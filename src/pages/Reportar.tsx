import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/authcontext";
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

interface IncidenteForm {
    title: string;
    descricao: string;
    categoria_id: string;
    latitude: number | null;
    longitude: number | null;
}

interface FileUpload {
    file: File;
    preview: string;
    tipo: 'foto' | 'video' | 'audio' | 'documento';
}

interface Position {
    lat: number;
    lng: number;
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

function LocationMarker({ setLocation, userLocation, onLocationConfirmed }: { 
    setLocation: (lat: number, lng: number) => void;
    userLocation: Position | null;
    onLocationConfirmed: (lat: number, lng: number) => void;
}) {
    const [position, setPosition] = useState<L.LatLng | null>(
        userLocation ? L.latLng(userLocation.lat, userLocation.lng) : null
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
            setLocation(lat, lng);
            onLocationConfirmed(lat, lng);
            toast.success("Localização selecionada no mapa!");
        },
    });

    return position === null ? null : (
        <>
            <Marker position={position}>
                <Popup>
                    Localização selecionada<br />
                    Lat: {position.lat.toFixed(6)}<br />
                    Lng: {position.lng.toFixed(6)}
                </Popup>
            </Marker>
            {userLocation && (
                <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={1000}
                    pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1 }}
                />
            )}
        </>
    );
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
    const [formData, setFormData] = useState<IncidenteForm>({
        title: "",
        descricao: "",
        categoria_id: "",
        latitude: null,
        longitude: null
    });
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [mapCenter, setMapCenter] = useState<[number, number]>([-12.3, 17.5]);

    useEffect(() => {
        loadInitialData();
        getCurrentLocation();
    }, []);

    const loadInitialData = async () => {
        setLoadingData(true);
        try {
            const categoriasRes = await api.get('/categorias');
            const categoriasData = categoriasRes.data.data || categoriasRes.data || [];
            setCategorias(categoriasData);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados necessários");
        } finally {
            setLoadingData(false);
        }
    };

    const detectarMunicipioPorLocalizacao = async (lat: number, lng: number) => {
        try {
            const response = await api.get('/municipios/detect', {
                params: { latitude: lat, longitude: lng }
            });
            
            if (response.data.success && response.data.data) {
                const municipio = response.data.data;
                setMunicipioDetectado(municipio);
                toast.success(`Município detectado: ${municipio.nome}${municipio.distancia ? ` (${municipio.distancia.toFixed(2)}km do centro)` : ''}`);
                return municipio;
            } else {
                setMunicipioDetectado(null);
                toast.error("Não foi possível detectar o município. Verifique se está dentro de Angola.");
                return null;
            }
        } catch (error) {
            console.error("Erro ao detectar município:", error);
            setMunicipioDetectado(null);
            toast.error("Erro ao detectar município. Tente novamente.");
            return null;
        }
    };

    const getCurrentLocation = () => {
        setLoadingLocation(true);
        setLocationError(null);
        
        if (!navigator.geolocation) {
            setLocationError("Geolocalização não é suportada pelo seu navegador");
            setLoadingLocation(false);
            toast.error("Geolocalização não suportada");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setUserLocation({ lat, lng });
                setMapCenter([lat, lng]);
                setFormData(prev => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng
                }));
                
                // Detectar município automaticamente
                await detectarMunicipioPorLocalizacao(lat, lng);
                
                setLoadingLocation(false);
                toast.success("Localização capturada com sucesso!");
            },
            (error) => {
                console.error("Erro ao obter localização:", error);
                let errorMessage = "Erro ao obter localização. ";
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Permissão negada. Por favor, permita o acesso à localização.";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Informação de localização indisponível.";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Tempo limite excedido.";
                        break;
                    default:
                        errorMessage += "Tente novamente.";
                }
                setLocationError(errorMessage);
                setLoadingLocation(false);
                toast.error(errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    };

    const updateLocation = async (lat: number, lng: number) => {
        if (userLocation) {
            const distancia = calcularDistancia(userLocation.lat, userLocation.lng, lat, lng);
            if (distancia > 1) {
                toast.error(`Localização muito distante! O incidente deve estar a menos de 1km da sua localização atual. Distância: ${distancia.toFixed(2)}km`);
                return false;
            }
        }
        
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng
        }));
        
        // Detectar município automaticamente quando selecionar no mapa
        await detectarMunicipioPorLocalizacao(lat, lng);
        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const newFiles: FileUpload[] = selectedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            tipo: getFileType(file.type)
        }));
        
        setFiles([...files, ...newFiles]);
    };

    const getFileType = (mimeType: string): 'foto' | 'video' | 'audio' | 'documento' => {
        if (mimeType.startsWith('image/')) return 'foto';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'documento';
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(files[index].preview);
        setFiles(files.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        
        if (!formData.title.trim()) {
            newErrors.title = "Título é obrigatório";
        }
        if (!formData.descricao.trim()) {
            newErrors.descricao = "Descrição é obrigatória";
        }
        if (!formData.categoria_id) {
            newErrors.categoria_id = "Selecione uma categoria";
        }
        if (!formData.latitude || !formData.longitude) {
            newErrors.location = "Selecione a localização no mapa";
        }
        if (!userLocation) {
            newErrors.gps = "Permita o acesso à localização para reportar um incidente";
        }
        if (!municipioDetectado) {
            newErrors.municipio = "Não foi possível detectar o município. Verifique sua localização.";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error("Preencha todos os campos obrigatórios");
            return;
        }

        if (userLocation && formData.latitude && formData.longitude) {
            const distancia = calcularDistancia(
                userLocation.lat, 
                userLocation.lng, 
                formData.latitude, 
                formData.longitude
            );
            if (distancia > 1) {
                toast.error(`Localização inválida! O incidente está a ${distancia.toFixed(2)}km da sua localização atual. O limite é 1km.`);
                return;
            }
        }

        if (!municipioDetectado) {
            toast.error("Município não detectado. Selecione uma localização válida dentro de Angola.");
            return;
        }

        setLoading(true);

        try {
            const incidenteData = {
                title: formData.title,
                descricao: formData.descricao,
                categoria_id: parseInt(formData.categoria_id),
                municipio_id: municipioDetectado.id,
                latitude: formData.latitude?.toString(),
                longitude: formData.longitude?.toString(),
                status: "pendente"
            };

            const incidenteResponse = await api.post("/incidentes", incidenteData);
            
            if (incidenteResponse.data.success) {
                const incidenteId = incidenteResponse.data.data.id;
                
                if (files.length > 0) {
                    for (const fileUpload of files) {
                        const formDataFile = new FormData();
                        formDataFile.append('incidente_id', incidenteId.toString());
                        formDataFile.append('tipo_midia', fileUpload.tipo);
                        formDataFile.append('arquivo', fileUpload.file);
                        
                        await api.post("/midia-incidentes", formDataFile, {
                            headers: {
                                'Content-Type': 'multipart/form-data',
                            }
                        });
                    }
                }
                
                toast.success("Incidente reportado com sucesso!");
                navigate("/crises");
            }
        } catch (error: any) {
            console.error("Erro ao reportar incidente:", error);
            
            if (error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Erro ao reportar incidente");
            }
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
                    <Card className={!userLocation ? "border-red-500" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Navigation className="h-5 w-5 text-primary" />
                                Localização Obrigatória
                            </CardTitle>
                            <CardDescription>
                                Para reportar um incidente, você precisa permitir o acesso à sua localização.
                                O incidente deve estar a menos de 1km da sua localização atual.
                                O município será detectado automaticamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingLocation ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                                    <span>Obtendo sua localização...</span>
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
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>Localização capturada com sucesso!</span>
                                        </div>
                                        <p className="text-xs mt-1">
                                            Lat: {userLocation.lat.toFixed(6)} | Lng: {userLocation.lng.toFixed(6)}
                                        </p>
                                    </div>

                                    {municipioDetectado && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-sm">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-4 w-4" />
                                                <span>Município Detectado: <strong>{municipioDetectado.nome}</strong></span>
                                            </div>
                                            {municipioDetectado.provincia_nome && (
                                                <p className="text-xs mt-1">Província: {municipioDetectado.provincia_nome}</p>
                                            )}
                                            {municipioDetectado.distancia && (
                                                <p className="text-xs">Distância do centro: {municipioDetectado.distancia.toFixed(2)}km</p>
                                            )}
                                        </div>
                                    )}
                                    
                                    <div className="h-96 rounded-lg overflow-hidden border">
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
                                            <LocationMarker 
                                                setLocation={updateLocation} 
                                                userLocation={userLocation}
                                                onLocationConfirmed={() => {}}
                                            />
                                            {formData.latitude && formData.longitude && (
                                                <Marker position={[formData.latitude, formData.longitude]}>
                                                    <Popup>
                                                        Localização do incidente<br />
                                                        Lat: {formData.latitude.toFixed(6)}<br />
                                                        Lng: {formData.longitude.toFixed(6)}
                                                        {municipioDetectado && <br />}
                                                        {municipioDetectado && `Município: ${municipioDetectado.nome}`}
                                                    </Popup>
                                                </Marker>
                                            )}
                                            <Circle
                                                center={[userLocation.lat, userLocation.lng]}
                                                radius={1000}
                                                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.1 }}
                                            />
                                        </MapContainer>
                                    </div>
                                    
                                    <p className="text-xs text-muted-foreground text-center">
                                        O círculo vermelho mostra o raio de 1km permitido. Clique no mapa dentro do círculo para selecionar a localização do incidente. O município será detectado automaticamente.
                                    </p>
                                    
                                    {errors.location && (
                                        <p className="text-xs text-red-500 text-center">{errors.location}</p>
                                    )}
                                    {errors.municipio && (
                                        <p className="text-xs text-red-500 text-center">{errors.municipio}</p>
                                    )}
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
                                        Descreva detalhadamente o incidente que está ocorrendo
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">Título *</Label>
                                        <Input
                                            id="title"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            placeholder="Ex: Inundação no bairro X"
                                            className={errors.title ? "border-red-500" : ""}
                                        />
                                        {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="descricao">Descrição *</Label>
                                        <Textarea
                                            id="descricao"
                                            value={formData.descricao}
                                            onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                                            placeholder="Descreva detalhadamente o incidente..."
                                            rows={5}
                                            className={errors.descricao ? "border-red-500" : ""}
                                        />
                                        {errors.descricao && <p className="text-xs text-red-500 mt-1">{errors.descricao}</p>}
                                    </div>

                                    <div>
                                        <Label htmlFor="categoria">Categoria *</Label>
                                        <Select
                                            value={formData.categoria_id}
                                            onValueChange={(value) => setFormData({...formData, categoria_id: value})}
                                        >
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

                                    {/* Município detectado - apenas exibição, sem edição */}
                                    <div className="bg-gray-50 rounded-lg p-3 border">
                                        <Label className="text-muted-foreground">Município (Detectado Automaticamente)</Label>
                                        <p className="font-medium mt-1">
                                            {municipioDetectado ? municipioDetectado.nome : "Aguardando localização..."}
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
                                    <CardTitle>Mídia</CardTitle>
                                    <CardDescription>
                                        Adicione fotos, vídeos ou documentos relacionados ao incidente
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                                        <input
                                            type="file"
                                            id="file-upload"
                                            multiple
                                            accept="image/*,video/*,audio/*,application/pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Label
                                            htmlFor="file-upload"
                                            className="cursor-pointer flex flex-col items-center gap-2"
                                        >
                                            <Upload className="h-8 w-8 text-gray-400" />
                                            <span className="text-sm text-gray-600">
                                                Clique para selecionar arquivos
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                ou arraste e solte aqui
                                            </span>
                                        </Label>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {files.map((file, index) => (
                                                <div key={index} className="relative group">
                                                    {file.tipo === 'foto' && (
                                                        <img
                                                            src={file.preview}
                                                            alt="Preview"
                                                            className="w-full h-24 object-cover rounded-lg"
                                                        />
                                                    )}
                                                    {(file.tipo === 'video' || file.tipo === 'audio' || file.tipo === 'documento') && (
                                                        <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
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
                                                    <p className="text-xs text-muted-foreground truncate mt-1">
                                                        {file.file.name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-end gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => navigate("/crises")}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={loading || !userLocation || !municipioDetectado}>
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            "Reportar Incidente"
                                        )}
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