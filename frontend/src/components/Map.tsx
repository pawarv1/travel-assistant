import { useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
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

const Map = () => {
    const mapRef = useRef(null);
    const center: [number, number] = [40.265, -74.781];

    return (
        <div className="pro-map-wrapper">
            <MapContainer
                center={center}
                zoom={9}
                ref={mapRef}
                scrollWheelZoom={true}
                className="pro-map-container"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a>'
                    url="https://api.maptiler.com/maps/basic-v2-dark/{z}/{x}/{y}.png?key=Fhb4Hebiu4SN3z8jHSmb"
                />


            </MapContainer>
        </div>
    );
};

export default Map;