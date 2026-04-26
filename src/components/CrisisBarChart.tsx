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
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-sm text-foreground/80">Crises por Mês</h3>
                <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" />
            </div>
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} barSize={20} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
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
                        />
                        <Tooltip
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                            contentStyle={{
                                background: "rgba(255, 255, 255, 0.9)",
                                backdropFilter: "blur(8px)",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "12px",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                                fontSize: 12,
                                fontWeight: 500,
                                color: "hsl(var(--foreground))"
                            }}
                            itemStyle={{ color: "hsl(var(--primary))" }}
                        />
                        <Bar 
                            dataKey="total" 
                            fill="url(#barGradient)" 
                            radius={[4, 4, 0, 0]} 
                            name="Incidentes" 
                        />
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}