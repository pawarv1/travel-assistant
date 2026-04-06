import asyncio
import os
from dotenv import load_dotenv

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider 
from pydantic_ai.mcp import load_mcp_servers
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.common_tools.duckduckgo import duckduckgo_search_tool
import logging
logging.basicConfig(level=logging.DEBUG)

async def chat(agent: Agent):
    history = None
    print("Chat started. Type 'quit' to exit.\n")
    
    end_chat = False

    while not end_chat:
        user_input = input("You: ")
        if user_input.lower() == 'quit':
            end_chat = True
        else:
            result = await agent.run(user_input, message_history=history)
            for message in result.all_messages():
                print(message)
                print("---------------------------")

            print(result.output)
            history = result.all_messages()

async def main():
    load_dotenv()

    instructions = """
You are an expert travel itinerary planner with access to a suite of tools.

TOOL USE RULES (follow strictly):
- Always check what tools are available before responding to any user request.
- When a user asks for any information that a tool can provide — weather, flights, 
hotels, points of interest, maps, exchange rates, events, etc. — you MUST call 
the relevant tool. Never answer from memory or make up data.
- If multiple tools are relevant to a request, call all of them before responding.
- If a tool call fails, tell the user what went wrong and try an alternative approach,
  if there is an alternative. If there are no alternatives, just let the user know the
  tool call failed.
- Never guess at real-world data (prices, hours, availability, forecasts). If you 
don't have a tool for it, say so clearly.

PLANNING BEHAVIOR:
- When building an itinerary, always gather real data first (weather, availability, 
hours, travel times) before presenting a plan.
- If the user does not ask you to build an itinerary, respond to their specific question,
  still using tools to gather needed data.
- Structure itineraries by day with clear times, locations, and logistics.
- Proactively flag potential issues: bad weather windows, long travel gaps, 
mismatched opening hours, visa requirements, or seasonal closures.
- Ask clarifying questions if the user hasn't specified budget, travel dates, 
group size, or interests — these affect every recommendation.

WEATHER WORKFLOW (follow exactly):
1. If the user asks about weather and provides a city name, FIRST call the 
   geocoding tool to get coordinates for that city.
2. Take the latitude and longitude from the geocoding result.
3. THEN call open-meteo_weather_forecast with those coordinates.
4. Never skip step 1. Never guess coordinates.

RESPONSE FORMAT:
- Lead with the most time-sensitive or decision-critical information.
- Use clear day-by-day structure for multi-day plans.
"""

    instructions = 'Search DuckDuckGo for the given query and return the results.'

    # load all servers from configuration file
    servers = load_mcp_servers('mcpconfig.json')
    
    # local model
    ollama_url = f"http://{os.getenv('OLLAMA_HOST', 'localhost:11434')}/v1"
    model = OpenAIChatModel(
        'qwen2.5:32b-32k',
        provider=OllamaProvider(base_url=ollama_url)
    )
    
    # api model (gemini)
    # model = GoogleModel("gemini-2.5-flash")

    # initialize agent using model and servers
    cool_agent = Agent(model, 
                       tools=[duckduckgo_search_tool()],
                       instructions=instructions)
    
    async with cool_agent:
        await chat(cool_agent)

if __name__ == "__main__":
    asyncio.run(main())
