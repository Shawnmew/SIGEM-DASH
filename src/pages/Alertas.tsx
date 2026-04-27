import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
    Bell, 
    AlertTriangle, 
    Info, 
    CheckCircle, 
    XCircle, 
    Clock,
    Eye,
    RefreshCw,
    Filter,
    Users,
    TrendingUp,
    Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
    Select, 
    SelectTrigger, 
    SelectContent, 
    SelectItem, 
    SelectValue 
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";

interface AlertaMonitoramento {
    id: number;
    alerta_id: number;
    incidente: {
        id: number;
        title: string;
        status: string;
        municipio: string;
        categoria: string;
    };
    voluntario: {
        id: number;
        nome: string;
        email: string;
        telefone: string;
        area_actuacao: string;
        municipio: string;
        entidade: string;
    };
    alerta: {
        tipo: string;
        prioridade: string;
        mensagem: string;
        data_envio: string;
        expira_em: string;
    };
    resposta: string;
    resposta_em: string | null;
    lido: boolean;
    created_at: string;
}

interface AlertaUsuario {
    id: number;
    alerta_id: number;
    lido: boolean;
    resposta: string;
    created_at: string;
    alerta: {
        id: number;
        incidente_id: number;
        tipo: string;
        prioridade: string;
        mensagem: string;
        data_envio: string;
        expira_em: string;
        incidente?: {
            id: number;
            title: string;
        };
    };
}

interface Stats {
    total: number;
    pendentes: number;
    aceitaram: number;
    recusaram: number;
    por_prioridade: {
        critica: number;
        alta: number;
        media: number;
        baixa: number;
    };
}

interface FilterOptions {
    entidades: Array<{ id: number; nome: string }>;
    municipios: Array<{ id: number; nome: string }>;
    incidentes: Array<{ id: number; title: string }>;
}

const prioridadeConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    critica: { 
        label: "Crítica", 
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <AlertTriangle className="h-3 w-3" />
    },
    alta: { 
        label: "Alta", 
        color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
        icon: <AlertTriangle className="h-3 w-3" />
    },
    media: { 
        label: "Média", 
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <Clock className="h-3 w-3" />
    },
    baixa: { 
        label: "Baixa", 
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle className="h-3 w-3" />
    },
};

const respostaConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    pendente: { 
        label: "Pendente", 
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <Clock className="h-3 w-3" />
    },
    aceito: { 
        label: "Aceito", 
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle className="h-3 w-3" />
    },
    recusado: { 
        label: "Recusado", 
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <XCircle className="h-3 w-3" />
    },
};

const tipoAlertaConfig: Record<string, { label: string; color: string }> = {
    critico: { label: "Crítico", color: "bg-red-500" },
    urgente: { label: "Urgente", color: "bg-orange-500" },
    aviso: { label: "Aviso", color: "bg-yellow-500" },
    informativo: { label: "Informativo", color: "bg-blue-500" },
};

const AlertasPage = () => {
    const { user, isAdmin, isEntidade } = useAuth();
    
    // Estado para alertas do usuário comum
    const [meusAlertas, setMeusAlertas] = useState<AlertaUsuario[]>([]);
    const [meusAlertasLoading, setMeusAlertasLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);
    
    // Estado para monitoramento (admin/entidade)
    const [monitoramentoAlertas, setMonitoramentoAlertas] = useState<AlertaMonitoramento[]>([]);
    const [monitoramentoStats, setMonitoramentoStats] = useState<Stats | null>(null);
    const [monitoramentoLoading, setMonitoramentoLoading] = useState(false);
    const [filterOptions, setFilterOptions] = useState<FilterOptions>({
        entidades: [],
        municipios: [],
        incidentes: [],
    });
    
    // Filtros para monitoramento
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [prioridadeFilter, setPrioridadeFilter] = useState<string>("all");
    const [incidenteFilter, setIncidenteFilter] = useState<string>("all");
    const [municipioFilter, setMunicipioFilter] = useState<string>("all");
    const [entidadeFilter, setEntidadeFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    
    const [selectedAlerta, setSelectedAlerta] = useState<AlertaMonitoramento | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [activeTab, setActiveTab] = useState<string>("meus");

    // Diagnóstico de mobilizações
    const [diagnostico, setDiagnostico] = useState<any>(null);
    const [mobilizando, setMobilizando] = useState<number | null>(null);

    // Carregar meus alertas
    const loadMeusAlertas = async () => {
        setMeusAlertasLoading(true);
        try {
            const response = await api.get('/user/alertas');
            let alertasData: AlertaUsuario[] = [];

            if (response.data.success) {
                // AlertaResource retorna Alerta com pivot, dentro de paginação
                // response.data.data pode ser { data: [...] } (paginado) ou [...] (array)
                let raw: any[] = [];
                const dataField = response.data.data;
                if (Array.isArray(dataField)) {
                    raw = dataField;
                } else if (dataField && Array.isArray(dataField.data)) {
                    raw = dataField.data;
                }

                // Mapear do formato AlertaResource para AlertaUsuario
                alertasData = raw.map((item: any) => ({
                    id: item.id,
                    alerta_id: item.id,
                    lido: item.pivot?.lido ?? false,
                    resposta: item.pivot?.resposta ?? 'pendente',
                    created_at: item.created_at,
                    alerta: {
                        id: item.id,
                        incidente_id: item.incidente_id,
                        tipo: item.tipo,
                        prioridade: item.prioridade ?? 'media',
                        mensagem: item.mensagem,
                        data_envio: item.data_envio ?? item.created_at,
                        expira_em: item.expira_em,
                        incidente: item.incidente ? {
                            id: item.incidente.id,
                            title: item.incidente.title,
                        } : undefined,
                    },
                }));
            }

            setMeusAlertas(alertasData);
            setUnreadCount(alertasData.filter((a: AlertaUsuario) => !a.lido).length);
        } catch (error) {
            console.error("Erro ao carregar meus alertas:", error);
        } finally {
            setMeusAlertasLoading(false);
        }
    };

    // Carregar monitoramento de alertas (admin/entidade)
    const loadMonitoramentoAlertas = async () => {
        setMonitoramentoLoading(true);
        try {
            const params: any = { page, per_page: 20 };
            if (statusFilter !== "all") params.status = statusFilter;
            if (prioridadeFilter !== "all") params.prioridade = prioridadeFilter;
            if (incidenteFilter !== "all") params.incidente_id = incidenteFilter;
            if (municipioFilter !== "all") params.municipio_id = municipioFilter;
            if (entidadeFilter !== "all" && isAdmin) params.entidade_id = entidadeFilter;
            
            const response = await api.get('/admin/monitoramento-alertas', { params });
            
            if (response.data.success) {
                setMonitoramentoAlertas(response.data.data.alertas || []);
                setMonitoramentoStats(response.data.data.stats);
                setFilterOptions(response.data.data.filters || filterOptions);
            }
        } catch (error) {
            console.error("Erro ao carregar monitoramento:", error);
            toast.error("Erro ao carregar dados de monitoramento");
        } finally {
            setMonitoramentoLoading(false);
        }
    };

    // Carregar diagnóstico quando não há dados de monitoramento
    const loadDiagnostico = async () => {
        try {
            const response = await api.get('/admin/monitoramento-alertas/diagnostico');
            if (response.data.success) {
                setDiagnostico(response.data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar diagnóstico:', error);
        }
    };

    // Mobilizar incidente manualmente
    const mobilizarIncidente = async (incidenteId: number) => {
        setMobilizando(incidenteId);
        try {
            const response = await api.post(`/admin/mobilizar-incidente/${incidenteId}`);
            if (response.data.success) {
                toast.success(response.data.message || 'Mobilização acionada com sucesso!');
                await loadMonitoramentoAlertas();
                await loadDiagnostico();
            } else {
                toast.warning(response.data.message || 'Não foi possível mobilizar.');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Erro ao mobilizar incidente');
        } finally {
            setMobilizando(null);
        }
    };

    // Marcar alerta como lido
    const marcarComoLido = async (alertaId: number) => {
        try {
            // Rota correcta: PATCH /user/alertas/{id}/lido
            await api.patch(`/user/alertas/${alertaId}/lido`);
            setMeusAlertas(meusAlertas.map(a => 
                a.alerta_id === alertaId ? { ...a, lido: true } : a
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
            toast.success("Alerta marcado como lido");
        } catch (error) {
            console.error("Erro ao marcar como lido:", error);
            toast.error("Erro ao marcar alerta como lido");
        }
    };

    // Marcar todos como lidos
    const marcarTodosComoLidos = async () => {
        try {
            // Rota correcta: PATCH /user/alertas/lidos
            await api.patch('/user/alertas/lidos');
            setMeusAlertas(meusAlertas.map(a => ({ ...a, lido: true })));
            setUnreadCount(0);
            toast.success("Todos os alertas marcados como lidos");
        } catch (error) {
            console.error("Erro ao marcar todos:", error);
            toast.error("Erro ao marcar alertas como lidos");
        }
    };

    useEffect(() => {
        loadMeusAlertas();
    }, []);

    useEffect(() => {
        if (activeTab === "monitoramento" && (isAdmin || isEntidade)) {
            loadMonitoramentoAlertas();
        }
    }, [activeTab, page, statusFilter, prioridadeFilter, incidenteFilter, municipioFilter, entidadeFilter]);

    // Carregar diagnóstico quando monitoramento estiver vazio
    useEffect(() => {
        if (
            activeTab === "monitoramento" &&
            isAdmin &&
            !monitoramentoLoading &&
            monitoramentoAlertas.length === 0
        ) {
            loadDiagnostico();
        }
    }, [activeTab, monitoramentoLoading, monitoramentoAlertas.length]);

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (minutes < 1) return "Agora";
        if (minutes < 60) return `${minutes} min atrás`;
        if (hours < 24) return `${hours} h atrás`;
        return `${days} d atrás`;
    };

    const getTimeRemaining = (expiraEm: string | null) => {
        if (!expiraEm) return "Nunca";
        const expDate = new Date(expiraEm);
        if (isNaN(expDate.getTime())) return "Nunca";
        
        const diff = expDate.getTime() - Date.now();
        const minutes = Math.floor(diff / 60000);
        if (minutes <= 0) return "Expirado";
        if (minutes < 60) return `${minutes} min`;
        return `${Math.floor(minutes / 60)}h ${minutes % 60}min`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString("pt-AO", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    const getPrioridadeBadge = (prioridade: string) => {
        const config = prioridadeConfig[prioridade] || prioridadeConfig.media;
        return (
            <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
                {config.icon}
                {config.label}
            </Badge>
        );
    };

    const getRespostaBadge = (resposta: string) => {
        const config = respostaConfig[resposta] || respostaConfig.pendente;
        return (
            <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
                {config.icon}
                {config.label}
            </Badge>
        );
    };

    const handleResetFilters = () => {
        setStatusFilter("all");
        setPrioridadeFilter("all");
        setIncidenteFilter("all");
        setMunicipioFilter("all");
        setEntidadeFilter("all");
        setPage(1);
    };

    const hasActiveFilters = statusFilter !== "all" || 
        prioridadeFilter !== "all" || 
        incidenteFilter !== "all" || 
        municipioFilter !== "all" || 
        entidadeFilter !== "all";

    // Mostrar monitoramento apenas para admin ou entidade
    const showMonitoramento = isAdmin || isEntidade;

    return (
        <AppLayout>
            <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="h-6 w-6" />
                            Alertas
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Central de notificações e monitoramento de respostas
                        </p>
                    </div>
                    {activeTab === "meus" && unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={marcarTodosComoLidos}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar todos como lidos ({unreadCount})
                        </Button>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                    <TabsList className={showMonitoramento ? "grid w-full grid-cols-2" : "w-full"}>
                        <TabsTrigger value="meus">Meus Alertas</TabsTrigger>
                        {showMonitoramento && (
                            <TabsTrigger value="monitoramento">
                                Monitoramento {monitoramentoStats && `(${monitoramentoStats.pendentes})`}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Tab: Meus Alertas */}
                    <TabsContent value="meus" className="space-y-3">
                        {meusAlertasLoading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : meusAlertas.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>Nenhum alerta encontrado</p>
                                    <p className="text-sm mt-1">Quando houver incidentes, você receberá alertas aqui.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            meusAlertas.map((alerta) => {
                                const tipo = alerta.alerta?.tipo || 'informativo';
                                const tipoConfig = tipoAlertaConfig[tipo] || tipoAlertaConfig.informativo;
                                
                                return (
                                    <Card key={alerta.id} className={`${!alerta.lido ? 'border-l-4 border-l-red-500' : ''}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex gap-3 flex-1">
                                                    {tipo === 'critico' ? (
                                                        <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                                                    ) : (
                                                        <Info className="h-5 w-5 text-blue-500" />
                                                    )}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                                            <Badge className={`${tipoConfig.color} text-white`}>
                                                                {tipoConfig.label}
                                                            </Badge>
                                                            {alerta.alerta?.prioridade && (
                                                                getPrioridadeBadge(alerta.alerta.prioridade)
                                                            )}
                                                            <span className="text-xs text-muted-foreground">
                                                                {getTimeAgo(alerta.alerta?.data_envio || alerta.created_at)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm whitespace-pre-wrap">{alerta.alerta?.mensagem || "Sem mensagem"}</p>
                                                        {alerta.alerta?.incidente && (
                                                            <p className="text-xs text-muted-foreground mt-2">
                                                                Incidente: {alerta.alerta.incidente.title}
                                                            </p>
                                                        )}
                                                        {alerta.alerta?.expira_em && !alerta.lido && (
                                                            <p className="text-xs text-orange-500 mt-1">
                                                                ⏰ Expira em: {getTimeRemaining(alerta.alerta.expira_em)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {!alerta.lido && (
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        onClick={() => marcarComoLido(alerta.alerta_id)}
                                                        title="Marcar como lido"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </TabsContent>

                    {/* Tab: Monitoramento (Admin/Entidade) */}
                    {showMonitoramento && (
                        <TabsContent value="monitoramento" className="space-y-4">
                            {/* Stats Cards */}
                            {monitoramentoStats && (
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Total</p>
                                                    <p className="text-2xl font-bold">{monitoramentoStats.total}</p>
                                                </div>
                                                <Bell className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Pendentes</p>
                                                    <p className="text-2xl font-bold text-yellow-600">{monitoramentoStats.pendentes}</p>
                                                </div>
                                                <Clock className="h-8 w-8 text-yellow-500" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Aceitaram</p>
                                                    <p className="text-2xl font-bold text-green-600">{monitoramentoStats.aceitaram}</p>
                                                </div>
                                                <CheckCircle className="h-8 w-8 text-green-500" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Recusaram</p>
                                                    <p className="text-2xl font-bold text-red-600">{monitoramentoStats.recusaram}</p>
                                                </div>
                                                <XCircle className="h-8 w-8 text-red-500" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-muted-foreground">Críticos</p>
                                                    <p className="text-2xl font-bold text-red-600">{monitoramentoStats.por_prioridade.critica}</p>
                                                </div>
                                                <AlertTriangle className="h-8 w-8 text-red-500" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Filtros */}
                            <div className="bg-card rounded-lg shadow p-4">
                                <div className="flex flex-wrap gap-3 items-end">
                                    <div className="w-36">
                                        <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="pendente">Pendente</SelectItem>
                                                <SelectItem value="aceito">Aceito</SelectItem>
                                                <SelectItem value="recusado">Recusado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-36">
                                        <label className="text-xs text-muted-foreground mb-1 block">Prioridade</label>
                                        <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Prioridade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas</SelectItem>
                                                <SelectItem value="critica">Crítica</SelectItem>
                                                <SelectItem value="alta">Alta</SelectItem>
                                                <SelectItem value="media">Média</SelectItem>
                                                <SelectItem value="baixa">Baixa</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-48">
                                        <label className="text-xs text-muted-foreground mb-1 block">Incidente</label>
                                        <Select value={incidenteFilter} onValueChange={setIncidenteFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Incidente" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {filterOptions.incidentes.map((i) => (
                                                    <SelectItem key={i.id} value={String(i.id)}>
                                                        {i.title.length > 30 ? i.title.substring(0, 30) + "..." : i.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="w-48">
                                        <label className="text-xs text-muted-foreground mb-1 block">Município</label>
                                        <Select value={municipioFilter} onValueChange={setMunicipioFilter}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Município" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                {filterOptions.municipios.map((m) => (
                                                    <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {isAdmin && (
                                        <div className="w-56">
                                            <label className="text-xs text-muted-foreground mb-1 block">Entidade</label>
                                            <Select value={entidadeFilter} onValueChange={setEntidadeFilter}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Entidade" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Todas</SelectItem>
                                                    {filterOptions.entidades.map((e) => (
                                                        <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        {hasActiveFilters && (
                                            <Button variant="outline" onClick={handleResetFilters} className="mt-5">
                                                Limpar
                                            </Button>
                                        )}
                                        <Button onClick={loadMonitoramentoAlertas} className="mt-5">
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Filtrar
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Tabela de Monitoramento */}
                            {monitoramentoLoading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : monitoramentoAlertas.length === 0 ? (
                                <Card>
                                    <CardContent className="py-8">
                                        <div className="text-center text-muted-foreground mb-4">
                                            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                            <p className="font-medium">Nenhuma mobilização encontrada</p>
                                        </div>

                                        {/* Diagnóstico */}
                                        {diagnostico && (
                                            <div className="mt-4 space-y-4">
                                                {/* Contagens */}
                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'Registos alertas_user', value: diagnostico.totais?.alertas_user ?? 0, color: 'text-blue-600' },
                                                        { label: 'Voluntários activos', value: diagnostico.totais?.voluntarios ?? 0, color: 'text-green-600' },
                                                        { label: 'Entidades activas', value: diagnostico.totais?.entidades ?? 0, color: 'text-purple-600' },
                                                        { label: 'Incidentes totais', value: diagnostico.totais?.incidentes ?? 0, color: 'text-orange-600' },
                                                    ].map(item => (
                                                        <div key={item.label} className="bg-muted rounded-lg p-3 text-center">
                                                            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Mensagem de diagnóstico */}
                                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                                        ⚠️ {diagnostico.diagnostico}
                                                    </p>
                                                </div>

                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="bg-card rounded-lg shadow overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-muted">
                                                <tr className="border-b border-border">
                                                    <th className="text-left p-3 text-sm font-medium">Voluntário</th>
                                                    <th className="text-left p-3 text-sm font-medium">Incidente</th>
                                                    <th className="text-left p-3 text-sm font-medium">Prioridade</th>
                                                    <th className="text-left p-3 text-sm font-medium">Resposta</th>
                                                    <th className="text-left p-3 text-sm font-medium">Expira em</th>
                                                    <th className="text-left p-3 text-sm font-medium">Ações</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {monitoramentoAlertas.map((item) => (
                                                    <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                                                        <td className="p-3">
                                                            <p className="font-medium">{item.voluntario?.nome}</p>
                                                            <p className="text-xs text-muted-foreground">{item.voluntario?.municipio}</p>
                                                        </td>
                                                        <td className="p-3">
                                                            <p className="text-sm">{item.incidente?.title}</p>
                                                            <p className="text-xs text-muted-foreground">{item.incidente?.municipio}</p>
                                                        </td>
                                                        <td className="p-3">{getPrioridadeBadge(item.alerta?.prioridade)}</td>
                                                        <td className="p-3">{getRespostaBadge(item.resposta)}</td>
                                                        <td className="p-3">
                                                            <span className={`text-xs ${
                                                                !item.alerta?.expira_em ? 'text-green-500' :
                                                                new Date(item.alerta?.expira_em) < new Date() ? 'text-red-500' : 'text-orange-500'
                                                            }`}>
                                                                {item.alerta?.expira_em ? getTimeRemaining(item.alerta?.expira_em) : "Nunca"}
                                                            </span>
                                                        </td>
                                                        <td className="p-3">
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedAlerta(item);
                                                                    setShowDetailsModal(true);
                                                                }}
                                                            >
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                Detalhes
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Paginação */}
                            {/* ... paginação aqui se necessário ... */}
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            {/* Modal de Detalhes */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Detalhes da Mobilização</DialogTitle>
                        <DialogDescription>
                            Informações completas da solicitação ao voluntário.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAlerta && (
                        <div className="space-y-4">
                            <div className="p-3 bg-muted rounded-lg">
                                <h4 className="font-semibold text-sm mb-2">Incidente</h4>
                                <p className="text-sm font-medium">{selectedAlerta.incidente?.title}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Status: {selectedAlerta.incidente?.status} | Município: {selectedAlerta.incidente?.municipio}
                                </p>
                            </div>
                            
                            <div className="p-3 bg-muted rounded-lg">
                                <h4 className="font-semibold text-sm mb-2">Voluntário</h4>
                                <p className="text-sm font-medium">{selectedAlerta.voluntario?.nome}</p>
                                <p className="text-xs text-muted-foreground">{selectedAlerta.voluntario?.email}</p>
                                {selectedAlerta.voluntario?.telefone && (
                                    <p className="text-xs text-muted-foreground">Tel: {selectedAlerta.voluntario.telefone}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">
                                    Área: {selectedAlerta.voluntario?.area_actuacao || "Não especificada"}
                                </p>
                                {selectedAlerta.voluntario?.entidade && (
                                    <p className="text-xs text-muted-foreground">Entidade: {selectedAlerta.voluntario.entidade}</p>
                                )}
                            </div>
                            
                            <div className="p-3 bg-muted rounded-lg">
                                <h4 className="font-semibold text-sm mb-2">Alerta</h4>
                                <p className="text-xs whitespace-pre-wrap">{selectedAlerta.alerta?.mensagem}</p>
                                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                                    <span>Enviado: {formatDate(selectedAlerta.alerta?.data_envio)}</span>
                                    <span>Expira: {formatDate(selectedAlerta.alerta?.expira_em)}</span>
                                </div>
                            </div>
                            
                            <div className="p-3 bg-muted rounded-lg">
                                <h4 className="font-semibold text-sm mb-2">Resposta</h4>
                                <div className="flex items-center gap-2">
                                    {getRespostaBadge(selectedAlerta.resposta)}
                                    <span className="text-xs text-muted-foreground">
                                        {selectedAlerta.resposta_em && `em ${formatDate(selectedAlerta.resposta_em)}`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Fechar</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default AlertasPage;