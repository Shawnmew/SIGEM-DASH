import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { mockCrises, crisisTypeLabels } from "@/data/crisisData";

const COLORS = [
  "hsl(var(--crisis-critical))",
  "hsl(var(--crisis-high))",
  "hsl(var(--crisis-medium))",
  "hsl(var(--crisis-low))",
  "hsl(var(--info))",
  "hsl(var(--crisis-resolved))",
];

export function CrisisPieChart() {
  const typeCounts = mockCrises.reduce((acc, c) => {
    acc[c.type] = (acc[c.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(typeCounts).map(([type, count]) => ({
    name: crisisTypeLabels[type as keyof typeof crisisTypeLabels] || type,
    value: count,
  }));

  return (
    <div className="rounded-2xl bg-card border border-border p-5 animate-slide-up">
      <h3 className="font-semibold text-sm mb-4">Crises por Tipo</h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
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
            <Legend
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
