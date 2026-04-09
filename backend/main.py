from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
import logfire

from agent import load_agent, generate_response
from models import TravelItinerary

class ItineraryRequest(BaseModel):
    prompt: str
    dry_run: bool = False


# load environment variables
load_dotenv()

cool_agent = load_agent()

app = FastAPI()

logfire.configure()
logfire.instrument_pydantic_ai()
logfire.instrument_fastapi(app)

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers
)

@app.get("/")
async def read_root():
    return {"Hello": "World"}


@app.get("/items/{item_id}")
async def read_item(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

@app.post("/itinerary")
async def generate_itinerary(request: ItineraryRequest) -> TravelItinerary:
    prompt = request.prompt
    dry_run = request.dry_run

    itinerary, history = await generate_response(cool_agent, prompt, [], dry_run)
    
    return itinerary
