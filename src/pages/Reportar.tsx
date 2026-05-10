import React, { useState, useEffect, useCallback, useRef, memo } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { MapPin, Upload, X, FileText, AlertTriangle, Loader2, Navigation, Crosshair, CheckCircle } from "lucide-react";
import { IncidentMap } from "@/components/IncidentMap";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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

// Componentes de formulário memoizados para evitar re-renderizações
const TitleInput = memo(({ value, onChange, error, t }: any) => (
    <div>
        <Label htmlFor="title">{t('title_label')} *</Label>
        <Input
            id="title"
            name="title"
            value={value}
            onChange={onChange}
            placeholder={t('title_placeholder')}
            className={error ? "border-red-500" : ""}
            autoComplete="off"
        />
        {error && <p className="text-xs text-red-500 mt-1">{t('title_required')}</p>}
    </div>
));

TitleInput.displayName = 'TitleInput';

const DescricaoTextarea = memo(({ value, onChange, error, t }: any) => (
    <div>
        <Label htmlFor="descricao">{t('description_label')} *</Label>
        <Textarea
            id="descricao"
            name="descricao"
            value={value}
            onChange={onChange}
            placeholder={t('description_placeholder')}
            rows={5}
            className={error ? "border-red-500" : ""}
        />
        {error && <p className="text-xs text-red-500 mt-1">{t('description_required')}</p>}
    </div>
));

DescricaoTextarea.displayName = 'DescricaoTextarea';

const ReportarPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [municipioDetectado, setMunicipioDetectado] = useState<MunicipioDetectado | null>(null);
    const [userLocation, setUserLocation] = useState<Position | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const [locationLoaded, setLocationLoaded] = useState(false);
    
    // Estado do formulário
    const [title, setTitle] = useState("");
    const [descricao, setDescricao] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [numeroAfetadosIntervalo, setNumeroAfetadosIntervalo] = useState("1-2");
    const [selectedLat, setSelectedLat] = useState<number | null>(null);
    const [selectedLng, setSelectedLng] = useState<number | null>(null);
    
    const [files, setFiles] = useState<FileUpload[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [municipios, setMunicipios] = useState<any[]>([]);

    const isMounted = useRef(true);
    const municipioDetectadoRef = useRef(municipioDetectado);
    const locationLoadedRef = useRef(false);
    const categoriasLoadedRef = useRef(false);

    useEffect(() => {
        municipioDetectadoRef.current = municipioDetectado;
    }, [municipioDetectado]);

    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Carregar dados UMA ÚNICA VEZ
    useEffect(() => {
        if (categoriasLoadedRef.current) return;
        categoriasLoadedRef.current = true;
        
        const loadData = async () => {
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
                toast.error(t('loading'));
            } finally {
                if (isMounted.current) {
                    setLoadingData(false);
                }
            }
        };
        
        loadData();
    }, [t]);

    // Função de detecção de município
    const detectarMunicipioPorLocalizacao = useCallback(async (lat: number, lng: number) => {
        try {
            const response = await api.get('/municipios/detect', {
                params: { latitude: lat, longitude: lng }
            });
            
            if (response.data.success && response.data.data && isMounted.current) {
                const municipio = response.data.data;
                setMunicipioDetectado(municipio);
                toast.success(`${t('municipality')} : ${municipio.nome}`);
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
    }, [municipios, t]);

    // Obter localização UMA ÚNICA VEZ
    const getCurrentLocation = useCallback(() => {
        if (locationLoadedRef.current) return;
        locationLoadedRef.current = true;
        
        if (!navigator.geolocation) {
            setLocationError(t('geo_not_supported'));
            setLocationLoaded(true);
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
                    setLocationLoaded(true);
                    toast.success(t('location_captured'));
                    
                    await detectarMunicipioPorLocalizacao(lat, lng);
                }
            },
            (error) => {
                console.error("Erro de localização:", error);
                setLocationError(t('allow_location')); // Fallback
                setLocationLoaded(true);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, [detectarMunicipioPorLocalizacao, t]);

    // Iniciar localização APENAS UMA VEZ
    useEffect(() => {
        getCurrentLocation();
    }, [getCurrentLocation]);

    // Quando o usuário seleciona uma nova localização no mapa
    const handleLocationSelect = useCallback(async (lat: number, lng: number) => {
        setSelectedLat(lat);
        setSelectedLng(lng);
        await detectarMunicipioPorLocalizacao(lat, lng);
    }, [detectarMunicipioPorLocalizacao]);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTitle(e.target.value);
        if (errors.title) setErrors(prev => ({ ...prev, title: undefined }));
    }, [errors.title]);

    const handleDescricaoChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescricao(e.target.value);
        if (errors.descricao) setErrors(prev => ({ ...prev, descricao: undefined }));
    }, [errors.descricao]);

    const handleCategoriaChange = useCallback((value: string) => {
        setCategoriaId(value);
        if (errors.categoria_id) setErrors(prev => ({ ...prev, categoria_id: undefined }));
    }, [errors.categoria_id]);

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []);
        const newFiles: FileUpload[] = selectedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            tipo: file.type.startsWith('image/') ? 'foto' : 
                  file.type.startsWith('video/') ? 'video' : 
                  file.type.startsWith('audio/') ? 'audio' : 'documento'
        }));
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const removeFile = useCallback((index: number) => {
        URL.revokeObjectURL(files[index].preview);
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, [files]);

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
            const R = 6371;
            const dLat = (selectedLat - userLocation.lat) * Math.PI / 180;
            const dLon = (selectedLng - userLocation.lng) * Math.PI / 180;
            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(selectedLat * Math.PI / 180) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            const distancia = R * c;
            
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
                status: "pendente",
                numero_afetados_intervalo: numeroAfetadosIntervalo
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
                        {t('report_incident')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('report_incident_subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Card de Localização */}
                    <Card className={!userLocation ? "border-red-500" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Navigation className="h-5 w-5 text-primary" />
                                {t('mandatory_location')}
                            </CardTitle>
                            <CardDescription>
                                {t('location_access_warning')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {!locationLoaded ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                                    <span>{t('getting_location')}</span>
                                </div>
                            ) : locationError ? (
                                <div className="text-center py-8">
                                    <div className="text-red-500 mb-4">{locationError}</div>
                                    <Button type="button" onClick={getCurrentLocation} variant="outline">
                                        <Crosshair className="h-4 w-4 mr-2" />
                                        {t('try_again')}
                                    </Button>
                                </div>
                            ) : userLocation ? (
                                <div className="space-y-4">
                                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-lg p-3 text-green-800 text-sm">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>{t('location_captured')}</span>
                                        </div>
                                        <p className="text-xs mt-1">
                                            Lat: {userLocation.lat.toFixed(6)} | Lng: {userLocation.lng.toFixed(6)}
                                        </p>
                                    </div>

                                    {municipioDetectado && (
                                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 rounded-lg p-3 text-blue-800 text-sm flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{t('municipality')}: <strong>{municipioDetectado.nome}</strong></span>
                                                </div>
                                                {municipioDetectado.provincia_nome && (
                                                    <p className="text-xs mt-1">{t('province')}: {municipioDetectado.provincia_nome}</p>
                                                )}
                                            </div>
                                            <Button 
                                                type="button" 
                                                variant="ghost" 
                                                size="sm" 
                                                onClick={() => {
                                                    locationLoadedRef.current = false;
                                                    getCurrentLocation();
                                                }}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <Crosshair className="h-4 w-4 mr-1" />
                                                {t('update')}
                                            </Button>
                                        </div>
                                    )}
                                    
                                    <div className="h-96 rounded-lg overflow-hidden border">
                                        <IncidentMap 
                                            userLat={userLocation.lat}
                                            userLng={userLocation.lng}
                                            initialLat={selectedLat}
                                            initialLng={selectedLng}
                                            onLocationSelect={handleLocationSelect}
                                        />
                                    </div>
                                    
                                    <p className="text-xs text-muted-foreground text-center">
                                        {t('map_click_instruction')}
                                    </p>
                                    
                                    {errors.location && <p className="text-xs text-red-500 text-center">{errors.location}</p>}
                                    {errors.municipio && <p className="text-xs text-red-500 text-center">{errors.municipio}</p>}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Button type="button" onClick={getCurrentLocation} variant="default">
                                        <Crosshair className="h-4 w-4 mr-2" />
                                        {t('allow_location')}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {userLocation && (
                        <>
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('incident_info')}</CardTitle>
                                    <CardDescription>
                                        {t('description_placeholder')}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <TitleInput 
                                        value={title} 
                                        onChange={handleTitleChange} 
                                        error={errors.title} 
                                        t={t}
                                    />

                                    <DescricaoTextarea 
                                        value={descricao} 
                                        onChange={handleDescricaoChange} 
                                        error={errors.descricao} 
                                        t={t}
                                    />

                                    <div>
                                        <Label htmlFor="categoria">{t('category')} *</Label>
                                        <Select value={categoriaId} onValueChange={handleCategoriaChange}>
                                            <SelectTrigger className={errors.categoria_id ? "border-red-500" : ""}>
                                                <SelectValue placeholder={t('select_category')} />
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

                                    <div>
                                        <Label htmlFor="afetados">Número de Afetados (Opcional)</Label>
                                        <Select value={numeroAfetadosIntervalo} onValueChange={setNumeroAfetadosIntervalo}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione o número de afetados" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="1-2">1 a 2 afetados</SelectItem>
                                                <SelectItem value="3-5">3 a 5 afetados</SelectItem>
                                                <SelectItem value="6-10">6 a 10 afetados</SelectItem>
                                                <SelectItem value="11-50">11 a 50 afetados</SelectItem>
                                                <SelectItem value="50+">Mais de 50 afetados</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground mt-1">Estimativa de pessoas afetadas pelo incidente.</p>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border">
                                        <Label className="text-muted-foreground">{t('detected_municipality')}</Label>
                                        <p className="font-medium mt-1 dark:text-white">
                                            {municipioDetectado?.nome || "Detectando..."}
                                        </p>
                                        {municipioDetectado?.provincia_nome && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {t('province')}: {municipioDetectado.provincia_nome}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('media_optional')}</CardTitle>
                                    <CardDescription>
                                        {t('media_description')}
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
                                            <span className="text-sm text-gray-600 dark:text-gray-400">{t('click_to_select_files')}</span>
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
                                        {t('cancel')}
                                    </Button>
                                    <Button type="submit" disabled={loading || !userLocation || !municipioDetectado}>
                                        {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                        {loading ? t('sending') : t('report_incident')}
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