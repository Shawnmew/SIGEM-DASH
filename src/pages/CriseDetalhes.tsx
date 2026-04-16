import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
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
  ZoomIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
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
}

const statusConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    pendente: { 
        label: "Pendente", 
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <Clock className="h-4 w-4" />
    },
    em_analise: { 
        label: "Em Análise", 
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Clock className="h-4 w-4" />
    },
    confirmado: { 
        label: "Confirmado", 
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-4 w-4" />
    },
    em_andamento: { 
        label: "Em Andamento", 
        color: "bg-orange-100 text-orange-800 border-orange-200",
        icon: <AlertTriangle className="h-4 w-4" />
    },
    resolvido: { 
        label: "Resolvido", 
        color: "bg-green-500 text-white border-green-600",
        icon: <CheckCircle className="h-4 w-4" />
    },
    encerrado: { 
        label: "Encerrado", 
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Clock className="h-4 w-4" />
    },
    cancelado: { 
        label: "Cancelado", 
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <AlertTriangle className="h-4 w-4" />
    },
};

const getStatusConfig = (status: string) => {
    return statusConfig[status] || statusConfig.pendente;
};

const CriseDetalhesPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [incidente, setIncidente] = useState<Incidente | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("detalhes");
    const [selectedMedia, setSelectedMedia] = useState<Midia | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                toast.error("Erro ao carregar detalhes da crise");
                navigate("/crises");
            }
        } catch (error) {
            console.error("Erro ao carregar incidente:", error);
            toast.error("Erro ao carregar detalhes da crise");
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
        
        if (hours < 1) return "Agora mesmo";
        if (hours < 24) return `${hours} hora(s) atrás`;
        return `${days} dia(s) atrás`;
    };

    const openMediaModal = (midia: Midia) => {
        setSelectedMedia(midia);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedMedia(null);
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
                    <h2 className="text-2xl font-bold mb-2">Crise não encontrada</h2>
                    <p className="text-muted-foreground mb-4">A crise que você procura não existe ou foi removida.</p>
                    <Button onClick={() => navigate("/crises")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Crises
                    </Button>
                </div>
            </AppLayout>
        );
    }

    const status = getStatusConfig(incidente.status);

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
                        Voltar
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
                                <span className="text-xs text-muted-foreground">
                                    Reportado há {getTimeAgo(incidente.created_at)}
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
                        <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                        <TabsTrigger value="midias">Mídias ({incidente.midias?.length || 0})</TabsTrigger>
                        <TabsTrigger value="voluntarios">Voluntários ({incidente.voluntarios?.length || 0})</TabsTrigger>
                        <TabsTrigger value="mapa">Mapa</TabsTrigger>
                    </TabsList>

                    <TabsContent value="detalhes" className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Descrição do Incidente</CardTitle>
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
                                        <CardTitle>Informações</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Data do Reporte</p>
                                                <p className="text-sm font-medium">{formatDate(incidente.created_at)}</p>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Reportado por</p>
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
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                            <div>
                                                <p className="text-xs text-muted-foreground">Localização</p>
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
                                                        Ver no mapa
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Categoria</CardTitle>
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
                                <CardTitle>Mídias do Incidente</CardTitle>
                                <p className="text-sm text-muted-foreground">
                                    Clique nas imagens para ampliar
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
                                                            src={midia.url}
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
                                                    <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                                        <Video className="h-12 w-12 text-gray-500" />
                                                        <span className="text-xs text-muted-foreground mt-2">Vídeo</span>
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Play className="h-8 w-8 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                {midia.tipo_midia === 'documento' && (
                                                    <div className="relative overflow-hidden rounded-lg bg-gray-100 aspect-square flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
                                                        <FileText className="h-12 w-12 text-gray-500" />
                                                        <span className="text-xs text-muted-foreground mt-2">Documento</span>
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                            <Download className="h-8 w-8 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="absolute top-2 right-2">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {midia.tipo_midia === 'foto' ? 'Foto' : midia.tipo_midia === 'video' ? 'Vídeo' : 'Documento'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <Image className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">Nenhuma mídia anexada a este incidente</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="voluntarios">
                        <Card>
                            <CardHeader>
                                <CardTitle>Voluntários Mobilizados</CardTitle>
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
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="text-xs">
                                                        {voluntario.papel === 'lider' ? 'Líder' : voluntario.papel === 'apoio' ? 'Apoio' : voluntario.papel}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(voluntario.data_ocorrencia).toLocaleDateString("pt-AO")}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <User className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                        <p className="text-muted-foreground">Nenhum voluntário mobilizado para este incidente</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="mapa">
                        <Card>
                            <CardHeader>
                                <CardTitle>Localização do Incidente</CardTitle>
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
                                        <p className="text-muted-foreground">Coordenadas de localização não disponíveis</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Localização: {incidente.municipio?.nome}, {incidente.municipio?.provincia?.nome}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Modal para visualização de mídia - CORRIGIDO COM DialogTitle */}
            <Dialog open={isModalOpen} onOpenChange={closeModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95">
                    <VisuallyHidden asChild>
                        <DialogTitle>Visualização de Mídia</DialogTitle>
                    </VisuallyHidden>
                    <DialogClose className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors">
                        <X className="h-5 w-5" />
                    </DialogClose>
                    {selectedMedia && (
                        <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
                            {selectedMedia.tipo_midia === 'foto' && (
                                <img
                                    src={selectedMedia.url}
                                    alt="Mídia do incidente"
                                    className="max-w-full max-h-[85vh] object-contain"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://placehold.co/800x600?text=Erro+ao+carregar+imagem";
                                    }}
                                />
                            )}
                            {selectedMedia.tipo_midia === 'video' && (
                                <video
                                    src={selectedMedia.url}
                                    controls
                                    autoPlay
                                    className="max-w-full max-h-[85vh]"
                                >
                                    Seu navegador não suporta vídeos.
                                </video>
                            )}
                            {selectedMedia.tipo_midia === 'documento' && (
                                <div className="text-center p-8">
                                    <FileText className="h-20 w-20 text-white mx-auto mb-4" />
                                    <p className="text-white mb-4">Visualização não disponível para este tipo de arquivo</p>
                                    <a
                                        href={selectedMedia.url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        Baixar Documento
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