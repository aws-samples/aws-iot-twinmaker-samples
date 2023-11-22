# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

import boto3

from langchain.llms.bedrock import Bedrock
from langchain.embeddings.bedrock import BedrockEmbeddings

from botocore.config import Config

from .env import get_bedrock_region

available_models = [
    "amazon.titan-tg1-large",
    "anthropic.claude-v2",
    "ai21.j2-ultra",
    "ai21.j2-mid",
    "anthropic.claude-instant-v1",
    "anthropic.claude-v1"
]

# the current model used for text generation
text_model_id = "anthropic.claude-instant-v1"
text_v2_model_id = "anthropic.claude-v2"
embedding_model_id = "amazon.titan-embed-text-v1"

model_kwargs = {
    "amazon.titan-tg1-large": {
        "temperature": 0, 
        "maxTokenCount": 4096,
    },
    "anthropic.claude-v2": {
        "max_tokens_to_sample": 2048,
        "temperature": 0.1,
        "top_p": 0.9,
    },
    "anthropic.claude-instant-v1": {
        "max_tokens_to_sample": 2048,
        "temperature": 0.1,
        "top_p": 0.9,
    },
}

prompt_template_prefix = {
    "anthropic.claude-v2": "\n\nHuman: ",
    "anthropic.claude-instant-v1": "\n\nHuman: "
}

prompt_template_postfix = {
    "anthropic.claude-v2": "\n\nAssistant:",
    "anthropic.claude-instant-v1": "\n\nAssistant:"
}

def get_template_proc(model_id):
    def template_proc(template):
        return f"{prompt_template_prefix[model_id]}{template}{prompt_template_postfix[model_id]}"
    return template_proc

prompt_template_procs = {
    "anthropic.claude-v2": get_template_proc("anthropic.claude-v2"),
    "anthropic.claude-instant-v1": get_template_proc("anthropic.claude-instant-v1")
}

bedrock = boto3.client('bedrock', get_bedrock_region(), config=Config(
    retries = {
        'max_attempts': 10,
        'mode': 'standard'
    }
))
bedrock_runtime = boto3.client('bedrock-runtime', get_bedrock_region(), config=Config(
    retries = {
        'max_attempts': 10,
        'mode': 'standard'
    }
))
response = bedrock.list_foundation_models()
print(response.get('modelSummaries')) 

def get_bedrock_text():
    llm = Bedrock(model_id=text_model_id, client=bedrock_runtime)
    llm.model_kwargs = model_kwargs.get(text_model_id, {})
    return llm

def get_bedrock_text_v2():
    llm = Bedrock(model_id=text_v2_model_id, client=bedrock_runtime)
    llm.model_kwargs = model_kwargs.get(text_v2_model_id, {})
    return llm

def get_bedrock_embedding():
    embeddings = BedrockEmbeddings(
        model_id=embedding_model_id,
        client=bedrock_runtime
    )
    return embeddings

def get_processed_prompt_template(template):
    if text_model_id in prompt_template_procs:
        return prompt_template_procs[text_model_id](template)
    else:
        return template

def get_prefix_prompt_template(template):
    if text_model_id in prompt_template_prefix:
        return prompt_template_prefix[text_model_id] + template
    else:
        return template

def get_postfix_prompt_template(template):
    if text_model_id in prompt_template_postfix:
        return template + prompt_template_postfix[text_model_id]
    else:
        return template
