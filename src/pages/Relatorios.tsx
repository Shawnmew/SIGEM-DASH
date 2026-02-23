import { useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  mockCrises,
  crisisTypeLabels,
  severityLabels,
  statusLabels,
  CrisisType,
  CrisisSeverity,
  CrisisStatus,
} from "@/data/crisisData";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Filter,
  Search,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const severityColors: Record<CrisisSeverity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  medium: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const statusColors: Record<CrisisStatus, string> = {
  active: "bg-destructive/20 text-destructive border-destructive/30",
  responding: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  monitoring: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
};

const RelatoriosPage = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");

  const provinces = useMemo(
    () => [...new Set(mockCrises.map((c) => c.province))].sort(),
    []
  );

  const filtered = useMemo(() => {
    return mockCrises.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.region.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === "all" || c.type === typeFilter;
      const matchSeverity =
        severityFilter === "all" || c.severity === severityFilter;
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchProvince =
        provinceFilter === "all" || c.province === provinceFilter;
      return (
        matchSearch && matchType && matchSeverity && matchStatus && matchProvince
      );
    });
  }, [search, typeFilter, severityFilter, statusFilter, provinceFilter]);

  const totalAffected = filtered.reduce((s, c) => s + c.affectedPeople, 0);
  const totalVolunteers = filtered.reduce(
    (s, c) => s + c.volunteersAssigned,
    0
  );

  const getExportRows = () =>
    filtered.map((c) => ({
      Título: c.title,
      Tipo: crisisTypeLabels[c.type],
      Severidade: severityLabels[c.severity],
      Estado: statusLabels[c.status],
      Região: c.region,
      Província: c.province,
      "Data Reportada": new Date(c.reportedAt).toLocaleDateString("pt-PT"),
      Afetados: c.affectedPeople,
      Voluntários: c.volunteersAssigned,
    }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, "relatorio_crises.xlsx");
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Relatório de Crises", 14, 20);
    doc.setFontSize(10);
    doc.text(
      `Gerado em: ${new Date().toLocaleDateString("pt-PT")} · ${filtered.length} ocorrências · ${totalAffected.toLocaleString()} afetados`,
      14,
      28
    );

    const rows = getExportRows();
    const headers = Object.keys(rows[0] || {});
    autoTable(doc, {
      startY: 34,
      head: [headers],
      body: rows.map((r) => headers.map((h) => String((r as Record<string, unknown>)[h] ?? ""))),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    doc.save("relatorio_crises.pdf");
  };

  const exportSQL = () => {
    const lines = filtered.map((c) => {
      return `INSERT INTO crises (id, title, type, severity, status, region, province, reported_at, affected_people, volunteers_assigned) VALUES ('${c.id}', '${c.title.replace(/'/g, "''")}', '${c.type}', '${c.severity}', '${c.status}', '${c.region}', '${c.province}', '${c.reportedAt}', ${c.affectedPeople}, ${c.volunteersAssigned});`;
    });
    const sql = `-- Relatório de Crises\n-- Gerado em: ${new Date().toISOString()}\n-- Total: ${filtered.length} registos\n\n${lines.join("\n")}`;
    const blob = new Blob([sql], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio_crises.sql";
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSeverityFilter("all");
    setStatusFilter("all");
    setProvinceFilter("all");
  };

  const hasFilters =
    search ||
    typeFilter !== "all" ||
    severityFilter !== "all" ||
    statusFilter !== "all" ||
    provinceFilter !== "all";

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">Relatórios de Impacto</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise detalhada de ocorrências e exportação de dados
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportExcel} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="h-4 w-4 text-green-500" />
                Exportar Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportPDF} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4 text-red-500" />
                Exportar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportSQL} className="gap-2 cursor-pointer">
                <Database className="h-4 w-4 text-blue-500" />
                Exportar SQL
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-3xl font-extrabold">{filtered.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Ocorrências</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-3xl font-extrabold">
            {totalAffected.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Pessoas Afetadas</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 text-center">
          <p className="text-3xl font-extrabold">{totalVolunteers}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Voluntários Mobilizados
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-border bg-card p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-sm">Filtros</h3>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-primary hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(crisisTypeLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Severidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas severidades</SelectItem>
              {Object.entries(severityLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos estados</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={provinceFilter} onValueChange={setProvinceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Província" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas províncias</SelectItem>
              {provinces.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Severidade</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Província</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Afetados</TableHead>
                <TableHead className="text-right">Voluntários</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-10 text-muted-foreground"
                  >
                    Nenhuma ocorrência encontrada com os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((crisis) => (
                  <TableRow key={crisis.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {crisis.title}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {crisisTypeLabels[crisis.type]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={severityColors[crisis.severity]}
                      >
                        {severityLabels[crisis.severity]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[crisis.status]}
                      >
                        {statusLabels[crisis.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{crisis.region}</TableCell>
                    <TableCell>{crisis.province}</TableCell>
                    <TableCell>
                      {new Date(crisis.reportedAt).toLocaleDateString("pt-PT")}
                    </TableCell>
                    <TableCell className="text-right">
                      {crisis.affectedPeople.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {crisis.volunteersAssigned}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            A mostrar {filtered.length} de {mockCrises.length} ocorrências
          </span>
          <span>
            Total afetados: {totalAffected.toLocaleString()} · Voluntários:{" "}
            {totalVolunteers}
          </span>
        </div>
      </div>
    </AppLayout>
  );
};

export default RelatoriosPage;
