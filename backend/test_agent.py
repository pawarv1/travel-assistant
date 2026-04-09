import pytest
from pydantic_ai import Agent
from pydantic_ai.models.test import TestModel

import models

@pytest.mark.parametrize("output_type", [models.TravelItinerary])
async def test_agent_output(output_type):

    test_model = TestModel() 
    test_agent = Agent(model=test_model, output_type=output_type)
    
    async with test_agent:
        result = await test_agent.run("test run!")
        assert type(result.output) is output_type

