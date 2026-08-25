import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { Cross, Navigation } from "lucide-react";

// Fix for default icons in leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function RoutingMachine({ position, destination }) {
  const map = useMap();
  useEffect(() => {
    if (!position || !destination) return;
    
    let routingControl;
    try {
      routingControl = L.Routing.control({
        waypoints: [
          L.latLng(position.latitude, position.longitude),
          L.latLng(destination.latitude, destination.longitude)
        ],
        routeWhileDragging: false,
        show: false,
        addWaypoints: false,
        createMarker: () => null // We draw our own markers
      }).addTo(map);
    } catch (e) {
      console.warn("Routing error", e);
    }

    return () => {
      try {
        if (routingControl && map) {
          map.removeControl(routingControl);
        }
      } catch (e) {}
    };
  }, [map, position, destination]);

  return null;
}

function NeonMap({ facilities, position, onSelect, selected }) {
  // Use fallback coordinates if position is missing
  const center = position && position.latitude && position.longitude 
    ? [position.latitude, position.longitude]
    : [22.9751, 88.4345];

  return (
    <div className="neon-map" style={{ padding: 0, overflow: 'hidden', height: "540px", minHeight: "500px", width: "100%" }} aria-label="Tactical emergency map">
      <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%", background: '#111827' }}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Marker position={center}>
          <Popup>You are here</Popup>
        </Marker>
        {facilities.map(f => (
          <Marker 
            key={f.id} 
            position={[f.latitude, f.longitude]}
            eventHandlers={{
              click: () => onSelect(f)
            }}
          >
            <Popup>{f.name}</Popup>
          </Marker>
        ))}
        {selected && (
          <RoutingMachine position={position} destination={selected} />
        )}
      </MapContainer>
    </div>
  );
}

export { NeonMap };
