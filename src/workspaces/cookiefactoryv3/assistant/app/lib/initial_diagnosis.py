# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from __future__ import annotations

from typing import Any, Dict, List, Optional

from langchain import PromptTemplate
from langchain.chains import LLMChain

from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
)
from langchain.chains.base import Chain
from langchain.schema.language_model import BaseLanguageModel

from .llm import get_bedrock_text, get_processed_prompt_template

default_llm = get_bedrock_text()

question_classifier_prompt = """
You are a technical assistant to help the cooke line operators to investigate product quality issues. \
Your task is take the "Collected Information" from alarm systems, summarize the issue and provide prescriptive suggestions as "Initial Diagnosis" based on \
your knowledge about cookie production to provide initial suggestions for line operators to investigate the issue. Be concise and professional in the response. \
Translate technical terms to business terms so it's easy for line operators to read and understand, for example, timestamps should be converted to local user friendly format.

<example>
Collected information
---------------------
Alarm Message: Cookie Color Anomaly Detected
Alarm Time: 2023-10-23T09:10:00Z
Alarm Description: number of cookie deviate from normal color > 100 per 5 minute

Initial Diagnosis
-----------------
## Summary of the issue

An alarm triggered at 02:10 AM on Oct. 23rd, indicating an anomaly in the cookie production line which is breaching the condition of producing more than 100 cookies deviating from normal cookie color.

## Potential root causes

here please generate a list of potential root causes based on your knowledge, actual answer is omitted in this example
</example>

Now, please generate the "Initial Diagnosis" for the below event:


Collected information
---------------------
Alarm Message: {event_title}
Alarm Time: {event_timestamp}
Alarm Description: {event_description}
"""

class InitialDiagnosisChain(Chain):
    """Conduct initial diagnosis of the issue found in cookie production line."""

    llm_chain: LLMChain
    """LLM chain used to perform initial diagnosis"""

    @property
    def input_keys(self) -> List[str]:
        return ["event_title", "event_description", "event_timestamp"]

    @property
    def output_keys(self) -> List[str]:
        return ["output"]

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[CallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or CallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        output = self.llm_chain.run(callbacks=callbacks, **inputs)
        return {"output": output}

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or CallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        output = await self.llm_chain.arun(callbacks=callbacks, **inputs)
        output = output.strip()
        print('output:', output)
        return {"output": output}

    @classmethod
    def from_llm(
        cls, llm: BaseLanguageModel, **kwargs: Any
    ) -> InitialDiagnosisChain:
        router_template = question_classifier_prompt
        router_prompt = PromptTemplate(
            template=get_processed_prompt_template(router_template),
            input_variables=["event_title", "event_description", "event_timestamp"],
        )
        llm_chain = LLMChain(llm=llm, prompt=router_prompt)
        return cls(llm_chain=llm_chain, **kwargs)
