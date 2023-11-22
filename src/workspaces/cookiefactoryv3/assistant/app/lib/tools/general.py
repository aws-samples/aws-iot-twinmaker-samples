# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from typing import Any, Dict, List, Optional

from langchain import LLMChain, PromptTemplate
from langchain.agents import tool
from langchain.chains.base import Chain
from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
)

from ..llm import get_bedrock_text, get_processed_prompt_template

llm = get_bedrock_text()
prompt_template = get_processed_prompt_template("{question}")

def get_tool_metadata():
    return {
        "name": "general",
        "description": "Useful to the user question is in the domain of factory operation \
            and no other tools can help. \
            Input to this tool is a question. \
            Output is the answer.",
    }
    
@tool
def run(input: str) -> str:
    """Answer the user question using pre-trained knowledge."""

    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["question"],
    )

    chain = LLMChain(
        llm=llm,
        prompt=prompt
    )

    output = chain.run({"question": input})

    return output

class GeneralChain(Chain):
    """Chain that answers question using pre-trained knowledge."""

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

        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["question"],
        )

        chain = LLMChain(
            llm=llm,
            prompt=prompt
        )

        output = chain.run({"question": inputs['question']})

        return {
            'text': output
        }

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:

        prompt = PromptTemplate(
            template=prompt_template,
            input_variables=["question"],
        )

        chain = LLMChain(
            llm=llm,
            prompt=prompt
        )

        output = await chain.arun({"question": inputs['question']})

        return {
            'text': output
        }
