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
    duration_minutes: int = Field(default=0, description="Total flight duration in minutes")
    url: str = Field(default="", description="Direct booking or flight info URL")

class Transportation(BaseModel):
    mode: TransportMode = Field(default=TransportMode.OTHER)
    from_location: str = Field(default="", description="Origin location")
    to_location: str = Field(default="", description="Destination location")
    departure_time: str = Field(default="", description="Departure time")
    arrival_time: str = Field(default="", description="Arrival time")
    estimated_cost_usd: float = Field(default=0.0, description="Estimated cost per person")
    segments: List[FlightSegment] = Field(default_factory=list, description="List of individual flight legs")
    url: str = Field(default="", description="Booking URL for transport")
    notes: str = Field(default="", description="Additional info (e.g., train company, terminal)")

class Hotel(BaseModel):
    name: str = Field(default="", description="Hotel name")
    address: str = Field(default="", description="Physical address of the hotel")
    check_in_date: str = Field(default="", description="Check-in date")
    check_out_date: str = Field(default="", description="Check-out date")
    estimated_cost_per_night_usd: float = Field(default=0.0, description="Cost per night")
    url: str = Field(default="", description="Hotel or booking website URL")
    notes: str = Field(default="", description="Amenities or check-in instructions")

class Activity(BaseModel):
    name: str = Field(default="", description="Activity name")
    description: str = Field(default="", description="Brief description of the activity")
    location: str = Field(default="", description="Where the activity takes place")
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
    hotel: Hotel = Field(default_factory=Hotel, description="Accommodation for this night")
    transportation: List[Transportation] = Field(default_factory=list)
    activities: List[Activity] = Field(default_factory=list)
    estimated_daily_cost_usd: float = Field(default=0.0, description="Total daily spend excluding hotel")

class TravelItinerary(BaseModel):
    title: str = Field(default="", description="Catchy title for the trip")
    destination: str = Field(default="", description="Main destination country/city")
    origin: str = Field(default="", description="Starting city/airport")
    start_date: str = Field(default="", description="Trip start date")
    end_date: str = Field(default="", description="Trip end date")
    total_days: int = Field(default=0, description="Total count of days")
    travelers: int = Field(default=1, ge=1, description="Number of people traveling")
    summary: str = Field(default="", description="Overall trip description")
    days: List[DayItinerary] = Field(default_factory=list)
    estimated_total_cost_usd: float = Field(default=0.0, description="Total trip budget per person")
    general_tips: List[str] = Field(default_factory=list, description="General travel advice for the destination")
