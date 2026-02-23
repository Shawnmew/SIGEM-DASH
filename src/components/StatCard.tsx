import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "critical" | "warning" | "success";
}

const iconBg: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  critical: "bg-crisis-critical/15 text-crisis-critical",
  warning: "bg-crisis-medium/15 text-crisis-medium",
  success: "bg-crisis-low/15 text-crisis-low",
};

export function StatCard({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 flex items-start justify-between gap-4 animate-slide-up">
      <div className="flex flex-col gap-1">
        <p className="text-2xl font-bold tracking-tight leading-none">{value}</p>
        <span className="text-xs text-muted-foreground font-medium mt-1">{title}</span>
        {trend && (
          <span className="text-[11px] text-crisis-low font-medium mt-1.5 flex items-center gap-1">
            <span>↗</span> {trend}
          </span>
        )}
      </div>
      <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg[variant]}`}>
        <Icon className="h-5 w-5" />
      </div>
    </div>
  );
}
