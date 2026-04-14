import { useMemo, useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import { type TravelItinerary, EventType } from '../types/itinerary.types.ts';

// Internal type for flat map markers
type MapLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: EventType;
  day: number;
  order: number;
  date: string;
  notes?: string;
  startTime?: string;
  endTime?: string;
  costUsd?: number;
};

type MapProps = {
  tripData: TravelItinerary;
};

// --- Leaflet Setup ---

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

const categoryMeta: Record<string, { markerColor: string; emoji: string; label: string; pill: string; pillBg: string }> = {
  [EventType.LODGING]:   { markerColor: 'red',    emoji: '🏨', label: 'Lodging',    pill: '#0284c7', pillBg: '#e0f2fe' },
  [EventType.ACTIVITY]:  { markerColor: 'green',  emoji: '🏛️', label: 'Activity',   pill: '#16a34a', pillBg: '#dcfce7' },
  [EventType.FOOD]:      { markerColor: 'orange', emoji: '🍽️', label: 'Food',       pill: '#d97706', pillBg: '#fef3c7' },
  [EventType.TRANSPORT]: { markerColor: 'blue',   emoji: '✈️', label: 'Transport',  pill: '#475569', pillBg: '#f1f5f9' },
};

const getMarkerIcon = (category: string) => {
  const meta = categoryMeta[category];
  if (!meta) return DefaultIcon;
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${meta.markerColor}.png`,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// --- Helper Components ---

function extractLocations(tripData: TravelItinerary): MapLocation[] {
  const results: MapLocation[] = [];
  tripData.days.forEach((day) => {
    day.events.forEach((event, index) => {
      if (event.latitude && event.longitude) {
        results.push({
          id: `event-${day.day_number}-${index}`,
          name: event.title,
          lat: event.latitude,
          lng: event.longitude,
          category: event.event_type,
          day: day.day_number,
          order: index,
          date: day.date,
          notes: event.notes,
          startTime: event.start_time,
          endTime: event.end_time,
          costUsd: event.cost_usd,
        });
      }
    });
  });
  return results;
}

const FitBounds = ({ locations }: { locations: MapLocation[] }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    if (locations.length === 1) { 
      map.setView([locations[0].lat, locations[0].lng], 13); 
      return; 
    }
    const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [locations, map]);
  return null;
};

const dayColors = ['#e8735a', '#0a4d68', '#16a34a', '#7c3aed', '#d97706', '#0284c7'];

const mapStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');
  .map-root { font-family: 'DM Sans', sans-serif; height: 100%; width: 100%; display: flex; flex-direction: column; background: #f5f0e8; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 64px rgba(10,77,104,0.16); }
  .map-header { background: linear-gradient(135deg, #0a4d68 0%, #0d6b91 60%, #1a8fb5 100%); padding: 20px 24px 16px; position: relative; overflow: hidden; flex-shrink: 0; }
  .map-header-title { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: white; position: relative; margin-bottom: 3px; }
  .map-header-sub { font-size: 12px; color: rgba(255,255,255,0.6); position: relative; }
  .map-controls { display: flex; flex-direction: column; gap: 10px; padding: 14px 20px; background: #fff; border-bottom: 1px solid rgba(10,77,104,0.1); flex-shrink: 0; }
  .map-days { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .map-days-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #5a7080; margin-right: 4px; }
  .map-day-btn { padding: 5px 12px; border-radius: 100px; border: 1.5px solid rgba(10,77,104,0.15); background: #fff; font-size: 12px; font-weight: 500; color: #5a7080; cursor: pointer; transition: all 0.15s; }
  .map-day-btn.active { background: #0a4d68; border-color: #0a4d68; color: white; }
  .map-cat-toggle { display: flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 100px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; opacity: 0.45; }
  .map-cat-toggle.active { opacity: 1; }
  .map-cat-dot { width: 8px; height: 8px; border-radius: 50%; }
  .map-stats { display: flex; gap: 16px; padding: 10px 20px; background: #f5f0e8; font-size: 12px; color: #5a7080; }
  .map-container-wrap { flex: 1; min-height: 0; }
  .map-popup { min-width: 180px; font-family: 'DM Sans', sans-serif; }
  .map-popup-name { font-size: 14px; font-weight: 700; color: #0a4d68; margin-bottom: 6px; }
  .map-popup-cat { display: inline-flex; align-items: center; gap: 5px; padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 600; margin-bottom: 8px; }
  .map-popup-row { font-size: 12px; color: #5a7080; margin-bottom: 3px; display: flex; gap: 5px; }
  .map-container-wrap {
      flex: 1;
      min-height: 400px;
      position: relative;
    }

    .leaflet-container {
      height: 100% !important;
      width: 100% !important;
      z-index: 1;
    }
`;

// --- Main Component ---

const TripMap = ({ tripData }: MapProps) => {
  const defaultCenter: [number, number] = [0, 0];
  const locations = useMemo(() => extractLocations(tripData), [tripData]);
  const days = useMemo(() => Array.from(new Set(locations.map((loc) => loc.day))).sort((a, b) => a - b), [locations]);
  const categories = useMemo(() => Object.values(EventType), []);

  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [activeCategories, setActiveCategories] = useState<EventType[]>([]);

  useEffect(() => { setActiveCategories(categories); }, [categories]);

  const toggleCategory = (category: EventType) => {
    setActiveCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesDay = selectedDay === 'all' || loc.day === selectedDay;
      const matchesCategory = activeCategories.includes(loc.category);
      return matchesDay && matchesCategory;
    });
  }, [locations, selectedDay, activeCategories]);

  const routePositions = useMemo(() => {
    if (selectedDay === 'all') return [];
    return locations
      .filter((loc) => loc.day === selectedDay && activeCategories.includes(loc.category))
      .sort((a, b) => a.order - b.order)
      .map((loc) => [loc.lat, loc.lng] as [number, number]);
  }, [locations, selectedDay, activeCategories]);

  const routeColor = selectedDay === 'all' ? '#e8735a' : dayColors[(selectedDay as number - 1) % dayColors.length];
  
  return (
    <div className="map-root">
      <style>{mapStyles}</style>

      <div className="map-controls">
        <div className="map-days">
          <span className="map-days-label">Schedule</span>
          <button type="button" className={`map-day-btn${selectedDay === 'all' ? ' active' : ''}`} onClick={() => setSelectedDay('all')}>Full Trip</button>
          {days.map((day) => (
            <button key={day} type="button" className={`map-day-btn${selectedDay === day ? ' active' : ''}`} onClick={() => setSelectedDay(day)}>
              Day {day}
            </button>
          ))}
        </div>

        <div className="map-cats">
          <span className="map-cats-label">Filter</span>
          {categories.map((cat) => {
            const meta = categoryMeta[cat];
            const isActive = activeCategories.includes(cat);
            return (
              <div
                key={cat}
                className={`map-cat-toggle${isActive ? ' active' : ''}`}
                style={{ background: isActive ? meta.pillBg : '#f5f5f5', color: isActive ? meta.pill : '#888' }}
                onClick={() => toggleCategory(cat)}
              >
                <span className="map-cat-dot" style={{ background: meta.pill }} />
                {meta.emoji} {meta.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="map-stats">
        <div>📍 <strong>{filteredLocations.length}</strong> markers</div>
        <div>👥 <strong>{tripData.travelers}</strong> travelers</div>
      </div>

      <div className="map-container-wrap">
        <MapContainer
          center={filteredLocations.length > 0 ? [filteredLocations[0].lat, filteredLocations[0].lng] : defaultCenter}
          zoom={12}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <FitBounds locations={filteredLocations} />

          {routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: routeColor, weight: 4, opacity: 0.8, dashArray: '8, 6' }}
            />
          )}

          <MarkerClusterGroup chunkedLoading maxClusterRadius={30}>
            {filteredLocations.map((loc) => {
              const meta = categoryMeta[loc.category];
              return (
                <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={getMarkerIcon(loc.category)}>
                  <Popup>
                    <div className="map-popup">
                      <div className="map-popup-name">{loc.name}</div>
                      <div className="map-popup-cat" style={{ background: meta.pillBg, color: meta.pill }}>
                        {meta.emoji} {meta.label}
                      </div>
                      <div className="map-popup-row">🗓️ Day {loc.day} ({loc.date})</div>
                      {loc.startTime && (
                        <div className="map-popup-row">⏰ {loc.startTime} - {loc.endTime}</div>
                      )}
                      {loc.notes && <div className="map-popup-row" style={{marginTop: '4px'}}>📝 {loc.notes}</div>}
                      {loc.costUsd ? <div className="map-popup-row" style={{fontWeight: 'bold', color: '#0a4d68', marginTop: '4px'}}>${loc.costUsd}</div> : null}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default TripMap;
