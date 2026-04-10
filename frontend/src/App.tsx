import TripMap from './components/Map';
import TravelPlannerUI from './components/TravelPlannerUI';
import { useState } from 'react';

type Hotel = {
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  category: string;
  check_in_date?: string;
  check_out_date?: string;
  estimated_cost_per_night_usd?: number;
  url?: string;
  notes?: string;
};

type Activity = {
  name: string;
  description?: string;
  location?: string;
  latitude: number;
  longitude: number;
  category: string;
  start_time?: string;
  end_time?: string;
  estimated_cost_usd?: number;
  url?: string;
  notes?: string;
};

type TripDay = {
  day_number: number;
  date: string;
  location?: string;
  summary?: string;
  hotel?: Hotel;
  activities?: Activity[];
};

type TripPlan = {
  title?: string;
  destination?: string;
  origin?: string;
  start_date?: string;
  end_date?: string;
  total_days?: number;
  travelers?: number;
  summary?: string;
  days: TripDay[];
};

export default function App() {
  const [tripData, setTripData] = useState<TripPlan | null>(null);

  return (
    <div className="app-container h-screen flex flex-col">
      <header className="glass-header">
        <div className="brand">
          <h1>Travel-Assistance</h1>
        </div>
      </header>

      <main className="dashboard-main flex h-full">
        <section className="planner-panel w-1/2">
          <TravelPlannerUI onTripDataChange={setTripData} />
        </section>

        <section
          className="map-panel w-1/2"
          style={{ height: 'calc(100vh - 100px)' }}
        >
          {tripData ? (
            <TripMap tripData={tripData} />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              No trip data yet.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}