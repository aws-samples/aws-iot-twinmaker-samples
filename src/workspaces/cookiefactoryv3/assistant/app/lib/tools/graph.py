# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from typing import Any, Dict, List, Optional

from langchain.chains import SequentialChain
from langchain.chains.base import Chain
from langchain.agents import tool
from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
)

from .partiql.domain_mapper import get_domain_mapper_chain, user_schema
from .partiql.partiql_generator import get_partiql_generator_chain
from .partiql.partiql_executor import execute_query_and_format, execute_query


def get_tool_metadata():
    return {
        "name": "graph",
        "description": "Converts a question into an AWS IoT TwinMaker domain model question. \
            This tool must always be called first when you need to call the database. \
            Input to this tool is text. \
            Output is text.",
    }

@tool
def run(input: str) -> str:
    """Translate the user question to AWS IoT TwinMaker Knowledge Graph query and execute the query."""

    overall_chain = SequentialChain(
        chains=[get_domain_mapper_chain(), get_partiql_generator_chain()],
        verbose=True,
        input_variables=['input', 'schema'],
        output_variables=['partiql'])

    output = overall_chain.run({
        "input": input,
        "schema": user_schema
    })

    res = execute_query_and_format(output)

    return res

    
class GraphChain(Chain):
    """Chain that queries AWS IoT TwinMaker Knowledge Graph."""
    query_chain: Chain

    @property
    def input_keys(self) -> List[str]:
        return ['question']

    @property
    def output_keys(self) -> List[str]:
        return ['text']
    
    @classmethod
    def create(cls, **kwargs):
        query_chain = SequentialChain(
            chains=[get_domain_mapper_chain(**kwargs), get_partiql_generator_chain(**kwargs)],
            verbose=True,
            input_variables=['input', 'schema'],
            output_variables=['partiql'])

        return cls(query_chain=query_chain)

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[CallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        output = self.query_chain.run({
            "input": inputs['question'],
            "schema": user_schema
        })
        
        if "format_output" not in inputs or inputs["format_output"]:
            res = execute_query_and_format(output)
        else:
            res = execute_query(output)

        return {
            'text': res
        }

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        output = await self.query_chain.arun({
            "input": inputs['question'],
            "schema": user_schema
        })

        if "format_output" not in inputs or inputs["format_output"]:
            res = execute_query_and_format(output)
        else:
            res = execute_query(output)

        return {
            'text': res
        }
