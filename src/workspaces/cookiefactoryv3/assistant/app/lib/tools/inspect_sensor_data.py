# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved. 2023
# SPDX-License-Identifier: Apache-2.0

from typing import Any, Dict, List, Optional

from langchain_core.prompts import PromptTemplate
from langchain import LLMChain
from langchain.agents import tool
from langchain.chains.base import Chain
from langchain.callbacks.manager import (
    AsyncCallbackManagerForChainRun,
    CallbackManagerForChainRun,
)

from ..llm import get_bedrock_text_v3_sonnet, get_processed_prompt_template_sonnet

canned_question = """Here's a sample dataset illustrating concepts around a freezer tunnel with potential anomalies. I'll include some expert insights within the data as comments to help you interpret the scenario.
            Scenario: An industrial freezer tunnel is used to quickly freeze formed cookie dough. Ideally, the temperature should remain consistent for optimal cookie quality.

            Data snippet:
            timestamp,zone_1_temp,zone_2_temp,zone_3_temp,belt_speed,ambient_temp,cookie_thickness
            2024-04-25 13:00:00,-10,-12,-11,1.2,23,5.5
            2024-04-25 13:01:00,-11,-12,-10,1.2,24,5.4
            2024-04-25 13:02:00,-10,-11,-10,1.2,23,5.6
            2024-04-25 13:03:00,-10,-12,-9,1.2,24,5.5 
            # Expert Note: Slight increase in zone 3 temp, could be early sign of issue
            2024-04-25 13:04:00,-8,-10,-8,1.2,25,5.4 
            # Expert Note: Significant warming trend, potential compressor issue
            2024-04-25 13:05:00,-6,-8,-7,1.2,25,5.6
            2024-04-25 13:06:00,-6,-8,-7,1.18,26,5.8  
            # Expert Note: Belt slowed slightly, likely compensatory, cookies thicker
            2024-04-25 13:07:00,-5,-5,-4,1.15,27,6.0
            # Expert Note: Critical issue, cookies not freezing properly
            2024-04-25 13:08:00,-7,-6,-5,1.15,27,5.9
            2024-04-25 13:09:00,-10,-12,-11,1.2,26,5.6 
            # Expert Note: Potential system reset or intervention, back to normal

            Explanation:
            timestamp: Date and time of reading
            zone_[1-3]_temp: Temperature in degrees Celsius for different sections of the freezer tunnel
            belt_speed: Speed of the conveyor belt in meters per minute
            ambient_temp: Ambient temperature outside the freezer
            cookie_thickness: Average thickness of cookies exiting the tunnel in millimeters

            Anomaly:
            The significant rise in temperatures across zones, combined with the slowed belt speed, indicates a potential cooling system failure. The resulting thicker cookies are a sign of insufficient freezing.
            Important Notes
            This is a simplified dataset. Real systems would have more sensors and data points for comprehensive analysis.
            You can simulate further anomalies, such as fluctuations in belt speed, ambient temperature spikes, etc.

            With this information, look at this sensor data below and tell me if you detect any potential issues. If you do, offer some suggestions on how to resolve.

            timestamp,zone_1_temp,zone_2_temp,zone_3_temp,belt_speed,ambient_temp,cookie_thickness
            2024-04-25 13:10:00,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:10:05,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:10:10,-11,-12,-10,1.2,26,5.5
            2024-04-25 13:10:15,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:10:20,-11,-12,-10,1.2,25,5.5
            2024-04-25 13:10:25,-10,-11,-10,1.2,25,5.6
            2024-04-25 13:10:30,-10,-12,-9,1.2,26,5.5
            2024-04-25 13:10:35,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:10:40,-11,-12,-10,1.2,25,5.5
            2024-04-25 13:10:45,-10,-11,-10,1.2,26,5.6
            2024-04-25 13:10:50,-10,-12,-9,1.2,26,5.5
            2024-04-25 13:10:55,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:11:00,-11,-12,-10,1.2,25,5.5
            2024-04-25 13:11:05,-10,-11,-10,1.2,26,5.6
            2024-04-25 13:11:10,-10,-12,-9,1.2,26,5.5
            2024-04-25 13:11:15,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:11:20,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:11:25,-11,-12,-10,1.2,25,5.5
            2024-04-25 13:11:30,-10,-11,-10,1.2,25,5.6
            2024-04-25 13:11:35,-10,-12,-9,1.2,26,5.5
            2024-04-25 13:11:40,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:11:45,-11,-12,-10,1.2,25,5.5
            2024-04-25 13:11:50,-10,-11,-10,1.2,26,5.6
            2024-04-25 13:11:55,-10,-12,-9,1.2,26,5.5
            2024-04-25 13:12:00,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:12:05,-11,-12,-10,1.2,25,5.5
            2024-04-25 13:12:10,-10,-11,-10,1.2,26,5.6
            2024-04-25 13:12:15,-10,-12,-9,1.2,26,5.5
            2024-04-25 13:12:20,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:12:25,-11,-12,-10,1.2,25,5.5
            2024-04-25 13:12:30,-10,-11,-10,1.2,26,5.6
            2024-04-25 13:12:35,-10,-12,-9,1.2,26,5.5
            2024-04-25 13:12:40,-10,-12,-11,1.2,26,5.6
            2024-04-25 13:12:45,-15,-18,-16,1.2,25,5.8
            2024-04-25 13:12:50,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:12:55,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:00,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:05,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:10,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:15,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:20,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:25,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:30,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:35,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:40,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:45,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:50,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:13:55,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:00,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:05,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:10,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:15,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:20,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:25,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:30,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:35,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:40,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:45,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:50,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:14:55,-14,-17,-15,1.2,25,5.7
            2024-04-25 13:15:00,-14,-17,-15,1.2,25,5.7"""

llm = get_bedrock_text_v3_sonnet()
prompt_template = get_processed_prompt_template_sonnet("{question}")

def get_tool_metadata():
    return {
        "name": "inspect_sensor_data",
        "description": "Useful to the user question is in the domain of factory operation \
            and no other tools can help. \
            Input to this tool is a question. \
            Output is the answer.",
    }

@tool
def run(input: str) -> str:
    """Answer the user question using pre-trained model and few-shot prompting techniques."""
    
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=["question"],
    )

    chain = LLMChain(
        llm=llm,
        prompt=prompt
    )

    output = chain.run({"question": canned_question})

    return output

class InspectChain(Chain):
    """Chain that inspects historical data to locate potential issues."""

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

        output = await chain.arun({"question": canned_question})

        return {
            'text': output
        }
