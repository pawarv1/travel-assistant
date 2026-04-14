from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional, TypeVar, Generic
from enum import Enum

class EventType(str, Enum):
    TRANSPORT = "transport"
    LODGING = "lodging"
    ACTIVITY = "activity"
    FOOD = "food"

class Event(BaseModel):
    """Represents a single chronological occurrence in the trip."""
    event_type: EventType = Field(..., description="Category: transport, lodging, activity, or food")
    title: str = Field(..., description="Name of the event (e.g., 'Flight to NRT', 'Sushi Dinner')")
    start_time: datetime = Field(..., description="Start time for the event")
    end_time: datetime = Field(..., description="End time for the event")
    location: str = Field(..., description="Full address of the location of the event. Formatted as {Street Address}, {City}, {State} {Zip Code}, {Country}")
    cost_usd: float = Field(..., ge=0, description="Estimated cost per person in USD")
    url: str = Field(..., description="Official booking or info website")
    notes: str = Field(default="", description="Details like flight numbers or packing tips")

T = TypeVar("T", bound=Event)

class DayPlan(BaseModel, Generic[T]):
    """A collection of events occurring on a specific calendar day."""
    day_number: int = Field(..., description="The sequence of the trip (e.g., 1, 2, 3)")
    date: str = Field(..., description="The specific calendar date for this day")
    summary: str = Field(..., description="A brief one-sentence highlight of the day")
    events: List[T] = Field(default_factory=list, description="All events in chronological order")

class TravelItinerary(BaseModel, Generic[T]):
    """The root schema for the entire generated trip."""
    title: str = Field(..., max_length=42, description="A creative and catchy title for the trip")
    destination: str = Field(..., description="Primary city and country being visited")
    origin: str = Field(..., description="The starting city and country")
    travelers: int = Field(default=1, ge=1, description="Number of people traveling")
    days: List[DayPlan[T]] = Field(..., description="The day-by-day breakdown of the itinerary")
    general_tips: List[str] = Field(default_factory=list, description="Advice on visas, currency, and culture")

class EventResponse(Event):
    """Response model for Event."""
    latitude: Optional[float] = Field(default=0, ge=-180, le=180, description="Latitude of the event location")
    longitude: Optional[float] = Field(default=0, ge=-180, le=180,  description="Longitude of the event location")

