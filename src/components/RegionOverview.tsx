const regionData = [
  { name: "Luanda", crises: 3, affected: 15000 },
  { name: "Huíla", crises: 2, affected: 3200 },
  { name: "Benguela", crises: 1, affected: 800 },
  { name: "Cunene", crises: 1, affected: 25000 },
  { name: "Uíge", crises: 1, affected: 500 },
  { name: "Cabinda", crises: 1, affected: 200 },
];

export function RegionOverview() {
  const maxAffected = Math.max(...regionData.map((r) => r.affected));

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-semibold text-sm mb-4">Impacto por Região</h3>
      <div className="space-y-3">
        {regionData.map((region) => (
          <div key={region.name} className="animate-slide-up">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium">{region.name}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">
                {region.affected.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded-full transition-all duration-700"
                style={{ width: `${(region.affected / maxAffected) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
