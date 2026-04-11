"""
test_geocoding.py
-----------------
Run with:  python test_geocoding.py
No server or agent required.
"""

import asyncio
import json
from models import TravelItinerary
from geocoding import geocode_itinerary


async def main():
    with open("sample_itinerary.json") as f:
        data = json.load(f)

    itinerary = TravelItinerary(**data)
    print("Before geocoding:")
    print_coords(itinerary)

    itinerary = await geocode_itinerary(itinerary)

    print("\nAfter geocoding:")
    print_coords(itinerary)


def print_coords(itinerary: TravelItinerary):
    for day in itinerary.days:
        for t in day.transportation:
            print(f"  [transport] from: {t.from_address!r:50s} → ({t.from_lat}, {t.from_lng})")
            print(f"  [transport]   to: {t.to_address!r:50s} → ({t.to_lat}, {t.to_lng})")
        for a in day.activities:
            print(f"  [activity]      : {a.address!r:50s} → ({a.lat}, {a.lng})")
    for acc in itinerary.accomodations:
        print(f"  [accommodation] : {acc.address!r:50s} → ({acc.lat}, {acc.lng})")


asyncio.run(main())
