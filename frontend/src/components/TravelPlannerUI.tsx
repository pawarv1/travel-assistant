import React, { useMemo, useState, useEffect } from "react";

import { getItinerary } from "../services/itinerary.js";

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
  category: string;
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
  category: string;
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

function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const categoryConfig: Record<string, { icon: string; color: string; bg: string }> = {
  attraction: { icon: "🏛️", color: "#16a34a", bg: "#dcfce7" },
  restaurant:  { icon: "🍽️", color: "#d97706", bg: "#fef3c7" },
  entertainment: { icon: "🎭", color: "#7c3aed", bg: "#ede9fe" },
  stay:        { icon: "🏨", color: "#0284c7", bg: "#e0f2fe" },
  flight:      { icon: "✈️", color: "#6b7280", bg: "#f3f4f6" },
  default:     { icon: "📍", color: "#64748b", bg: "#f1f5f9" },
};

const getCat = (cat: string) => categoryConfig[cat?.toLowerCase()] ?? categoryConfig.default;

type TabKey = "overview" | "days" | "tips";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

  :root {
    --sand: #f5f0e8;
    --ocean: #0a4d68;
    --coral: #e8735a;
    --foam: #ffffff;
    --dusk: #1a2e3b;
    --mist: #e8eef2;
    --gold: #c9a84c;
    --text: #1a2e3b;
    --text-muted: #5a7080;
    --border: rgba(10,77,104,0.12);
    --shadow-sm: 0 2px 8px rgba(10,77,104,0.08);
    --shadow-md: 0 8px 32px rgba(10,77,104,0.12);
    --shadow-lg: 0 24px 64px rgba(10,77,104,0.16);
    --radius: 16px;
    --radius-sm: 8px;
  }

  .tp-root * { box-sizing: border-box; margin: 0; padding: 0; }
  .tp-root { font-family: 'DM Sans', sans-serif; color: var(--text); background: var(--sand); min-height: 100vh; }

  /* Header */
  .tp-hero {
    background: linear-gradient(135deg, var(--ocean) 0%, #0d6b91 50%, #1a8fb5 100%);
    padding: 48px 40px 40px;
    position: relative;
    overflow: hidden;
  }
  .tp-hero::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  .tp-hero-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
    color: rgba(255,255,255,0.9); font-size: 12px; font-weight: 600;
    letter-spacing: 1.5px; text-transform: uppercase;
    padding: 6px 14px; border-radius: 100px; margin-bottom: 20px;
    backdrop-filter: blur(8px);
  }
  .tp-hero-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(24px, 4vw, 40px); font-weight: 700; color: white;
    line-height: 1.2; margin-bottom: 12px; position: relative;
  }
  .tp-hero-subtitle {
    color: rgba(255,255,255,0.7); font-size: 15px; font-weight: 400;
    max-width: 540px; line-height: 1.6; position: relative;
  }
  .tp-hero-meta {
    display: flex; flex-wrap: wrap; gap: 24px; margin-top: 32px; position: relative;
  }
  .tp-hero-stat {
    display: flex; flex-direction: column; gap: 2px;
  }
  .tp-hero-stat-label { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: rgba(255,255,255,0.5); }
  .tp-hero-stat-value { font-size: 18px; font-weight: 600; color: white; }

  /* Nav */
  .tp-nav {
    display: flex; gap: 0; padding: 0 40px;
    background: var(--foam); border-bottom: 1px solid var(--border);
    position: sticky; top: 0; z-index: 10;
    box-shadow: var(--shadow-sm);
  }
  .tp-nav-btn {
    padding: 16px 24px; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500; color: var(--text-muted);
    background: none; border: none; border-bottom: 2px solid transparent;
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
    display: flex; align-items: center; gap: 8px;
  }
  .tp-nav-btn:hover { color: var(--ocean); }
  .tp-nav-btn.active { color: var(--ocean); border-bottom-color: var(--coral); font-weight: 600; }

  /* Content */
  .tp-content { padding: 40px; max-width: 900px; margin: 0 auto; }

  /* Overview Cards */
  .tp-overview-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px;
  }
  .tp-stat-card {
    background: var(--foam); border-radius: var(--radius); padding: 24px 20px;
    box-shadow: var(--shadow-sm); border: 1px solid var(--border);
    display: flex; flex-direction: column; gap: 8px;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .tp-stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .tp-stat-card-icon { font-size: 24px; }
  .tp-stat-card-label { font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: var(--text-muted); }
  .tp-stat-card-value { font-size: 22px; font-weight: 600; color: var(--ocean); }

  .tp-cost-banner {
    background: linear-gradient(135deg, var(--ocean), #1a8fb5);
    border-radius: var(--radius); padding: 28px 32px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;
  }
  .tp-cost-banner-label { font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.7); letter-spacing: 0.5px; }
  .tp-cost-banner-value { font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 700; color: white; }
  .tp-cost-banner-sub { font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 4px; }

  /* Search */
  .tp-search-wrap { position: relative; margin-bottom: 32px; }
  .tp-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); font-size: 16px; pointer-events: none; }
  .tp-search {
    width: 100%; padding: 14px 16px 14px 44px;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--foam); color: var(--text); outline: none;
    box-shadow: var(--shadow-sm); transition: border-color 0.2s, box-shadow 0.2s;
  }
  .tp-search:focus { border-color: var(--ocean); box-shadow: 0 0 0 3px rgba(10,77,104,0.1); }
  .tp-search::placeholder { color: var(--text-muted); }

  /* Day Cards */
  .tp-day-card {
    background: var(--foam); border-radius: var(--radius); margin-bottom: 20px;
    border: 1px solid var(--border); box-shadow: var(--shadow-sm); overflow: hidden;
    transition: box-shadow 0.2s;
  }
  .tp-day-card:hover { box-shadow: var(--shadow-md); }
  .tp-day-header {
    display: flex; align-items: center; gap: 16px; padding: 20px 24px;
    cursor: pointer; user-select: none;
    background: linear-gradient(to right, rgba(10,77,104,0.03), transparent);
  }
  .tp-day-number {
    width: 44px; height: 44px; border-radius: 12px;
    background: var(--ocean); color: white;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; flex-shrink: 0;
  }
  .tp-day-info { flex: 1; min-width: 0; }
  .tp-day-title { font-size: 16px; font-weight: 600; color: var(--text); }
  .tp-day-date { font-size: 13px; color: var(--text-muted); margin-top: 2px; }
  .tp-day-summary { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
  .tp-day-chevron { color: var(--text-muted); font-size: 14px; transition: transform 0.2s; }
  .tp-day-chevron.open { transform: rotate(180deg); }

  .tp-day-body { padding: 0 24px 24px; border-top: 1px solid var(--border); }

  /* Section */
  .tp-section { margin-top: 24px; }
  .tp-section-title {
    display: flex; align-items: center; gap: 10px;
    font-size: 12px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;
    color: var(--text-muted); margin-bottom: 14px;
  }
  .tp-section-title::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* Hotel Card */
  .tp-hotel-card {
    background: var(--mist); border-radius: var(--radius-sm); padding: 16px 20px;
    display: flex; flex-direction: column; gap: 8px;
  }
  .tp-hotel-name { font-size: 15px; font-weight: 600; color: var(--ocean); }
  .tp-hotel-address { font-size: 13px; color: var(--text-muted); }
  .tp-hotel-meta { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 4px; }
  .tp-hotel-meta-item { display: flex; flex-direction: column; gap: 2px; }
  .tp-hotel-meta-label { font-size: 10px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: var(--text-muted); }
  .tp-hotel-meta-value { font-size: 13px; font-weight: 500; color: var(--text); }

  /* Transport */
  .tp-transport-card {
    border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 16px 20px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .tp-transport-route {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  }
  .tp-transport-airport { font-size: 22px; font-weight: 700; color: var(--ocean); }
  .tp-transport-arrow {
    flex: 1; display: flex; align-items: center; gap: 8px; min-width: 60px;
    color: var(--text-muted); font-size: 12px;
  }
  .tp-transport-arrow::before, .tp-transport-arrow::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }
  .tp-transport-mode-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 600; text-transform: capitalize;
    background: var(--mist); color: var(--text-muted);
  }
  .tp-segment { display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: var(--text-muted); }
  .tp-segment-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--coral); flex-shrink: 0; margin-top: 5px; }

  /* Activities */
  .tp-activities-list { display: flex; flex-direction: column; gap: 12px; }
  .tp-activity-card {
    display: flex; gap: 14px; padding: 16px; border-radius: var(--radius-sm);
    border: 1px solid var(--border); background: var(--foam);
    transition: border-color 0.2s;
  }
  .tp-activity-card:hover { border-color: rgba(10,77,104,0.25); }
  .tp-activity-icon {
    width: 40px; height: 40px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .tp-activity-info { flex: 1; min-width: 0; }
  .tp-activity-name { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 4px; }
  .tp-activity-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 8px; }
  .tp-activity-meta { display: flex; flex-wrap: wrap; gap: 12px; }
  .tp-activity-meta-item { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--text-muted); }
  .tp-activity-cost {
    font-size: 14px; font-weight: 600; color: var(--ocean);
    white-space: nowrap; padding-top: 2px;
  }

  /* Tips */
  .tp-tips-list { display: flex; flex-direction: column; gap: 12px; }
  .tp-tip-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 18px 20px; background: var(--foam); border-radius: var(--radius-sm);
    border: 1px solid var(--border); box-shadow: var(--shadow-sm);
  }
  .tp-tip-num {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--ocean); color: white; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700;
  }
  .tp-tip-text { font-size: 14px; color: var(--text); line-height: 1.6; padding-top: 3px; }

  /* Empty state */
  .tp-empty { text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px; }
`;

type Props = {
  onTripDataChange?: (tripData: TripPlan) => void;
  initialData?: TripPlan;
};

export default function TravelPlannerUI({ initialData = sampleTrip, onTripDataChange }: Props) {
  const [trip] = useState<TripPlan>(initialData);
  const [tab, setTab] = useState<TabKey>("overview");
  const [query, setQuery] = useState<string>("");
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1]));

  const toggleDay = (dayNum: number) => {
    setOpenDays(prev => {
      const next = new Set(prev);
      next.has(dayNum) ? next.delete(dayNum) : next.add(dayNum);
      return next;
    });
  };

  const filteredDays = useMemo<Day[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trip.days;
    return trip.days.filter((day) => {
      const activityText = day.activities.map((a) => `${a.name} ${a.description} ${a.location}`).join(" ").toLowerCase();
      const transportText = day.transportation.map((t) => `${t.mode} ${t.from_location} ${t.to_location}`).join(" ").toLowerCase();
      const hotelText = `${day.hotel.name} ${day.hotel.address}`.toLowerCase();
      const dayText = `${day.location} ${day.summary}`.toLowerCase();
      return [activityText, transportText, hotelText, dayText].some((t) => t.includes(q));
    });
  }, [query, trip.days]);

  useEffect(() => {
    if (onTripDataChange) onTripDataChange(trip);
  }, [trip, onTripDataChange]);

  const tabs = [
    { key: "overview" as TabKey, label: "Overview", icon: "🗺️" },
    { key: "days" as TabKey, label: "Itinerary", icon: "📅" },
    { key: "tips" as TabKey, label: "Travel Tips", icon: "💡" },
  ];

  return (
    <div className="tp-root">
      <style>{styles}</style>

      {/* Hero */}
      <div className="tp-hero">
        <div className="tp-hero-badge">✈️ &nbsp; Trip Planner</div>
        <h1 className="tp-hero-title">{trip.title}</h1>
        <p className="tp-hero-subtitle">{trip.summary}</p>
        <div className="tp-hero-meta">
          <div className="tp-hero-stat">
            <span className="tp-hero-stat-label">From</span>
            <span className="tp-hero-stat-value">{trip.origin.split("(")[0].trim()}</span>
          </div>
          <div className="tp-hero-stat">
            <span className="tp-hero-stat-label">Destination</span>
            <span className="tp-hero-stat-value">{trip.destination}</span>
          </div>
          <div className="tp-hero-stat">
            <span className="tp-hero-stat-label">Dates</span>
            <span className="tp-hero-stat-value">{formatDate(trip.start_date)} – {formatDate(trip.end_date)}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="tp-nav">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`tp-nav-btn${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="tp-content">

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div className="tp-overview-grid">
              {[
                { icon: "🌍", label: "Destination", value: trip.destination },
                { icon: "📅", label: "Total Days", value: `${trip.total_days} days` },
                { icon: "👤", label: "Travelers", value: `${trip.travelers} person${trip.travelers > 1 ? "s" : ""}` },
                { icon: "🏁", label: "Departure", value: trip.origin.split("(")[0].trim() },
              ].map((card) => (
                <div key={card.label} className="tp-stat-card">
                  <div className="tp-stat-card-icon">{card.icon}</div>
                  <div className="tp-stat-card-label">{card.label}</div>
                  <div className="tp-stat-card-value">{card.value}</div>
                </div>
              ))}
            </div>
            <div className="tp-cost-banner">
              <div>
                <div className="tp-cost-banner-label">ESTIMATED TOTAL COST</div>
                <div className="tp-cost-banner-value">{formatUsd(trip.estimated_total_cost_usd)}</div>
                <div className="tp-cost-banner-sub">for {trip.travelers} traveler{trip.travelers > 1 ? "s" : ""} · {trip.total_days} days</div>
              </div>
              <div style={{ fontSize: "48px" }}>🌺</div>
            </div>
          </div>
        )}

        {/* Days */}
        {tab === "days" && (
          <div>
            <div className="tp-search-wrap">
              <span className="tp-search-icon">🔍</span>
              <input
                className="tp-search"
                value={query}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
                placeholder="Search activities, hotels, transportation…"
              />
            </div>

            {filteredDays.length === 0 ? (
              <div className="tp-empty">No results found for "{query}"</div>
            ) : (
              filteredDays.map((day) => {
                const isOpen = openDays.has(day.day_number);
                return (
                  <div key={day.day_number} className="tp-day-card">
                    <div className="tp-day-header" onClick={() => toggleDay(day.day_number)}>
                      <div className="tp-day-number">{day.day_number}</div>
                      <div className="tp-day-info">
                        <div className="tp-day-title">{day.location}</div>
                        <div className="tp-day-date">{formatDate(day.date)}</div>
                        {day.summary && <div className="tp-day-summary">{day.summary}</div>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        {day.activities.length > 0 && (
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                            {day.activities.length} activit{day.activities.length > 1 ? "ies" : "y"}
                          </span>
                        )}
                        <span className={`tp-day-chevron${isOpen ? " open" : ""}`}>▾</span>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="tp-day-body">
                        {/* Hotel */}
                        <div className="tp-section">
                          <div className="tp-section-title">🏨 Hotel</div>
                          <div className="tp-hotel-card">
                            <div className="tp-hotel-name">{day.hotel.name || "Not listed"}</div>
                            {day.hotel.address && <div className="tp-hotel-address">📍 {day.hotel.address}</div>}
                            <div className="tp-hotel-meta">
                              <div className="tp-hotel-meta-item">
                                <span className="tp-hotel-meta-label">Check-in</span>
                                <span className="tp-hotel-meta-value">{formatDate(day.hotel.check_in_date)}</span>
                              </div>
                              <div className="tp-hotel-meta-item">
                                <span className="tp-hotel-meta-label">Check-out</span>
                                <span className="tp-hotel-meta-value">{formatDate(day.hotel.check_out_date)}</span>
                              </div>
                              {day.hotel.estimated_cost_per_night_usd > 0 && (
                                <div className="tp-hotel-meta-item">
                                  <span className="tp-hotel-meta-label">Per Night</span>
                                  <span className="tp-hotel-meta-value">{formatUsd(day.hotel.estimated_cost_per_night_usd)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Transportation */}
                        {day.transportation.length > 0 && (
                          <div className="tp-section">
                            <div className="tp-section-title">✈️ Transportation</div>
                            {day.transportation.map((item, idx) => (
                              <div key={idx} className="tp-transport-card">
                                <div className="tp-transport-route">
                                  <span className="tp-transport-airport">{item.from_location.split("(")[1]?.replace(")", "") || item.from_location.slice(0, 3).toUpperCase()}</span>
                                  <div className="tp-transport-arrow">
                                    <span className="tp-transport-mode-badge">
                                      {item.mode === "flight" ? "✈️" : "🚗"} {item.mode}
                                    </span>
                                  </div>
                                  <span className="tp-transport-airport">{item.to_location.split("(")[1]?.replace(")", "") || item.to_location.slice(0, 3).toUpperCase()}</span>
                                </div>
                                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", fontSize: "13px", color: "var(--text-muted)" }}>
                                  <span>🕐 {item.departure_time} → {item.arrival_time}</span>
                                  {item.estimated_cost_usd > 0 && <span>💰 {formatUsd(item.estimated_cost_usd)}</span>}
                                </div>
                                {item.segments.length > 0 && (
                                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                    {item.segments.map((seg, si) => (
                                      <div key={si} className="tp-segment">
                                        <span className="tp-segment-dot" />
                                        <span>{seg.airline}: {seg.departure_airport} → {seg.arrival_airport} · {seg.departure_time}–{seg.arrival_time}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Activities */}
                        {day.activities.length > 0 && (
                          <div className="tp-section">
                            <div className="tp-section-title">🎯 Activities</div>
                            <div className="tp-activities-list">
                              {day.activities.map((activity, idx) => {
                                const cat = getCat(activity.category);
                                return (
                                  <div key={idx} className="tp-activity-card">
                                    <div className="tp-activity-icon" style={{ background: cat.bg }}>{cat.icon}</div>
                                    <div className="tp-activity-info">
                                      <div className="tp-activity-name">{activity.name}</div>
                                      {activity.description && <div className="tp-activity-desc">{activity.description}</div>}
                                      <div className="tp-activity-meta">
                                        {(activity.start_time || activity.end_time) && (
                                          <span className="tp-activity-meta-item">⏰ {activity.start_time}–{activity.end_time}</span>
                                        )}
                                        {activity.location && (
                                          <span className="tp-activity-meta-item">📍 {activity.location}</span>
                                        )}
                                        <span className="tp-activity-meta-item" style={{ color: cat.color, fontWeight: 600, textTransform: "capitalize" }}>{activity.category}</span>
                                      </div>
                                    </div>
                                    {activity.estimated_cost_usd > 0 && (
                                      <div className="tp-activity-cost">{formatUsd(activity.estimated_cost_usd)}</div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {day.estimated_daily_cost_usd > 0 && (
                          <div style={{ marginTop: "20px", textAlign: "right", fontSize: "14px", color: "var(--text-muted)" }}>
                            Day total: <strong style={{ color: "var(--ocean)" }}>{formatUsd(day.estimated_daily_cost_usd)}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tips */}
        {tab === "tips" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "28px", fontWeight: "700", color: "var(--ocean)" }}>
                Travel Tips
              </h2>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "6px" }}>
                Keep these in mind to make your trip seamless.
              </p>
            </div>
            <div className="tp-tips-list">
              {trip.general_tips.map((tip, idx) => (
                <div key={tip} className="tp-tip-item">
                  <div className="tp-tip-num">{idx + 1}</div>
                  <p className="tp-tip-text">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
