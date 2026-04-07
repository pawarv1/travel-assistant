import os
from pathlib import Path

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider 
from pydantic_ai.mcp import load_mcp_servers
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.common_tools.duckduckgo import duckduckgo_search_tool
from pydantic_ai.models.test import TestModel

import models

import logging
logging.basicConfig(level=logging.DEBUG)


async def generate_response(agent: Agent[None, models.TravelItinerary], prompt: str, history: list, dry_run: bool = False):
    
    if dry_run:
        with agent.override(model=TestModel()):
            async with agent:
                # generate response from agent (inference)
                response = await agent.run(prompt, message_history=history)
    else:
        async with agent:
            # generate response from agent (inference)
            response = await agent.run(prompt, message_history=history)
            
    # parse json response and history from result 
    output = response.output
    history = response.all_messages()

    # log messages
    for message in history:
        print(message)
        print("---------------------------")
    print(output)

    return output, history


def load_agent():
    # load instructions
    instructions = Path("AGENT.md").read_text()

    # load tools
    servers = load_mcp_servers('mcpconfig.json')
    ddg_tool = duckduckgo_search_tool()

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
                       instructions=instructions)
    
    # print name and description of each tool
    for name, tool in cool_agent._function_toolset.tools.items():
        print(f"Tool Name: {name}")
        print(f"Description: {tool.description}")

    return cool_agent
