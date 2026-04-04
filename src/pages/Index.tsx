// src/pages/Index.tsx
import { AppLayout } from "@/components/AppLayout";
import { AlertTriangle, Users, Activity, Shield, History, Building2, CheckCircle } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { CrisisBarChart } from "@/components/CrisisBarChart";
import { CrisisPieChart } from "@/components/CrisisPieChart";
import { AffectedLineChart } from "@/components/AffectedLineChart";
import { VideoGrid } from "@/components/VideoGrid";
import { RecentAlerts } from "@/components/RecentAlerts";
import { RegionOverview } from "@/components/RegionOverview";
import { mockCrises } from "@/data/crisisData";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/authcontext";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isEntidade, loading } = useAuth();
  
  const activeCrises = mockCrises.filter((c) => c.status !== "resolved");
  const totalAffected = mockCrises.reduce((sum, c) => sum + c.affectedPeople, 0);
  const totalVolunteers = mockCrises.reduce((sum, c) => sum + c.volunteersAssigned, 0);
  const criticalCount = mockCrises.filter((c) => c.severity === "critical").length;
  const resolvedCrises = mockCrises.filter((c) => c.status === "resolved").length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
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
          Histórico
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard 
          title="Crises Ativas" 
          value={activeCrises.length} 
          icon={AlertTriangle} 
          variant="critical" 
          trend={`${criticalCount} crítica(s)`} 
        />
        <StatCard 
          title="Pessoas Afetadas" 
          value={totalAffected.toLocaleString()} 
          icon={Users} 
          variant="warning" 
        />
        <StatCard 
          title="Voluntários" 
          value={totalVolunteers} 
          icon={Shield} 
          variant="success" 
        />
        <StatCard 
          title="Crises Resolvidas" 
          value={resolvedCrises} 
          icon={CheckCircle} 
          variant="default" 
        />
      </div>

      {isAdmin && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Visão Administrativa</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Total Usuários" value="1,234" icon={Users} variant="default" />
            <StatCard title="Entidades" value="45" icon={Building2} variant="default" />
            <StatCard title="Províncias" value="18" icon={Activity} variant="default" />
          </div>
        </div>
      )}

      {isEntidade && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Visão da Entidade</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard title="Meus Voluntários" value="24" icon={Users} variant="default" />
            <StatCard title="Relatórios" value="12" icon={Activity} variant="default" />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <CrisisBarChart />
        <CrisisPieChart />
        <AffectedLineChart />
      </div>

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