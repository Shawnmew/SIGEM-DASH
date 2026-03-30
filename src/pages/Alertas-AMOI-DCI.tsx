import { AppLayout } from "@/components/AppLayout";
import { Bell, AlertTriangle, Info, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const allAlerts = [
  { id: 1, title: "Alerta Crítico — Inundação em Luanda", description: "Nível de água subindo rapidamente. Evacuação recomendada nas zonas baixas.", severity: "critical" as const, time: "5 min atrás", read: false },
  { id: 2, title: "Novo Incêndio Detectado — Huíla", description: "Foco de incêndio identificado por satélite na zona rural.", severity: "high" as const, time: "15 min atrás", read: false },
  { id: 3, title: "Voluntários Disponíveis — Benguela", description: "3 novos voluntários registados e prontos para mobilização.", severity: "info" as const, time: "1h atrás", read: true },
  { id: 4, title: "Relatório Atualizado — Cunene", description: "O relatório de impacto da seca foi atualizado com novos dados.", severity: "info" as const, time: "2h atrás", read: true },
  { id: 5, title: "Crise Resolvida — Cabinda", description: "A tempestade tropical em Cabinda foi classificada como resolvida.", severity: "resolved" as const, time: "6h atrás", read: true },
];

const alertIcons: Record<string, typeof AlertTriangle> = {
  critical: AlertTriangle,
  high: AlertTriangle,
  info: Info,
  resolved: CheckCircle,
};

const alertStyles: Record<string, string> = {
  critical: "border-l-crisis-critical",
  high: "border-l-crisis-high",
  info: "border-l-info",
  resolved: "border-l-crisis-low",
};

const AlertasPage = () => {
  const { data, isLoading } = useQuery(
    ["alertas"],
    async () => {
      const res = await api.get("/user/alertas");
      return res.data;
    }
  );

  const alertas: any[] = data?.data ?? [];
  const naoLidos: number = data?.meta?.nao_lidos ?? 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Alertas</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Centro de notificações e alertas do sistema
            </p>
          </div>
          <span className="bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full">
            {naoLidos} não lido(s)
          </span>
        </div>
      </div>

      <div className="space-y-3 max-w-3xl">
        {alertas.map((alert: any) => {
          // adapt server fields to frontend naming
          const severity = alert.tipo || alert.severity || "info";
          const Icon = alertIcons[severity];
          const read = alert.lido;
          const title = alert.titulo || alert.title;
          const description = alert.descricao || alert.description;
          const time = new Date(alert.created_at).toLocaleString();

          return (
            <div
              key={alert.id}
              className={`rounded-xl border border-border border-l-4 ${alertStyles[severity]} bg-card p-4 animate-slide-up ${
                !read ? "bg-card" : "opacity-70"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon
                  className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                    severity === "critical"
                      ? "text-crisis-critical animate-pulse-alert"
                      : severity === "high"
                      ? "text-crisis-high"
                      : severity === "resolved"
                      ? "text-crisis-low"
                      : "text-info"
                  }`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold">{title}</h3>
                    {!read && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{description}</p>
                  <p className="text-[10px] text-muted-foreground">{time}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default AlertasPage;
