// src/pages/Mapa.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { AppLayout } from "@/components/AppLayout";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Loader2, Search, MapPin, AlertTriangle, ArrowRight, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

const getStatusLabel = (status: string, t: any) => {
    switch (status) {
        case 'critico': return t('critical');
        case 'em_andamento': return t('in_progress');
        case 'confirmado': return t('confirmed');
        case 'pendente': return t('pending');
        case 'resolvido': return t('resolved_status');
        default: return status;
    }
};

const createCustomIcon = (status: string) => {
    const color = getStatusColor(status);
    return L.divIcon({
        className: 'custom-leaflet-icon',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        popupAnchor: [0, -12],
    });
};

// Componente para mudar a visão do mapa externamente
const MapController = ({ center, zoom }: { center: [number, number], zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom, { animate: true });
    }, [center, zoom, map]);
    return null;
};

const MapaPage = () => {
    const { t } = useTranslation();
    const [incidentes, setIncidentes] = useState<Incidente[]>([]);
    const [loading, setLoading] = useState(true);
    const [center, setCenter] = useState<[number, number]>([-12.3, 17.5]);
    const [zoom, setZoom] = useState(6);
    
    // Filtros
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("todos");

    useEffect(() => {
        loadIncidentes();
    }, []);

    const loadIncidentes = async () => {
        try {
            const response = await api.get('/incidentes');
            const data = response.data.data.data || response.data.data || [];
            // Apenas pegar incidentes que não estão encerrados/cancelados
            const activeIncidentes = data.filter((i: Incidente) => !['encerrado', 'cancelado'].includes(i.status));
            setIncidentes(activeIncidentes);
        } catch (error) {
            console.error("Erro ao carregar incidentes:", error);
            toast.error(t('loading'));
        } finally {
            setLoading(false);
        }
    };

    const filteredIncidentes = useMemo(() => {
        return incidentes.filter(inc => {
            const matchesSearch = inc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  (inc.municipio?.nome.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
            const matchesStatus = statusFilter === "todos" || inc.status === statusFilter;
            return matchesSearch && matchesStatus && inc.latitude && inc.longitude;
        });
    }, [incidentes, searchQuery, statusFilter]);

    const handleFocusIncident = (inc: Incidente) => {
        setCenter([parseFloat(inc.latitude), parseFloat(inc.longitude)]);
        setZoom(15);
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
            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex-shrink-0 flex items-center justify-between z-10 shadow-sm relative">
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-red-500" />
                            {t('geo_command_center')}
                        </h1>
                        <p className="text-sm text-muted-foreground hidden sm:block">
                            {t('real_time_monitoring', { count: filteredIncidentes.length })}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder={t('search_map_placeholder')}
                                className="pl-9 h-9"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px] h-9">
                                <Filter className="h-4 w-4 mr-2 text-gray-500" />
                                <SelectValue placeholder={t('status')} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">{t('all_active')}</SelectItem>
                                <SelectItem value="critico">{t('critical')}</SelectItem>
                                <SelectItem value="em_andamento">{t('in_progress')}</SelectItem>
                                <SelectItem value="confirmado">{t('confirmed')}</SelectItem>
                                <SelectItem value="pendente">{t('pending')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex flex-1 overflow-hidden relative">
                    {/* Sidebar Lista de Incidentes */}
                    <div className="w-80 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 flex flex-col z-10 shadow-[4px_0_15px_-3px_rgba(0,0,0,0.1)]">
                        <div className="p-3 border-b border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-gray-800/50">
                            <h3 className="font-medium text-sm text-gray-700 dark:text-gray-300">{t('incidents_panel')}</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {filteredIncidentes.length === 0 ? (
                                <div className="text-center py-10 opacity-50">
                                    <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                                    <p className="text-sm">{t('no_crises_found')}</p>
                                </div>
                            ) : (
                                filteredIncidentes.map((inc) => (
                                    <div 
                                        key={inc.id}
                                        onClick={() => handleFocusIncident(inc)}
                                        className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:border-red-300 dark:hover:border-red-900 transition-colors group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <Badge 
                                                variant="outline" 
                                                style={{ borderColor: getStatusColor(inc.status), color: getStatusColor(inc.status) }}
                                                className="text-[10px] uppercase font-bold"
                                            >
                                                {getStatusLabel(inc.status, t)}
                                            </Badge>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(inc.created_at).toLocaleDateString('pt-AO')}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-red-500 transition-colors">{inc.title}</h4>
                                        <div className="flex items-center text-xs text-gray-500 mt-2 gap-1">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{inc.municipio?.nome}, {inc.municipio?.provincia?.nome}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 text-xs text-center text-gray-500">
                            <strong>{t('legend')}:</strong>
                            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2">
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> {t('critical')}</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> {t('in_progress')}</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> {t('confirmed')}</div>
                            </div>
                        </div>
                    </div>

                    {/* Mapa Central */}
                    <div className="flex-1 relative bg-blue-50/50">
                        <MapContainer
                            center={center}
                            zoom={zoom}
                            style={{ height: "100%", width: "100%", zIndex: 1 }}
                            scrollWheelZoom={true}
                            zoomControl={false}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                            />
                            <MapController center={center} zoom={zoom} />
                            
                            {filteredIncidentes.map((incidente) => {
                                const lat = parseFloat(incidente.latitude);
                                const lng = parseFloat(incidente.longitude);
                                const cor = getStatusColor(incidente.status);
                                
                                return (
                                    <React.Fragment key={incidente.id}>
                                        <Circle
                                            center={[lat, lng]}
                                            radius={incidente.status === 'critico' ? 1500 : 500}
                                            pathOptions={{ 
                                                color: cor, 
                                                fillColor: cor, 
                                                fillOpacity: incidente.status === 'critico' ? 0.4 : 0.2,
                                                weight: 1
                                            }}
                                        />
                                        <Marker 
                                            position={[lat, lng]}
                                            icon={createCustomIcon(incidente.status)}
                                        >
                                            <Popup className="custom-popup">
                                                <div className="min-w-[220px] p-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cor }}></div>
                                                        <h3 className="font-bold text-sm leading-tight text-gray-900">{incidente.title}</h3>
                                                    </div>
                                                    <p className="text-xs text-gray-600 mb-3 border-l-2 border-gray-200 pl-2">
                                                        {incidente.descricao?.substring(0, 80)}{incidente.descricao?.length > 80 ? '...' : ''}
                                                    </p>
                                                    <div className="space-y-1 mb-3 bg-gray-50 p-2 rounded text-gray-700">
                                                        <p className="text-xs flex justify-between"><strong>{t('category')}:</strong> <span>{incidente.categoria?.nome || 'N/A'}</span></p>
                                                        <p className="text-xs flex justify-between"><strong>{t('municipality')}:</strong> <span>{incidente.municipio?.nome || 'N/A'}</span></p>
                                                    </div>
                                                    <Link 
                                                        to={`/crises/${incidente.id}`}
                                                        className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-md text-xs font-semibold transition-colors"
                                                    >
                                                        {t('view_full_details')} <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    </React.Fragment>
                                );
                            })}
                        </MapContainer>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default MapaPage;