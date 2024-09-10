# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

import os
import re
import boto3
import json 

from typing import Any, Dict, List, Optional

from langchain_core.prompts import PromptTemplate
from langchain.agents import tool
from langchain.chains.base import Chain
from langchain.chains import RetrievalQA
from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
)
from langchain_community.retrievers import AmazonKnowledgeBasesRetriever
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableParallel
from langchain_core.output_parsers import StrOutputParser
from langchain_community.chat_models import BedrockChat

import chainlit as cl

from ..env import get_knowledge_base_id

from ..llm import get_bedrock_embedding, get_bedrock_text_v3_sonnet, get_processed_prompt_template_sonnet

embeddings = get_bedrock_embedding()
llm = get_bedrock_text_v3_sonnet()
metadatas = []
texts = []
docsearch = None

def get_tool_metadata():
    return {
        "name": "qa",
        "description": "Useful for when you need to find standard procedures \
            or look up for user manuals. \
            Input to this tool is a question. \
            Output is the answer.",
    }
  
TEMPLATE_CLAUDE = """Given the information extracted from knowledge base and a question, create a final answer with references.

<document>
{context}
</document>

Here is the question: {question}

Follow the below two steps to answer the question.

First, find the parts that are most relevant to answering the question, and then write down their corresponding source locations in numbered order, starting with "[1]". Do not include the quoted content verbatim, only the source location. Always print an empty "Quotes:" section if there is no relevant quote.

Second, answer the question. Do not include or reference quoted content verbatim in the answer. Don't say "According to Quote [1]" when answering. Instead make references to quotes relevant to each section of the answer solely by adding their bracketed numbers at the end of relevant sentences. If the question cannot be answered by the knowledge base, say that you cannot answer the question based on the knowledge base. Do not make up answers.

Third, the file names like 'manual.pdf' in the Quotes section should be extracted from an s3 object key path. Only need the file name, not the whole path.

The format of the response should look like what's shown between the <example></example> tags. Do not include <example> in response. Make sure to follow the formatting and spacing exactly.

<example>
Quotes:
[1] manual.pdf - page 1
[2] reference.pdf - page 4

Answer:
Company X earned $12 million. [1]  Almost 90% of it was from widget sales. [2]
</example>
"""

CLAUDE_PROMPT = PromptTemplate(template=get_processed_prompt_template_sonnet(TEMPLATE_CLAUDE), input_variables=["context", "question"])

@tool
def run(input: str) -> str:
    """Answer the user question using Bedrock Agents and a KnowledgeBase."""

    global metadatas
    global texts

    # Amazon Bedrock - KnowledgeBase Retriever 
    retriever = AmazonKnowledgeBasesRetriever(
        knowledge_base_id=get_knowledge_base_id(),
        retrieval_config={"vectorSearchConfiguration": {"numberOfResults": 4}},
    )

    chain = (
        RunnableParallel({"context": retriever, "question": RunnablePassthrough()})
        .assign(response = CLAUDE_PROMPT | llm | StrOutputParser())
        .pick(["response", "context"])
    )

    output = chain.invoke(input)

    if output["response"] is None:
        return "I don't know the answer to that question."
    
    output["answer"] = output["response"]
    cl.user_session.set("sources", output["answer"])

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
        return f'/docs/{quote[0]}#page={quote[1]}'
        
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
