/**
 * TravelItinerary.tsx
 *
 * Main entry point for the AI-powered travel itinerary generator UI.
 * Composed of modular sub-components for prompting, display, and individual
 * itinerary sections (days, accommodations, transport, activities).
 *
 * Aesthetic: editorial travel-magazine — warm ivory/slate palette,
 * Playfair Display headlines, clean data-dense cards, subtle motion.
 */

import { useState } from "react";
import { getItinerary } from "../services/itinerary.js";

// ─── Types (mirroring the Pydantic schema) ────────────────────────────────────

type TransportMode =
  | "flight"
  | "train"
  | "bus"
  | "car"
  | "taxi"
  | "walk"
  | "ferry"
  | "other";

interface FlightSegment {
  airline: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time: string;
  url: string;
}

interface Transportation {
  mode: TransportMode;
  from_address: string;
  to_address: string;
  departure_time: string;
  arrival_time: string;
  estimated_cost_usd: number;
  segments: FlightSegment[];
  url: string;
  notes: string;
}

interface Accommodation {
  name: string;
  address: string;
  check_in_date: string;
  check_out_date: string;
  estimated_cost_per_night_usd: number;
  url: string;
  notes: string;
}

interface Activity {
  name: string;
  description: string;
  address: string;
  start_time: string;
  end_time: string;
  estimated_cost_usd: number;
  url: string;
  notes: string;
}

interface DayItinerary {
  day_number: number;
  date: string;
  location: string;
  summary: string;
  transportation: Transportation[];
  activities: Activity[];
}

interface TravelItinerary {
  title: string;
  destination: string;
  origin: string;
  start_date: string;
  end_date: string;
  total_days: number;
  travelers: number;
  summary: string;
  days: DayItinerary[];
  accomodations: Accommodation[]; // note: matches backend spelling
  general_tips: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Maps transport mode to an emoji icon */
const transportIcon: Record<TransportMode, string> = {
  flight: "✈️",
  train: "🚆",
  bus: "🚌",
  car: "🚗",
  taxi: "🚕",
  walk: "🚶",
  ferry: "⛴️",
  other: "🧭",
};

const fmt = {
  usd: (n: number) =>
    n > 0
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(n)
      : null,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Single flight leg within a transport segment */
function FlightSegmentRow({ seg }: { seg: FlightSegment }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-600 font-mono tracking-wide">
      <span className="font-semibold text-slate-800">{seg.departure_airport}</span>
      <span className="text-amber-500">→</span>
      <span className="font-semibold text-slate-800">{seg.arrival_airport}</span>
      {seg.airline && <span className="text-slate-400">· {seg.airline}</span>}
      {seg.departure_time && (
        <span className="text-slate-400">{seg.departure_time}</span>
      )}
      {seg.url && (
        <a
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-amber-600 hover:text-amber-800 underline underline-offset-2"
        >
          Book
        </a>
      )}
    </div>
  );
}

/** Transport card used inside a DayCard */
function TransportCard({ t }: { t: Transportation }) {
  const icon = transportIcon[t.mode] ?? "🧭";
  const cost = fmt.usd(t.estimated_cost_usd);

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white/70 backdrop-blur-sm space-y-2">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-slate-800 capitalize">{t.mode}</span>
        </div>
        {cost && (
          <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5">
            {cost} / person
          </span>
        )}
      </div>

      {/* Route */}
      {(t.from_address || t.to_address) && (
        <p className="text-sm text-slate-600">
          {t.from_address && <span>{t.from_address}</span>}
          {t.from_address && t.to_address && (
            <span className="mx-1 text-amber-500">→</span>
          )}
          {t.to_address && <span>{t.to_address}</span>}
        </p>
      )}

      {/* Times */}
      {(t.departure_time || t.arrival_time) && (
        <p className="text-xs text-slate-500 font-mono">
          {t.departure_time && `Departs ${t.departure_time}`}
          {t.departure_time && t.arrival_time && " · "}
          {t.arrival_time && `Arrives ${t.arrival_time}`}
        </p>
      )}

      {/* Flight segments */}
      {t.segments.length > 0 && (
        <div className="space-y-1 pt-1 border-t border-slate-100">
          {t.segments.map((seg, i) => (
            <FlightSegmentRow key={i} seg={seg} />
          ))}
        </div>
      )}

      {/* Notes + booking link */}
      {t.notes && <p className="text-xs text-slate-500 italic">{t.notes}</p>}
      {t.url && (
        <a
          href={t.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          View booking →
        </a>
      )}
    </div>
  );
}

/** Activity card used inside a DayCard */
function ActivityCard({ a }: { a: Activity }) {
  const cost = fmt.usd(a.estimated_cost_usd);

  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-white/70 backdrop-blur-sm space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-slate-900 leading-snug">{a.name}</h4>
        {cost && (
          <span className="shrink-0 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
            {cost}
          </span>
        )}
      </div>

      {(a.start_time || a.end_time) && (
        <p className="text-xs text-slate-500 font-mono">
          {a.start_time}
          {a.start_time && a.end_time && " – "}
          {a.end_time}
        </p>
      )}

      {a.description && (
        <p className="text-sm text-slate-600 leading-relaxed">{a.description}</p>
      )}

      {a.address && (
        <p className="text-xs text-slate-400">📍 {a.address}</p>
      )}

      {a.notes && (
        <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-1.5">
          💡 {a.notes}
        </p>
      )}

      {a.url && (
        <a
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          More info →
        </a>
      )}
    </div>
  );
}

/** A single day's full itinerary card */
function DayCard({ day }: { day: DayItinerary }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Day header — clickable to collapse */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-700 text-left"
      >
        <div className="flex items-center gap-4">
          {/* Day badge */}
          <span className="shrink-0 w-10 h-10 rounded-full bg-amber-400 text-slate-900 font-black flex items-center justify-center text-sm">
            D{day.day_number}
          </span>
          <div>
            <p className="text-white font-semibold leading-tight">{day.location}</p>
            {day.date && (
              <p className="text-slate-400 text-xs font-mono">{day.date}</p>
            )}
          </div>
        </div>
        <span className="text-slate-400 text-lg select-none">
          {expanded ? "▲" : "▼"}
        </span>
      </button>

      {expanded && (
        <div className="p-6 bg-slate-50 space-y-6">
          {/* Day summary */}
          {day.summary && (
            <p className="text-slate-600 italic border-l-2 border-amber-400 pl-3 text-sm leading-relaxed">
              {day.summary}
            </p>
          )}

          {/* Transport section */}
          {day.transportation.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Getting Around
              </h3>
              <div className="space-y-2">
                {day.transportation.map((t, i) => (
                  <TransportCard key={i} t={t} />
                ))}
              </div>
            </section>
          )}

          {/* Activities section */}
          {day.activities.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                Activities
              </h3>
              <div className="space-y-2">
                {day.activities.map((a, i) => (
                  <ActivityCard key={i} a={a} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

/** Accommodation card in the sidebar/section */
function AccommodationCard({ acc }: { acc: Accommodation }) {
  const cost = fmt.usd(acc.estimated_cost_per_night_usd);

  return (
    <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-1.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-slate-900">🏨 {acc.name}</h4>
        {cost && (
          <span className="shrink-0 text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200 rounded-full px-2 py-0.5">
            {cost}/night
          </span>
        )}
      </div>

      {(acc.check_in_date || acc.check_out_date) && (
        <p className="text-xs font-mono text-slate-500">
          {acc.check_in_date} → {acc.check_out_date}
        </p>
      )}

      {acc.address && (
        <p className="text-xs text-slate-400">📍 {acc.address}</p>
      )}

      {acc.notes && (
        <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-1.5">
          {acc.notes}
        </p>
      )}

      {acc.url && (
        <a
          href={acc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-xs font-medium text-amber-700 hover:text-amber-900 underline underline-offset-2"
        >
          View property →
        </a>
      )}
    </div>
  );
}

/** The rendered full itinerary view */
function ItineraryDisplay({ itinerary }: { itinerary: TravelItinerary }) {
  return (
    <div className="space-y-10 pb-16">
      {/* Hero header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative circle */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-amber-400/10 pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-amber-400/5 pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <p className="text-amber-400 text-xs font-bold uppercase tracking-widest">
            ✈ {itinerary.origin} → {itinerary.destination}
          </p>
          <h1
            className="text-3xl md:text-4xl font-black leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            {itinerary.title || itinerary.destination}
          </h1>
          <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">
            {itinerary.summary}
          </p>

          {/* Meta pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              itinerary.start_date &&
                itinerary.end_date &&
                `${itinerary.start_date} – ${itinerary.end_date}`,
              itinerary.total_days && `${itinerary.total_days} days`,
              itinerary.travelers && `${itinerary.travelers} traveler${itinerary.travelers > 1 ? "s" : ""}`,
            ]
              .filter(Boolean)
              .map((label, i) => (
                <span
                  key={i}
                  className="text-xs font-medium bg-white/10 border border-white/20 rounded-full px-3 py-1"
                >
                  {label}
                </span>
              ))}
          </div>
        </div>
      </div>

      {/* Days */}
      {itinerary.days.length > 0 && (
        <section className="space-y-4">
          <h2
            className="text-xl font-black text-slate-800"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Day by Day
          </h2>
          {itinerary.days.map((day) => (
            <DayCard key={day.day_number} day={day} />
          ))}
        </section>
      )}

      {/* Accommodations */}
      {itinerary.accomodations.length > 0 && (
        <section className="space-y-4">
          <h2
            className="text-xl font-black text-slate-800"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Where You'll Stay
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {itinerary.accomodations.map((acc, i) => (
              <AccommodationCard key={i} acc={acc} />
            ))}
          </div>
        </section>
      )}

      {/* General tips */}
      {itinerary.general_tips.length > 0 && (
        <section className="space-y-3">
          <h2
            className="text-xl font-black text-slate-800"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Travel Tips
          </h2>
          <ul className="space-y-2">
            {itinerary.general_tips.map((tip, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-slate-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3"
              >
                <span className="text-amber-500 shrink-0">✦</span>
                {tip}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/** Animated loading skeleton shown while the AI generates the itinerary */
function LoadingSkeleton() {
  const pulse = "animate-pulse bg-slate-200 rounded";
  return (
    <div className="space-y-6 pt-4">
      <div className={`${pulse} h-48 rounded-3xl`} />
      <div className="space-y-3">
        <div className={`${pulse} h-6 w-40`} />
        <div className={`${pulse} h-28 rounded-2xl`} />
        <div className={`${pulse} h-28 rounded-2xl`} />
        <div className={`${pulse} h-28 rounded-2xl`} />
      </div>
    </div>
  );
}

/** Prompt input form */
function PromptForm({
  onSubmit,
  loading,
}: {
  onSubmit: (prompt: string) => void;
  loading: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed && !loading) onSubmit(trimmed);
  };

  return (
    <div className="space-y-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          // Submit on Ctrl/Cmd + Enter
          if (e.key === "Enter") handleSubmit();
        }}
        disabled={loading}
        rows={3}
        placeholder="Plan me a 10-day adventure through Japan in cherry blossom season for 2 people, mixing temples, street food, and countryside ryokans…"
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-800 placeholder-slate-400 text-sm leading-relaxed shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent disabled:opacity-60 transition"
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Press ENTER to submit
        </p>
        <button
          onClick={handleSubmit}
          disabled={loading || !value.trim()}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-all shadow-sm"
        >
          {loading ? (
            <>
              <span className="inline-block w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Planning…
            </>
          ) : (
            <>✈ Generate Itinerary</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Root App Component ───────────────────────────────────────────────────────

export default function TravelItineraryApp() {
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePromptSubmit = async (prompt: string) => {
    setLoading(true);
    setError(null);
    setItinerary(null);

    try {
      const result = await getItinerary(prompt);
      if (!result) throw new Error("No itinerary returned from the server.");
      setItinerary(result as TravelItinerary);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Full-page wrapper with a warm textured background feel via a subtle gradient
    <div
      className="min-h-screen bg-stone-50"
      style={{
        backgroundImage:
          "radial-gradient(ellipse at 20% 50%, #fef3c720 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #e2e8f020 0%, transparent 60%)",
      }}
    >
      {/* Google Fonts — Playfair Display for headings */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&display=swap');`}</style>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        {/* App header */}
        <header className="text-center space-y-2">
          <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">
            AI Travel Planner
          </p>
          <h1
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Where to next?
          </h1>
          <p className="text-slate-500 text-sm">
            Describe your dream trip and get a complete itinerary in seconds.
          </p>
        </header>

        {/* Prompt input */}
        <PromptForm onSubmit={handlePromptSubmit} loading={loading} />

        {/* States: loading / error / result */}
        {loading && <LoadingSkeleton />}

        {error && !loading && (
          <div className="rounded-2xl bg-red-50 border border-red-200 px-5 py-4 text-sm text-red-700">
            ⚠️ {error}
          </div>
        )}

        {itinerary && !loading && (
          <ItineraryDisplay itinerary={itinerary} />
        )}
      </div>
    </div>
  );
}
