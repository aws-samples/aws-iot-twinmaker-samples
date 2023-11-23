# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

import os
import re
import PyPDF2

from typing import Any, Dict, List, Optional

from langchain import PromptTemplate
from langchain.agents import tool
from langchain.chains.base import Chain
from langchain.chains import RetrievalQAWithSourcesChain
from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.vectorstores import Chroma

import chainlit as cl

from ..llm import get_bedrock_embedding, get_bedrock_text, get_processed_prompt_template

embeddings = get_bedrock_embedding()
llm = get_bedrock_text()
metadatas = []
texts = []
docsearch = None
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

def get_tool_metadata():
    return {
        "name": "qa",
        "description": "Useful for when you need to find standard procedures \
            or look up for user manuals. \
            Input to this tool is a question. \
            Output is the answer.",
    }

def init_db(file):
  pdf_text = ""
  global texts
  global metadatas
  global docsearch
  _, filename = os.path.split(file)
  with open(file, 'rb') as f:
    pdf = PyPDF2.PdfReader(f)
    for i in range(len(pdf.pages)):
      page = pdf.pages[i]
      current_page_text = page.extract_text()
      pdf_text += current_page_text

      # Split the text into chunks
      texts_current_page = text_splitter.split_text(current_page_text)
      texts = texts + texts_current_page
      metadatas = metadatas + [{ "source": f"{filename} - page {i+1}" } for _ in range(len(texts_current_page))]

  # Create a Chroma vector store
  docsearch = Chroma.from_texts(
      texts, embeddings, metadatas=metadatas
  )
  
TEMPLATE_CLAUDE = """Given the information extracted from knowledge base and a question, create a final answer with references.

<document>
{summaries}
</document>

Here is the question: {question}

Follow the below two steps to answer the question.

First, find the parts that are most relevant to answering the question, and then write down their corresponding source locations in numbered order, starting with "[1]". Do not include the quoted content verbatim, only the source location. Always print an empty "Quotes:" section if there is no relevant quote.

Second, answer the question. Do not include or reference quoted content verbatim in the answer. Don't say "According to Quote [1]" when answering. Instead make references to quotes relevant to each section of the answer solely by adding their bracketed numbers at the end of relevant sentences. If the question cannot be answered by the knowledge base, say that you cannot answer the question based on the knowledge base. Do not make up answers.

The format of the response should look like what's shown between the <example></example> tags. Make sure to follow the formatting and spacing exactly.

<example>
Quotes:
[1] manual.pdf - page 1
[2] reference.pdf - page 4

Answer:
Company X earned $12 million. [1]  Almost 90% of it was from widget sales. [2]
</example>
"""

CLAUDE_PROMPT = PromptTemplate(template=get_processed_prompt_template(TEMPLATE_CLAUDE), input_variables=["summaries", "question"])

@tool
def run(input: str) -> str:
    """Answer the user question using the in memory vector db."""

    global metadatas
    global texts

    # Create a chain that uses the Chroma vector store
    qa_chain = RetrievalQAWithSourcesChain.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=docsearch.as_retriever(),
    )
    
    qa_chain.combine_documents_chain.llm_chain.prompt = CLAUDE_PROMPT

    output = qa_chain({"question": input})

    if output["answer"] is None:
        return "I don't know the answer to that question."

    print('answer', output["answer"])

    sources = ''
    if output["sources"]:
        if isinstance(output["sources"], str):
            sources = output["sources"]

    print('sources', sources)

    cl.user_session.set("sources", sources)

    return output["answer"]


class QAResult(object):
    def __init__(self, answer, quotes_dict) -> None:
        self.answer = answer
        self.quotes_dict = quotes_dict
    
    def try_parse(text):
        # Extracting the quotes and answer sections
        sections_pattern = re.compile(r'Quotes:\s*\n*(.*?)\n\nAnswer:\s*\n*(.+)', re.DOTALL)
        sections_match = sections_pattern.search(text)
        
        if sections_match:
            quotes_section = sections_match.group(1).strip()
            answer_section = sections_match.group(2).strip()
            
            # Extracting individual quotes from the quotes section
            quote_pattern = re.compile(r'\[(\d+)\]\s*(.+?)(?: - page (\d+))?$')
            quotes_matches = quote_pattern.findall(quotes_section)
            quotes_dict = {int(quote[0]): (quote[1], quote[2]) for quote in quotes_matches}
            return QAResult(answer_section, quotes_dict)
        else:
            return None
        
    def get_file_url(self, quote):
        return f'/public/{quote[0]}#page={quote[1]}'
        
    def format(self):
        answer = self.answer
        # Replacing the references in the answer section
        for key, quote in self.quotes_dict.items():
            link = f'[[{key}]]({self.get_file_url(quote)})'
            answer = answer.replace(f'[{key}]', link)
        return answer

            
class QAChain(Chain):
    """Chain that answers user questions based on RAG pattern."""

    @property
    def input_keys(self) -> List[str]:
        return ['question']

    @property
    def output_keys(self) -> List[str]:
        return ['text']

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[CallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        output = run(inputs['question'])
        
        result = QAResult.try_parse(output)
        
        if result is None:
            return {
                'text': "I don't know the answer to that question."
            }
        
        return {
            'text': result.format()
        }

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        output = run(inputs['question'])
        
        result = QAResult.try_parse(output)
        
        if result is None:
            return {
                'text': "I don't know the answer to that question."
            }
        
        return {
            'text': result.format()
        }
