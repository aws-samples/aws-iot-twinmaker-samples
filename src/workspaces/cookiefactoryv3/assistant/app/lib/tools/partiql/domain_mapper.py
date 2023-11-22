# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from langchain import FewShotPromptTemplate, LLMChain, PromptTemplate
from langchain.agents import tool

from ...llm import get_bedrock_text, get_prefix_prompt_template, get_postfix_prompt_template

llm = get_bedrock_text()

few_shot_domain_mapping_examples = [
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "",
        "user_domain_question": "show me all freezer tunnels",
        "twinmaker_domain_question": "select all entities where entityId like '%FREEZER_TUNNEL%'"
    },
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "",
        "user_domain_question": "show me all cookie lines",
        "twinmaker_domain_question": "select all entities where entityId like '%COOKIE_LINE%'"
    },
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "",
        "user_domain_question": "show me what is connected to cookie line",
        "twinmaker_domain_question": "select all entities which has one relationship to another entity with entityId like '%COOKIE_LINE%'"
    },
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "",
        "user_domain_question": "show me what feeds cookie line",
        "twinmaker_domain_question": "select all entities which has feed relationship to another entity with entityId like '%COOKIE_LINE%'"
    },
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "",
        "user_domain_question": "show me what feeds cookie line 123",
        "twinmaker_domain_question": "select all entities which has feed relationship to another entity with entityId = '123'"
    },
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "",
        "user_domain_question": "give me details about COOKIE_LINE123",
        "twinmaker_domain_question": "select all entity properties where entityId = 'COOKIE_LINE123'"
    },
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "the current selected entity is 'COOKIE_LINE123'",
        "user_domain_question": "give me details about the selected entity.",
        "twinmaker_domain_question": "select all entity properties where entityId = 'COOKIE_LINE123'"
    },
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "the current selected entity is 'ABC'",
        "user_domain_question": "give me details about the selected entity.",
        "twinmaker_domain_question": "select all entity properties where entityId = 'ABC'"
    },
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "the current selected entity is 'ABC'",
        "user_domain_question": "give me details about this equipment.",
        "twinmaker_domain_question": "select all entity properties where entityId = 'ABC'"
    },
    {
        "schema":
            """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
            """,
        "context": "",
        "user_domain_question": "what is the entityId of the freezer tunnel",
        "twinmaker_domain_question": "select entityId where entityName like '%FREEZER_TUNNEL%'"
    }
]

example_prompt = PromptTemplate(
    input_variables=["schema", "context", "user_domain_question", "twinmaker_domain_question"],
    template="""
Schema: {schema}
Context: {context}
User domain question: {user_domain_question}
Twinmaker domain question: {twinmaker_domain_question}
""")

prompt = FewShotPromptTemplate(
    examples=few_shot_domain_mapping_examples,
    example_prompt=example_prompt,
    prefix=get_prefix_prompt_template("""
Here are few examples for creating a question in twinmaker domain from a question in user's domain 
given the user's schema."""),
    suffix=get_postfix_prompt_template("""
Create a question in twinmaker domain from the following question in user domain given the question and schema. 
Only write down the twinmaker domain question, do not repeat the schema and original question. 
                                       
Schema: {schema}
Context: {context}
User domain question: {input}
Twinmaker domain question: """),
    input_variables=["schema", "context", "input"])


def get_domain_mapper_chain(**kwargs):
    return LLMChain(
        llm=llm,
        prompt=prompt,
        output_key="twinmaker_domain_question",
        **kwargs
    )

# TODO: replace hardcoded schema with schema extracted from component types, entities and relationships
user_schema = """
Entities can be any of the following: COOKIE_LINE, FREEZER_TUNNEL, CONVEYOR, VERTICAL_CONVEYOR, COOKIE_FORMER, BOX_ERECTOR
Entity Properties can be any of the following: manufacturer date,
Relationship Names can be any of the following: feed, isLocationOf
"""

@tool
def run(input: str) -> str:
    """Convert the question written in user's domain model to twinmaker domain model question using schema"""

    llm_chain = LLMChain(
        llm=llm,
        prompt=prompt,
        output_key="twinmaker_domain_question"
    )

    output = llm_chain.run({"schema": user_schema, "input": input})

    return output
