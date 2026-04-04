// src/components/CrisisPieChart.tsx
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface CategoryData {
    name: string;
    value: number;
    color: string;
}

interface CrisisPieChartProps {
    chartData?: CategoryData[];
}

const DEFAULT_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

export function CrisisPieChart({ chartData = [] }: CrisisPieChartProps) {
    const data = chartData.length > 0 ? chartData : [{ name: "Sem dados", value: 1, color: "#9ca3af" }];
    
    return (
        <div className="rounded-2xl bg-card border border-border p-5 animate-slide-up">
            <h3 className="font-semibold text-sm mb-4">Crises por Tipo</h3>
            <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                            {data.map((_, i) => (
                                <Cell key={i} fill={data[i]?.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                background: "hsl(var(--card))",
                                border: "1px solid hsl(var(--border))",
                                borderRadius: "0.75rem",
                                fontSize: 12,
                            }}
                        />
                        <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}