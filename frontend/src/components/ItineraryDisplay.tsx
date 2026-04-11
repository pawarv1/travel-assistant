import React from 'react';
import { type TravelItinerary, EventType } from '../types/itinerary.types.ts';
import { MapPin, Clock, ExternalLink, Info } from 'lucide-react';

interface Props {
  itinerary: TravelItinerary;
}

const getIcon = (type: EventType) => {
  switch (type) {
    case EventType.TRANSPORT: return "✈️";
    case EventType.LODGING: return "🏨";
    case EventType.FOOD: return "🍽️";
    case EventType.ACTIVITY: return "📸";
    default: return "📍";
  }
};

const ItineraryDisplay: React.FC<Props> = ({ itinerary }) => {
  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="border-l-4 border-red-600 pl-6">
        <h2 className="relative text-4xl font-serif mb-2">{itinerary.title}</h2>
        <p className="text-slate-500 text-lg uppercase tracking-wide">
          {itinerary.origin} → {itinerary.destination} • {itinerary.travelers} Traveler(s)
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Timeline */}
        <div className="lg:col-span-2 space-y-12">
          {itinerary.days.map((day) => (
            <section key={day.day_number} className="relative">
              <div className="flex items-baseline gap-4 mb-6">
                <span className="text-5xl font-serif text-slate-700">0{day.day_number}</span>
                <div>
                  <h3 className="text-2xl font-bold">{day.date}</h3>
                  <p className="text-red-600 italic">{day.summary}</p>
                </div>
              </div>

              <div className="space-y-4 ml-4 border-l-2 border-slate-700 pl-8">
                {day.events.map((event, idx) => {
                  const start_time = new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const end_time = new Date(event.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                  <div key={idx} className="group bg-slate-100 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all border border-transparent hover:border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-sm font-bold uppercase text-slate-400 flex items-center gap-2">
                        {getIcon(event.event_type)} {event.event_type}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 flex items-center gap-1">
                        <Clock size={14} /> {start_time} - {end_time}
                      </span>
                    </div>
                    <h4 className="text-xl font-bold mb-2">{event.title}</h4>
                    <p className="text-slate-600 text-sm mb-4 flex items-center gap-1">
                      <MapPin size={14} /> {event.location}
                    </p>
                    {event.notes && <p className="text-slate-500 text-sm italic mb-4">"{event.notes}"</p>}
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-green-700 bg-green-50 px-2 py-1 rounded text-sm">
                        ${event.cost_usd.toFixed(2)}
                      </span>
                      {event.url && (
                        <a href={event.url} target="_blank" rel="noreferrer" className="text-red-600 hover:underline flex items-center gap-1 text-sm font-bold">
                          View Details <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              )}
              </div>
            </section>
          ))}
        </div>

        {/* Sidebar for Tips */}
        <aside className="space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl sticky top-8">
            <h3 className="text-2xl font-serif mb-6 flex items-center gap-2">
              <Info className="text-red-500" /> General Tips
            </h3>
            <ul className="space-y-4">
              {itinerary.general_tips.map((tip, i) => (
                <li key={i} className="text-slate-300 text-sm border-b border-white/10 pb-4 last:border-0">
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ItineraryDisplay;
