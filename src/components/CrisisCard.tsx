import { Crisis, crisisTypeLabels, severityLabels, statusLabels } from "@/data/crisisData";
import { Clock, MapPin, Users } from "lucide-react";

const severityColors: Record<string, string> = {
  critical: "bg-crisis-critical/10 text-crisis-critical border-crisis-critical/20",
  high: "bg-crisis-high/10 text-crisis-high border-crisis-high/20",
  medium: "bg-crisis-medium/10 text-crisis-medium border-crisis-medium/20",
  low: "bg-crisis-low/10 text-crisis-low border-crisis-low/20",
};

const statusDot: Record<string, string> = {
  active: "bg-crisis-critical animate-pulse-alert",
  monitoring: "bg-crisis-medium",
  responding: "bg-crisis-high animate-pulse-alert",
  resolved: "bg-crisis-resolved",
};

export function CrisisCard({ crisis }: { crisis: Crisis }) {
  const timeAgo = getTimeAgo(crisis.reportedAt);

  return (
    <div className="group rounded-xl bg-card border border-border p-4 hover:border-primary/20 transition-all animate-slide-up">
      <div className="flex items-start justify-between gap-3 mb-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusDot[crisis.status]}`} />
            <span className="text-[11px] font-medium text-muted-foreground">
              {statusLabels[crisis.status]}
            </span>
            <span className="text-[11px] text-muted-foreground">·</span>
            <span className="text-[11px] text-muted-foreground">{crisisTypeLabels[crisis.type]}</span>
          </div>
          <h3 className="font-semibold text-sm leading-snug">{crisis.title}</h3>
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border flex-shrink-0 ${severityColors[crisis.severity]}`}>
          {severityLabels[crisis.severity]}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{crisis.description}</p>

      <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {crisis.province}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {crisis.affectedPeople.toLocaleString()}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3 w-3" />
          {timeAgo}
        </span>
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Agora";
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}
