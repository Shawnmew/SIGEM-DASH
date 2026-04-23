// src/pages/TodasCrises.tsx
import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { incidenteService, Incidente } from '@/services/incidenteService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Search,
    Filter,
    X,
    Calendar,
    MapPin,
    AlertTriangle,
    CheckCircle,
    Clock,
    Eye,
    Download,
    Loader2,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Activity,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';

const statusConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
    pendente: {
        label: 'Pendente',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: <Clock className="h-3 w-3" />
    },
    em_analise: {
        label: 'Em Análise',
        color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400',
        icon: <Activity className="h-3 w-3" />
    },
    confirmado: {
        label: 'Confirmado',
        color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400',
        icon: <CheckCircle className="h-3 w-3" />
    },
    em_andamento: {
        label: 'Em Andamento',
        color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400',
        icon: <AlertTriangle className="h-3 w-3" />
    },
    resolvido: {
        label: 'Resolvido',
        color: 'bg-green-500 text-white border-green-600',
        icon: <CheckCircle className="h-3 w-3" />
    },
    encerrado: {
        label: 'Encerrado',
        color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400',
        icon: <Clock className="h-3 w-3" />
    },
    cancelado: {
        label: 'Cancelado',
        color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400',
        icon: <X className="h-3 w-3" />
    },
};

const TodasCrisesPage = () => {
    const navigate = useNavigate();
    const [incidentes, setIncidentes] = useState<Incidente[]>([]);
    const [filteredIncidentes, setFilteredIncidentes] = useState<Incidente[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIncidente, setSelectedIncidente] = useState<Incidente | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [stats, setStats] = useState<any>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
    const [municipioFilter, setMunicipioFilter] = useState<string>('all');
    const [ordenarPor, setOrdenarPor] = useState<string>('created_at');
    const [ordenarDirecao, setOrdenarDirecao] = useState<'asc' | 'desc'>('desc');

    const [categorias, setCategorias] = useState<{ id: number; nome: string }[]>([]);
    const [municipios, setMunicipios] = useState<{ id: number; nome: string; provincia?: string }[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [incidentesData, statsData, categoriasData, municipiosData] = await Promise.all([
                incidenteService.getAllIncidentes(),
                api.get('/incidentes/stats'),
                api.get('/categorias'),
                api.get('/municipios')
            ]);

            setIncidentes(incidentesData);
            setFilteredIncidentes(incidentesData);
            setStats(statsData.data.data);
            setCategorias(categoriasData.data.data || []);
            setMunicipios(municipiosData.data.data || []);

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar crises');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...incidentes];

        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(i =>
                i.title.toLowerCase().includes(searchLower) ||
                i.descricao?.toLowerCase().includes(searchLower) ||
                i.municipio?.nome?.toLowerCase().includes(searchLower)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(i => i.status === statusFilter);
        }

        if (categoriaFilter !== 'all') {
            filtered = filtered.filter(i => i.categoria_id === parseInt(categoriaFilter));
        }

        if (municipioFilter !== 'all') {
            filtered = filtered.filter(i => i.municipio_id === parseInt(municipioFilter));
        }

        filtered.sort((a, b) => {
            let aVal: any = a[ordenarPor as keyof Incidente];
            let bVal: any = b[ordenarPor as keyof Incidente];

            if (ordenarPor === 'created_at') {
                aVal = new Date(a.created_at).getTime();
                bVal = new Date(b.created_at).getTime();
            }

            if (ordenarDirecao === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });

        setFilteredIncidentes(filtered);
    }, [search, statusFilter, categoriaFilter, municipioFilter, ordenarPor, ordenarDirecao, incidentes]);

    const resetFilters = () => {
        setSearch('');
        setStatusFilter('all');
        setCategoriaFilter('all');
        setMunicipioFilter('all');
        setOrdenarPor('created_at');
        setOrdenarDirecao('desc');
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
        return new Date(date).toLocaleDateString('pt-AO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);
        if (hours < 1) return 'Agora mesmo';
        if (hours < 24) return `${hours} hora(s) atrás`;
        return `${days} dia(s) atrás`;
    };

    const exportToCSV = () => {
        const headers = ['ID', 'Título', 'Status', 'Categoria', 'Município', 'Província', 'Afetados', 'Data'];
        const rows = filteredIncidentes.map(i => [
            i.id,
            i.title,
            statusConfig[i.status]?.label || i.status,
            i.categoria?.nome || '-',
            i.municipio?.nome || '-',
            i.municipio?.provincia?.nome || '-',
            i.affected_people || 0,
            formatDate(i.created_at)
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `crises_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Relatório exportado com sucesso!');
    };

    const hasActiveFilters = search !== '' ||
        statusFilter !== 'all' ||
        categoriaFilter !== 'all' ||
        municipioFilter !== 'all';

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
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6 text-primary" />
                            Todas as Crises
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Visualização completa de todos os incidentes registados no sistema
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToCSV} className="gap-2">
                            <Download className="h-4 w-4" />
                            Exportar CSV
                        </Button>
                        <Button variant="outline" onClick={loadData} className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Atualizar
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total de Crises</p>
                                        <p className="text-2xl font-bold">{stats.total || incidentes.length}</p>
                                    </div>
                                    <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Crises Ativas</p>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {incidentes.filter(i => !['resolvido', 'encerrado', 'cancelado'].includes(i.status)).length}
                                        </p>
                                    </div>
                                    <Activity className="h-8 w-8 text-orange-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Resolvidas</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {incidentes.filter(i => i.status === 'resolvido').length}
                                        </p>
                                    </div>
                                    <CheckCircle className="h-8 w-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Pessoas Afetadas</p>
                                        <p className="text-2xl font-bold">
                                            {incidentes.reduce((sum, i) => sum + (i.affected_people || 0), 0).toLocaleString()}
                                        </p>
                                    </div>
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-card rounded-lg shadow p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold text-sm">Filtros</h3>
                            <span className="text-xs text-muted-foreground">
                                ({filteredIncidentes.length} de {incidentes.length} crises)
                            </span>
                        </div>
                        <div className="flex gap-2">
                            {hasActiveFilters && (
                                <Button variant="ghost" size="sm" onClick={resetFilters}>
                                    Limpar Filtros
                                </Button>
                            )}
                            <div className="flex gap-1 border rounded-lg p-0.5">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'text-muted-foreground'}`}
                                >
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por título, descrição ou local..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>

                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-36">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os status</SelectItem>
                                <SelectItem value="pendente">Pendente</SelectItem>
                                <SelectItem value="em_analise">Em Análise</SelectItem>
                                <SelectItem value="confirmado">Confirmado</SelectItem>
                                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                                <SelectItem value="resolvido">Resolvido</SelectItem>
                                <SelectItem value="encerrado">Encerrado</SelectItem>
                                <SelectItem value="cancelado">Cancelado</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas categorias</SelectItem>
                                {categorias.map(cat => (
                                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={municipioFilter} onValueChange={setMunicipioFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Município" />
                            </SelectTrigger>
                            <SelectContent className="max-h-64">
                                <SelectItem value="all">Todos municípios</SelectItem>
                                {municipios.map(m => (
                                    <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={ordenarPor} onValueChange={setOrdenarPor}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Ordenar por" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="created_at">Data</SelectItem>
                                <SelectItem value="title">Título</SelectItem>
                                <SelectItem value="status">Status</SelectItem>
                                <SelectItem value="affected_people">Afetados</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setOrdenarDirecao(ordenarDirecao === 'asc' ? 'desc' : 'asc')}
                            className="w-10"
                        >
                            {ordenarDirecao === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>

                {/* Incidentes List/Grid */}
                {filteredIncidentes.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Nenhuma crise encontrada com os filtros selecionados.</p>
                            <p className="text-sm mt-1">Tente ajustar os filtros ou limpar a busca.</p>
                            {hasActiveFilters && (
                                <Button variant="outline" onClick={resetFilters} className="mt-4">
                                    Limpar Filtros
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredIncidentes.map((incidente) => (
                            <Card
                                key={incidente.id}
                                className="hover:shadow-lg transition-shadow cursor-pointer"
                                onClick={() => {
                                    setSelectedIncidente(incidente);
                                    setShowDetailsModal(true);
                                }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        {getStatusBadge(incidente.status)}
                                        <span className="text-xs text-muted-foreground">
                                            {getTimeAgo(incidente.created_at)}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-lg mt-2 line-clamp-1">{incidente.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                        {incidente.descricao}
                                    </p>
                                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <MapPin className="h-3 w-3" />
                                            {incidente.municipio?.nome || 'N/A'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(incidente.created_at).split(' ')[0]}
                                        </span>
                                        {incidente.affected_people > 0 && (
                                            <span className="flex items-center gap-1">
                                                <Users className="h-3 w-3" />
                                                {incidente.affected_people}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedIncidente(incidente);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Ver Detalhes
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="bg-card rounded-lg shadow overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted">
                                    <tr className="border-b border-border">
                                        <th className="text-left p-3 text-sm font-medium">ID</th>
                                        <th className="text-left p-3 text-sm font-medium">Título</th>
                                        <th className="text-left p-3 text-sm font-medium">Status</th>
                                        <th className="text-left p-3 text-sm font-medium">Categoria</th>
                                        <th className="text-left p-3 text-sm font-medium">Município</th>
                                        <th className="text-left p-3 text-sm font-medium">Afetados</th>
                                        <th className="text-left p-3 text-sm font-medium">Data</th>
                                        <th className="text-left p-3 text-sm font-medium">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredIncidentes.map((incidente) => (
                                        <tr key={incidente.id} className="border-b border-border hover:bg-muted/50">
                                            <td className="p-3">{incidente.id}</td>
                                            <td className="p-3 font-medium max-w-xs truncate">{incidente.title}</td>
                                            <td className="p-3">{getStatusBadge(incidente.status)}</td>
                                            <td className="p-3">{incidente.categoria?.nome || '-'}</td>
                                            <td className="p-3">{incidente.municipio?.nome || '-'}</td>
                                            <td className="p-3">{incidente.affected_people || 0}</td>
                                            <td className="p-3 text-xs">{formatDate(incidente.created_at)}</td>
                                            <td className="p-3">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setSelectedIncidente(incidente);
                                                        setShowDetailsModal(true);
                                                    }}
                                                >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Ver
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Footer com total */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    Mostrando {filteredIncidentes.length} de {incidentes.length} crises
                </div>

                {/* Modal de Detalhes */}
                <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                    <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-primary" />
                                Detalhes da Crise
                            </DialogTitle>
                            <DialogDescription>
                                Informações completas do incidente
                            </DialogDescription>
                        </DialogHeader>

                        {selectedIncidente && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    {getStatusBadge(selectedIncidente.status)}
                                    <span className="text-xs text-muted-foreground">
                                        Reportado em {formatDate(selectedIncidente.created_at)}
                                    </span>
                                </div>

                                <div>
                                    <h3 className="text-xl font-bold">{selectedIncidente.title}</h3>
                                    {selectedIncidente.categoria && (
                                        <Badge variant="secondary" className="mt-1">
                                            {selectedIncidente.categoria.nome}
                                        </Badge>
                                    )}
                                </div>

                                <Separator />

                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Descrição</h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                        {selectedIncidente.descricao}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Localização</h4>
                                    <div className="bg-muted rounded-lg p-3 space-y-1">
                                        <p className="text-sm">
                                            <strong>Município:</strong> {selectedIncidente.municipio?.nome || 'N/A'}
                                        </p>
                                        <p className="text-sm">
                                            <strong>Província:</strong> {selectedIncidente.municipio?.provincia?.nome || 'N/A'}
                                        </p>
                                        {selectedIncidente.latitude && selectedIncidente.longitude && (
                                            <p className="text-xs font-mono">
                                                Coordenadas: {parseFloat(selectedIncidente.latitude).toFixed(6)}, {parseFloat(selectedIncidente.longitude).toFixed(6)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-muted rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold text-red-600">
                                            {selectedIncidente.affected_people || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Pessoas Afetadas</p>
                                    </div>
                                    <div className="bg-muted rounded-lg p-3 text-center">
                                        <p className="text-2xl font-bold">
                                            {selectedIncidente.midias?.length || 0}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Mídias Anexadas</p>
                                    </div>
                                </div>

                                {selectedIncidente.user && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Reportado por</h4>
                                        <div className="bg-muted rounded-lg p-3">
                                            <p className="text-sm">
                                                <strong>Nome:</strong> {selectedIncidente.user.nome} {selectedIncidente.user.sobrenome}
                                            </p>
                                            <p className="text-sm">
                                                <strong>Email:</strong> {selectedIncidente.user.email}
                                            </p>
                                            {selectedIncidente.user.telefone && (
                                                <p className="text-sm">
                                                    <strong>Telefone:</strong> {selectedIncidente.user.telefone}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {selectedIncidente.solucao_descricao && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2">Solução</h4>
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200">
                                            <p className="text-sm">{selectedIncidente.solucao_descricao}</p>
                                            {selectedIncidente.resolvido_em && (
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Resolvido em: {formatDate(selectedIncidente.resolvido_em)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Fechar</Button>
                            </DialogClose>
                            {selectedIncidente && (
                                <Button onClick={() => navigate(`/crises/${selectedIncidente.id}`)}>
                                    Ver Página Completa
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
};

export default TodasCrisesPage;