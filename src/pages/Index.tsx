// src/pages/Index.tsx
import { useEffect, useState } from "react";
import { VideoGrid } from "@/components/VideoGrid";
import { AppLayout } from "@/components/AppLayout";
import { 
    AlertTriangle, 
    Users, 
    Activity, 
    Shield, 
    History, 
    Building2, 
    CheckCircle,
    TrendingUp,
    TrendingDown,
    Clock
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { CrisisBarChart } from "@/components/CrisisBarChart";
import { CrisisPieChart } from "@/components/CrisisPieChart";
import { AffectedLineChart } from "@/components/AffectedLineChart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardService, DashboardStats, ChartData } from "@/services/dashboardService";
import api from "@/lib/api";
import { toast } from "sonner";

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, isAdmin, isEntidade, loading: authLoading } = useAuth();
    
    const [stats, setStats] = useState<DashboardStats>({
        total_incidentes: 0,
        active_crises: 0,
        resolved_crises: 0,
        critical_count: 0,
        total_affected: 0,
        total_volunteers: 0,
        total_entidades: 0,
        response_rate: 0,
        my_incident_count: 0,
        my_volunteer_count: 0,
        confirmed_validation: 0,
        pending_validation: 0,
        entity_validated: 0
    });
    
    const [chartData, setChartData] = useState<ChartData>({
        by_month: [],
        by_category: [],
        by_status: [],
        by_province: []
    });
    
    const [loading, setLoading] = useState(true);
    
    // Filtros de localização
    const [provincias, setProvincias] = useState<any[]>([]);
    const [municipios, setMunicipios] = useState<any[]>([]);
    const [selectedProvincia, setSelectedProvincia] = useState<string>("all");
    const [selectedMunicipio, setSelectedMunicipio] = useState<string>("all");

    // Carregar províncias
    useEffect(() => {
        const loadProvincias = async () => {
            try {
                const response = await api.get('/provincias');
                setProvincias(response.data.data || []);
            } catch (error) {
                console.error("Erro ao carregar províncias:", error);
            }
        };
        loadProvincias();
    }, []);

    // Carregar municípios quando a província muda
    useEffect(() => {
        const loadMunicipios = async () => {
            if (selectedProvincia === "all") {
                setMunicipios([]);
                setSelectedMunicipio("all");
                return;
            }
            
            try {
                const response = await api.get(`/municipios?provincia_id=${selectedProvincia}`);
                setMunicipios(response.data.data || []);
            } catch (error) {
                console.error("Erro ao carregar municípios:", error);
            }
        };
        loadMunicipios();
    }, [selectedProvincia]);

    useEffect(() => {
        if (!authLoading && user) {
            loadDashboardData();
        }
    }, [authLoading, user, selectedProvincia, selectedMunicipio]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Carregar estatísticas e dados dos gráficos em paralelo
            const [statsData, chartData] = await Promise.all([
                dashboardService.getStats(selectedProvincia, selectedMunicipio),
                dashboardService.getChartData(selectedProvincia, selectedMunicipio)
            ]);
            
            setStats(statsData);
            setChartData(chartData);
            
            console.log("Dashboard data loaded:", { statsData, chartData });
        } catch (error) {
            console.error("Erro ao carregar dados do dashboard:", error);
            toast.error("Erro ao carregar dados do dashboard");
            
            // Dados mock para fallback (apenas para não quebrar a UI)
            setStats({
                total_incidentes: 0,
                active_crises: 0,
                resolved_crises: 0,
                critical_count: 0,
                total_affected: 0,
                total_volunteers: 0,
                total_entidades: 0,
                response_rate: 0,
                my_incident_count: 0,
                my_volunteer_count: 0,
                confirmed_validation: 0,
                pending_validation: 0,
                entity_validated: 0
            });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
                        Visão Geral
                    </p>
                    <h1 className="text-2xl lg:text-3xl font-bold">
                        Painel de Controlo
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Bem-vindo, {user.nome} {isAdmin && "(Administrador)"}
                        {isEntidade && "(Entidade Promotora)"}
                    </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Select value={selectedProvincia} onValueChange={setSelectedProvincia}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Todas Províncias" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todas Províncias</SelectItem>
                            {provincias.map((prov) => (
                                <SelectItem key={prov.id} value={String(prov.id)}>
                                    {prov.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    
                    <Select value={selectedMunicipio} onValueChange={setSelectedMunicipio} disabled={selectedProvincia === "all"}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <SelectValue placeholder="Todos Municípios" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Municípios</SelectItem>
                            {municipios.map((mun) => (
                                <SelectItem key={mun.id} value={String(mun.id)}>
                                    {mun.nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="default" className="gap-2" onClick={() => navigate("/crises")}>
                        <History className="h-4 w-4" />
                        Crises
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard 
                    title="Crises Ativas" 
                    value={stats.active_crises} 
                    icon={AlertTriangle} 
                    variant="critical" 
                    trend={`${stats.critical_count} crítica(s)`}
                />
                <StatCard 
                    title="Pessoas Afetadas" 
                    value={stats.total_affected.toLocaleString()} 
                    icon={Users} 
                    variant="warning"
                />
                <StatCard 
                    title="Voluntários" 
                    value={stats.total_volunteers.toLocaleString()} 
                    icon={Shield} 
                    variant="success"
                />
                <StatCard 
                    title="Crises Resolvidas" 
                    value={stats.resolved_crises} 
                    icon={CheckCircle} 
                    variant="default"
                />
            </div>

            {/* Admin Only Section */}
            {isAdmin && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Visão Administrativa</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard 
                            title="Total Incidentes" 
                            value={stats.total_incidentes} 
                            icon={Activity} 
                            variant="default"
                        />
                        <StatCard 
                            title="Taxa de Resposta" 
                            value={`${stats.response_rate}%`} 
                            icon={TrendingUp} 
                            variant="default"
                        />
                        <StatCard 
                            title="Entidades" 
                            value={stats.total_entidades} 
                            icon={Building2} 
                            variant="default"
                        />
                    </div>
                </div>
            )}

            {/* Validation Overview Section */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4 text-foreground/90 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Estado de Validação
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard 
                        title="Validados/Confirmados" 
                        value={stats.confirmed_validation || 0} 
                        icon={CheckCircle} 
                        variant="success"
                        trend={`${stats.entity_validated || 0} por entidades`}
                    />
                    <StatCard 
                        title="Pendentes de Validação" 
                        value={stats.pending_validation || 0} 
                        icon={Clock} 
                        variant="warning"
                        trend="Aguardando confirmações"
                    />
                    <StatCard 
                        title="Total de Reportes" 
                        value={stats.total_incidentes} 
                        icon={Activity} 
                        variant="default"
                    />
                </div>
            </div>

            {/* Entidade Only Section */}
            {isEntidade && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Visão da Entidade</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard 
                            title="Meus Incidentes" 
                            value={stats.my_incident_count || 0} 
                            icon={AlertTriangle} 
                            variant="default"
                        />
                        <StatCard 
                            title="Meus Voluntários" 
                            value={stats.my_volunteer_count || 0} 
                            icon={Users} 
                            variant="default"
                        />
                    </div>
                </div>
            )}

            {/* Vídeos Section */}
            <div className="mb-8">
                <VideoGrid />
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <CrisisBarChart chartData={chartData.by_month} />
                <CrisisPieChart chartData={chartData.by_category} />
                <AffectedLineChart chartData={chartData.by_month} />
            </div>

        </AppLayout>
    );
};

export default Dashboard;