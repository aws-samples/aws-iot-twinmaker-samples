# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from langchain import FewShotPromptTemplate, LLMChain, PromptTemplate
from langchain.agents import tool

from ...llm import get_bedrock_text, get_prefix_prompt_template, get_postfix_prompt_template

llm = get_bedrock_text()

few_shot_partiql_examples = [
    {
        "instruction": "select all entities",
        "partiql": "SELECT e FROM EntityGraph MATCH (e)"
    },
    {
        "instruction": "select all entities with entityId 'xxx'",
        "partiql": "SELECT e FROM EntityGraph MATCH (e) WHERE e.entityId = 'xxx'"
    },
    {
        "instruction": "select all entity properties with entityId 'xxx'",
        "partiql": "SELECT e.entityId, c.componentName, p.propertyName, p.propertyValue FROM EntityGraph MATCH (e), e.components as c, c.properties as p WHERE e.entityId = 'xxx'"
    },
    {
        "instruction": "select all entities with entityName like 'yyy'",
        "partiql": "SELECT e FROM EntityGraph MATCH (e) WHERE e.entityName LIKE '%yyy%'"
    },
    {
        "instruction": "select all entities which has locatedIn relationship to another entity",
        "partiql": "SELECT e FROM EntityGraph MATCH (e)-[:locatedIn]->(e2)"
    },
    {
        "instruction": "select all entities which has locatedIn relationship to another entity with entityId = '123'",
        "partiql": "SELECT e FROM EntityGraph MATCH (e)-[:locatedIn]->(e2) WHERE e2.entityId = '123'"
    },
    {
        "instruction": "select all entities which has one relationship to another entity",
        "partiql": "SELECT e2 FROM EntityGraph MATCH (e)-[]-(e2)"
    },
    {
        "instruction": "select all entities which has one relationship to another entity with entityId LIKE '%zzz%'",
        "partiql": "SELECT e FROM EntityGraph MATCH (e)-[]-(e2) WHERE e.entityId LIKE '%zzz%'"
    },
    {
        "instruction": "select all entities which has one to 10 relationship hops to another entity",
        "partiql": """SELECT e2 FROM EntityGraph MATCH (e)-[]-{{1,10}}(e2)"""
    },
    {
        "instruction": "select all entities starting from entity with entityId zzz which has one to 5 relationship hops to another entity",
        "partiql": "SELECT e2 FROM EntityGraph MATCH (e)-[]-{{1,5}}(e2) WHERE e.entityId = 'zzz'"
    },
    {
        "instruction": "select all entities which has its color property set to blue",
        "partiql": "SELECT e2 FROM EntityGraph MATCH (e), e.components AS c, c.properties AS p WHERE p.propertyName = 'color' AND p.propertyValue = 'blue'"
    },
    {
        "instruction": "select all entities which has 'sitewise' component type with property assetId set to 'ccc'",
        "partiql": "SELECT e2 FROM EntityGraph MATCH (e), e.components AS c, c.properties AS p WHERE c.componentTypeId = 'sitewise' AND p.propertyName = 'assetId' AND p.propertyValue = 'ccc'"
    },
    {
        "instruction": "Which entities start from entity with entityName xxx and has a 'contains' relationship with it?",
        "partiql": "SELECT e2 FROM EntityGraph MATCH (e)-[:contains]->(e2) WHERE e.entityName = 'xxx'"
    },
    {
        "instruction": "Starting from entity with entityName xxx, find all entities with 'contains' relationship within 4 hops of the starting entity?",
        "partiql": "SELECT e2 FROM EntityGraph MATCH (e)-[:contains]->()-[:contains]->()-[:contains]->()-[:contains]->(e2) WHERE e.entityName = 'xxx' "
    },
    {
        "instruction": "Which entities start from entity with propertyvalue 'siemens' and ends with entity with propertyvalue 'GE' within 2 relationship hops?",
        "partiql": "SELECT FROM EntityGraph MATCH (e1)-[]->()-[]->(e2), e1.components AS c1, c1.properties AS p1, e2.components AS c2, c2.properties as p2 WHERE p1.propertyValue = 'siemens' AND p2.propertyValue = 'GE'"
    },
    {
        "instruction": "select all entities which has incoming 'contains' relationship to an entity which has 'sitewise' component type with property assetId set to 'ccc'",
        "partiql": "SELECT e2 FROM EntityGraph MATCH (e)-[:contains]->(e2), e.components AS c, c.properties AS p WHERE c.componentTypeId = 'sitewise' AND p.propertyName = 'assetId' AND p.propertyValue = 'ccc'"
    },
    {
        "instruction": "select all entities which has outgoing 'contains' relationship to an entity which has 'sitewise' component type with property assetId set to 'ccc'",
        "partiql": "SELECT e2 FROM EntityGraph MATCH (e)<-[:contains]-(e2), e.components AS c, c.properties AS p WHERE c.componentTypeId = 'sitewise' AND p.propertyName = 'assetId' AND p.propertyValue = 'ccc'"
    }
]


example_prompt = PromptTemplate(
    input_variables=["instruction", "partiql"],
    template="Instruction: {instruction}\n PartiQL: {partiql}")

prompt = FewShotPromptTemplate(
    examples=few_shot_partiql_examples,
    example_prompt=example_prompt,
    prefix=get_prefix_prompt_template("Here are few examples of creating partiql from instruction"),
    suffix=get_postfix_prompt_template("""
Create PartiQL statement from instruction. Only write down the PartiQL statement, do not repeat the instruction.

Instruction: {twinmaker_domain_question}
PartiQL: """),
    input_variables=["twinmaker_domain_question"])


def get_partiql_generator_chain(**kwargs):
    return LLMChain(
        llm=llm,
        prompt=prompt,
        output_key="partiql",
        **kwargs
    )

@tool
def run(instruction: str) -> str:
    """Convert the AWS IoT TwinMaker domain model question into partiql query"""

    llm_chain = LLMChain(
        llm=llm,
        prompt=prompt,
        output_key="partiql"
    )

    query = llm_chain.run({"twinmaker_domain_question": instruction})

    return query
