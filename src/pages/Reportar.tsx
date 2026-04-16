import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/authcontext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MapPin, Upload, X, FileText, AlertTriangle, Loader2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents, Popup } from "react-leaflet";
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

interface Municipio {
    id: number;
    nome: string;
    provincia_id: number;
}

interface IncidenteForm {
    title: string;
    descricao: string;
    categoria_id: string;
    municipio_id: string;
    latitude: number | null;
    longitude: number | null;
}

interface FileUpload {
    file: File;
    preview: string;
    tipo: 'foto' | 'video' | 'audio' | 'documento';
}

function LocationMarker({ setLocation }: { setLocation: (lat: number, lng: number) => void }) {
    const [position, setPosition] = useState<L.LatLng | null>(null);

    useMapEvents({
        click(e) {
            setPosition(e.latlng);
            setLocation(e.latlng.lat, e.latlng.lng);
            toast.success("Localização selecionada no mapa!");
        },
    });

    return position === null ? null : (
        <Marker position={position}>
            <Popup>
                Localização selecionada<br />
                Lat: {position.lat.toFixed(6)}<br />
                Lng: {position.lng.toFixed(6)}
            </Popup>
        </Marker>
    );
}

const ReportarPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [municipios, setMunicipios] = useState<Municipio[]>([]);
    const [formData, setFormData] = useState<IncidenteForm>({
        title: "",
        descricao: "",
        categoria_id: "",
        municipio_id: "",
        latitude: null,
        longitude: null
    });
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [mapCenter, setMapCenter] = useState<[number, number]>([-12.3, 17.5]);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoadingData(true);
        try {
            const categoriasRes = await api.get('/categorias');
            const municipiosRes = await api.get('/municipios');
            
            const categoriasData = categoriasRes.data.data || categoriasRes.data || [];
            const municipiosData = municipiosRes.data.data || municipiosRes.data || [];
            
            setCategorias(categoriasData);
            setMunicipios(municipiosData);
            
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            toast.error("Erro ao carregar dados necessários");
        } finally {
            setLoadingData(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocalização não suportada pelo navegador");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                });
                setMapCenter([position.coords.latitude, position.coords.longitude]);
                toast.success("Localização capturada com sucesso!");
            },
            (error) => {
                console.error("Erro ao obter localização:", error);
                toast.error("Erro ao obter localização. Verifique as permissões.");
            }
        );
    };

    const updateLocation = (lat: number, lng: number) => {
        setFormData({
            ...formData,
            latitude: lat,
            longitude: lng
        });
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
        if (!formData.municipio_id) {
            newErrors.municipio_id = "Selecione o município";
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

        setLoading(true);

        try {
            const incidenteData = {
                title: formData.title,
                descricao: formData.descricao,
                categoria_id: parseInt(formData.categoria_id),
                municipio_id: parseInt(formData.municipio_id),
                latitude: formData.latitude ? formData.latitude.toString() : null,
                longitude: formData.longitude ? formData.longitude.toString() : null,
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                            {categorias.length === 0 ? (
                                                <SelectItem value="none" disabled>Nenhuma categoria encontrada</SelectItem>
                                            ) : (
                                                categorias.map((cat) => (
                                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                                        {cat.nome}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.categoria_id && <p className="text-xs text-red-500 mt-1">{errors.categoria_id}</p>}
                                </div>

                                <div>
                                    <Label htmlFor="municipio">Município *</Label>
                                    <Select
                                        value={formData.municipio_id}
                                        onValueChange={(value) => setFormData({...formData, municipio_id: value})}
                                    >
                                        <SelectTrigger className={errors.municipio_id ? "border-red-500" : ""}>
                                            <SelectValue placeholder="Selecione o município" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-64">
                                            {municipios.length === 0 ? (
                                                <SelectItem value="none" disabled>Nenhum município encontrado</SelectItem>
                                            ) : (
                                                municipios.map((m) => (
                                                    <SelectItem key={m.id} value={String(m.id)}>
                                                        {m.nome}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.municipio_id && <p className="text-xs text-red-500 mt-1">{errors.municipio_id}</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Localização</CardTitle>
                            <CardDescription>
                                Selecione a localização no mapa ou use sua localização atual
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="h-96 rounded-lg overflow-hidden border">
                                <MapContainer
                                    center={mapCenter}
                                    zoom={6}
                                    style={{ height: "100%", width: "100%" }}
                                    scrollWheelZoom={true}
                                >
                                    <TileLayer
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <LocationMarker setLocation={updateLocation} />
                                    {formData.latitude && formData.longitude && (
                                        <Marker position={[formData.latitude, formData.longitude]}>
                                            <Popup>
                                                Localização do incidente<br />
                                                Lat: {formData.latitude.toFixed(6)}<br />
                                                Lng: {formData.longitude.toFixed(6)}
                                            </Popup>
                                        </Marker>
                                    )}
                                </MapContainer>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="latitude">Latitude</Label>
                                    <Input
                                        id="latitude"
                                        value={formData.latitude || ""}
                                        onChange={(e) => setFormData({...formData, latitude: parseFloat(e.target.value) || null})}
                                        placeholder="-8.8383"
                                        type="number"
                                        step="any"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="longitude">Longitude</Label>
                                    <Input
                                        id="longitude"
                                        value={formData.longitude || ""}
                                        onChange={(e) => setFormData({...formData, longitude: parseFloat(e.target.value) || null})}
                                        placeholder="13.2344"
                                        type="number"
                                        step="any"
                                    />
                                </div>
                            </div>
                            
                            <Button
                                type="button"
                                variant="outline"
                                onClick={getCurrentLocation}
                                className="w-full"
                            >
                                <MapPin className="h-4 w-4 mr-2" />
                                Usar minha localização atual
                            </Button>
                            
                            <p className="text-xs text-muted-foreground text-center">
                                Clique no mapa para selecionar a localização do incidente
                            </p>
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
                                            {file.tipo === 'video' && (
                                                <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <FileText className="h-8 w-8 text-gray-500" />
                                                </div>
                                            )}
                                            {file.tipo === 'audio' && (
                                                <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <FileText className="h-8 w-8 text-gray-500" />
                                                </div>
                                            )}
                                            {file.tipo === 'documento' && (
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
                            <Button type="submit" disabled={loading}>
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
                </form>
            </div>
        </AppLayout>
    );
};

export default ReportarPage;