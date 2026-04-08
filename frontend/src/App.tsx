import Map from './components/Map'; 
import TravelPlannerUI from './components/TravelPlannerUI';
import { useState } from 'react';

export default function App() {
  const [locations, setLocations] = useState<{ name: string; lat: number; lng: number; category: string }[]>([]);
  return (
    <div className="app-container h-screen flex flex-col">
      
      {/* HEADER */}
      <header className="glass-header">
        <div className="brand">
          <h1>Travel-Assistance</h1>
        </div>
      </header>

      {/* SPLIT SCREEN DASHBOARD */}
      <main className="dashboard-main flex h-full">
        
        {/* LEFT PANEL: The Travel Planner UI */}
        <section className="planner-panel w-1/2">
          <TravelPlannerUI onLocationsChange={setLocations} />
        </section>

        {/* RIGHT PANEL: The WebGL Map */}
        <section className="map-panel w-1/2" style={{ height: 'calc(100vh - 100px)' }}>
          <Map locations={locations} />
        </section>

      </main>
    </div>
  );
}