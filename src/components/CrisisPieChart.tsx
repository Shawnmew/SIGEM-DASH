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

const MODERN_COLORS = [
    "#6366f1", // Indigo
    "#10b981", // Emerald
    "#f43f5e", // Rose
    "#f59e0b", // Amber
    "#06b6d4", // Cyan
    "#8b5cf6", // Violet
    "#94a3b8"  // Slate
];

export function CrisisPieChart({ chartData = [] }: CrisisPieChartProps) {
    const data = chartData.length > 0 ? chartData : [{ name: "Sem dados", value: 1, color: "#9ca3af" }];
    const total = data.reduce((acc, curr) => acc + (curr.value || 0), 0);
    
    return (
        <div className="rounded-2xl bg-card border border-border p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-sm text-foreground/80">Crises por Tipo</h3>
                <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                </div>
            </div>
            <div className="h-52 relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-2xl font-bold text-foreground/90">{total}</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Total</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                            data={data} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={55} 
                            outerRadius={75} 
                            paddingAngle={4} 
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, i) => (
                                <Cell 
                                    key={i} 
                                    fill={entry.color || MODERN_COLORS[i % MODERN_COLORS.length]} 
                                    style={{ filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.05))" }}
                                />
                            ))}
                        </Pie>
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
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            align="center"
                            iconType="circle"
                            iconSize={6} 
                            wrapperStyle={{ 
                                fontSize: 10, 
                                paddingTop: 20, 
                                fontWeight: 500,
                                color: "hsl(var(--muted-foreground))"
                            }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}