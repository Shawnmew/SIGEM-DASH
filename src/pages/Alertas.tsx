import { AppLayout } from "@/components/AppLayout";
import { Bell, AlertTriangle, Info, CheckCircle } from "lucide-react";

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
            {allAlerts.filter(a => !a.read).length} não lido(s)
          </span>
        </div>
      </div>

      <div className="space-y-3 max-w-3xl">
        {allAlerts.map((alert) => {
          const Icon = alertIcons[alert.severity];
          return (
            <div
              key={alert.id}
              className={`rounded-xl border border-border border-l-4 ${alertStyles[alert.severity]} bg-card p-4 animate-slide-up ${
                !alert.read ? "bg-card" : "opacity-70"
              }`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                  alert.severity === "critical" ? "text-crisis-critical animate-pulse-alert" :
                  alert.severity === "high" ? "text-crisis-high" :
                  alert.severity === "resolved" ? "text-crisis-low" : "text-info"
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-bold">{alert.title}</h3>
                    {!alert.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-1">{alert.description}</p>
                  <p className="text-[10px] text-muted-foreground">{alert.time}</p>
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
