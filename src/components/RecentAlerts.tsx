import { Bell, AlertTriangle } from "lucide-react";

const alerts = [
  { id: 1, message: "Nível de água crítico em Luanda — evacuação em curso", severity: "critical" as const, time: "5 min" },
  { id: 2, message: "Novo foco de incêndio detectado em Huíla", severity: "high" as const, time: "15 min" },
  { id: 3, message: "3 novos voluntários disponíveis em Benguela", severity: "low" as const, time: "1h" },
  { id: 4, message: "Relatório de impacto do Cunene atualizado", severity: "low" as const, time: "2h" },
];

const alertStyles: Record<string, string> = {
  critical: "border-l-crisis-critical bg-crisis-critical/5",
  high: "border-l-crisis-high bg-crisis-high/5",
  low: "border-l-transparent",
};

export function RecentAlerts() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Alertas Recentes</h3>
        <Bell className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-2.5 rounded-lg border-l-2 ${alertStyles[alert.severity]} animate-slide-up`}
          >
            {alert.severity === "critical" && (
              <AlertTriangle className="h-3.5 w-3.5 text-crisis-critical flex-shrink-0 mt-0.5 animate-pulse-alert" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[12px] leading-relaxed">{alert.message}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{alert.time} atrás</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
