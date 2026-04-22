import React, { useEffect, useRef, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";

// Fix para os ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface IncidentMapProps {
    userLat: number | null;
    userLng: number | null;
    initialLat: number | null;
    initialLng: number | null;
    onLocationSelect: (lat: number, lng: number) => void;
}

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export const IncidentMap: React.FC<IncidentMapProps> = ({ 
    userLat, 
    userLng, 
    initialLat, 
    initialLng, 
    onLocationSelect 
}) => {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const onLocationSelectRef = useRef(onLocationSelect);

    // Manter referência da função
    useEffect(() => {
        onLocationSelectRef.current = onLocationSelect;
    }, [onLocationSelect]);

    // Inicializar o mapa UMA ÚNICA VEZ
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const center: L.LatLngExpression = (userLat && userLng) 
            ? [userLat, userLng] 
            : [-12.3, 17.5];

        // Criar o mapa
        const map = L.map(containerRef.current).setView(center, 13);
        mapRef.current = map;

        // Adicionar tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Adicionar evento de clique
        map.on('click', (e) => {
            const { lat, lng } = e.latlng;
            
            if (userLat && userLng) {
                const distancia = calcularDistancia(userLat, userLng, lat, lng);
                if (distancia > 1) {
                    toast.error(`Localização muito distante! O incidente deve estar a menos de 1km da sua localização atual. Distância: ${distancia.toFixed(2)}km`);
                    return;
                }
            }
            
            // Atualizar ou criar marcador
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                const marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(`Localização selecionada<br />Lat: ${lat.toFixed(6)}<br />Lng: ${lng.toFixed(6)}`);
                markerRef.current = marker;
            }
            
            onLocationSelectRef.current(lat, lng);
            toast.success("Localização selecionada no mapa!");
        });

        // Adicionar círculo se houver localização do usuário
        if (userLat && userLng) {
            const circle = L.circle([userLat, userLng], {
                radius: 1000,
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.1
            }).addTo(map);
            circleRef.current = circle;
        }

        // Adicionar marcador inicial se houver
        if (initialLat && initialLng) {
            const marker = L.marker([initialLat, initialLng]).addTo(map);
            marker.bindPopup(`Localização selecionada<br />Lat: ${initialLat.toFixed(6)}<br />Lng: ${initialLng.toFixed(6)}`);
            markerRef.current = marker;
        }

        // Cleanup
        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []); // Array vazio = executa apenas uma vez

    // Atualizar círculo quando userLat/userLng mudar
    useEffect(() => {
        if (!mapRef.current) return;
        
        if (circleRef.current) {
            circleRef.current.remove();
            circleRef.current = null;
        }
        
        if (userLat && userLng) {
            const circle = L.circle([userLat, userLng], {
                radius: 1000,
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.1
            }).addTo(mapRef.current);
            circleRef.current = circle;
            
            // Centralizar o mapa na localização do usuário
            mapRef.current.setView([userLat, userLng], 13);
        }
    }, [userLat, userLng]);

    // Atualizar marcador quando initialLat/initialLng mudar
    useEffect(() => {
        if (!mapRef.current) return;
        
        if (markerRef.current) {
            if (initialLat && initialLng) {
                markerRef.current.setLatLng([initialLat, initialLng]);
                markerRef.current.bindPopup(`Localização selecionada<br />Lat: ${initialLat.toFixed(6)}<br />Lng: ${initialLng.toFixed(6)}`);
            } else {
                markerRef.current.remove();
                markerRef.current = null;
            }
        } else if (initialLat && initialLng) {
            const marker = L.marker([initialLat, initialLng]).addTo(mapRef.current);
            marker.bindPopup(`Localização selecionada<br />Lat: ${initialLat.toFixed(6)}<br />Lng: ${initialLng.toFixed(6)}`);
            markerRef.current = marker;
        }
    }, [initialLat, initialLng]);

    return (
        <div 
            ref={containerRef} 
            style={{ height: "100%", width: "100%", borderRadius: "0.5rem" }}
        />
    );
};