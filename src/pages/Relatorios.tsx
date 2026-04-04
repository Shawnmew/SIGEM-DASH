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
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Filter,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar,
  MapPin,
  Activity,
  BarChart3,
  PieChart,
  Printer,
  Mail,
  Share2,
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
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const severityColors: Record<CrisisSeverity, string> = {
  critical: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-white",
  low: "bg-green-500 text-white",
};

const statusColors: Record<CrisisStatus, string> = {
  active: "bg-red-500/20 text-red-600 border-red-500/30",
  responding: "bg-blue-500/20 text-blue-600 border-blue-500/30",
  monitoring: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
  resolved: "bg-green-500/20 text-green-600 border-green-500/30",
};

const CHART_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6"];

const RelatoriosPage = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("lista");

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

  // Estatísticas
  const totalAffected = filtered.reduce((s, c) => s + c.affectedPeople, 0);
  const totalVolunteers = filtered.reduce(
    (s, c) => s + c.volunteersAssigned,
    0
  );
  const activeCrises = filtered.filter(c => c.status !== "resolved").length;
  const resolvedCrises = filtered.filter(c => c.status === "resolved").length;
  const criticalCrises = filtered.filter(c => c.severity === "critical").length;
  
  // Dados para gráficos
  const chartDataByType = useMemo(() => {
    const typeCount: Record<string, number> = {};
    filtered.forEach(c => {
      typeCount[c.type] = (typeCount[c.type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({
      name: crisisTypeLabels[name as CrisisType] || name,
      value
    }));
  }, [filtered]);

  const chartDataByStatus = useMemo(() => {
    const statusCount: Record<string, number> = {};
    filtered.forEach(c => {
      statusCount[c.status] = (statusCount[c.status] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({
      name: statusLabels[name as CrisisStatus] || name,
      value
    }));
  }, [filtered]);

  const chartDataByProvince = useMemo(() => {
    const provinceCount: Record<string, number> = {};
    filtered.forEach(c => {
      provinceCount[c.province] = (provinceCount[c.province] || 0) + 1;
    });
    return Object.entries(provinceCount)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filtered]);

  const getExportRows = () =>
    filtered.map((c) => ({
      "ID": c.id,
      "Título": c.title,
      "Tipo": crisisTypeLabels[c.type],
      "Severidade": severityLabels[c.severity],
      "Estado": statusLabels[c.status],
      "Região": c.region,
      "Província": c.province,
      "Data Reportada": new Date(c.reportedAt).toLocaleDateString("pt-PT"),
      "Pessoas Afetadas": c.affectedPeople,
      "Voluntários": c.volunteersAssigned,
    }));

  // Exportar Excel com formatação profissional
  const exportExcel = () => {
    const rows = getExportRows();
    
    // Criar worksheet
    const ws = XLSX.utils.json_to_sheet(rows);
    
    // Definir largura das colunas
    ws['!cols'] = [
      { wch: 8 },   // ID
      { wch: 40 },  // Título
      { wch: 15 },  // Tipo
      { wch: 12 },  // Severidade
      { wch: 15 },  // Estado
      { wch: 15 },  // Região
      { wch: 15 },  // Província
      { wch: 15 },  // Data
      { wch: 18 },  // Afetados
      { wch: 12 },  // Voluntários
    ];
    
    // Criar workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório de Crises");
    
    // Adicionar sheet de resumo
    const summaryData = [
      ["RELATÓRIO DE CRISES - RESUMO EXECUTIVO", ""],
      ["", ""],
      ["Data de emissão:", new Date().toLocaleDateString("pt-PT")],
      ["Período analisado:", "Últimos 6 meses"],
      ["", ""],
      ["MÉTRICAS PRINCIPAIS", ""],
      ["Total de Ocorrências:", filtered.length],
      ["Crises Ativas:", activeCrises],
      ["Crises Resolvidas:", resolvedCrises],
      ["Crises Críticas:", criticalCrises],
      ["Pessoas Afetadas:", totalAffected.toLocaleString()],
      ["Voluntários Mobilizados:", totalVolunteers],
      ["", ""],
      ["DISTRIBUIÇÃO POR TIPO", ""],
      ...Object.entries(crisisTypeLabels).map(([key, label]) => [
        label,
        filtered.filter(c => c.type === key).length
      ]),
      ["", ""],
      ["DISTRIBUIÇÃO POR SEVERIDADE", ""],
      ...Object.entries(severityLabels).map(([key, label]) => [
        label,
        filtered.filter(c => c.severity === key).length
      ]),
    ];
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo Executivo");
    
    // Salvar arquivo
    XLSX.writeFile(wb, `relatorio_crises_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Exportar PDF com design profissional
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    // Cabeçalho com gradiente
    doc.setFillColor(239, 68, 68);
    doc.rect(0, 0, 297, 45, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE CRISES", 20, 20);
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text("Sistema Integrado de Gestão de Emergências", 20, 32);
    
    // Data e hora
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-PT")}`, 20, 40);
    
    // Cards de métricas
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(245, 245, 245);
    
    // Card 1
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(20, 55, 60, 25, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(filtered.length.toString(), 35, 72);
    doc.setFontSize(9);
    doc.text("Total Ocorrências", 32, 78);
    
    // Card 2
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(85, 55, 60, 25, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(resolvedCrises.toString(), 100, 72);
    doc.setFontSize(9);
    doc.text("Resolvidas", 105, 78);
    
    // Card 3
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(150, 55, 60, 25, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(totalAffected.toLocaleString(), 155, 72);
    doc.setFontSize(9);
    doc.text("Pessoas Afetadas", 158, 78);
    
    // Card 4
    doc.setFillColor(249, 115, 22);
    doc.roundedRect(215, 55, 60, 25, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(totalVolunteers.toString(), 220, 72);
    doc.setFontSize(9);
    doc.text("Voluntários", 228, 78);
    
    // Tabela de dados
    const rows = getExportRows();
    const headers = ["Título", "Tipo", "Severidade", "Estado", "Província", "Afetados"];
    
    autoTable(doc, {
      startY: 95,
      head: [headers],
      body: rows.map((r) => [
        r.Título.substring(0, 40),
        r.Tipo,
        r.Severidade,
        r.Estado,
        r.Província,
        r["Pessoas Afetadas"].toLocaleString(),
      ]),
      theme: "striped",
      headStyles: { 
        fillColor: [239, 68, 68], 
        textColor: [255, 255, 255],
        fontStyle: "bold",
        halign: "center",
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        valign: "middle",
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 25 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
        5: { cellWidth: 25, halign: "right" },
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
    });
    
    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Página ${i} de ${pageCount}`, 280, 195, { align: "right" });
      doc.text("SIGEM - Sistema Integrado de Gestão de Emergências", 148, 195, { align: "center" });
    }
    
    doc.save(`relatorio_crises_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportSQL = () => {
    const lines = filtered.map((c) => {
      return `INSERT INTO crises (id, title, type, severity, status, region, province, reported_at, affected_people, volunteers_assigned) VALUES ('${c.id}', '${c.title.replace(/'/g, "''")}', '${c.type}', '${c.severity}', '${c.status}', '${c.region}', '${c.province}', '${c.reportedAt}', ${c.affectedPeople}, ${c.volunteersAssigned});`;
    });
    const sql = `-- ============================================\n-- RELATÓRIO DE CRISES\n-- ============================================\n-- Gerado em: ${new Date().toISOString()}\n-- Total de registos: ${filtered.length}\n-- ============================================\n\n${lines.join("\n")}\n\n-- ============================================\n-- FIM DO RELATÓRIO\n-- ============================================`;
    const blob = new Blob([sql], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_crises_${new Date().toISOString().split('T')[0]}.sql`;
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
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-extrabold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                Relatórios de Impacto
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Análise detalhada de ocorrências e métricas de desempenho
              </p>
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600">
                    <Download className="h-4 w-4" />
                    Exportar Relatório
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={exportExcel} className="gap-3 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Excel (.xlsx)</p>
                      <p className="text-xs text-muted-foreground">Dados formatados com resumo</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPDF} className="gap-3 cursor-pointer">
                    <FileText className="h-4 w-4 text-red-600" />
                    <div>
                      <p className="font-medium">PDF</p>
                      <p className="text-xs text-muted-foreground">Relatório profissional</p>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportSQL} className="gap-3 cursor-pointer">
                    <Database className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">SQL</p>
                      <p className="text-xs text-muted-foreground">Script para banco de dados</p>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Stats Cards Modernos */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total Ocorrências</p>
                  <p className="text-3xl font-bold">{filtered.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 opacity-80" />
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs opacity-80">
                  <span>Ativas: {activeCrises}</span>
                  <span>Resolvidas: {resolvedCrises}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Pessoas Afetadas</p>
                  <p className="text-3xl font-bold">{totalAffected.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 opacity-80" />
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs opacity-80">
                  <span>Média por crise: {Math.round(totalAffected / filtered.length || 0).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Voluntários</p>
                  <p className="text-3xl font-bold">{totalVolunteers}</p>
                </div>
                <Users className="h-8 w-8 opacity-80" />
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-xs opacity-80">
                  <span>Mobilizados em {filtered.length} crises</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Crises Críticas</p>
                  <p className="text-3xl font-bold">{criticalCrises}</p>
                </div>
                <AlertTriangle className="h-8 w-8 opacity-80" />
              </div>
              <div className="mt-2">
                <Progress value={(criticalCrises / filtered.length) * 100 || 0} className="h-1 bg-white/30" />
                <p className="text-xs opacity-80 mt-1">{Math.round((criticalCrises / filtered.length) * 100 || 0)}% do total</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs para visualização */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="lista" className="gap-2">
              <FileText className="h-4 w-4" />
              Lista de Crises
            </TabsTrigger>
            <TabsTrigger value="graficos" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Análise Gráfica
            </TabsTrigger>
            <TabsTrigger value="resumo" className="gap-2">
              <PieChart className="h-4 w-4" />
              Resumo Executivo
            </TabsTrigger>
          </TabsList>

          {/* Tab Lista */}
          <TabsContent value="lista" className="mt-4">
            {/* Filters */}
            <div className="rounded-xl border border-border bg-card p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-primary" />
                <h3 className="font-bold text-sm">Filtros Avançados</h3>
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
                      <SelectItem key={k} value={k}>{v}</SelectItem>
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
                      <SelectItem key={k} value={k}>{v}</SelectItem>
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
                      <SelectItem key={k} value={k}>{v}</SelectItem>
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
                      <SelectItem key={p} value={p}>{p}</SelectItem>
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
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100">
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
                        <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                          Nenhuma ocorrência encontrada com os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((crisis) => (
                        <TableRow key={crisis.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium max-w-[200px] truncate">
                            {crisis.title}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{crisisTypeLabels[crisis.type]}</span>
                          </TableCell>
                          <TableCell>
                            <Badge className={severityColors[crisis.severity]}>
                              {severityLabels[crisis.severity]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[crisis.status]}>
                              {statusLabels[crisis.status]}
                            </Badge>
                          </TableCell>
                          <TableCell>{crisis.region}</TableCell>
                          <TableCell>{crisis.province}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(crisis.reportedAt).toLocaleDateString("pt-PT")}
                          </TableCell>
                          <TableCell className="text-right font-medium">
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

              <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground flex items-center justify-between bg-gray-50">
                <span>
                  📊 A mostrar {filtered.length} de {mockCrises.length} ocorrências
                </span>
                <span>
                  👥 Total afetados: {totalAffected.toLocaleString()} · 🦺 Voluntários: {totalVolunteers}
                </span>
              </div>
            </div>
          </TabsContent>

          {/* Tab Gráficos */}
          <TabsContent value="graficos" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartDataByType}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartDataByType.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataByStatus} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={100} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Top Províncias Mais Afetadas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataByProvince}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" fill="#ef4444" radius={[8, 8, 0, 0]}>
                          {chartDataByProvince.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo Executivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold text-blue-800 mb-2">📈 Visão Geral</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Total de Crises:</span>
                          <span className="font-bold">{filtered.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Crises Ativas:</span>
                          <span className="font-bold text-orange-600">{activeCrises}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Crises Resolvidas:</span>
                          <span className="font-bold text-green-600">{resolvedCrises}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Taxa de Resolução:</span>
                          <span className="font-bold">{Math.round((resolvedCrises / filtered.length) * 100 || 0)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-red-50 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-2">⚠️ Impacto Humano</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Pessoas Afetadas:</span>
                          <span className="font-bold">{totalAffected.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Média por Crise:</span>
                          <span className="font-bold">{Math.round(totalAffected / filtered.length || 0).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Voluntários Mobilizados:</span>
                          <span className="font-bold">{totalVolunteers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Rácio Voluntário/Afetado:</span>
                          <span className="font-bold">1:{Math.round(totalAffected / totalVolunteers || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-semibold text-yellow-800 mb-2">🏆 Top 3 Crises mais Críticas</h3>
                      <div className="space-y-3">
                        {filtered.filter(c => c.severity === "critical").slice(0, 3).map((crisis, idx) => (
                          <div key={idx} className="border-b pb-2">
                            <p className="font-medium text-sm">{crisis.title}</p>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>{crisis.province}</span>
                              <span>{crisis.affectedPeople.toLocaleString()} afetados</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-800 mb-2">✅ Recomendações</h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          <span>Reforçar equipes nas províncias com maior incidência</span>
                        </li>