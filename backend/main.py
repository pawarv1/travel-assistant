from dotenv import load_dotenv
from fastapi import FastAPI

from agent import load_agent, generate_response
from models import TravelItinerary

# load environment variables
load_dotenv()

cool_agent = load_agent()

app = FastAPI()

@app.get("/")
async def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

@app.get("/itinerary")
async def generate_itinerary(prompt: str) -> TravelItinerary:
    itinerary, history = await generate_response(cool_agent, prompt, [])
    return itinerary
