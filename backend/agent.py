import os
import json
import datetime
from pathlib import Path

from pydantic_ai import Agent, ModelMessage, ModelResponse, ToolCallPart
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider 
from pydantic_ai.common_tools.duckduckgo import duckduckgo_search_tool

from pydantic_ai.models.function import FunctionModel, AgentInfo

# from pydantic_ai.mcp import load_mcp_servers
# from pydantic_ai.models.google import GoogleModel

import models
from geocoding import geocode_itinerary

# import logging
# logging.basicConfig(level=logging.DEBUG)

async def model_function(messages: list[ModelMessage], info: AgentInfo) -> ModelResponse:
    with open("sample_itinerary.json", "r") as sample_file:
        data_dict = json.load(sample_file)
   
    result_tool_name = info.output_tools[0].name

    return ModelResponse(parts=[
        ToolCallPart(
            tool_name=result_tool_name,
            args=data_dict
        )
    ])

async def generate_response(
    agent: Agent[None, models.TravelItinerary], 
    prompt: str, history: list, 
    dry_run: bool = False
):
    
    if dry_run:
        with agent.override(model=FunctionModel(model_function)):
            # generate response from agent (inference)
            response = await agent.run(prompt, message_history=history)
    else:
        async with agent:
            # generate response from agent (inference)
            response = await agent.run(prompt, message_history=history)
            
    # parse json response and history from result 
    output: models.TravelItinerary = response.output
    history = response.all_messages()
    
    # --- Geocode every address in the itinerary --- 
    output = await geocode_itinerary(output)

    # log messages
    for message in history:
        print(message)
        print("---------------------------")
    print(output)

    return output, history


def load_agent():
    # load instructions
    system_prompt = Path("AGENT.md").read_text()

    # load tools
    # servers = load_mcp_servers('mcpconfig.json')
    ddg_tool = duckduckgo_search_tool(max_results=5)

    # define model
    # local model
    ollama_url = f"http://{os.getenv('OLLAMA_HOST', 'localhost:11434')}/v1"
    model = OpenAIChatModel(
        'qwen2.5:32b-32k',
        provider=OllamaProvider(base_url=ollama_url)
    )
    # api model (gemini)
    # model = GoogleModel("gemini-2.5-flash")
    
    # define agent using model and servers
    cool_agent = Agent(model, 
                       output_type=models.TravelItinerary,
                       tools=[ddg_tool],
                       tool_timeout=20)
    
    @cool_agent.system_prompt
    def base_system_prompt() -> str:
        return system_prompt
    
    @cool_agent.system_prompt
    def current_context() -> str:
        now = datetime.datetime.now()
        return f"The current date and time is {now.strftime('%A, %B %d, %Y %H:%M:%S')}."
    
    return cool_agent

