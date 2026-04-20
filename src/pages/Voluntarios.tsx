import React, { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
    Users, 
    MapPin, 
    Phone, 
    Mail, 
    CheckCircle, 
    XCircle, 
    Clock,
    Search,
    Filter,
    Eye,
    UserCheck,
    UserX,
    Loader2,
    RefreshCw,
    Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

interface Voluntario {
    id: number;
    user_id: number;
    voluntario_entidade_id: number | null;
    status: string;
    numero_bi: string;
    data_nascimento: string | null;
    municipio_id: number;
    area_actuacao: string | null;
    entidade_cadastradora_id: number | null;
    promovido_em: string | null;
    created_at: string;
    user: {
        id: number;
        nome: string;
        sobrenome: string;
        email: string;
        telefone: string | null;
        nome_completo: string;
    };
    municipio: {
        id: number;
        nome: string;
        provincia?: {
            id: number;
            nome: string;
        };
    } | null;
    entidade_promotora?: {
        id: number;
        nome: string;
    } | null;
}

interface Meta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Entidade {
    id: number;
    nome: string;
}

const statusConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    activo: { 
        label: "Ativo", 
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        icon: <CheckCircle className="h-3 w-3" />
    },
    inactivo: { 
        label: "Inativo", 
        color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
        icon: <XCircle className="h-3 w-3" />
    },
    pendente: { 
        label: "Pendente", 
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        icon: <Clock className="h-3 w-3" />
    },
    suspenso: { 
        label: "Suspenso", 
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        icon: <UserX className="h-3 w-3" />
    },
};

const VoluntariosPage = () => {
    const { user, isAdmin, isEntidade } = useAuth();
    const navigate = useNavigate();
    
    const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
    const [meta, setMeta] = useState<Meta | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVoluntario, setSelectedVoluntario] = useState<Voluntario | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [updating, setUpdating] = useState(false);
    
    // Filters
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [municipioFilter, setMunicipioFilter] = useState<string>("all");
    const [entidadeFilter, setEntidadeFilter] = useState<string>("all");
    const [page, setPage] = useState(1);
    
    // Options for filters
    const [municipios, setMunicipios] = useState<{ id: number; nome: string }[]>([]);
    const [entidades, setEntidades] = useState<Entidade[]>([]);
    const [filterKey, setFilterKey] = useState(0); // Força refresh dos filtros

    const fetchMunicipios = async () => {
        try {
            const response = await api.get("/municipios");
            setMunicipios(response.data.data || []);
        } catch (error) {
            console.error("Erro ao carregar municípios:", error);
        }
    };

    const fetchEntidades = async () => {
        try {
            const response = await api.get("/admin/entities");
            // Acessando corretamente a estrutura de dados
            const entities = response.data.data?.entities?.data || response.data.data?.entities || [];
            setEntidades(entities.map((e: any) => ({ id: e.id, nome: e.nome })));
        } catch (error) {
            console.error("Erro ao carregar entidades:", error);
            // Fallback para quando não consegue carregar entidades
            setEntidades([]);
        }
    };

    const fetchVoluntarios = async () => {
        setLoading(true);
        try {
            const params: any = { 
                page, 
                per_page: 15 
            };
            
            if (search && search.trim()) {
                params.search = search.trim();
            }
            if (statusFilter !== "all") {
                params.status = statusFilter;
            }
            if (municipioFilter !== "all") {
                params.municipio_id = municipioFilter;
            }
            if (entidadeFilter !== "all" && isAdmin) {
                params.entidade_id = entidadeFilter;
            }
            
            console.log("Parâmetros da requisição:", params);
            
            const response = await api.get("/voluntarios", { params });
            
            console.log("Resposta da API:", response.data);
            
            if (response.data.success) {
                const data = response.data.data;
                // Verificar estrutura da resposta
                if (Array.isArray(data)) {
                    setVoluntarios(data);
                    setMeta(null);
                } else if (data.data) {
                    setVoluntarios(data.data);
                    setMeta({
                        current_page: data.current_page,
                        last_page: data.last_page,
                        per_page: data.per_page,
                        total: data.total,
                        from: data.from,
                        to: data.to,
                    });
                } else {
                    setVoluntarios([]);
                    setMeta(null);
                }
            } else {
                setVoluntarios([]);
                setMeta(null);
                toast.error(response.data.message || "Erro ao carregar voluntários");
            }
        } catch (error: any) {
            console.error("Erro ao carregar voluntários:", error);
            toast.error(error.response?.data?.message || "Erro ao carregar voluntários");
            setVoluntarios([]);
            setMeta(null);
        } finally {
            setLoading(false);
        }
    };

    // Executar busca quando filtros mudarem
    useEffect(() => {
        fetchVoluntarios();
    }, [page, statusFilter, municipioFilter, entidadeFilter, filterKey]);

    // Carregar opções de filtro
    useEffect(() => {
        fetchMunicipios();
        if (isAdmin) {
            fetchEntidades();
        }
    }, [isAdmin]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchVoluntarios();
    };

    const handleResetFilters = () => {
        setSearch("");
        setStatusFilter("all");
        setMunicipioFilter("all");
        setEntidadeFilter("all");
        setPage(1);
        setFilterKey(prev => prev + 1); // Força refresh
    };

    const handleUpdateStatus = async () => {
        if (!selectedVoluntario || !newStatus) return;
        
        setUpdating(true);
        try {
            await api.patch(`/voluntarios/${selectedVoluntario.id}/status`, { status: newStatus });
            toast.success(`Status alterado para ${statusConfig[newStatus]?.label || newStatus}`);
            setShowStatusModal(false);
            fetchVoluntarios();
        } catch (error: any) {
            console.error("Erro ao alterar status:", error);
            toast.error(error.response?.data?.message || "Erro ao alterar status");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const config = statusConfig[status] || statusConfig.pendente;
        return (
            <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
                {config.icon}
                {config.label}
            </Badge>
        );
    };

    const formatDate = (date: string) => {
        if (!date) return "-";
        return new Date(date).toLocaleDateString("pt-AO", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const hasActiveFilters = search !== "" || 
        statusFilter !== "all" || 
        municipioFilter !== "all" || 
        entidadeFilter !== "all";

    // Se não for admin nem entidade, redirecionar
    if (!isAdmin && !isEntidade) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-screen">
                    <UserX className="h-16 w-16 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
                    <p className="text-muted-foreground">Apenas administradores e entidades podem acessar esta página.</p>
                    <Button className="mt-4" onClick={() => navigate("/")}>Voltar ao Dashboard</Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-4 lg:p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Users className="h-6 w-6 text-primary" />
                            Voluntários
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Gestão de voluntários cadastrados no sistema
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasActiveFilters && (
                            <Button variant="outline" size="sm" onClick={handleResetFilters}>
                                Limpar Filtros
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={fetchVoluntarios} className="gap-2">
                            <RefreshCw className="h-3 w-3" />
                            Atualizar
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card rounded-lg shadow p-4 mb-6">
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="flex flex-wrap gap-3 items-end">
                            <div className="flex-1 min-w-[200px]">
                                <label className="text-xs text-muted-foreground mb-1 block">Busca</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Nome, email ou BI..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            
                            <div className="w-36">
                                <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        <SelectItem value="activo">Ativo</SelectItem>
                                        <SelectItem value="inactivo">Inativo</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="suspenso">Suspenso</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="w-48">
                                <label className="text-xs text-muted-foreground mb-1 block">Município</label>
                                <Select value={municipioFilter} onValueChange={setMunicipioFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Município" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-64">
                                        <SelectItem value="all">Todos</SelectItem>
                                        {municipios.map(m => (
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
                                        <SelectContent className="max-h-64">
                                            <SelectItem value="all">Todas</SelectItem>
                                            {entidades.map(e => (
                                                <SelectItem key={e.id} value={String(e.id)}>{e.nome}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <Button type="submit" className="mt-5">Buscar</Button>
                        </div>
                    </form>
                </div>

                {/* Stats */}
                {meta && (
                    <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
                        <span>Total de voluntários: {meta.total}</span>
                    </div>
                )}

                {/* Voluntários Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : voluntarios.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhum voluntário encontrado.</p>
                            <p className="text-sm mt-1">Tente ajustar os filtros.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {voluntarios.map((vol) => (
                            <Card key={vol.id} className="hover:shadow-lg transition-shadow">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                                                {vol.user?.nome?.charAt(0)}{vol.user?.sobrenome?.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm">{vol.user?.nome_completo}</h3>
                                                <p className="text-xs text-muted-foreground">{vol.area_actuacao || "Sem especialidade"}</p>
                                            </div>
                                        </div>
                                        {getStatusBadge(vol.status)}
                                    </div>
                                    
                                    <div className="space-y-2 text-xs text-muted-foreground mb-3">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-3 w-3" />
                                            <span>{vol.municipio?.nome || "Não informado"}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-3 w-3" />
                                            <span className="truncate">{vol.user?.email}</span>
                                        </div>
                                        {vol.user?.telefone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3 w-3" />
                                                <span>{vol.user.telefone}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3" />
                                            <span>Cadastro: {formatDate(vol.created_at)}</span>
                                        </div>
                                        {vol.numero_bi && (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">BI:</span>
                                                <span>{vol.numero_bi}</span>
                                            </div>
                                        )}
                                        {isAdmin && vol.entidade_promotora && (
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-3 w-3" />
                                                <span className="truncate">{vol.entidade_promotora.nome}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-2 mt-2">
                                        <Button 
                                            size="sm" 
                                            variant="outline" 
                                            className="flex-1"
                                            onClick={() => {
                                                setSelectedVoluntario(vol);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Detalhes
                                        </Button>
                                        {isAdmin && (
                                            <Button 
                                                size="sm" 
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => {
                                                    setSelectedVoluntario(vol);
                                                    setNewStatus(vol.status);
                                                    setShowStatusModal(true);
                                                }}
                                            >
                                                <UserCheck className="h-3 w-3 mr-1" />
                                                Status
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {meta && meta.last_page > 1 && (
                    <Pagination className="mt-6">
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                            {Array.from({ length: Math.min(meta.last_page, 7) }, (_, i) => {
                                let pageNum = i + 1;
                                if (pageNum <= meta.last_page && pageNum > 0) {
                                    return (
                                        <PaginationItem key={pageNum}>
                                            <PaginationLink 
                                                isActive={page === pageNum} 
                                                onClick={() => setPage(pageNum)}
                                            >
                                                {pageNum}
                                            </PaginationLink>
                                        </PaginationItem>
                                    );
                                }
                                return null;
                            })}
                            <PaginationItem>
                                <PaginationNext 
                                    onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                                    className={page === meta.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                )}

                {meta && (
                    <div className="mt-4 text-xs text-muted-foreground text-center">
                        Mostrando {meta.from} a {meta.to} de {meta.total} voluntários
                    </div>
                )}
            </div>

            {/* Modal de Detalhes */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Detalhes do Voluntário</DialogTitle>
                        <DialogDescription>
                            Informações completas do voluntário cadastrado no sistema.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedVoluntario && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 pb-3 border-b">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                                    {selectedVoluntario.user?.nome?.charAt(0)}{selectedVoluntario.user?.sobrenome?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold">{selectedVoluntario.user?.nome_completo}</h3>
                                    <p className="text-sm text-muted-foreground">{selectedVoluntario.area_actuacao || "Sem especialidade"}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-muted-foreground">Email:</div>
                                <div className="break-all">{selectedVoluntario.user?.email}</div>
                                
                                <div className="text-muted-foreground">Telefone:</div>
                                <div>{selectedVoluntario.user?.telefone || "-"}</div>
                                
                                <div className="text-muted-foreground">BI:</div>
                                <div>{selectedVoluntario.numero_bi}</div>
                                
                                <div className="text-muted-foreground">Data Nasc.:</div>
                                <div>{selectedVoluntario.data_nascimento ? formatDate(selectedVoluntario.data_nascimento) : "-"}</div>
                                
                                <div className="text-muted-foreground">Município:</div>
                                <div>{selectedVoluntario.municipio?.nome || "-"}</div>
                                
                                <div className="text-muted-foreground">Status:</div>
                                <div>{getStatusBadge(selectedVoluntario.status)}</div>
                                
                                <div className="text-muted-foreground">Cadastro:</div>
                                <div>{formatDate(selectedVoluntario.created_at)}</div>
                                
                                {selectedVoluntario.entidade_promotora && (
                                    <>
                                        <div className="text-muted-foreground">Entidade:</div>
                                        <div>{selectedVoluntario.entidade_promotora.nome}</div>
                                    </>
                                )}
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

            {/* Modal de Alterar Status */}
            <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Alterar Status do Voluntário</DialogTitle>
                        <DialogDescription>
                            Altere o status do voluntário no sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Alterar status de <strong>{selectedVoluntario?.user?.nome_completo}</strong>
                        </p>
                        <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="activo">Ativo</SelectItem>
                                <SelectItem value="inactivo">Inativo</SelectItem>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="suspenso">Suspenso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleUpdateStatus} disabled={updating}>
                            {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
};

export default VoluntariosPage;