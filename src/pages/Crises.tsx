import { AppLayout } from "@/components/AppLayout";
import { CrisisCard } from "@/components/CrisisCard";
import { mockCrises, severityLabels, crisisTypeLabels } from "@/data/crisisData";
import { useState } from "react";
import { Filter } from "lucide-react";

const CrisesPage = () => {
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const filtered = mockCrises.filter((c) => {
    if (filterSeverity !== "all" && c.severity !== filterSeverity) return false;
    if (filterType !== "all" && c.type !== filterType) return false;
    return true;
  });

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <h1 className="text-2xl font-extrabold">Crises e Emergências</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Todas as crises reportadas no território nacional
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground"
        >
          <option value="all">Todas Severidades</option>
          {Object.entries(severityLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-sm bg-card border border-border rounded-lg px-3 py-2 text-foreground"
        >
          <option value="all">Todos Tipos</option>
          {Object.entries(crisisTypeLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} resultado(s)
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((crisis) => (
          <CrisisCard key={crisis.id} crisis={crisis} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">Nenhuma crise encontrada com os filtros selecionados.</p>
        </div>
      )}
    </AppLayout>
  );
};

export default CrisesPage;
