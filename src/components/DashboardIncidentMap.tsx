// src/components/DashboardIncidentMap.tsx
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AlertTriangle, MapPin, Eye, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

// Configurar ícones padrão do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface IncidentMapItem {
  id: number;
  title: string;
  descricao?: string;
  latitude: number | string | null;
  longitude: number | string | null;
  status: string;
  gravidade?: string;
  affected_people?: number;
  categoria?: { nome: string };
  municipio?: { nome: string; provincia?: { nome: string } };
  created_at?: string;
}

interface DashboardIncidentMapProps {
  provinciaId?: string;
  municipioId?: string;
}

// Criar ícones coloridos personalizados usando SVG do Leaflet
const createCustomIcon = (color: string) => {
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="${color}">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `;
  return L.divIcon({
    html: svgString,
    className: "custom-leaflet-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -30],
  });
};

const icons = {
  critical: createCustomIcon("#ef4444"), // Vermelho (Crítico / Em andamento)
  confirmed: createCustomIcon("#f97316"), // Laranja (Confirmado)
  pending: createCustomIcon("#eab308"), // Amarelo (Pendente / Em análise)
  resolved: createCustomIcon("#22c55e"), // Verde (Resolvido)
};

export const DashboardIncidentMap: React.FC<DashboardIncidentMapProps> = ({
  provinciaId = "all",
  municipioId = "all",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [incidents, setIncidents] = useState<IncidentMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Carregar dados de incidentes
  const fetchMapIncidents = async () => {
    try {
      setLoading(true);
      const params: any = { per_page: 100 };
      if (municipioId !== "all") params.municipio_id = municipioId;
      else if (provinciaId !== "all") params.provincia_id = provinciaId;

      const response = await api.get("/incidentes", { params });
      const items = response.data?.data?.data || response.data?.data || [];
      setIncidents(items);
    } catch (error) {
      console.error("Erro ao carregar incidentes no mapa:", error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapIncidents();
  }, [provinciaId, municipioId]);

  // Inicializar o mapa Leaflet
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Coordenadas centrais de Angola
    const defaultCenter: L.LatLngExpression = [-12.3, 17.5];

    const map = L.map(containerRef.current, {
      center: defaultCenter,
      zoom: 6,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Atualizar marcadores quando os incidentes mudam
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    // Limpar marcadores antigos
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const bounds = L.latLngBounds([]);
    let validMarkersCount = 0;

    incidents.forEach((inc) => {
      const lat = parseFloat(String(inc.latitude));
      const lng = parseFloat(String(inc.longitude));

      if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) return;

      // Definir ícone por status/gravidade
      let icon = icons.pending;
      if (inc.status === "resolvido" || inc.status === "encerrado") {
        icon = icons.resolved;
      } else if (inc.status === "confirmado") {
        icon = icons.confirmed;
      } else if (inc.status === "em_andamento" || inc.gravidade === "critical") {
        icon = icons.critical;
      }

      const marker = L.marker([lat, lng], { icon }).addTo(map);

      // Criar conteúdo do Popup
      const popupContent = document.createElement("div");
      popupContent.className = "p-1 space-y-2 min-w-[200px]";
      popupContent.innerHTML = `
        <div class="border-b pb-1">
          <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">${inc.categoria?.nome || 'Emergência'}</span>
          <h4 class="font-bold text-sm text-foreground leading-snug">${inc.title}</h4>
        </div>
        <div class="text-xs space-y-1">
          <p class="text-muted-foreground">📍 ${inc.municipio?.nome || 'Localidade não especificada'}</p>
          ${inc.affected_people ? `<p class="font-medium text-red-600">👥 Afetados: ${inc.affected_people}</p>` : ''}
          <div class="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
            inc.status === 'em_andamento' ? 'bg-red-100 text-red-700' :
            inc.status === 'confirmado' ? 'bg-orange-100 text-orange-700' :
            inc.status === 'resolvido' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }">
            ${inc.status.replace('_', ' ')}
          </div>
        </div>
        <button id="btn-details-${inc.id}" class="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold py-1.5 px-3 rounded flex items-center justify-center gap-1 transition-all">
          Ver Crise
        </button>
      `;

      // Adicionar listener no botão do Popup
      marker.bindPopup(popupContent);
      marker.on("popupopen", () => {
        const btn = document.getElementById(`btn-details-${inc.id}`);
        if (btn) {
          btn.onclick = () => navigate(`/crises/${inc.id}`);
        }
      });

      markersRef.current.push(marker);
      bounds.extend([lat, lng]);
      validMarkersCount++;
    });

    // Ajustar zoom para caber os marcadores se houver algum
    if (validMarkersCount > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
  }, [incidents, navigate]);

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm animate-slide-up space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MapPin className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Mapa Cartográfico de Ocorrências</h3>
            <p className="text-xs text-muted-foreground">Monitoramento geográfico de crises e chamados ativos</p>
          </div>
        </div>

        {/* Legenda do Mapa */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Crítico / Em Andamento</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            <span>Confirmado</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
            <span>Resolvido</span>
          </div>
        </div>
      </div>

      <div className="relative h-[380px] w-full rounded-xl overflow-hidden border border-border">
        {loading && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-[1000] flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm font-medium">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span>Carregando dados cartográficos...</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="h-full w-full" />
      </div>
    </div>
  );
};
