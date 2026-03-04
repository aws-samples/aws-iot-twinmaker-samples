# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0
# Updated 2024: Migrated to Claude 3 / Messages API

from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import os
import logging

logging.getLogger('botocore').setLevel(logging.DEBUG)

import chainlit as cl
from chainlit.context import context

from lib.router import LLMRouterChain, MultiRouteChain, create_routes
from lib.llm import get_bedrock_text
from lib.context_memory import EntityContextMemory
from lib.tools.qa import init_db
from lib.initial_diagnosis import InitialDiagnosisChain

print('initializing vector db')

init_db(os.path.join(os.path.dirname(__file__), '..', 'public', './freezer_tunnel_manual.pdf'))

print('done initializing vector db')


welcome_message="""
Hi, I'm the AI assistant of the Cookie Factory. I'm here to help you diagnose and resolve issues \
with the cookie production line.
"""

welcome_message_with_event=welcome_message + """

There is an ongoing event [#{event_id}](https://example.com/issue/{event_id}). Do you want to run an initial diagnosis of the issue?
"""


@cl.on_chat_start
async def start():
  LLMRouterChain.update_forward_refs()
  MultiRouteChain.update_forward_refs()
  
  memory = EntityContextMemory()
  routes = create_routes(memory)
  llm_chain = MultiRouteChain.from_prompts(llm=get_bedrock_text(), prompt_infos=routes)

  cl.user_session.set("chain", llm_chain)

  print('user data',  context.session.user_data)
  event_id = context.session.user_data.get('event_id')
  
  if event_id:
    actions = [
        cl.Action(name="initial_chat_actions", payload={"value": "initial_diagnosis"}, label="Run Issue Diagnosis", tooltip="Run Issue Diagnosis"),
    ]
    message = welcome_message_with_event.format(event_id=event_id)
    await cl.Message(content=message, actions=actions).send()
  else:
    message = welcome_message
    await cl.Message(content=message).send()
  

@cl.on_message
async def main(message: cl.Message):
  llm_chain = cl.user_session.get("chain")

  res = await llm_chain.acall(
    message.content,
    callbacks=[cl.AsyncLangchainCallbackHandler()])
  
  await cl.Message(content=res["text"]).send()


@cl.action_callback("initial_chat_actions")
async def on_action(action):
  event_title = context.session.user_data.get('event_title')
  event_description = context.session.user_data.get('event_description')
  event_timestamp = context.session.user_data.get('event_timestamp')
  
  await cl.Message(content=f"Running event initial diagnosis...").send()
  await action.remove()
  
  cb = cl.AsyncLangchainCallbackHandler()
  chain = InitialDiagnosisChain.from_llm(llm=get_bedrock_text())
  
  res = await chain.acall({
    'event_title': event_title,
    'event_description': event_description,
    'event_timestamp': event_timestamp
  }, callbacks=[cb])

  actions = [
      cl.Action(name="agent_actions", payload={"value": "3d"}, label="Show in 3D", tooltip="Show in 3D")
  ]
  
  await cl.Message(content=res['output'], actions=actions).send()

@cl.action_callback("agent_actions")
async def on_action(action):
  event_entity_id = context.session.user_data.get('event_entity_id')
  if action.payload.get("value") == "3d":
    await cl.Message(content=f"Navigating to the issue site.").send()
    await action.remove()
    # point camera to the entity id
    await context.session.emit('view', event_entity_id)
