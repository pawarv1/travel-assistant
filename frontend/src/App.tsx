import React, { useState } from 'react';
import { getItinerary } from './services/itinerary.js';
import { type TravelItinerary } from './types/itinerary.types.ts';
import ItineraryDisplay from './components/ItineraryDisplay';
import { Plane, Loader2 } from 'lucide-react';

import cloudsImage from './assets/clouds.jpg';

const App: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [itinerary, setItinerary] = useState<TravelItinerary | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    try {
      const data = await getItinerary(prompt);
      if (data) setItinerary(data);
    } catch (err) {
      console.error("Failed to fetch itinerary", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      <div className="fixed top-0 right-0 w-1/2 h-screen overflow-hidden hidden md:block z-0">
        <div className="absolute top-2/5 right-[-10%] w-[80%] h-[300px] rounded-l-full bg-cover bg-center overflow-hidden" 
          style={{ backgroundImage: `url(${cloudsImage})` }}>
          <div className="absolute inset-0 bg-blue-600/10" />

          {/* Large circle */}
          <div className="border border-white/50 rounded-full w-[450px] h-[450px] absolute -right-16 top-10 pointer-events-none" />
          
          {/* Smaller circle */}
          <div className="border border-white/30 rounded-full w-[250px] h-[250px] absolute right-20 top-40 pointer-events-none" />
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 py-12 lg:py-24 z-10">
        {/* Header Section */}
        <header className="mb-12">
          <p className="text-sm font-medium tracking-widest text-slate-400 uppercase mb-4">
            AI Travel Assistant
          </p>
          <h1 className="text-6xl md:text-8xl font-serif text-red-600 leading-tight mb-8">
            Where to <span className="italic">next?</span>
          </h1>
          
          <form onSubmit={handleGenerate} className="max-w-2xl relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Tell me about your dream trip... e.g., 'A 5-day culinary tour of Tokyo in October for 2 people'"
              className="w-full p-6 pr-16 border-b-2 border-slate-200 focus:border-red-600 outline-none transition-colors text-xl bg-transparent resize-none h-32"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute bottom-4 right-2 p-4 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:bg-slate-300 transition-all shadow-lg"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Plane />}
            </button>
          </form>
        </header>

        {/* Results Section */}
        {itinerary && <ItineraryDisplay itinerary={itinerary} />}
      </main>
    </div>
  );
};

export default App;
