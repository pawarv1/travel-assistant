import os
import json
import datetime
from dataclasses import dataclass
from pathlib import Path
from pydantic_ai import Agent, ModelMessage, ModelResponse, ToolCallPart, RunContext
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.ollama import OllamaProvider 
from pydantic_ai.models.function import FunctionModel, AgentInfo
from pydantic_ai.common_tools.duckduckgo import duckduckgo_search_tool
from pydantic_ai.capabilities import WebFetch, WebSearch
# from pydantic_ai.mcp import load_mcp_servers
# from pydantic_ai.models.google import GoogleModel
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
from crawl4ai.markdown_generation_strategy import DefaultMarkdownGenerator
from crawl4ai.content_filter_strategy import PruningContentFilter
import models

# import logging
# logging.basicConfig(level=logging.DEBUG)

@dataclass
class MainAgentDeps:
    summary_agent: Agent

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

async def web_fetch_tool(ctx: RunContext[MainAgentDeps], url: str) -> str:
    """Fetches a URL and converts it to Markdown."""
    md_generator = DefaultMarkdownGenerator(
        content_filter=PruningContentFilter(threshold=0.4, threshold_type="fixed")
    )

    config = CrawlerRunConfig(
        word_count_threshold=10,
        markdown_generator=md_generator,
        process_iframes=True
    )
        
    async with AsyncWebCrawler() as crawler:
        result = await crawler.arun(url=url, config=config)
        if result.success:
            md_response = result.markdown.fit_markdown
        else:
            return f"Failed to fetch {url}: {result.error_message}"

    result = await ctx.deps.summary_agent.run(md_response, usage=ctx.usage)

    return result.output

def add_context() -> str:
    now = datetime.datetime.now()
    return f"The current date and time is {now.strftime('%A, %B %d, %Y %H:%M:%S')}."

async def generate_response(agent: Agent[MainAgentDeps, models.TravelItinerary], prompt: str, history: list, deps: MainAgentDeps, dry_run: bool = False):
    if dry_run:
        with agent.override(model=FunctionModel(model_function)):
            # get sample response from agent
            response = await agent.run(prompt, deps=deps)
    else:
        async with agent:
            # generate response from agent (inference)
            response = await agent.run(prompt, message_history=history, deps=deps)
            
    # parse json response and history from result 
    output = response.output
    history = response.all_messages()

    # log messages
    for message in history:
        print(message)
        print("---------------------------")
    print(output)

    return output, history

def load_agents():

    # load tools and capabilities
    # servers = load_mcp_servers('mcpconfig.json')
    web_search_tool = duckduckgo_search_tool(max_results=5)
    web_search = WebSearch(local=web_search_tool)
    web_fetch = WebFetch[MainAgentDeps](local=web_fetch_tool)

    ollama_url = f"http://{os.getenv('OLLAMA_HOST', 'localhost:11434')}/v1" 

    #initialize summary agent
    summary_system_prompt = Path("./system_prompts/SUMMARY_AGENT.md").read_text()
    summary_model = OpenAIChatModel(
        'qwen2.5:7b-16k',
        provider=OllamaProvider(base_url=ollama_url)
    )
    summary_agent = Agent(summary_model,
                          name="summary_agent",
                          system_prompt=summary_system_prompt)
 

    # initialize main agent
    main_system_prompt = Path("./system_prompts/MAIN_AGENT.md").read_text()
    main_model = OpenAIChatModel(
        'qwen2.5:32b-131k',
        provider=OllamaProvider(base_url=ollama_url)
    )
    main_agent = Agent(main_model,
                       name="main_agent",
                       system_prompt=[main_system_prompt, add_context()],
                       output_type=models.TravelItinerary[models.Event],
                       deps_type=MainAgentDeps,
                       capabilities=[web_search, web_fetch],
                       tool_timeout=10)
    
    deps = MainAgentDeps(summary_agent=summary_agent)
    
    return main_agent, deps

