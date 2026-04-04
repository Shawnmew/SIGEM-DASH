// src/pages/Mapa.tsx
import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

// Fix para os ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Incidente {
    id: number;
    title: string;
    descricao: string;
    latitude: string;
    longitude: string;
    status: string;
    categoria_id: number;
    municipio_id: number;
    created_at: string;
    categoria?: {
        id: number;
        nome: string;
    };
    municipio?: {
        id: number;
        nome: string;
        provincia?: {
            id: number;
            nome: string;
        };
    };
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'critico': return '#ef4444';
        case 'em_andamento': return '#f97316';
        case 'confirmado': return '#eab308';
        case 'pendente': return '#3b82f6';
        case 'resolvido': return '#22c55e';
        default: return '#6b7280';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'critico': return 'Crítico';
        case 'em_andamento': return 'Em Andamento';
        case 'confirmado': return 'Confirmado';
        case 'pendente': return 'Pendente';
        case 'resolvido': return 'Resolvido';
        default: return status;
    }
};

const MapaPage = () => {
    const [incidentes, setIncidentes] = useState<Incidente[]>([]);
    const [loading, setLoading] = useState(true);
    const [center, setCenter] = useState<[number, number]>([-12.3, 17.5]);
    const [zoom, setZoom] = useState(6);

    useEffect(() => {
        loadIncidentes();
    }, []);

    const loadIncidentes = async () => {
        try {
            const response = await api.get('/incidentes');
            const data = response.data.data.data || response.data.data || [];
            setIncidentes(data);
        } catch (error) {
            console.error("Erro ao carregar incidentes:", error);
            toast.error("Erro ao carregar incidentes no mapa");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-4 lg:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Mapa de Risco</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualização geográfica de incidentes ativos
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="h-[calc(100vh-200px)] w-full">
                        <MapContainer
                            center={center}
                            zoom={zoom}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={true}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            
                            {incidentes.filter(i => i.latitude && i.longitude).map((incidente) => {
                                const lat = parseFloat(incidente.latitude);
                                const lng = parseFloat(incidente.longitude);
                                const cor = getStatusColor(incidente.status);
                                
                                return (
                                    <React.Fragment key={incidente.id}>
                                        <Circle
                                            center={[lat, lng]}
                                            radius={500}
                                            pathOptions={{ color: cor, fillColor: cor, fillOpacity: 0.3 }}
                                        />
                                        <Marker position={[lat, lng]}>
                                            <Popup>
                                                <div className="min-w-[200px]">
                                                    <h3 className="font-bold text-sm">{incidente.title}</h3>
                                                    <p className="text-xs text-gray-600 mt-1">{incidente.descricao?.substring(0, 100)}...</p>
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-xs"><strong>Status:</strong> {getStatusLabel(incidente.status)}</p>
                                                        <p className="text-xs"><strong>Categoria:</strong> {incidente.categoria?.nome || 'N/A'}</p>
                                                        <p className="text-xs"><strong>Município:</strong> {incidente.municipio?.nome || 'N/A'}</p>
                                                        <p className="text-xs"><strong>Data:</strong> {new Date(incidente.created_at).toLocaleDateString('pt-AO')}</p>
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    </React.Fragment>
                                );
                            })}
                        </MapContainer>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-2">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span className="text-xs">Crítico</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span className="text-xs">Em Andamento</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span className="text-xs">Confirmado</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-xs">Pendente</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span className="text-xs">Resolvido</span></div>
                </div>
            </div>
        </AppLayout>
    );
};

export default MapaPage;