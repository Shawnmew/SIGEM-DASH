import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

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
    <div className="rounded-2xl bg-card border border-border p-5 animate-slide-up">
      <h3 className="font-semibold text-sm mb-4">Evolução de Pessoas Afetadas</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: 12,
              }}
              formatter={(value: number) => [value.toLocaleString(), "Afetados"]}
            />
            <Line type="monotone" dataKey="affected" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--accent))" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
