import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Crisis, crisisTypeLabels, severityLabels, statusLabels } from "@/data/crisisData";

// Fix default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const severityColors: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

function createIcon(severity: string) {
  const color = severityColors[severity] || "#6b7280";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50%; 
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ${severity === 'critical' ? 'animation: pulse-alert 2s ease-in-out infinite;' : ''}
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

interface CrisisMapProps {
  crises: Crisis[];
}

export function CrisisMap({ crises }: CrisisMapProps) {
  // Center on Angola
  const center: [number, number] = [-12.3, 17.5];

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {crises.map((crisis) => {
        if (!crisis.lat || !crisis.lng) return null;
        return (
          <Marker
            key={crisis.id}
            position={[crisis.lat, crisis.lng]}
            icon={createIcon(crisis.severity)}
          >
            <Popup>
              <div style={{ minWidth: 180, fontFamily: "Inter, sans-serif" }}>
                <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{crisis.title}</p>
                <p style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>{crisis.description}</p>
                <div style={{ fontSize: 11, display: "flex", flexDirection: "column", gap: 2 }}>
                  <span><strong>Tipo:</strong> {crisisTypeLabels[crisis.type]}</span>
                  <span><strong>Severidade:</strong> {severityLabels[crisis.severity]}</span>
                  <span><strong>Estado:</strong> {statusLabels[crisis.status]}</span>
                  <span><strong>Afetados:</strong> {crisis.affectedPeople.toLocaleString()}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
