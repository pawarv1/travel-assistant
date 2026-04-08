import Map from './components/Map'; 

export default function App() {
  return (
    <div className="app-container">
      
      {/* HEADER */}
      <header className="glass-header">
        <div className="brand">
          <h1>Travel-Assistance</h1>
        </div>
      </header>

      {/* SPLIT SCREEN DASHBOARD */}
      <main className="dashboard-main">
        
        {/* LEFT PANEL: The AI Planner Form */}
        <section className="planner-panel">
          <div className="planner-card">
            <h2>Plan Your Trip</h2>
            
            <div className="input-group">
              <label>Destination (or Vibe)</label>
              <input type="text" placeholder="e.g. Miami, or 'Somewhere tropical'" className="glass-input full-width" />
            </div>

            <div className="row-group">
              <div className="input-group">
                <label>Dates</label>
                <input type="text" placeholder="e.g. Next weekend" className="glass-input full-width" />
              </div>
              <div className="input-group">
                <label>Budget</label>
                <select className="glass-input full-width">
                  <option>Backpacker</option>
                  <option>Standard</option>
                  <option>Luxury</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Interests & Must-Dos</label>
              <textarea 
                placeholder="Food, museums, nightlife, less walking..." 
                className="glass-input full-width" 
                rows={3}
              />
            </div>

            <button className="primary-btn full-width">Generate Itinerary</button>
          </div>
        </section>

        {/* RIGHT PANEL: The WebGL Map */}
        <section className="map-panel">
          <Map />
        </section>

      </main>
    </div>
  );
}