// src/pages/Index.tsx
import { useEffect, useState } from "react";
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
import { VideoGrid } from "@/components/VideoGrid";
import { RecentAlerts } from "@/components/RecentAlerts";
import { RegionOverview } from "@/components/RegionOverview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/authcontext";
import { dashboardService, DashboardStats, ChartData } from "@/services/dashboardService";
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
        response_rate: 0
    });
    
    const [chartData, setChartData] = useState<ChartData>({
        by_month: [],
        by_category: [],
        by_status: [],
        by_province: []
    });
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && user) {
            loadDashboardData();
        }
    }, [authLoading, user]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Carregar estatísticas e dados dos gráficos em paralelo
            const [statsData, chartData] = await Promise.all([
                dashboardService.getStats(),
                dashboardService.getChartData()
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
                response_rate: 0
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
            <div className="mb-8 pl-12 lg:pl-0 flex items-end justify-between">
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
                <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/crises")}>
                    <History className="h-4 w-4" />
                    Ver todas as crises
                </Button>
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
                            value="0" 
                            icon={Building2} 
                            variant="default"
                        />
                    </div>
                </div>
            )}

            {/* Entidade Only Section */}
            {isEntidade && (
                <div className="mb-8">
                    <h2 className="text-lg font-semibold mb-4">Visão da Entidade</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard 
                            title="Meus Incidentes" 
                            value="0" 
                            icon={AlertTriangle} 
                            variant="default"
                        />
                        <StatCard 
                            title="Meus Voluntários" 
                            value="0" 
                            icon={Users} 
                            variant="default"
                        />
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <CrisisBarChart chartData={chartData.by_month} />
                <CrisisPieChart chartData={chartData.by_category} />
                <AffectedLineChart chartData={chartData.by_month} />
            </div>

            {/* Bottom: Impacto por Região, Vídeos e Alertas */}
            <div className="grid lg:grid-cols-12 gap-6">
                <div className="lg:col-span-3">
                    <RegionOverview />
                </div>
                <div className="lg:col-span-6">
                    <VideoGrid />
                </div>
                <div className="lg:col-span-3">
                    <RecentAlerts />
                </div>
            </div>
        </AppLayout>
    );
};

export default Dashboard;