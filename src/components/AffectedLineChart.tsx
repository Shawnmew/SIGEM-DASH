import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface ChartData {
    month: string;
    affected: number;
}

interface AffectedLineChartProps {
    chartData?: ChartData[];
}

export function AffectedLineChart({ chartData = [] }: AffectedLineChartProps) {
  const data = chartData.length > 0 ? chartData : [
    { month: "Jan", affected: 0 }, { month: "Fev", affected: 0 }, { month: "Mar", affected: 0 },
    { month: "Abr", affected: 0 }, { month: "Mai", affected: 0 }, { month: "Jun", affected: 0 }
  ];

  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-sm text-foreground/80">Evolução de Pessoas Afetadas</h3>
        <TrendingUp className="h-4 w-4 text-emerald-500 opacity-60" />
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAffected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
            <XAxis 
                dataKey="month" 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                dy={10}
            />
            <YAxis 
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} 
                axisLine={false} 
                tickLine={false} 
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} 
            />
            <Tooltip
              contentStyle={{
                background: "rgba(255, 255, 255, 0.9)",
                backdropFilter: "blur(8px)",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                fontSize: 12,
                fontWeight: 500
              }}
              formatter={(value: number) => [value.toLocaleString(), "Afetados"]}
            />
            <Area 
                type="monotone" 
                dataKey="affected" 
                stroke="hsl(var(--accent))" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorAffected)" 
                dot={{ r: 4, fill: "hsl(var(--accent))", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
