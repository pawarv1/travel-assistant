"""
geocoding.py
------------
Post-processes a TravelItinerary produced by the agent and fills in
lat/lng coordinates for every address field using the Nominatim API
(OpenStreetMap).  No API key required.

Usage:
    from geocoding import geocode_itinerary
    itinerary = await geocode_itinerary(itinerary)
"""

import asyncio
import logging
from typing import Optional

import httpx

import models

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "TravelAssistantApp/1.0"}

# Simple in-memory cache so the same address is never looked up twice
# within a single itinerary (or across requests while the process is alive).
_cache: dict[str, tuple[float, float] | None] = {}


async def _lookup(client: httpx.AsyncClient, address: str) -> tuple[float, float] | None:
    """Return (lat, lng) for a single address string, or None on failure."""
    if not address or not address.strip():
        return None

    if address in _cache:
        return _cache[address]

    params = {
        "q": address,
        "format": "json",
        "limit": 1,
    }
    try:
        response = await client.get(NOMINATIM_URL, params=params, headers=HEADERS, timeout=10.0)
        response.raise_for_status()
        results = response.json()
        if results:
            coords = (float(results[0]["lat"]), float(results[0]["lon"]))
            _cache[address] = coords
            return coords
        logger.warning("Geocoding: no results for address %r", address)
    except Exception as exc:
        logger.warning("Geocoding failed for address %r: %s", address, exc)

    _cache[address] = None
    return None


async def geocode_itinerary(itinerary: models.TravelItinerary) -> models.TravelItinerary:
    """
    Walk every address in the itinerary and populate the corresponding
    lat/lng fields in-place.  Returns the same itinerary object.

    Nominatim's usage policy asks for a small delay between requests
    (≥ 1 request/second).  Fire them concurrently but throttle with
    a semaphore so we stay well within the limit.
    """
    semaphore = asyncio.Semaphore(1)  # 1 concurrent request → ~1 req/s

    async def guarded_lookup(client: httpx.AsyncClient, address: str):
        async with semaphore:
            result = await _lookup(client, address)
            # Nominatim rate-limit: at least 1 second between requests
            await asyncio.sleep(1.1)
            return result

    async with httpx.AsyncClient() as client:

        # --- Build a flat list of (address, setter) coroutines ---
        tasks: list[tuple[str, asyncio.Task]] = []

        for day in itinerary.days:
            for transport in day.transportation:
                if transport.from_address:
                    tasks.append(("transport.from", transport.from_address,
                                  lambda coords, t=transport: _set(t, "from_lat", "from_lng", coords)))
                if transport.to_address:
                    tasks.append(("transport.to", transport.to_address,
                                  lambda coords, t=transport: _set(t, "to_lat", "to_lng", coords)))
                    
            for activity in day.activities:
                if activity.address:
                    tasks.append(("activity", activity.address,
                                  lambda coords, a=activity: _set(a, "lat", "lng", coords)))

        for accommodation in itinerary.accomodations:
            if accommodation.address:
                tasks.append(("accommodation", accommodation.address,
                              lambda coords, acc=accommodation: _set(acc, "lat", "lng", coords)))

        # --- Run lookups sequentially (Nominatim is strict about rate limits) ---
        for kind, address, setter in tasks:
            coords = await guarded_lookup(client, address)
            setter(coords)
            if coords:
                logger.info("Geocoded %s %r → %s", kind, address, coords)
            else:
                logger.warning("Could not geocode %s %r", kind, address)

    return itinerary


def _set(obj, lat_field: str, lng_field: str, coords: Optional[tuple[float, float]]):
    """Helper: write lat/lng onto a model object (or leave None on failure)."""
    if coords:
        setattr(obj, lat_field, coords[0])
        setattr(obj, lng_field, coords[1])
