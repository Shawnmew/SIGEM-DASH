import { AppLayout } from "@/components/AppLayout";
import { AlertTriangle, Users, Activity, Shield, History } from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { CrisisBarChart } from "@/components/CrisisBarChart";
import { CrisisPieChart } from "@/components/CrisisPieChart";
import { AffectedLineChart } from "@/components/AffectedLineChart";
import { VideoGrid } from "@/components/VideoGrid";
import { RecentAlerts } from "@/components/RecentAlerts";
import { mockCrises } from "@/data/crisisData";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const activeCrises = mockCrises.filter((c) => c.status !== "resolved");
  const totalAffected = mockCrises.reduce((sum, c) => sum + c.affectedPeople, 0);
  const totalVolunteers = mockCrises.reduce((sum, c) => sum + c.volunteersAssigned, 0);
  const criticalCount = mockCrises.filter((c) => c.severity === "critical").length;

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-8 pl-12 lg:pl-0 flex items-end justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1">
            Visão Geral
          </p>
          <h1 className="text-2xl lg:text-3xl font-bold">Painel de Controlo</h1>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/crises")}>
          <History className="h-4 w-4" />
          Histórico
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard title="Crises Ativas" value={activeCrises.length} icon={AlertTriangle} variant="critical" trend={`${criticalCount} crítica(s)`} />
        <StatCard title="Pessoas Afetadas" value={totalAffected.toLocaleString()} icon={Users} variant="warning" />
        <StatCard title="Voluntários" value={totalVolunteers} icon={Shield} variant="success" />
        <StatCard title="Províncias Alerta" value={5} icon={Activity} trend="de 18 províncias" />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <CrisisBarChart />
        <CrisisPieChart />
        <AffectedLineChart />
      </div>

      {/* Bottom: Videos + Alerts */}
      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <VideoGrid />
        </div>
        <div className="lg:col-span-2">
          <RecentAlerts />
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
