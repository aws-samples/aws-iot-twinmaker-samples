# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from typing import Any, Dict, List, Optional

from langchain.agents import tool
from langchain.chains.base import Chain
from langchain.chains import LLMChain
from langchain import PromptTemplate
from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
)

import chainlit as cl
from chainlit.context import context
from chainlit import run_sync

from tabulate import tabulate

from ..llm import get_bedrock_text, get_processed_prompt_template
from .graph import GraphChain


def get_tool_metadata():
    return {
        "name": "3dview",
        "description": "Useful to teleport in 3D viewer to the equipment the user is interested in. \
            Input to this tool should be the entityId of the equipment. \
            Output is a string to confirm whether the view is found or not.",
    }

@tool
def run(input: str) -> str:
    """Identify the location of the object user is asking about."""

    point_camera_to_entity(input)
    return 'Found it!'

def point_camera_to_entity(entityId):
    run_sync(context.session.emit('view', entityId))

ENTITY_EXTRACTION_PROMPT = """
Your job is to identify the entity user is asking about based on the user question.

Use the following format:

Question: the input question from the user
Entity: the phrase about the entity in the original question

Only output the entity phrase, do not repeat the question.

Here are some examples:

Question: teleport me to the cookie line in alarm state
Entity: the cookie line in alarm state

Question: show me the freezer tunnel
Entity: the freezer tunnel

Question: show me the conveyer belt
Entity: the conveyer belt

Now begin!

Question: {question}
Entity:
"""

class EntityExtractorChain(Chain):
    """Chain to find the entity in the question."""
    
    llm_chain: LLMChain

    @property
    def input_keys(self) -> List[str]:
        return ['question']

    @property
    def output_keys(self) -> List[str]:
        return ['entity']
    
    @classmethod
    def create(cls, **kwargs):
        llm = get_bedrock_text()
        prompt = PromptTemplate(
            template=get_processed_prompt_template(ENTITY_EXTRACTION_PROMPT),
            input_variables=["question"],
        )
        llm_chain = LLMChain(
            llm=llm,
            prompt=prompt,
            **kwargs)
        return cls(llm_chain=llm_chain)

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[CallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or CallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        output = self.llm_chain.run(callbacks=callbacks, **inputs)
        return {
            'entity': output
        }

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or CallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        output = await self.llm_chain.arun(callbacks=callbacks, **inputs)
        return {
            'entity': output
        }


class ViewChain(Chain):
    """Chain that manipulates 3D viewer."""
    
    entity_extractor: EntityExtractorChain
    entity_lookup: GraphChain

    @property
    def input_keys(self) -> List[str]:
        return ['question']

    @property
    def output_keys(self) -> List[str]:
        return ['text', 'selected_entity']
    
    @classmethod
    def create(cls, **kwargs):
        entity_extractor = EntityExtractorChain.create(**kwargs)
        entity_lookup = GraphChain.create(**kwargs)
        return cls(entity_extractor=entity_extractor, entity_lookup=entity_lookup, **kwargs)
        
    def pick_entity(self, entities):
        if entities.shape[0] > 1:
            headers = ['No', 'Name', 'Id']
            rows = [[i + 1, row.entityName, row.entityId] for i, row in entities.items()]
            entity_table = tabulate(rows, headers=headers, tablefmt="pipe")
            
            run_sync(cl.Message(content="I've found these matching entities:\n\n" + entity_table).send())
            
            res = run_sync(cl.AskUserMessage(content="Which one do you mean?").send())
            
            if res is not None:
                # TODO: use a LLMChain to parse the user input
                idx = int(res['content']) - 1
                
                entityId = entities.iloc[idx].entityId
            else:
                entityId = None
        else:
            entityId = entities.iloc[0].entityId
            
        return entityId

    async def apick_entity(self, entities):
        if entities.shape[0] > 1:
            headers = ['No', 'Name', 'Id']
            rows = [[i + 1, row.entityName, row.entityId] for i, row in entities.items()]
            entity_table = tabulate(rows, headers=headers, tablefmt="pipe")
            
            await cl.Message(content="I've found these matching entities:\n\n" + entity_table).send()
            
            res = await cl.AskUserMessage(content="Which one do you mean?").send()
            
            if res is not None:
                # TODO: use a LLMChain to parse the user input
                idx = int(res['content']) - 1
                
                entityId = entities.iloc[idx].entityId
            else:
                entityId = None
        else:
                entityId = entities.iloc[0].entityId
            
        return entityId

    def _call(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[CallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or CallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        
        entity = self.entity_extractor.run(callbacks=callbacks, **inputs)
        df = self.entity_lookup.run(
            callbacks,
            {
                "question": "Find all entities matching the description: " + entity,
                "format_output": False
            })
        
        # TODO: handle the column detection better
        if df.shape[0] < 1 or df.columns[0] != 'e':
            return {
                'text': "I didn't find any result.",
                'selected_entity': ''
            }
            
        entities = df[df.columns[0]]
        
        entityId = self.pick_entity(entities)
        
        if entityId is None:
            return {
                'text': "I didn't find any result.",
                'selected_entity': ''
            }
            
        point_camera_to_entity(entityId)
        
        return {
            'text': f"I've pointed you to the {entityId} in the 3D Viewer.",
            'selected_entity': entityId
        }

    async def _acall(
        self,
        inputs: Dict[str, Any],
        run_manager: Optional[AsyncCallbackManagerForChainRun] = None,
    ) -> Dict[str, Any]:
        _run_manager = run_manager or CallbackManagerForChainRun.get_noop_manager()
        callbacks = _run_manager.get_child()
        
        entity = await self.entity_extractor.arun(callbacks=callbacks, **inputs)
        df = await self.entity_lookup.arun(
            **{
                "question": "Find all entities matching the description: " + entity,
                "format_output": False
            })
        
        # TODO: handle the column detection better
        if df.shape[0] < 1 or df.columns[0] != 'e':
            return {
                'text': "I didn't find any result.",
                'selected_entity': ''
            }
            
        entities = df[df.columns[0]]
        
        entityId = await self.apick_entity(entities)
        
        if entityId is None:
            return {
                'text': "I didn't find any result.",
                'selected_entity': ''
            }
            
        point_camera_to_entity(entityId)
        return {
            'text': f"I've pointed you to the {entityId} in the 3D Viewer.",
            'selected_entity': entityId
        }
