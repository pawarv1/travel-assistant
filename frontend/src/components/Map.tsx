import { useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Static assets for default Leaflet marker icons
// @ts-ignore
import icon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

type Location = {
  name: string;
  lat: number;
  lng: number;
  category: string;
};

type MapProps = {
  locations: Location[];
};

const Map = ({ locations }: MapProps) => {
    const mapRef = useRef<L.Map>(null);

    // Function to get marker icon based on category
    const getMarkerIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'stay':
                // Red marker for hotels
                return L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
                    shadowUrl: iconShadow,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                });
            case 'attraction':
                // Green marker for attractions
                return L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
                    shadowUrl: iconShadow,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                });
            case 'restaurant':
                // Orange marker for restaurants
                return L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
                    shadowUrl: iconShadow,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                });
            case 'entertainment':
                // Purple marker for entertainment
                return L.icon({
                    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png',
                    shadowUrl: iconShadow,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                });
            default:
                return DefaultIcon;
        }
    };

    // Component to handle fitting bounds when locations change
    const FitBounds = () => {
        const map = useMap();
        useEffect(() => {
            if (locations.length > 0) {
                const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
                map.fitBounds(bounds, { padding: [20, 20] });
            }
        }, [locations, map]);
        return null;
    };

    const defaultCenter: [number, number] = [21.637, -158.065]; // Hawaii

    return (
        <div className="pro-map-wrapper rounded-lg shadow-lg overflow-hidden" style={{ height: '100%', width: '100%' }}>
            <MapContainer
                center={locations.length > 0 ? [locations[0].lat, locations[0].lng] : defaultCenter}
                zoom={9}
                ref={mapRef}
                scrollWheelZoom={true}
                className="pro-map-container"
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <FitBounds />
                {locations.map((loc, index) => (
                    <Marker key={index} position={[loc.lat, loc.lng]} icon={getMarkerIcon(loc.category)}>
                        <Popup>{loc.name} ({loc.category})</Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default Map;