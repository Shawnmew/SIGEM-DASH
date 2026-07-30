import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService } from "@/services/dashboardService";
import { AppLayout } from "@/components/AppLayout";
import api, { SERVER_URL } from "@/lib/api";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Image,
  Video,
  FileText,
  Loader2,
  Phone,
  Mail,
  Navigation,
  X,
  Play,
  Download,
  ZoomIn,
  Shield,
  Headphones
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Midia {
    id: number;
    tipo_midia: string;
    url: string;
    transcricao_texto?: string;
}

interface Voluntario {
    id: number;
    user: {
        id: number;
        nome: string;
        sobrenome: string;
        telefone: string;
        email: string;
    };
    papel: string;
    data_ocorrencia: string;
}

interface Incidente {
    id: number;
    title: string;
    descricao: string;
    status: string;
    gravidade?: string;
    numero_afetados_intervalo?: string;
    latitude: string;
    longitude: string;
    created_at: string;
    user: {
        id: number;
        nome: string;
        sobrenome: string;
        email: string;
        telefone: string;
    };
    categoria: {
        id: number;
        nome: string;
        descricao: string;
    };
    municipio: {
        id: number;
        nome: string;
        provincia: {
            id: number;
            nome: string;
            sigla: string;
        };
    };
    midias: Midia[];
    voluntarios: Voluntario[];
    validation_score?: number;
    confirmacoes_count?: number;
    is_validated_by_entity?: boolean;
    entity_id_validator?: number;
    alertas?: {
        id: number;
        tipo: string;
        mensagem: string;
        usuarios: {
            id: number;
            nome: string;
            sobrenome: string;
            telefone: string;
            email: string;
            pivot: {
                lido: boolean;
                resposta: string;
                resposta_em?: string;
                justificativa_recusa?: string;
            };
            voluntario?: {
                id: number;
                municipio?: { nome: string };
            };
        }[];
    }[];
}

const getStatusConfig = (t: any): Record<string, { label: string; color: string; icon: JSX.Element }> => ({
    pendente: { 
        label: t('pending'), 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="h-4 w-4" />
    },
    em_analise: { 
        label: t('under_analysis'), 
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Clock className="h-4 w-4" />
    },
    confirmado: { 
        label: t('confirmed'), 
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-4 w-4" />
    },
    validado_entidade: { 
        label: t('entity_validated'), 
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Shield className="h-4 w-4" />
    },
    em_andamento: { 
        label: t('in_progress'), 
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: <AlertTriangle className="h-4 w-4" />
    },
    resolvido: { 
        label: t('resolved'), 
        color: "bg-green-500 text-white border-green-600",
        icon: <CheckCircle className="h-4 w-4" />
    },
    encerrado: { 
        label: t('closed'), 
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Clock className="h-4 w-4" />
    },
    cancelado: { 
        label: t('cancelled'), 
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <AlertTriangle className="h-4 w-4" />
    },
});

const getStatusDisplay = (incidente: Incidente, statusConfig: any) => {
    if (incidente.is_validated_by_entity) return statusConfig.validado_entidade;
    return statusConfig[incidente.status] || statusConfig.pendente;
};

const CriseDetalhesPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const statusConfig = getStatusConfig(t);
    const { user: currentUser, isEntidade, isAdmin } = useAuth();
    const [incidente, setIncidente] = useState<Incidente | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("detalhes");
    const [selectedMedia, setSelectedMedia] = useState<Midia | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updatingGravidade, setUpdatingGravidade] = useState(false);

    const handleGravidadeChange = async (newGravidade: string) => {
        if (!incidente) return;
        setUpdatingGravidade(true);
        try {
            await api.patch(`/incidentes/${incidente.id}/gravidade`, { gravidade: newGravidade });
            setIncidente({ ...incidente, gravidade: newGravidade });
            toast.success("Gravidade atualizada com sucesso");
        } catch (error) {
            toast.error("Erro ao atualizar gravidade");
        } finally {
            setUpdatingGravidade(false);
        }
    };

    useEffect(() => {
        loadIncidente();
    }, [id]);

    const loadIncidente = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/incidentes/${id}`);
            if (response.data.success) {
                setIncidente(response.data.data);
            } else {
                toast.error(t('loading'));
                navigate("/crises");
            }
        } catch (error) {
            console.error("Erro ao carregar incidente:", error);
            toast.error(t('loading'));
            navigate("/crises");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("pt-AO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);
        
        if (hours < 1) return t('now_exactly');
        if (hours < 24) return t('hours_ago', { count: hours });
        return t('days_ago', { count: days });
    };

    const openMediaModal = (midia: Midia) => {
        setSelectedMedia(midia);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMedia(null);
    };

    const handleReportUser = async (reason: string) => {
        if (!incidente || !incidente.user) return;
        
        try {
            const response = await dashboardService.reportUser({
                user_id: incidente.user.id,
                incidente_id: incidente.id,
                reason: reason
            });
            
            if (response.success) {
                toast.success("Denúncia enviada com sucesso!");
            } else {
                toast.error(response.message || "Erro ao enviar denúncia");
            }
        } catch (error) {
            console.error("Erro ao denunciar utilizador:", error);
            toast.error("Erro ao enviar denúncia");
        }
    };

    const getMediaUrl = (url: string) => {
        if (!url) return "";
        if (url.startsWith('http')) return url;
        const cleanUrl = url.startsWith('/') ? url : `/${url}`;
        return `${SERVER_URL}${cleanUrl}`;
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

    if (!incidente) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-screen">
                    <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">{t('incident_not_found')}</h2>
                    <p className="text-muted-foreground mb-4">{t('incident_not_found_desc')}</p>
                    <Button onClick={() => navigate("/crises")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('back_to_incidents')}
                    </Button>
                </div>
            </AppLayout>
        );
    }

    // Corrigido para passar o t() para a configuração de status
    const status = getStatusDisplay(incidente, statusConfig);

    return (
        <AppLayout>
            <div className="p-4 lg:p-6">
                <div className="mb-6">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate("/crises")}
                        className="mb-4 -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        {t('back')}
                    </Button>
                    
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className={status.color}>
                                    <span className="flex items-center gap-1">
                                        {status.icon}
                                        {status.label}
                                    </span>
                                </Badge>
                                {incidente.origem === 'ivr_telefone_analogico' && (
                                    <Badge variant="outline" className="border-purple-500 text-purple-700 bg-purple-50 dark:bg-purple-950/40 flex items-center gap-1 font-semibold">
                                        📞 Chamada de Voz (Telefone Analógico {incidente.telefone_remetente ? `• ${incidente.telefone_remetente}` : ''})
                                    </Badge>
                                )}
                                <span className="text-xs text-muted-foreground">
                                    {t('reported_ago', { time: getTimeAgo(incidente.created_at) })}
                                </span>
                            </div>
                            <h1 className="text-2xl lg:text-3xl font-bold">{incidente.title}</h1>
                            <p className="text-muted-foreground mt-1">
                                {incidente.categoria?.nome} • {incidente.municipio?.nome}, {incidente.municipio?.provincia?.nome}
                            </p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="detalhes">{t('details')}</TabsTrigger>
                        <TabsTrigger value="midias">{t('media')} ({incidente.midias?.length || 0})</TabsTrigger>
                        <TabsTrigger value="voluntarios">{t('volunteers')} ({incidente.voluntarios?.length || 0})</TabsTrigger>
                        <TabsTrigger value="mapa">{t('map')}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="detalhes" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('incident_description')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {incidente.descricao}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="space-y-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('info')}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t('report_date')}</p>
                                                <p className="text-sm font-medium">{formatDate(incidente.created_at)}</p>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t('reported_by')}</p>
                                                <p className="text-sm font-medium">{incidente.user?.nome} {incidente.user?.sobrenome}</p>
                                                {incidente.user?.email && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                        <Mail className="h-3 w-3" />
                                                        {incidente.user.email}
                                                    </p>
                                                )}
                                                {incidente.user?.telefone && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {incidente.user.telefone}
                                                    </p>
                                                )}
                                                
                                                {(isEntidade || isAdmin) && (
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm" 
                                                        className="mt-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-1 h-7 text-[10px]"
                                                        onClick={() => {
                                                            const reason = window.prompt(t('penalty_reason_placeholder'));
                                                            if (reason) handleReportUser(reason);
                                                        }}
                                                    >
                                                        <AlertTriangle className="h-3 w-3" />
                                                        {t('denounce_citizen')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t('location')}</p>
                                                <p className="text-sm font-medium">{incidente.municipio?.nome}</p>
                                                <p className="text-xs text-muted-foreground">{incidente.municipio?.provincia?.nome}</p>
                                                {incidente.latitude && incidente.longitude && (
                                                    <Button 
                                                        variant="link" 
                                                        size="sm" 
                                                        className="p-0 h-auto text-xs mt-1"
                                                        onClick={() => setActiveTab("mapa")}
                                                    >
                                                        <Navigation className="h-3 w-3 mr-1" />
                                                        {t('view_on_map')}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div className="w-full">
                                                <p className="text-xs text-muted-foreground">Gravidade</p>
                                                {(isEntidade || currentUser?.tipo === 'voluntario' || isAdmin) ? (
                                                    <Select 
                                                        value={incidente.gravidade || ''} 
                                                        onValueChange={handleGravidadeChange}
                                                        disabled={updatingGravidade}
                                                    >
                                                        <SelectTrigger className="mt-1 w-full max-w-xs h-8 text-xs">
                                                            <SelectValue placeholder="Definir gravidade" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="baixa">Baixa</SelectItem>
                                                            <SelectItem value="media">Média</SelectItem>
                                                            <SelectItem value="alta">Alta</SelectItem>
                                                            <SelectItem value="critica">Crítica</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <p className="text-sm font-medium capitalize">{incidente.gravidade || 'Não definida'}</p>
                                                )}
                                            </div>
                                        </div>
                                        {incidente.numero_afetados_intervalo && (
                                            <>
                                                <Separator />
                                                <div className="flex items-start gap-3">
                                                    <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Número de Afetados</p>
                                                        <p className="text-sm font-medium">{incidente.numero_afetados_intervalo}</p>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-sm flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-blue-500" />
                                            {t('hybrid_validation')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-xs text-muted-foreground">{t('confirmations')}</p>
                                                <p className="text-xl font-bold">{incidente.confirmacoes_count || 0}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Score</p>
                                                <p className="text-xl font-bold">{Math.round((incidente.validation_score || 0) * 100)}%</p>
                                            </div>
                                        </div>
                                        
                                        <div className="w-full bg-secondary rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-500 ${
                                                    (incidente.validation_score || 0) > 0.7 ? 'bg-green-500' : 
                                                    (incidente.validation_score || 0) > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                                }`} 
                                                style={{ width: `${(incidente.validation_score || 0) * 100}%` }}
                                            />
                                        </div>
                                        {incidente.is_validated_by_entity ? (
                                            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-[10px] text-green-700 font-medium leading-tight">
                                                    {t('entity_validated_desc')}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-[10px] text-muted-foreground italic">
                                                {t('waiting_validation')}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>{t('category')}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{incidente.categoria?.nome}</span>
                                        </div>
                                        {incidente.categoria?.descricao && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {incidente.categoria.descricao}
                                            </p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="midias">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('incident_media')}</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    {t('click_to_enlarge')}
                                </p>
                            </CardHeader>
                            <CardContent>
                                {incidente.midias && incidente.midias.length > 0 ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {incidente.midias.map((midia) => (
                                            <div 
                                                key={midia.id} 
                                                className="relative group cursor-pointer"
                                                onClick={() => openMediaModal(midia)}
                                            >
                                                {midia.tipo_midia === 'foto' && (
                                                    <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square">
                                                        <img
                                                            src={getMediaUrl(midia.url)}
                                                            alt="Mídia do incidente"
                                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "https://placehold.co/400x400?text=Erro+ao+carregar+imagem";
                                                            }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <ZoomIn className="h-8 w-8 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                {midia.tipo_midia === 'video' && (
                                                    <div className="relative overflow-hidden rounded-lg bg-black aspect-square flex flex-col items-center justify-center cursor-pointer group-hover:opacity-90 transition-opacity">
                                                        <video 
                                                            src={getMediaUrl(midia.url)} 
                                                            className="w-full h-full object-cover opacity-60"
                                                            preload="metadata"
                                                        />
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                            <div className="bg-black/40 backdrop-blur-sm p-3 rounded-full mb-2">
                                                                <Play className="h-8 w-8 text-white fill-white" />
                                                            </div>
                                                            <span className="text-[10px] text-white font-medium uppercase tracking-wider">{t('watch_video')}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {midia.tipo_midia === 'audio' && (
                                                    <div className="space-y-2">
                                                        <div className="relative overflow-hidden rounded-lg bg-orange-50 border border-orange-200 aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-orange-100 transition-colors">
                                                            <Headphones className="h-12 w-12 text-orange-500" />
                                                            <span className="text-xs text-orange-700 mt-2">{t('audio')}</span>
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                <Play className="h-8 w-8 text-white" />
                                                            </div>
                                                        </div>
                                                        {midia.transcricao_texto && (
                                                            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg">
                                                                <div className="flex items-center gap-1.5 mb-1">
                                                                    <Headphones className="h-3.5 w-3.5 text-purple-600" />
                                                                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                                                                        🎙️ Transcrição do Áudio
                                                                    </span>
                                                                </div>
                                                                <p className="text-xs text-foreground italic">"{midia.transcricao_texto}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {midia.tipo_midia === 'documento' && (
                                                    <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                                        <FileText className="h-12 w-12 text-gray-500" />
                                                        <span className="text-xs text-muted-foreground mt-2">{t('document')}</span>
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Download className="h-8 w-8 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {midia.tipo_midia === 'foto' ? t('photo') : midia.tipo_midia === 'video' ? t('video') : midia.tipo_midia === 'audio' ? t('audio') : t('document')}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">{t('no_media_attached')}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="voluntarios">
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('mobilized_volunteers')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {incidente.voluntarios && incidente.voluntarios.length > 0 ? (
                                        <div className="space-y-3">
                                            {incidente.voluntarios.map((voluntario) => (
                                                <div key={voluntario.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">
                                                                {voluntario.user?.nome} {voluntario.user?.sobrenome}
                                                            </p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                {voluntario.user?.telefone && (
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Phone className="h-3 w-3" />
                                                                        {voluntario.user.telefone}
                                                                    </p>
                                                                )}
                                                                {voluntario.user?.email && (
                                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Mail className="h-3 w-3" />
                                                                        {voluntario.user.email}
                                                                    </p>
                                                                )}
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {voluntario.municipio?.nome || t('municipality_not_specified')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge variant="outline" className="text-xs">
                                                            {voluntario.papel === 'lider' ? t('leader') : voluntario.papel === 'apoio' ? t('support') : voluntario.papel}
                                                        </Badge>
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            {new Date(voluntario.data_ocorrencia).toLocaleDateString("pt-AO")}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <User className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                            <p className="text-muted-foreground">{t('no_volunteers_on_site')}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('notified_volunteers')}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {incidente.alertas && incidente.alertas.length > 0 && incidente.alertas.some(a => a.usuarios && a.usuarios.length > 0) ? (
                                        <div className="space-y-3">
                                            {incidente.alertas.flatMap(alerta => 
                                                alerta.usuarios?.map((user) => (
                                                    <div key={`${alerta.id}-${user.id}`} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                                                                <User className="h-5 w-5 text-muted-foreground" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">
                                                                    {user.nome} {user.sobrenome}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {user.voluntario?.municipio?.nome || t('municipality_not_specified')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {user.pivot.resposta === 'aceito' && (
                                                                <Badge className="bg-green-100 text-green-800 border-green-200">{t('accepted')}</Badge>
                                                            )}
                                                            {user.pivot.resposta === 'recusado' && (
                                                                <Badge className="bg-red-100 text-red-800 border-red-200">{t('rejected')}</Badge>
                                                            )}
                                                            {user.pivot.resposta === 'pendente' && (
                                                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{t('pending')}</Badge>
                                                            )}
                                                            {!['aceito', 'recusado', 'pendente'].includes(user.pivot.resposta) && (
                                                                <Badge variant="outline">{user.pivot.resposta}</Badge>
                                                            )}
                                                            {user.pivot.lido && (
                                                                <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-end gap-1">
                                                                    <CheckCircle className="h-3 w-3" /> {t('visualized')}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6">
                                            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                                            <p className="text-muted-foreground">{t('no_alerts_sent')}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="mapa">
                        <Card>
                            <CardHeader>
                                <CardTitle>{t('incident_location')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {incidente.latitude && incidente.longitude ? (
                                    <div className="h-[400px] w-full rounded-lg overflow-hidden">
                                        <MapContainer
                                            center={[parseFloat(incidente.latitude), parseFloat(incidente.longitude)]}
                                            zoom={13}
                                            style={{ height: "100%", width: "100%" }}
                                            scrollWheelZoom={true}
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={[parseFloat(incidente.latitude), parseFloat(incidente.longitude)]}>
                                                <Popup>
                                                    <div className="text-center">
                                                        <p className="font-bold">{incidente.title}</p>
                                                        <p className="text-xs">{incidente.municipio?.nome}</p>
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        </MapContainer>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">{t('location_not_available')}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            {t('location')}: {incidente.municipio?.nome}, {incidente.municipio?.provincia?.nome}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={isModalOpen} onOpenChange={closeModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95">
                    <VisuallyHidden asChild>
                        <DialogTitle>{t('media_preview')}</DialogTitle>
                    </VisuallyHidden>
                    <VisuallyHidden asChild>
                        <DialogDescription>
                            {t('media_preview_description')}
                        </DialogDescription>
                    </VisuallyHidden>
                    <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors">
                        <X className="h-5 w-5" />
                    </DialogClose>
                    {selectedMedia && (
                        <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
                            {selectedMedia.tipo_midia === 'foto' && (
                                <img
                                    src={getMediaUrl(selectedMedia.url)}
                                    alt="Mídia do incidente"
                                    className="max-w-full max-h-[85vh] object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/800x600?text=Erro+ao+carregar+imagem";
                                    }}
                                />
                            )}
                            {selectedMedia.tipo_midia === 'video' && (
                                <video
                                    src={getMediaUrl(selectedMedia.url)}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[85vh]"
                                >
                                    Seu navegador não suporta vídeos.
                                </video>
                            )}
                            {selectedMedia.tipo_midia === 'audio' && (
                                <div className="text-center p-8 w-full max-w-md bg-white rounded-xl">
                                    <Headphones className="h-24 w-24 text-orange-500 mx-auto mb-6" />
                                    <h3 className="text-lg font-medium mb-6 text-gray-800">{t('audio_playback')}</h3>
                                    <audio
                                        src={getMediaUrl(selectedMedia.url)}
                                        controls
                                        autoPlay
                                        className="w-full"
                                    >
                                        Seu navegador não suporta a reprodução de áudio.
                                    </audio>
                                </div>
                            )}
                            {selectedMedia.tipo_midia === 'documento' && (
                                <div className="text-center p-8">
                                    <FileText className="h-20 w-20 text-white mx-auto mb-4" />
                                    <p className="text-white mb-4">{t('preview_not_available')}</p>
                                    <a
                                        href={getMediaUrl(selectedMedia.url)}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        {t('download_document')}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default CriseDetalhesPage;