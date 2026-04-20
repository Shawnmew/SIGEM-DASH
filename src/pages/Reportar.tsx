import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, Upload, X, FileText, AlertTriangle, Loader2, Navigation, Crosshair, CheckCircle } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Categoria {
    id: number;
    nome: string;
    descricao: string;
}

interface MunicipioDetectado {
    id: number;
    nome: string;
    provincia_id: number;
    provincia_nome?: string;
    distancia: number;
}

interface Position {
    lat: number;
    lng: number;
}

interface FileUpload {
    file: File;
    preview: string;
    tipo: 'foto' | 'video' | 'audio' | 'documento';
}

// Componente de Mapa isolado com memo para evitar re-renderizações
const MapComponent = memo(({ 
    userLocation, 
    onLocationSelect, 
    initialLocation 
}: { 
    userLocation: Position | null; 
    onLocationSelect: (lat: number, lng: number) => void;
    initialLocation: Position | null;
}) => {
    const mapCenter: [number, number] = userLocation 
        ? [userLocation.lat, userLocation.lng] 
        : [-12.3, 17.5];

    function LocationMarker() {
        const [position, setPosition] = useState<L.LatLng | null>(
            initialLocation ? L.latLng(initialLocation.lat, initialLocation.lng) : null
        );

        useMapEvents({
            click(e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                
                if (userLocation) {
                    const distancia = calcularDistancia(userLocation.lat, userLocation.lng, lat, lng);
                    if (distancia > 1) {
                        toast.error(`Localização muito distante! O incidente deve estar a menos de 1km da sua localização atual. Distância: ${distancia.toFixed(2)}km`);
                        return;
                    }
                }
                
                setPosition(e.latlng);
                onLocationSelect(lat, lng);
                toast.success("Localização selecionada no mapa!");
            },
        });

        useEffect(() => {
            if (initialLocation) {
                setPosition(L.latLng(initialLocation.lat, initialLocation.lng));
            }
        }, [initialLocation]);

        return position === null ? null : (
            <>
                <Marker position={position}>
                    <Popup>
                        Localização selecionada<br />
                        Lat: {position.lat.toFixed(6)}<br />
                        Lng: {position.lng.toFixed(6)}
                    </Popup>
                </Marker>
            </>
        );
    }

    return (
        <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
            {userLocation && (
                <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={1000}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1 }}
                />
            )}
        </MapContainer>
    );
});

MapComponent.displayName = 'MapComponent';

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

const ReportarPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [loadingLocation, setLoadingLocation] = useState(true);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [municipioDetectado, setMunicipioDetectado] = useState<MunicipioDetectado | null>(null);
    const [userLocation, setUserLocation] = useState<Position | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    
    // Estado do formulário
    const [title, setTitle] = useState("");
    const [descricao, setDescricao] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [selectedLat, setSelectedLat] = useState<number | null>(null);
    const [selectedLng, setSelectedLng] = useState<number | null>(null);
    
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [municipios, setMunicipios] = useState<any[]>([]);

    const isMounted = useRef(true);
    const municipioDetectadoRef = useRef(municipioDetectado);

    useEffect(() => {
        municipioDetectadoRef.current = municipioDetectado;
    }, [municipioDetectado]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        loadInitialData();
        getCurrentLocation();
    }, []);

    const loadInitialData = async () => {
        setLoadingData(true);
        try {
            const [categoriasRes, municipiosRes] = await Promise.all([
                api.get('/categorias'),
                api.get('/municipios')
            ]);
            
            const categoriasData = categoriasRes.data.data || categoriasRes.data || [];
            setCategorias(categoriasData);
            setMunicipios(municipiosRes.data.data || []);
            
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados necessários");
        } finally {
            if (isMounted.current) {
                setLoadingData(false);
            }
        }
    };

    const detectarMunicipioPorLocalizacao = useCallback(async (lat: number, lng: number) => {
        try {
            console.log('Detectando município para:', lat, lng);
            const response = await api.get('/municipios/detect', {
                params: { latitude: lat, longitude: lng }
            });
            
            console.log('Resposta da detecção:', response.data);
            
            if (response.data.success && response.data.data && isMounted.current) {
                const municipio = response.data.data;
                setMunicipioDetectado(municipio);
                toast.success(`Município detectado: ${municipio.nome}`);
                return municipio;
            } else if (municipios.length > 0 && isMounted.current) {
                const fallback = municipios[0];
                setMunicipioDetectado({
                    id: fallback.id,
                    nome: fallback.nome,
                    provincia_id: fallback.provincia_id,
                    provincia_nome: fallback.provincia?.nome,
                    distancia: 0
                });
            }
            return null;
        } catch (error) {
            console.error("Erro ao detectar município:", error);
            return null;
        }
    }, [municipios]);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            setLocationError("Geolocalização não suportada");
            setLoadingLocation(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                if (isMounted.current) {
                    setUserLocation({ lat, lng });
                    setSelectedLat(lat);
                    setSelectedLng(lng);
                    setLoadingLocation(false);
                    toast.success("Localização capturada!");
                }
                
                await detectarMunicipioPorLocalizacao(lat, lng);
            },
            (error) => {
                console.error("Erro de localização:", error);
                setLocationError("Não foi possível obter sua localização");
                setLoadingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleLocationSelect = useCallback((lat: number, lng: number) => {
        setSelectedLat(lat);
        setSelectedLng(lng);
        detectarMunicipioPorLocalizacao(lat, lng);
    }, [detectarMunicipioPorLocalizacao]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        if (errors.title) {
            setErrors(prev => ({ ...prev, title: undefined }));
        }
    };

    const handleDescricaoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescricao(e.target.value);
        if (errors.descricao) {
            setErrors(prev => ({ ...prev, descricao: undefined }));
        }
    };

    const handleCategoriaChange = (value: string) => {
        setCategoriaId(value);
        if (errors.categoria_id) {
            setErrors(prev => ({ ...prev, categoria_id: undefined }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const newFiles: FileUpload[] = selectedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            tipo: file.type.startsWith('image/') ? 'foto' : 
                  file.type.startsWith('video/') ? 'video' : 
                  file.type.startsWith('audio/') ? 'audio' : 'documento'
        }));
        setFiles(prev => [...prev, ...newFiles]);
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(files[index].preview);
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!title.trim()) newErrors.title = "Título é obrigatório";
        if (!descricao.trim()) newErrors.descricao = "Descrição é obrigatória";
        if (!categoriaId) newErrors.categoria_id = "Selecione uma categoria";
        if (!selectedLat || !selectedLng) newErrors.location = "Selecione a localização no mapa";
        if (!userLocation) newErrors.gps = "Permita o acesso à localização";
        if (!municipioDetectadoRef.current) newErrors.municipio = "Município não detectado";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        if (userLocation && selectedLat && selectedLng) {
            const distancia = calcularDistancia(userLocation.lat, userLocation.lng, selectedLat, selectedLng);
            if (distancia > 1) {
                toast.error(`Localização inválida! Distância de ${distancia.toFixed(2)}km (limite 1km)`);
                return;
            }
        }

        const municipioAtual = municipioDetectadoRef.current;
        if (!municipioAtual) {
            toast.error("Município não detectado");
            return;
        }

        setLoading(true);

        try {
            const incidenteData = {
                title: title.trim(),
                descricao: descricao.trim(),
                categoria_id: parseInt(categoriaId),
                municipio_id: municipioAtual.id,
                latitude: selectedLat?.toString(),
                longitude: selectedLng?.toString(),
                status: "pendente"
            };

            const incidenteResponse = await api.post("/incidentes", incidenteData);
            
            if (incidenteResponse.data.success) {
                const incidenteId = incidenteResponse.data.data.id;
                
                for (const fileUpload of files) {
                    const formDataFile = new FormData();
                    formDataFile.append('incidente_id', incidenteId.toString());
                    formDataFile.append('tipo_midia', fileUpload.tipo);
                    formDataFile.append('arquivo', fileUpload.file);
                    
                    await api.post("/midia-incidentes", formDataFile, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                }
                
                toast.success("Incidente reportado com sucesso!");
                navigate("/crises");
            }
        } catch (error: any) {
            console.error("Erro:", error);
            toast.error(error.response?.data?.message || "Erro ao reportar incidente");
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
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
            <div className="max-w-4xl mx-auto p-4 lg:p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6 text-red-500" />
                        Reportar Incidente
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Preencha o formulário abaixo para reportar um novo incidente
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card de Localização */}
                    <Card className={!userLocation ? "border-red-500" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Navigation className="h-5 w-5 text-primary" />
                                Localização Obrigatória
                            </CardTitle>
                            <CardDescription>
                                Permita o acesso à localização. O incidente deve estar a menos de 1km da sua localização atual.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingLocation ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                                    <span>Obtendo localização...</span>
                                </div>
                            ) : locationError ? (
                                <div className="text-center py-8">
                                    <div className="text-red-500 mb-4">{locationError}</div>
                                    <Button type="button" onClick={getCurrentLocation} variant="outline">
                                        <Crosshair className="h-4 w-4 mr-2" />
                                        Tentar Novamente
                                    </Button>
                                </div>
                            ) : userLocation ? (
                                <div className="space-y-4">
                                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Localização capturada!</span>
                                        </div>
                                        <p className="text-xs mt-1">
                                            Lat: {userLocation.lat.toFixed(6)} | Lng: {userLocation.lng.toFixed(6)}
                                        </p>
                                    </div>

                                    {municipioDetectado && (
                                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 rounded-lg p-3 text-blue-800 text-sm">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                <span>Município: <strong>{municipioDetectado.nome}</strong></span>
                                            </div>
                                            {municipioDetectado.provincia_nome && (
                                                <p className="text-xs mt-1">Província: {municipioDetectado.provincia_nome}</p>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="h-96 rounded-lg overflow-hidden border">
                                        <MapComponent 
                                            userLocation={userLocation}
                                            onLocationSelect={handleLocationSelect}
                                            initialLocation={selectedLat && selectedLng ? { lat: selectedLat, lng: selectedLng } : null}
                                        />
                                    </div>
                                    
                                    <p className="text-xs text-muted-foreground text-center">
                                        Clique no mapa dentro do círculo vermelho para selecionar a localização exata do incidente.
                                    </p>
                                    
                                    {errors.location && <p className="text-xs text-red-500 text-center">{errors.location}</p>}
                                    {errors.municipio && <p className="text-xs text-red-500 text-center">{errors.municipio}</p>}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Button type="button" onClick={getCurrentLocation} variant="default">
                                        <Crosshair className="h-4 w-4 mr-2" />
                                        Permitir Localização
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {userLocation && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informações do Incidente</CardTitle>
                                    <CardDescription>
                                        Descreva detalhadamente o incidente
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">Título *</Label>
                                        <Input
                                            id="title"
                                            value={title}
                                            onChange={handleTitleChange}
                                            placeholder="Ex: Inundação no bairro X"
                                            className={errors.title ? "border-red-500" : ""}
                                        />
                                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="descricao">Descrição *</Label>
                                        <Textarea
                                            id="descricao"
                                            value={descricao}
                                            onChange={handleDescricaoChange}
                                            placeholder="Descreva detalhadamente o incidente..."
                                            rows={5}
                                            className={errors.descricao ? "border-red-500" : ""}
                                        />
                                        {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="categoria">Categoria *</Label>
                                        <Select value={categoriaId} onValueChange={handleCategoriaChange}>
                                            <SelectTrigger className={errors.categoria_id ? "border-red-500" : ""}>
                                                <SelectValue placeholder="Selecione a categoria" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {categorias.map((cat) => (
                                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                                        {cat.nome}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.categoria_id && <p className="text-xs text-red-500 mt-1">{errors.categoria_id}</p>}
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border">
                                        <Label className="text-muted-foreground">Município (Detectado)</Label>
                                        <p className="font-medium mt-1 dark:text-white">
                                            {municipioDetectado?.nome || "Detectando..."}
                                        </p>
                                        {municipioDetectado?.provincia_nome && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Província: {municipioDetectado.provincia_nome}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Mídia (Opcional)</CardTitle>
                                    <CardDescription>
                                        Adicione fotos, vídeos ou documentos relacionados
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary transition-colors">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            multiple
                                            accept="image/*,video/*,audio/*,application/pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                            <Upload className="h-8 w-8 text-gray-400" />
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Clique para selecionar arquivos</span>
                                        </Label>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {files.map((file, index) => (
                                                <div key={index} className="relative group">
                                                    {file.tipo === 'foto' && (
                                                        <img src={file.preview} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
                                                    )}
                                                    {(file.tipo === 'video' || file.tipo === 'audio' || file.tipo === 'documento') && (
                                                        <div className="w-full h-24 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                                            <FileText className="h-8 w-8 text-gray-500" />
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(index)}
                                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                    <p className="text-xs text-muted-foreground truncate mt-1">{file.file.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-end gap-3">
                                    <Button type="button" variant="outline" onClick={() => navigate("/crises")}>
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading || !userLocation || !municipioDetectado}>
                                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                        {loading ? "Enviando..." : "Reportar Incidente"}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </>
                    )}
                </form>
            </div>
        </AppLayout>
    );
};

export default ReportarPage;