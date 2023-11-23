# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from __future__ import annotations

from typing import Any, Dict, List, Mapping, NamedTuple, Optional

from langchain import PromptTemplate
from langchain.chains import LLMChain

from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
    Callbacks,
)
from langchain.chains.base import Chain

from langchain.schema.language_model import BaseLanguageModel

from .tools.view import ViewChain
from .tools.qa import QAChain
from .tools.graph import GraphChain
from .tools.general import GeneralChain

from .llm import get_bedrock_text, get_processed_prompt_template

default_llm = get_bedrock_text()

question_classifier_prompt = """
You are given an instruction. The instruction is either a command or a question. You need to decide the type of the instruction provided by user. 

The only valid options are:

- 3dview: if the instruction is a command about manipulating the 3D viewer
- doc: if the instruction is a question about standard procedures in the knowledge base
- graph: if the instruction is a question about finding information of the entities in the factory
- general: if none of the above applies

You must give an answer using one of the valid options, and you should write out the answer without further explanation.

<example>

Instruction: what is the manufacturer date of the cookie line?
Answer: graph

Instruction: how to operate the cookie line?
Answer: doc

Instruction: what are the potential causes of the inconsistent cookie shape?
Answer: general

Instruction: show me the cookie line in 3d
Answer: 3dview

</example>

Instruction: {question}
Answer:
"""

class Route(NamedTuple):
    destination: Optional[str]
    next_inputs: Dict[str, Any]

class LLMRouterChain(Chain):
    """Chain that outputs the name of a destination chain and the inputs to it."""

    llm_chain: LLMChain
    """LLM chain used to perform routing"""

    @property
    def input_keys(self) -> List[str]:
        return ["question"]

    @property
    def output_keys(self) -> List[str]:
        return ["destination", "next_inputs"]

    def route(self, inputs: Dict[str, Any], callbacks: Callbacks = None) -> Route:
        """
        Route inputs to a destination chain.

        Args:
            inputs: inputs to the chain
            callbacks: callbacks to use for the chain

        Returns:
            a Route object
        """
        result = self(inputs, callbacks=callbacks)
        return Route(result["destination"], result["next_inputs"])

    async def aroute(
        self, inputs: Dict[str, Any], callbacks: Callbacks = None
    ) -> Route:
        result = await self.acall(inputs, callbacks=callbacks)
        return Route(result["destination"], result["next_inputs"])

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[CallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or CallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        output = self.llm_chain.run(callbacks=callbacks, **inputs)
        result = {
            'destination': output.strip(),
            'next_inputs': {
                'question': inputs['question']
            },
        }
        return result

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or CallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        output = await self.llm_chain.arun(callbacks=callbacks, **inputs)
        result = {
            'destination': output.strip(),
            'next_inputs': {
                'question': inputs['question']
            },
        }
        return result

    @classmethod
    def from_llm(
        cls, llm: BaseLanguageModel, **kwargs: Any
    ) -> LLMRouterChain:
        router_template = question_classifier_prompt
        router_prompt = PromptTemplate(
            template=get_processed_prompt_template(router_template),
            input_variables=["question"],
        )
        llm_chain = LLMChain(llm=llm, prompt=router_prompt)
        return cls(llm_chain=llm_chain, **kwargs)


class MultiRouteChain(Chain):
    """A multi-route chain that uses an LLM router chain to choose amongst prompts."""

    router_chain: LLMRouterChain
    """Chain for deciding a destination chain and the input to it."""
    destination_chains: Mapping[str, Chain]
    """Map of name to candidate chains that inputs can be routed to."""

    @property
    def input_keys(self) -> List[str]:
        return self.router_chain.input_keys

    @property
    def output_keys(self) -> List[str]:
        return ["text"]

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[CallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or CallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        route = self.router_chain.route(inputs, callbacks=callbacks)

        _run_manager.on_text(
            str(route.destination) + ": " + str(route.next_inputs), verbose=self.verbose
        )
        if route.destination in self.destination_chains:
            return self.destination_chains[route.destination](
                route.next_inputs, callbacks=callbacks
            )
        else:
            raise ValueError(
                f"Received invalid destination chain name '{route.destination}'"
            )

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or AsyncCallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        route = await self.router_chain.aroute(inputs, callbacks=callbacks)

        await _run_manager.on_text(
            str(route.destination) + ": " + str(route.next_inputs), verbose=self.verbose
        )
        if route.destination in self.destination_chains:
            return await self.destination_chains[route.destination].acall(
                route.next_inputs, callbacks=callbacks
            )
        else:
            raise ValueError(
                f"Received invalid destination chain name '{route.destination}'"
            )

    @classmethod
    def from_prompts(
        cls,
        llm: BaseLanguageModel,
        prompt_infos: List[Dict[str, LLMChain]],
        **kwargs: Any,
    ) -> MultiRouteChain:
        router_chain = LLMRouterChain.from_llm(llm)
        destination_chains = {}
        for p_info in prompt_infos:
            name = p_info["name"]
            chain = p_info["chain"]
            destination_chains[name] = chain
        return cls(
            router_chain=router_chain,
            destination_chains=destination_chains,
            **kwargs,
        )

def create_routes(memory):
    return [
        {
            "name": "general",
            "chain": GeneralChain()
        },
        {
            "name": "3dview",
            "chain": ViewChain.create(memory=memory)
        },
        {
            "name": "doc",
            "chain": QAChain()
        },
        {
            "name": "graph",
            "chain": GraphChain.create(memory=memory)
        }
    ]
