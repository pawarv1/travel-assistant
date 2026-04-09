from pydantic import BaseModel, Field
from typing import List
from enum import Enum

class TransportMode(str, Enum):
    FLIGHT = "flight"
    TRAIN = "train"
    BUS = "bus"
    CAR = "car"
    TAXI = "taxi"
    WALK = "walk"
    FERRY = "ferry"
    OTHER = "other"

class FlightSegment(BaseModel):
    airline: str = Field(default="", description="Name of the airline")
    departure_airport: str = Field(default="", description="IATA code e.g. 'JFK'")
    arrival_airport: str = Field(default="", description="IATA code e.g. 'NRT'")
    departure_time: str = Field(default="", description="Scheduled departure time")
    arrival_time: str = Field(default="", description="Scheduled arrival time")
    url: str = Field(default="", description="Direct booking or flight info URL")

class Transportation(BaseModel):
    mode: TransportMode = Field(default=TransportMode.OTHER)
    from_address: str = Field(default="", description="Full physical address of origin")
    to_address: str = Field(default="", description="Full physical address of destination")
    departure_time: str = Field(default="", description="Departure time")
    arrival_time: str = Field(default="", description="Arrival time")
    estimated_cost_usd: float = Field(default=0.0, description="Estimated cost per person")
    segments: List[FlightSegment] = Field(default_factory=list, description="List of individual flight legs. Only use if TransportMode is flight")
    url: str = Field(default="", description="Booking URL for transport")
    notes: str = Field(default="", description="Additional info (e.g., train company, terminal)")

class Accomodation(BaseModel):
    name: str = Field(default="", description="Accomodation name")
    address: str = Field(default="", description="Full physical address of place of accomodation")
    check_in_date: str = Field(default="", description="Check-in date")
    check_out_date: str = Field(default="", description="Check-out date")
    estimated_cost_per_night_usd: float = Field(default=0.0, description="Cost per night")
    url: str = Field(default="", description="Accomodation or booking website URL")
    notes: str = Field(default="", description="Amenities or check-in instructions")

class Activity(BaseModel):
    name: str = Field(default="", description="Activity name")
    description: str = Field(default="", description="Brief description of the activity")
    address: str = Field(default="", description="Full physical address where the activity takes place")
    start_time: str = Field(default="", description="Start time")
    end_time: str = Field(default="", description="End time")
    estimated_cost_usd: float = Field(default=0.0, description="Price per person")
    url: str = Field(default="", description="Official activity or booking URL")
    notes: str = Field(default="", description="Tips or reservation requirements")

class DayItinerary(BaseModel):
    day_number: int = Field(description="The day sequence number (1, 2, etc.)")
    date: str = Field(default="", description="Calendar date or relative day name")
    location: str = Field(default="", description="Primary city or area for this day")
    summary: str = Field(default="", description="One-sentence overview of the day")
    transportation: List[Transportation] = Field(default_factory=list)
    activities: List[Activity] = Field(default_factory=list)

class TravelItinerary(BaseModel):
    title: str = Field(default="", description="Catchy title for the trip")
    destination: str = Field(default="", description="Main destination city and country")
    origin: str = Field(default="", description="Starting city and country")
    start_date: str = Field(default="", description="Trip start date")
    end_date: str = Field(default="", description="Trip end date")
    total_days: int = Field(default=0, description="Total count of days")
    travelers: int = Field(default=1, ge=1, description="Number of people traveling")
    summary: str = Field(default="", description="Overall trip description")
    days: List[DayItinerary] = Field(default_factory=list)
    accomodations: List[Accomodation] = Field(default_factory=list, description="List of accomodations for the trip")
    general_tips: List[str] = Field(default_factory=list, description="General travel advice for the destination")
