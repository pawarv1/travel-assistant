from dotenv import load_dotenv
import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
import logfire

from agent import load_agents, generate_response
from models import TravelItinerary, DayPlan, EventResponse

class ItineraryRequest(BaseModel):
    prompt: str
    dry_run: bool = False


# load environment variables
load_dotenv()

cool_agent, deps = load_agents()

app = FastAPI()

# set up logfire
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

@app.post("/itinerary")
async def generate_itinerary(request: ItineraryRequest) -> TravelItinerary:
    prompt = request.prompt
    dry_run = request.dry_run

    itinerary, history = await generate_response(cool_agent, prompt, [], deps, dry_run)
    
    # retrieve locations from itinerary
    locations = []
    for day in itinerary.days:
        for event in day.events:
           locations.append(event.location)
    
    # find coordinates for each location
    coordinates = geocode(locations)
    
    # prepare response itinerary from itinerary 
    response_days: list[DayPlan[EventResponse]] = []

    i = 0
    for day in itinerary.days:
        response_events: list[EventResponse] = []

        for event in day.events:
            if i >= len(coordinates):
                raise ValueError("Number of coordinates does not match number of events.")
            elif type(coordinates[i][0]) is float and type(coordinates[i][1]) is float:
                latitude, longitude = coordinates[i]
            else:
                latitude, longitude = None, None
            response_event = EventResponse(**event.model_dump(), latitude=latitude, longitude=longitude)
            response_events.append(response_event)
            i += 1

        response_day = DayPlan[EventResponse](**day.model_dump(exclude={"events"}), events=response_events)
        response_days.append(response_day)

    response_itinerary = TravelItinerary[EventResponse](**itinerary.model_dump(exclude={"days"}),
                                         days=response_days)

    
    print(response_itinerary)

    return response_itinerary

def geocode(locations: list[str]):
    
    json=[
        {        
            "q": location,
            "limit": 1
        } 
        for location in locations
    ]
    
    response = requests.post("https://api.mapbox.com/search/geocode/v6/batch",
                        params={"access_token": os.getenv("MAPBOX_ACCESS_TOKEN")},
                        json=json)
    coordinates = []

    response = response.json()

    for feature in response["batch"]:
        try:
            coord = feature["features"][0]["geometry"]["coordinates"]
            coordinates.append((coord[1], coord[0]))
        except (KeyError, IndexError, TypeError):
            coordinates.append((None, None))

    return coordinates
    

        

