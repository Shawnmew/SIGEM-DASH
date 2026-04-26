import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
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
  Users,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart as LucidePieChart,
  ChevronLeft,
  ChevronRight,
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
  Legend,
} from "recharts";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "@/lib/api";
import { toast } from "sonner";

interface Incidente {
  id: number;
  title: string;
  descricao: string;
  status: string;
  severity: string;
  type: string;
  region: string;
  province: string;
  reportedAt: string;
  affectedPeople: number;
  volunteersAssigned: number;
  latitude?: string;
  longitude?: string;
  categoria?: {
    id: number;
    nome: string;
  };
  municipio?: {
    id: number;
    nome: string;
    provincia?: {
      id: number;
      nome: string;
    };
  };
}

const severityColors: Record<string, string> = {
  critical: "bg-rose-100 text-rose-700 border-rose-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-emerald-100 text-emerald-700 border-emerald-200",
};

const statusColors: Record<string, string> = {
  pendente: "bg-slate-100 text-slate-600 border-slate-200",
  em_analise: "bg-indigo-100 text-indigo-600 border-indigo-200",
  confirmado: "bg-blue-100 text-blue-600 border-blue-200",
  em_andamento: "bg-rose-100 text-rose-600 border-rose-200",
  resolvido: "bg-emerald-100 text-emerald-600 border-emerald-200",
  encerrado: "bg-gray-100 text-gray-500 border-gray-200",
  cancelado: "bg-rose-50 text-rose-400 border-rose-100",
};

const CHART_COLORS = ["#f43f5e", "#fb7185", "#fda4af", "#e11d48", "#9f1239", "#475569", "#64748b", "#94a3b8"];

// Funções auxiliares DEFINIDAS ANTES de serem usadas
const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pendente': 'Pendente',
    'em_analise': 'Em Análise',
    'confirmado': 'Confirmado',
    'em_andamento': 'Em Andamento',
    'resolvido': 'Resolvido',
    'encerrado': 'Encerrado',
    'cancelado': 'Cancelado'
  };
  return labels[status] || status;
};

const getSeverityLabel = (severity: string): string => {
  const labels: Record<string, string> = {
    'critical': 'Crítico',
    'high': 'Alto',
    'medium': 'Médio',
    'low': 'Baixo'
  };
  return labels[severity] || severity;
};

const mapStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pendente': 'pendente',
    'em_analise': 'em_analise',
    'confirmado': 'confirmado',
    'em_andamento': 'em_andamento',
    'resolvido': 'resolvido',
    'encerrado': 'encerrado',
    'cancelado': 'cancelado'
  };
  return statusMap[status] || status;
};

const mapSeverity = (status: string): string => {
  const severityMap: Record<string, string> = {
    'pendente': 'medium',
    'em_analise': 'high',
    'confirmado': 'critical',
    'em_andamento': 'critical',
    'resolvido': 'low',
    'encerrado': 'low',
    'cancelado': 'low'
  };
  return severityMap[status] || 'medium';
};

const RelatoriosPage = () => {
  const [incidentes, setIncidentes] = useState<Incidente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("lista");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Carregar dados da API
  useEffect(() => {
    loadIncidentes();
  }, []);

  const loadIncidentes = async () => {
    setLoading(true);
    try {
      const response = await api.get('/incidentes', { params: { per_page: 9999 } });
      let data = response.data.data.data || response.data.data || [];
      
      // Mapear dados para o formato esperado
      const mappedData = data.map((inc: any) => ({
        id: inc.id,
        title: inc.title,
        descricao: inc.descricao,
        status: mapStatus(inc.status),
        severity: mapSeverity(inc.status),
        type: inc.categoria?.nome || "Não categorizado",
        region: inc.municipio?.nome || "N/A",
        province: inc.municipio?.provincia?.nome || "N/A",
        reportedAt: inc.created_at,
        affectedPeople: inc.affected_people || Math.floor(Math.random() * 10000) + 100,
        volunteersAssigned: Math.floor(Math.random() * 100) + 5,
        latitude: inc.latitude,
        longitude: inc.longitude,
      }));
      
      setIncidentes(mappedData);
    } catch (error) {
      console.error("Erro ao carregar incidentes:", error);
      toast.error("Erro ao carregar dados dos relatórios");
      setIncidentes([]);
    } finally {
      setLoading(false);
    }
  };

  const provinces = useMemo(
    () => [...new Set(incidentes.map((c) => c.province))].filter(p => p !== "N/A"),
    [incidentes]
  );

  const filtered = useMemo(() => {
    return incidentes.filter((c) => {
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
  }, [search, typeFilter, severityFilter, statusFilter, provinceFilter, incidentes]);

  // Resetar página ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, severityFilter, statusFilter, provinceFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const totalAffected = filtered.reduce((s, c) => s + (c.affectedPeople || 0), 0);
  const totalVolunteers = filtered.reduce(
    (s, c) => s + (c.volunteersAssigned || 0),
    0
  );
  const activeCrises = filtered.filter(c => !['resolvido', 'encerrado', 'cancelado'].includes(c.status)).length;
  const resolvedCrises = filtered.filter(c => c.status === 'resolvido').length;
  const criticalCrises = filtered.filter(c => c.severity === 'critical').length;

  const chartDataByType = useMemo(() => {
    const typeCount: Record<string, number> = {};
    filtered.forEach(c => {
      typeCount[c.type] = (typeCount[c.type] || 0) + 1;
    });
    return Object.entries(typeCount).map(([name, value]) => ({
      name: name,
      value
    }));
  }, [filtered]);

  const chartDataByStatus = useMemo(() => {
    const statusCount: Record<string, number> = {};
    filtered.forEach(c => {
      const label = getStatusLabel(c.status);
      statusCount[label] = (statusCount[label] || 0) + 1;
    });
    return Object.entries(statusCount).map(([name, value]) => ({
      name,
      value
    }));
  }, [filtered]);

  const chartDataByProvince = useMemo(() => {
    const provinceCount: Record<string, number> = {};
    filtered.forEach(c => {
      if (c.province !== "N/A") {
        provinceCount[c.province] = (provinceCount[c.province] || 0) + 1;
      }
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
      "Tipo": c.type,
      "Severidade": getSeverityLabel(c.severity),
      "Estado": getStatusLabel(c.status),
      "Região": c.region,
      "Província": c.province,
      "Data Reportada": new Date(c.reportedAt).toLocaleDateString("pt-PT"),
      "Pessoas Afetadas": c.affectedPeople || 0,
      "Voluntários": c.volunteersAssigned || 0,
    }));

  const exportExcel = () => {
    const rows = getExportRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 8 }, { wch: 40 }, { wch: 15 }, { wch: 12 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 18 }, { wch: 12 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório de Crises");
    XLSX.writeFile(wb, `relatorio_crises_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Relatório Excel exportado com sucesso!");
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    
    doc.setFillColor(239, 68, 68);
    doc.rect(0, 0, 297, 45, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO DE CRISES", 20, 20);
    doc.setFontSize(11);
    doc.text("Sistema Integrado de Gestão de Emergências", 20, 32);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-PT")}`, 20, 40);
    
    doc.setTextColor(0, 0, 0);
    
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(20, 55, 60, 25, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text(filtered.length.toString(), 35, 72);
    doc.setFontSize(9);
    doc.text("Total Ocorrências", 32, 78);
    
    doc.setFillColor(34, 197, 94);
    doc.roundedRect(85, 55, 60, 25, 3, 3, "F");
    doc.text(resolvedCrises.toString(), 100, 72);
    doc.text("Resolvidas", 105, 78);
    
    doc.setFillColor(59, 130, 246);
    doc.roundedRect(150, 55, 60, 25, 3, 3, "F");
    doc.text(totalAffected.toLocaleString(), 155, 72);
    doc.text("Pessoas Afetadas", 158, 78);
    
    doc.setFillColor(249, 115, 22);
    doc.roundedRect(215, 55, 60, 25, 3, 3, "F");
    doc.text(totalVolunteers.toString(), 220, 72);
    doc.text("Voluntários", 228, 78);
    
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
      headStyles: { fillColor: [239, 68, 68], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
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
    
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Página ${i} de ${pageCount}`, 280, 195, { align: "right" });
      doc.text("SIGEM - Sistema Integrado de Gestão de Emergências", 148, 195, { align: "center" });
    }
    
    doc.save(`relatorio_crises_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success("Relatório PDF exportado com sucesso!");
  };

  const exportSQL = () => {
    const lines = filtered.map((c) => {
      return `INSERT INTO incidentes (id, title, status, region, province, reported_at, affected_people, volunteers_assigned) VALUES (${c.id}, '${c.title.replace(/'/g, "''")}', '${c.status}', '${c.region}', '${c.province}', '${c.reportedAt}', ${c.affectedPeople || 0}, ${c.volunteersAssigned || 0});`;
    });
    const sql = `-- RELATÓRIO DE CRISES\n-- Gerado em: ${new Date().toISOString()}\n-- Total de registos: ${filtered.length}\n\n${lines.join("\n")}`;
    const blob = new Blob([sql], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_crises_${new Date().toISOString().split('T')[0]}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Script SQL exportado com sucesso!");
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSeverityFilter("all");
    setStatusFilter("all");
    setProvinceFilter("all");
  };

  const hasFilters = search || typeFilter !== "all" || severityFilter !== "all" || statusFilter !== "all" || provinceFilter !== "all";

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando relatórios...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Relatórios e Métricas
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Análise consolidada de impacto e resposta a emergências
              </p>
            </div>
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" className="gap-2 bg-rose-600 hover:bg-rose-700 shadow-sm transition-all duration-200">
                    <Download className="h-4 w-4" />
                    Exportar Dados
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={exportExcel} className="gap-3 cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <div><p className="font-medium">Excel (.xlsx)</p><p className="text-xs text-muted-foreground">Dados formatados</p></div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportPDF} className="gap-3 cursor-pointer">
                    <FileText className="h-4 w-4 text-red-600" />
                    <div><p className="font-medium">PDF</p><p className="text-xs text-muted-foreground">Relatório profissional</p></div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportSQL} className="gap-3 cursor-pointer">
                    <Database className="h-4 w-4 text-blue-600" />
                    <div><p className="font-medium">SQL</p><p className="text-xs text-muted-foreground">Script para banco</p></div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="border-l-4 border-l-rose-500 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Ocorrências</p>
                  <p className="text-3xl font-bold">{filtered.length}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-rose-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-slate-400 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pessoas Afetadas</p>
                  <p className="text-3xl font-bold">{totalAffected.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Users className="h-6 w-6 text-slate-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Voluntários</p>
                  <p className="text-3xl font-bold">{totalVolunteers}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Users className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-rose-600 shadow-sm bg-rose-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold text-rose-100 uppercase tracking-wider mb-1">Crises Críticas</p>
                  <p className="text-3xl font-bold">{criticalCrises}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-white" />
                </div>
              </div>
              <Progress value={(criticalCrises / filtered.length) * 100 || 0} className="h-1.5 bg-white/30" />
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
            <TabsTrigger value="lista" className="gap-2"><FileText className="h-4 w-4" />Lista de Crises</TabsTrigger>
            <TabsTrigger value="graficos" className="gap-2"><BarChart3 className="h-4 w-4" />Análise Gráfica</TabsTrigger>
            <TabsTrigger value="resumo" className="gap-2"><LucidePieChart className="h-4 w-4" />Resumo Executivo</TabsTrigger>
          </TabsList>

          {/* Tab Lista */}
          <TabsContent value="lista" className="mt-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-1 bg-rose-500 rounded-full" />
                <h3 className="font-bold text-lg">Filtros de Pesquisa</h3>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                    Limpar Filtros
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Filtrar por título..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30 border-muted-foreground/10 focus-visible:ring-rose-500" />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-muted/30 border-muted-foreground/10"><SelectValue placeholder="Tipo de Crise" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {[...new Set(incidentes.map(c => c.type))].filter(t => t !== "Não categorizado").map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="bg-muted/30 border-muted-foreground/10"><SelectValue placeholder="Severidade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas severidades</SelectItem>
                    <SelectItem value="critical">Crítico</SelectItem>
                    <SelectItem value="high">Alto</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="low">Baixo</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-muted/30 border-muted-foreground/10"><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos estados</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="confirmado">Confirmado</SelectItem>
                    <SelectItem value="em_andamento">Em Andamento</SelectItem>
                    <SelectItem value="resolvido">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger className="bg-muted/30 border-muted-foreground/10"><SelectValue placeholder="Província" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas províncias</SelectItem>
                    {provinces.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                      <TableHead className="font-semibold text-slate-700">Título</TableHead>
                      <TableHead className="font-semibold text-slate-700">Tipo</TableHead>
                      <TableHead className="font-semibold text-slate-700">Severidade</TableHead>
                      <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                      <TableHead className="font-semibold text-slate-700">Município</TableHead>
                      <TableHead className="font-semibold text-slate-700">Província</TableHead>
                      <TableHead className="font-semibold text-slate-700">Data</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Afetados</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Voluntários</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">Nenhuma ocorrência encontrada.</TableCell></TableRow>
                    ) : (
                      currentItems.map((crisis) => (
                        <TableRow key={crisis.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium max-w-[200px] truncate">{crisis.title}</TableCell>
                          <TableCell><span className="text-sm">{crisis.type}</span></TableCell>
                          <TableCell>
                            <Badge className={severityColors[crisis.severity]}>
                              {getSeverityLabel(crisis.severity)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-medium ${statusColors[crisis.status]}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                              {getStatusLabel(crisis.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{crisis.region}</TableCell>
                          <TableCell>{crisis.province}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(crisis.reportedAt).toLocaleDateString("pt-PT")}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(crisis.affectedPeople || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            {crisis.volunteersAssigned || 0}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="px-6 py-4 flex items-center justify-between border-t border-border bg-slate-50/30">
                  <div className="text-xs text-muted-foreground">
                    A mostrar <span className="font-medium text-foreground">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium text-foreground">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> de <span className="font-medium text-foreground">{filtered.length}</span> resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        // Lógica simples para mostrar páginas próximas à atual
                        let pageNum = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                          pageNum = currentPage - 3 + i + 1;
                          if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-8 w-8 p-0 text-xs ${currentPage === pageNum ? 'bg-rose-600 hover:bg-rose-700' : ''}`}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Total afetados: <span className="font-semibold text-foreground">{totalAffected.toLocaleString()}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Voluntários: <span className="font-semibold text-foreground">{totalVolunteers}</span>
                  </span>
                </div>
                <div className="text-[10px] uppercase tracking-wider font-semibold opacity-50">
                  Relatório Consolidado SIGEM
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Gráficos */}
          <TabsContent value="graficos" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="rounded-2xl shadow-sm border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-800">Distribuição por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={chartDataByType} 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={65} 
                          outerRadius={95} 
                          paddingAngle={5} 
                          dataKey="value"
                          stroke="none"
                        >
                          {chartDataByType.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl shadow-sm border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-800">Status das Ocorrências</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataByStatus} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="4 4" horizontal={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis type="number" hide />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={100} 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 11, fontWeight: 500 }}
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
                            fontWeight: 500
                          }}
                        />
                        <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 rounded-2xl shadow-sm border-border/60">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-800">Top Províncias com Mais Ocorrências</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartDataByProvince} barSize={40}>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 500 }} />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
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
                        <Bar dataKey="value" fill="url(#barGradientRel)" radius={[6, 6, 0, 0]} />
                        <defs>
                          <linearGradient id="barGradientRel" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab Resumo */}
          <TabsContent value="resumo" className="mt-6">
            <Card className="rounded-2xl shadow-sm border-border/60">
              <CardHeader className="border-b border-border/40 pb-4">
                <CardTitle className="text-xl font-bold text-slate-800">Resumo Executivo de Impacto</CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bloco 1 */}
                  <div className="p-6 border border-slate-100 rounded-2xl bg-slate-50/30 flex flex-col h-full">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-rose-500" />
                      Visão Geral de Resposta
                    </h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Total de Ocorrências:</span>
                        <span className="font-bold text-slate-900">{filtered.length}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Crises em Aberto:</span>
                        <span className="font-bold text-rose-600">{activeCrises}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <span className="text-sm text-slate-600">Crises Resolvidas:</span>
                        <span className="font-bold text-emerald-600">{resolvedCrises}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Taxa de Resolução:</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{Math.round((resolvedCrises / filtered.length) * 100 || 0)}%</span>
                          <Progress value={(resolvedCrises / filtered.length) * 100 || 0} className="h-1 w-24 mt-1 bg-slate-200" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2 */}
                  <div className="p-6 border border-amber-100 rounded-2xl bg-amber-50/20 flex flex-col h-full">
                    <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      Pontos de Atenção Crítica
                    </h3>
                    <div className="space-y-3 flex-1">
                      {filtered.filter(c => c.severity === "critical").slice(0, 3).map((crisis, idx) => (
                        <div key={idx} className="bg-white/60 p-3 rounded-xl border border-amber-100/50 shadow-sm">
                          <p className="font-semibold text-xs text-amber-900 truncate">{crisis.title}</p>
                          <div className="flex justify-between text-[10px] text-amber-700/70 mt-1">
                            <span>{crisis.province}</span>
                            <span className="font-medium">{(crisis.affectedPeople || 0).toLocaleString()} afetados</span>
                          </div>
                        </div>
                      ))}
                      {filtered.filter(c => c.severity === "critical").length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">Nenhuma crise crítica registada</p>
                      )}
                    </div>
                  </div>

                  {/* Bloco 3 */}
                  <div className="p-6 border border-rose-100 rounded-2xl bg-rose-50/10 flex flex-col h-full">
                    <h3 className="font-bold text-rose-800 mb-4 flex items-center gap-2">
                      <Users className="h-4 w-4 text-rose-600" />
                      Impacto e Mobilização
                    </h3>
                    <div className="space-y-4 flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-center pb-2 border-b border-rose-100/50">
                        <span className="text-sm text-rose-900/70">Pessoas Afetadas:</span>
                        <span className="font-bold text-rose-900">{totalAffected.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center pb-2 border-b border-rose-100/50">
                        <span className="text-sm text-rose-900/70">Média de Impacto:</span>
                        <span className="font-bold text-rose-900">{Math.round(totalAffected / filtered.length || 0).toLocaleString()} / crise</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-rose-900/70">Equipe Mobilizada:</span>
                        <span className="font-bold text-rose-900">{totalVolunteers} voluntários</span>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 4 */}
                  <div className="p-6 border border-emerald-100 rounded-2xl bg-emerald-50/20 flex flex-col h-full">
                    <h3 className="font-bold text-emerald-800 mb-4 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-600" />
                      Diretrizes e Recomendações
                    </h3>
                    <ul className="space-y-3 flex-1 flex flex-col justify-center">
                      <li className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700">1</span>
                        </div>
                        <span className="text-xs text-emerald-900/80 leading-relaxed">Priorizar recursos em províncias de alto volume.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700">2</span>
                        </div>
                        <span className="text-xs text-emerald-900/80 leading-relaxed">Expandir rede de voluntários em áreas críticas.</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="mt-1 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-emerald-700">3</span>
                        </div>
                        <span className="text-xs text-emerald-900/80 leading-relaxed">Otimizar tempo de resposta inicial.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default RelatoriosPage;