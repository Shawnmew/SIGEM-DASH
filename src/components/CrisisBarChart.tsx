import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { month: "Set", crises: 3 },
  { month: "Out", crises: 5 },
  { month: "Nov", crises: 4 },
  { month: "Dez", crises: 7 },
  { month: "Jan", crises: 6 },
  { month: "Fev", crises: 4 },
];

export function CrisisBarChart() {
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
            <Bar dataKey="crises" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
