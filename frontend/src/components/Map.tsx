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

const markerIcons: Record<string, L.Icon> = {
  stay: L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  attraction: L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  restaurant: L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  entertainment: L.icon({
    iconUrl:
      'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
};

const getMarkerIcon = (category: string) => {
  return markerIcons[category.toLowerCase()] || DefaultIcon;
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

    if (locations.length === 1) {
      map.setView([locations[0].lat, locations[0].lng], 13);
      return;
    }

    const bounds = L.latLngBounds(locations.map((loc) => [loc.lat, loc.lng]));
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [locations, map]);

  return null;
};

const TripMap = ({ tripData }: MapProps) => {
  const defaultCenter: [number, number] = [21.637, -158.065];

  const locations = useMemo(() => extractLocations(tripData), [tripData]);

  const days = useMemo(() => {
    return Array.from(new Set(locations.map((loc) => loc.day))).sort((a, b) => a - b);
  }, [locations]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(locations.map((loc) => loc.category.toLowerCase()))
    ).sort();
  }, [locations]);

  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  useEffect(() => {
    setActiveCategories(categories);
  }, [categories]);

  const toggleCategory = (category: string) => {
    setActiveCategories((prev) =>
      prev.includes(category)
        ? prev.filter((item) => item !== category)
        : [...prev, category]
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
      .filter(
        (loc) =>
          loc.day === selectedDay &&
          activeCategories.includes(loc.category.toLowerCase())
      )
      .sort((a, b) => a.order - b.order)
      .map((loc) => [loc.lat, loc.lng] as [number, number]);
  }, [locations, selectedDay, activeCategories]);

  return (
    <div
      className="pro-map-wrapper rounded-lg shadow-lg overflow-hidden"
      style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <div
        style={{
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderBottom: '1px solid #ddd',
          background: '#fff',
        }}
      >
        <div>
          <strong>{tripData.title ?? 'Trip Map'}</strong>
          {tripData.destination ? (
            <div style={{ fontSize: '14px', color: '#555', marginTop: '4px' }}>
              {tripData.destination}
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setSelectedDay('all')}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #ccc',
              background: selectedDay === 'all' ? '#eee' : '#fff',
              cursor: 'pointer',
            }}
          >
            All Days
          </button>

          {days.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                background: selectedDay === day ? '#eee' : '#fff',
                cursor: 'pointer',
              }}
            >
              Day {day}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {categories.map((category) => (
            <label
              key={category}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'capitalize',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={activeCategories.includes(category)}
                onChange={() => toggleCategory(category)}
              />
              {category}
            </label>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <MapContainer
          center={
            filteredLocations.length > 0
              ? [filteredLocations[0].lat, filteredLocations[0].lng]
              : defaultCenter
          }
          zoom={9}
          scrollWheelZoom={true}
          className="pro-map-container"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds locations={filteredLocations} />

          {routePositions.length > 1 && (
            <Polyline positions={routePositions} pathOptions={{ weight: 4 }} />
          )}

          <MarkerClusterGroup
            chunkedLoading
            zoomToBoundsOnClick
            spiderfyOnMaxZoom
            showCoverageOnHover={false}
            maxClusterRadius={30}
            disableClusteringAtZoom={15}
          >
            {filteredLocations.map((loc) => (
              <Marker
                key={loc.id}
                position={[loc.lat, loc.lng]}
                icon={getMarkerIcon(loc.category)}
              >
                <Popup>
                  <div style={{ minWidth: '180px' }}>
                    <strong>{loc.name}</strong>
                    <br />

                    <span style={{ textTransform: 'capitalize' }}>{loc.category}</span>
                    <br />

                    <span>
                      Day {loc.day}
                      {loc.date ? ` • ${loc.date}` : ''}
                    </span>
                    <br />

                    {loc.startTime || loc.endTime ? (
                      <>
                        <span>
                          {loc.startTime ?? '—'} - {loc.endTime ?? '—'}
                        </span>
                        <br />
                      </>
                    ) : null}

                    {loc.address ? (
                      <>
                        <span>{loc.address}</span>
                        <br />
                      </>
                    ) : null}

                    {loc.description ? (
                      <>
                        <span>{loc.description}</span>
                        <br />
                      </>
                    ) : null}

                    {typeof loc.estimatedCostUsd === 'number' ? (
                      <span>Estimated Cost: ${loc.estimatedCostUsd}</span>
                    ) : null}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
};

export default TripMap;