# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import os
import logging

logging.getLogger('botocore').setLevel(logging.DEBUG)

import langchain
langchain.debug = True
langchain.verbose = True

import chainlit as cl
from chainlit.context import context

from lib.router import LLMRouterChain, MultiRouteChain, create_routes
from lib.llm import get_bedrock_text_v3_sonnet
from lib.context_memory import EntityContextMemory
from lib.initial_diagnosis import InitialDiagnosisChain

## To be implemented with update to chainlit
#from chainlit.oauth_providers import AWSCognitoOAuthProvider 

welcome_message="""
Hi, I'm the AI assistant of the Cookie Factory. I'm here to help you diagnose and resolve issues \
with the cookie production line.
"""

welcome_message_with_event=welcome_message + """

There is an ongoing event [#{event_id}](https://example.com/issue/{event_id}). Do you want to run an initial diagnosis of the issue?
"""

## To be implemented with update to chainlit
#cl.oauth_providers = [
#    AWSCognitoOAuthProvider(
#        client_id=os.environ["OAUTH_COGNITO_CLIENT_ID"],
#        client_secret=os.environ["OAUTH_COGNITO_CLIENT_SECRET"],
#        domain=os.environ["OAUTH_COGNITO_DOMAIN"],
#    )
#]

@cl.on_chat_start
async def start():
  
  ## To be implemented with udpdate to chainlit
  #if not cl.user_session.get("is_authenticated"):
  #      await cl.oauth_providers[0].authorize()
        
  LLMRouterChain.update_forward_refs()
  MultiRouteChain.update_forward_refs()
  
  memory = EntityContextMemory()
  routes = create_routes(memory)
  llm_chain = MultiRouteChain.from_prompts(llm=get_bedrock_text_v3_sonnet(), prompt_infos=routes)

  cl.user_session.set("chain", llm_chain)

  print('user data',  context.session.user_data)
  event_id = context.session.user_data.get('event_id')
  
  if event_id:
    actions = [
        cl.Action(name="initial_chat_actions", value="initial_diagnosis", label="Run Issue Diagnosis", description="Run Issue Diagnosis"),
    ]
    message = welcome_message_with_event.format(event_id=event_id)
    await cl.Message(content=message, actions=actions).send()
  else:
    message = welcome_message
    await cl.Message(content=message).send()
  

@cl.on_message
async def main(message, context):
  llm_chain = cl.user_session.get("chain")

  res = await llm_chain.ainvoke(
    message,
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
  chain = InitialDiagnosisChain.from_llm(llm=get_bedrock_text_v3_sonnet())
  
  res = await chain.ainvoke({
    'event_title': event_title,
    'event_description': event_description,
    'event_timestamp': event_timestamp
  }, callbacks=[cb])

  actions = [
      cl.Action(name="agent_actions", value="3d", label="Show in 3D", description="Show in 3D")
  ]
  
  await cl.Message(content=res['output'], actions=actions).send()

@cl.action_callback("agent_actions")
async def on_action(action):
  event_entity_id = context.session.user_data.get('event_entity_id')

  if action.value == "3d":
    await cl.Message(content=f"Navigating to the issue site.").send()
    await action.remove()
    # point camera to the entity id
    await context.session.emit('view', event_entity_id)
