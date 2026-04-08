import React, { useMemo, useState, useEffect } from "react";

// ---------- Types ----------
type FlightSegment = {
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  duration_minutes: number;
  url: string;
};

type TransportationItem = {
  mode: string;
  from_location: string;
  to_location: string;
  departure_time: string;
  arrival_time: string;
  estimated_cost_usd: number;
  segments: FlightSegment[];
  url: string;
  notes: string;
};

type Activity = {
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string; // e.g., "attraction", "restaurant", "entertainment"
  start_time: string;
  end_time: string;
  estimated_cost_usd: number;
  url: string;
  notes: string;
};

type Hotel = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string; // "stay"
  check_in_date: string;
  check_out_date: string;
  estimated_cost_per_night_usd: number;
  url: string;
  notes: string;
};

type Day = {
  day_number: number;
  date: string;
  location: string;
  summary: string;
  hotel: Hotel;
  transportation: TransportationItem[];
  activities: Activity[];
  estimated_daily_cost_usd: number;
};

type TripPlan = {
  title: string;
  destination: string;
  origin: string;
  start_date: string;
  end_date: string;
  total_days: number;
  travelers: number;
  summary: string;
  days: Day[];
  estimated_total_cost_usd: number;
  general_tips: string[];
};

// ---------- Sample Data ----------
const sampleTrip: TripPlan = {
  title: "Sunny Escape to Hawaii: 3-Day Oahu Itinerary from Central New Jersey",
  destination: "Hawaii, Oahu",
  origin: "EWR (Newark Liberty International Airport)",
  start_date: "2024-05-15",
  end_date: "2024-05-17",
  total_days: 3,
  travelers: 1,
  summary: "Enjoy a compact but jam-packed 3-day visit to Oahu, Hawaii from Central New Jersey.",
  days: [
    {
      day_number: 1,
      date: "2024-05-15",
      location: "North Shore",
      summary: "Arrival and first day exploring the north shore.",
      hotel: {
        name: "North Shore Retreat Hotel",
        address: "99 Waimea Falls Dr, Waialua, HI 96791, USA",
        latitude: 21.637,
        longitude: -158.065,
        category: "stay",
        check_in_date: "2024-05-15",
        check_out_date: "2024-05-18",
        estimated_cost_per_night_usd: 250,
        url: "",
        notes: "",
      },
      transportation: [
        {
          mode: "flight",
          from_location: "Newark, NJ (EWR)",
          to_location: "Honolulu International Airport (HNL)",
          departure_time: "14:00",
          arrival_time: "19:58",
          estimated_cost_usd: 300,
          segments: [
            {
              airline: "United Airlines",
              departure_airport: "EWR",
              arrival_airport: "HNL",
              departure_time: "14:00",
              arrival_time: "19:58",
              duration_minutes: 278,
              url: "",
            },
          ],
          url: "",
          notes: "",
        },
      ],
      activities: [
        {
          name: "Waimea Falls Park Adventure",
          description: "A water sports park with natural swimming pools and a waterfall.",
          location: "Waimea Falls Park",
          latitude: 21.637,
          longitude: -158.065,
          category: "attraction",
          start_time: "10:30",
          end_time: "14:00",
          estimated_cost_usd: 50,
          url: "",
          notes: "",
        },
        {
          name: "Haleiwa Joe's Seafood Restaurant",
          description: "Fresh seafood with ocean views.",
          location: "Haleiwa",
          latitude: 21.59,
          longitude: -158.11,
          category: "restaurant",
          start_time: "18:00",
          end_time: "20:00",
          estimated_cost_usd: 80,
          url: "",
          notes: "",
        },
      ],
      estimated_daily_cost_usd: 0,
    },
  ],
  estimated_total_cost_usd: 800,
  general_tips: [
    "Check entry requirements.",
    "Carry sunscreen and swimwear.",
    "Respect local culture and nature.",
  ],
};

// ---------- Helpers ----------
function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

type TabKey = "overview" | "days" | "tips";

type Props = {
  initialData?: TripPlan;
  onLocationsChange?: (locations: { name: string; lat: number; lng: number; category: string }[]) => void;
};

export default function TravelPlannerUI({ initialData = sampleTrip, onLocationsChange }: Props) {
  const [trip] = useState<TripPlan>(initialData);
  const [tab, setTab] = useState<TabKey>("overview");
  const [query, setQuery] = useState<string>("");

  const filteredDays = useMemo<Day[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trip.days;

    return trip.days.filter((day) => {
      const activityText = day.activities
        .map((activity) => `${activity.name} ${activity.description} ${activity.location}`)
        .join(" ")
        .toLowerCase();

      const transportText = day.transportation
        .map((item) => `${item.mode} ${item.from_location} ${item.to_location}`)
        .join(" ")
        .toLowerCase();

      const hotelText = `${day.hotel.name} ${day.hotel.address}`.toLowerCase();
      const dayText = `${day.location} ${day.summary}`.toLowerCase();

      return [activityText, transportText, hotelText, dayText].some((text) => text.includes(q));
    });
  }, [query, trip.days]);

  useEffect(() => {
    if (onLocationsChange) {
      const locations: { name: string; lat: number; lng: number; category: string }[] = [];
      const seen = new Set<string>();
      filteredDays.forEach((day) => {
        // Add hotel
        const hotelKey = `${day.hotel.name}-${day.hotel.latitude}-${day.hotel.longitude}`;
        if (!seen.has(hotelKey)) {
          seen.add(hotelKey);
          locations.push({
            name: day.hotel.name,
            lat: day.hotel.latitude,
            lng: day.hotel.longitude,
            category: day.hotel.category,
          });
        }
        // Add activities
        day.activities.forEach((activity) => {
          const activityKey = `${activity.name}-${activity.latitude}-${activity.longitude}`;
          if (!seen.has(activityKey)) {
            seen.add(activityKey);
            locations.push({
              name: activity.name,
              lat: activity.latitude,
              lng: activity.longitude,
              category: activity.category,
            });
          }
        });
      });
      onLocationsChange(locations);
    }
  }, [filteredDays, onLocationsChange]);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", lineHeight: 1.4 }}>
      <h1>{trip.title}</h1>
      <p>{trip.summary}</p>

      <div style={{ marginBottom: 16 }}>
        <button type="button" onClick={() => setTab("overview")} style={{ marginRight: 8 }}>
          Overview
        </button>
        <button type="button" onClick={() => setTab("days")} style={{ marginRight: 8 }}>
          Days
        </button>
        <button type="button" onClick={() => setTab("tips")}>
          Tips
        </button>
      </div>

      {tab === "overview" && (
        <div>
          <p><b>Destination:</b> {trip.destination}</p>
          <p><b>Origin:</b> {trip.origin}</p>
          <p><b>Dates:</b> {trip.start_date} to {trip.end_date}</p>
          <p><b>Total Days:</b> {trip.total_days}</p>
          <p><b>Travelers:</b> {trip.travelers}</p>
          <p><b>Estimated Total Cost:</b> {formatUsd(trip.estimated_total_cost_usd)}</p>
        </div>
      )}

      {tab === "days" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <input
              value={query}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
              placeholder="Search by location, activity, hotel, or transportation"
              style={{ width: 360, maxWidth: "100%" }}
            />
          </div>

          {filteredDays.map((day) => (
            <details key={day.day_number} style={{ marginBottom: 16 }}>
              <summary>
                Day {day.day_number} - {day.date} - {day.location}
              </summary>

              <div style={{ paddingTop: 8 }}>
                <p>{day.summary}</p>

                <h3>Hotel</h3>
                <p><b>Name:</b> {day.hotel.name || "Not listed"}</p>
                <p><b>Address:</b> {day.hotel.address || "Not listed"}</p>
                <p>
                  <b>Check-in / Check-out:</b> {day.hotel.check_in_date || "-"} to {day.hotel.check_out_date || "-"}
                </p>
                <p>
                  <b>Estimated Cost Per Night:</b>{" "}
                  {day.hotel.estimated_cost_per_night_usd > 0
                    ? formatUsd(day.hotel.estimated_cost_per_night_usd)
                    : "Not listed"}
                </p>

                <h3>Transportation</h3>
                {day.transportation.length > 0 ? (
                  day.transportation.map((item, index) => (
                    <div key={`${item.mode}-${index}`} style={{ marginBottom: 10 }}>
                      <p>
                        <b>Mode:</b> {item.mode}
                      </p>
                      <p>
                        <b>Route:</b> {item.from_location} → {item.to_location}
                      </p>
                      <p>
                        <b>Time:</b> {item.departure_time || "-"} to {item.arrival_time || "-"}
                      </p>
                      <p>
                        <b>Estimated Cost:</b>{" "}
                        {item.estimated_cost_usd > 0 ? formatUsd(item.estimated_cost_usd) : "Not listed"}
                      </p>
                      {item.segments.length > 0 && (
                        <div>
                          <b>Segments:</b>
                          <ul>
                            {item.segments.map((segment, segmentIndex) => (
                              <li key={`${segment.airline}-${segmentIndex}`}>
                                {segment.airline}: {segment.departure_airport} → {segment.arrival_airport} ({segment.departure_time} - {segment.arrival_time})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p>No transportation listed.</p>
                )}

                <h3>Activities</h3>
                {day.activities.length > 0 ? (
                  day.activities.map((activity, index) => (
                    <div key={`${activity.name}-${index}`} style={{ marginBottom: 10 }}>
                      <p><b>{activity.name}</b></p>
                      <p>{activity.description}</p>
                      <p>
                        <b>Time:</b> {activity.start_time || "-"} to {activity.end_time || "-"}
                      </p>
                      <p><b>Location:</b> {activity.location || "Not listed"}</p>
                      <p>
                        <b>Estimated Cost:</b>{" "}
                        {activity.estimated_cost_usd > 0 ? formatUsd(activity.estimated_cost_usd) : "Not listed"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No activities listed.</p>
                )}

                <p>
                  <b>Estimated Daily Cost:</b>{" "}
                  {day.estimated_daily_cost_usd > 0 ? formatUsd(day.estimated_daily_cost_usd) : "Not listed"}
                </p>
              </div>
            </details>
          ))}
        </div>
      )}

      {tab === "tips" && (
        <div>
          <h2>General Tips</h2>
          <ul>
            {trip.general_tips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}