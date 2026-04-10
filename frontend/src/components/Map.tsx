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

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

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

type TripData = {
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

type MapLocation = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  category: string;
  day: number;
  order: number;
  date?: string;
  description?: string;
  address?: string;
  startTime?: string;
  endTime?: string;
  estimatedCostUsd?: number;
};

type MapProps = {
  tripData: TripData;
};

const categoryMeta: Record<string, { markerColor: string; emoji: string; label: string; pill: string; pillBg: string }> = {
  stay:          { markerColor: 'red',    emoji: '🏨', label: 'Hotel',         pill: '#0284c7', pillBg: '#e0f2fe' },
  attraction:    { markerColor: 'green',  emoji: '🏛️', label: 'Attraction',    pill: '#16a34a', pillBg: '#dcfce7' },
  restaurant:    { markerColor: 'orange', emoji: '🍽️', label: 'Restaurant',    pill: '#d97706', pillBg: '#fef3c7' },
  entertainment: { markerColor: 'violet', emoji: '🎭', label: 'Entertainment', pill: '#7c3aed', pillBg: '#ede9fe' },
};

const getMarkerIcon = (category: string) => {
  const cat = category.toLowerCase();
  const meta = categoryMeta[cat];
  if (!meta) return DefaultIcon;
  return L.icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${meta.markerColor}.png`,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

function extractLocations(tripData: TripData): MapLocation[] {
  const results: MapLocation[] = [];
  tripData.days.forEach((day) => {
    let order = 0;
    if (day.hotel) {
      results.push({
        id: `hotel-${day.day_number}`,
        name: day.hotel.name,
        lat: day.hotel.latitude,
        lng: day.hotel.longitude,
        category: day.hotel.category || 'stay',
        day: day.day_number,
        order: order++,
        date: day.date,
        address: day.hotel.address,
        estimatedCostUsd: day.hotel.estimated_cost_per_night_usd,
      });
    }
    (day.activities || []).forEach((activity, index) => {
      results.push({
        id: `activity-${day.day_number}-${index}`,
        name: activity.name,
        lat: activity.latitude,
        lng: activity.longitude,
        category: activity.category,
        day: day.day_number,
        order: order++,
        date: day.date,
        description: activity.description,
        address: activity.location,
        startTime: activity.start_time,
        endTime: activity.end_time,
        estimatedCostUsd: activity.estimated_cost_usd,
      });
    });
  });
  return results;
}

const FitBounds = ({ locations }: { locations: MapLocation[] }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    if (locations.length === 1) { map.setView([locations[0].lat, locations[0].lng], 13); return; }
    const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [locations, map]);
  return null;
};

// Day colors for route polylines
const dayColors = ['#e8735a', '#0a4d68', '#16a34a', '#7c3aed', '#d97706', '#0284c7'];

const mapStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Playfair+Display:wght@600;700&display=swap');

  .map-root {
    font-family: 'DM Sans', sans-serif;
    height: 100%; width: 100%;
    display: flex; flex-direction: column;
    background: #f5f0e8;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 24px 64px rgba(10,77,104,0.16);
  }

  /* Header */
  .map-header {
    background: linear-gradient(135deg, #0a4d68 0%, #0d6b91 60%, #1a8fb5 100%);
    padding: 20px 24px 16px;
    position: relative; overflow: hidden; flex-shrink: 0;
  }
  .map-header::before {
    content: '';
    position: absolute; inset: 0;
    background: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='20' cy='20' r='3'/%3E%3C/g%3E%3C/svg%3E");
  }
  .map-header-title {
    font-family: 'Playfair Display', serif;
    font-size: 18px; font-weight: 700; color: white;
    position: relative; margin-bottom: 3px;
  }
  .map-header-sub { font-size: 12px; color: rgba(255,255,255,0.6); position: relative; }

  /* Controls */
  .map-controls {
    display: flex; flex-direction: column; gap: 10px;
    padding: 14px 20px 14px;
    background: #fff; border-bottom: 1px solid rgba(10,77,104,0.1);
    flex-shrink: 0;
  }

  /* Day pills */
  .map-days { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .map-days-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #5a7080; margin-right: 4px; }
  .map-day-btn {
    padding: 5px 12px; border-radius: 100px;
    border: 1.5px solid rgba(10,77,104,0.15); background: #fff;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    color: #5a7080; cursor: pointer; transition: all 0.15s;
    white-space: nowrap;
  }
  .map-day-btn:hover { border-color: #0a4d68; color: #0a4d68; }
  .map-day-btn.active { background: #0a4d68; border-color: #0a4d68; color: white; font-weight: 600; }

  /* Category toggles */
  .map-cats { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .map-cats-label { font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; color: #5a7080; margin-right: 4px; }
  .map-cat-toggle {
    display: flex; align-items: center; gap: 6px;
    padding: 5px 12px; border-radius: 100px;
    border: 1.5px solid transparent;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    cursor: pointer; transition: all 0.15s; user-select: none;
    opacity: 0.45;
  }
  .map-cat-toggle.active { opacity: 1; }
  .map-cat-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

  /* Stats bar */
  .map-stats {
    display: flex; gap: 16px; flex-wrap: wrap;
    padding: 10px 20px;
    background: #f5f0e8; border-bottom: 1px solid rgba(10,77,104,0.08);
    font-size: 12px; color: #5a7080; flex-shrink: 0;
  }
  .map-stats-item { display: flex; align-items: center; gap: 5px; }
  .map-stats-item strong { color: #0a4d68; }

  /* Map */
  .map-container-wrap { flex: 1; min-height: 0; }
  .leaflet-container { height: 100%; width: 100%; }

  /* Popup */
  .map-popup { min-width: 180px; font-family: 'DM Sans', sans-serif; }
  .map-popup-name { font-size: 14px; font-weight: 700; color: #0a4d68; margin-bottom: 6px; line-height: 1.3; }
  .map-popup-cat {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 8px; border-radius: 100px; font-size: 11px; font-weight: 600;
    margin-bottom: 8px; text-transform: capitalize;
  }
  .map-popup-row { font-size: 12px; color: #5a7080; margin-bottom: 3px; display: flex; align-items: flex-start; gap: 5px; }
  .map-popup-cost { font-size: 14px; font-weight: 700; color: #0a4d68; margin-top: 8px; }
`;

const TripMap = ({ tripData }: MapProps) => {
  const defaultCenter: [number, number] = [21.637, -158.065];
  const locations = useMemo(() => extractLocations(tripData), [tripData]);
  const days = useMemo(() => Array.from(new Set(locations.map((loc) => loc.day))).sort((a, b) => a - b), [locations]);
  const categories = useMemo(() => Array.from(new Set(locations.map((loc) => loc.category.toLowerCase()))).sort(), [locations]);

  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  useEffect(() => { setActiveCategories(categories); }, [categories]);

  const toggleCategory = (category: string) => {
    setActiveCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesDay = selectedDay === 'all' || loc.day === selectedDay;
      const matchesCategory = activeCategories.includes(loc.category.toLowerCase());
      return matchesDay && matchesCategory;
    });
  }, [locations, selectedDay, activeCategories]);

  const routePositions = useMemo(() => {
    if (selectedDay === 'all') return [];
    return locations
      .filter((loc) => loc.day === selectedDay && activeCategories.includes(loc.category.toLowerCase()))
      .sort((a, b) => a.order - b.order)
      .map((loc) => [loc.lat, loc.lng] as [number, number]);
  }, [locations, selectedDay, activeCategories]);

  const routeColor = selectedDay === 'all' ? '#e8735a' : dayColors[(selectedDay as number - 1) % dayColors.length];

  return (
    <div className="map-root">
      <style>{mapStyles}</style>

      {/* Header */}
      <div className="map-header">
        <div className="map-header-title">🗺️ {tripData.title ?? 'Trip Map'}</div>
        {tripData.destination && <div className="map-header-sub">📍 {tripData.destination}</div>}
      </div>

      {/* Controls */}
      <div className="map-controls">
        <div className="map-days">
          <span className="map-days-label">Day</span>
          <button type="button" className={`map-day-btn${selectedDay === 'all' ? ' active' : ''}`} onClick={() => setSelectedDay('all')}>All</button>
          {days.map((day) => (
            <button
              key={day} type="button"
              className={`map-day-btn${selectedDay === day ? ' active' : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="map-cats">
          <span className="map-cats-label">Show</span>
          {categories.map((category) => {
            const meta = categoryMeta[category] ?? { emoji: '📍', label: category, pill: '#64748b', pillBg: '#f1f5f9' };
            const isActive = activeCategories.includes(category);
            return (
              <div
                key={category}
                className={`map-cat-toggle${isActive ? ' active' : ''}`}
                style={{ background: isActive ? meta.pillBg : '#f5f5f5', borderColor: isActive ? meta.pill : 'transparent', color: isActive ? meta.pill : '#888' }}
                onClick={() => toggleCategory(category)}
              >
                <span className="map-cat-dot" style={{ background: meta.pill }} />
                {meta.emoji} {meta.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="map-stats">
        <div className="map-stats-item">📍 <strong>{filteredLocations.length}</strong> locations</div>
        {selectedDay !== 'all' && <div className="map-stats-item">🗓️ Day <strong>{selectedDay}</strong></div>}
        {routePositions.length > 1 && (
          <div className="map-stats-item">
            <span style={{ width: 16, height: 3, background: routeColor, borderRadius: 2, display: 'inline-block' }} />
            Route shown
          </div>
        )}
      </div>

      {/* Map */}
      <div className="map-container-wrap">
        <MapContainer
          center={filteredLocations.length > 0 ? [filteredLocations[0].lat, filteredLocations[0].lng] : defaultCenter}
          zoom={9}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds locations={filteredLocations} />

          {routePositions.length > 1 && (
            <Polyline
              positions={routePositions}
              pathOptions={{ color: routeColor, weight: 4, opacity: 0.8, dashArray: '8, 6' }}
            />
          )}

          <MarkerClusterGroup
            chunkedLoading zoomToBoundsOnClick spiderfyOnMaxZoom
            showCoverageOnHover={false} maxClusterRadius={30} disableClusteringAtZoom={15}
          >
            {filteredLocations.map((loc) => {
              const meta = categoryMeta[loc.category.toLowerCase()] ?? { emoji: '📍', label: loc.category, pill: '#64748b', pillBg: '#f1f5f9' };
              return (
                <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={getMarkerIcon(loc.category)}>
                  <Popup>
                    <div className="map-popup">
                      <div className="map-popup-name">{loc.name}</div>
                      <div className="map-popup-cat" style={{ background: meta.pillBg, color: meta.pill }}>
                        {meta.emoji} {meta.label}
                      </div>

                      <div className="map-popup-row">
                        🗓️ Day {loc.day}{loc.date ? ` · ${loc.date}` : ''}
                      </div>

                      {(loc.startTime || loc.endTime) && (
                        <div className="map-popup-row">
                          ⏰ {loc.startTime ?? '—'} – {loc.endTime ?? '—'}
                        </div>
                      )}

                      {loc.address && (
                        <div className="map-popup-row">
                          📍 {loc.address}
                        </div>
                      )}

                      {loc.description && (
                        <div className="map-popup-row" style={{ marginTop: '6px', lineHeight: '1.5' }}>
                          {loc.description}
                        </div>
                      )}

                      {typeof loc.estimatedCostUsd === 'number' && (
                        <div className="map-popup-cost">
                          ${loc.estimatedCostUsd.toLocaleString()}
                        </div>
                      )}
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