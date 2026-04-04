// src/components/CrisisBarChart.tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface ChartData {
    month: string;
    total: number;
}

interface CrisisBarChartProps {
    chartData?: ChartData[];
}

export function CrisisBarChart({ chartData = [] }: CrisisBarChartProps) {
    const data = chartData.length > 0 ? chartData : [
        { month: "Jan", total: 0 }, { month: "Fev", total: 0 }, { month: "Mar", total: 0 },
        { month: "Abr", total: 0 }, { month: "Mai", total: 0 }, { month: "Jun", total: 0 }
    ];

    return (
        <div className="rounded-2xl bg-card border border-border p-5 animate-slide-up">
            <h3 className="font-semibold text-sm mb-4">Crises por Mês</h3>
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={28}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "0.75rem",
                                fontSize: 12,
                            }}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Incidentes" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}