import { AppLayout } from "@/components/AppLayout";
import { CrisisMap } from "@/components/CrisisMap";
import { mockCrises } from "@/data/crisisData";

const MapaPage = () => {
  const activeCrises = mockCrises.filter((c) => c.status !== "resolved");

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <h1 className="text-2xl font-extrabold">Mapa de Risco</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualização geográfica das áreas de risco e crises ativas
        </p>
      </div>

      {/* Map */}
      <div className="rounded-2xl border border-border overflow-hidden" style={{ height: "65vh" }}>
        <CrisisMap crises={mockCrises} />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-muted-foreground">
        <span className="font-semibold">Legenda:</span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-crisis-critical" /> Crítico
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-crisis-high" /> Alto
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-crisis-medium" /> Médio
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-crisis-low" /> Baixo
        </span>
        <span className="ml-auto">{activeCrises.length} crise(s) ativa(s)</span>
      </div>
    </AppLayout>
  );
};

export default MapaPage;
