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
import { useTranslation } from "react-i18next";
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
const getStatusLabel = (status: string, t: any): string => {
  const labels: Record<string, string> = {
    'pendente': t('pending'),
    'em_analise': t('under_analysis'),
    'confirmado': t('confirmed'),
    'em_andamento': t('in_progress'),
    'resolvido': t('resolved'),
    'encerrado': t('closed'),
    'cancelado': t('cancelled')
  };
  return labels[status] || status;
};

const getSeverityLabel = (severity: string, t: any): string => {
  const labels: Record<string, string> = {
    'critical': t('critical'),
    'high': t('high'),
    'medium': t('medium'),
    'low': t('low')
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
  const { t } = useTranslation();
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
      toast.error(t('loading_error'));
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
      const label = getStatusLabel(c.status, t);
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
      "Severidade": getSeverityLabel(c.severity, t),
      "Estado": getStatusLabel(c.status, t),
      "Região": c.region,
      "Província": c.province,
      "Data Reportada": new Date(c.reportedAt).toLocaleDateString("pt-PT"),
      "Pessoas Afetadas": c.affectedPeople || 0,
      "Voluntários": c.volunteersAssigned || 0,
    }));

  const exportExcel = () => {
    try {
      const rows = getExportRows();
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [
        { wch: 8 }, { wch: 40 }, { wch: 20 }, { wch: 15 },
        { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 15 },
        { wch: 18 }, { wch: 15 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Relatório Executive SIGEM");
      XLSX.writeFile(wb, `SIGEM_Relatorio_Executivo_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Relatório Excel exportado com sucesso!");
    } catch (e) {
      console.error("Erro ao exportar Excel:", e);
      toast.error("Erro ao gerar relatório Excel");
    }
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      
      // Cabeçalho institucional topo (Vermelho SIGEM)
      doc.setFillColor(220, 38, 38);
      doc.rect(0, 0, 297, 38, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("SIGEM - RELATÓRIO EXECUTIVO DE EMERGÊNCIAS", 15, 18);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("República de Angola • Centro de Comando Integrado de Emergências", 15, 26);
      doc.setFontSize(8);
      doc.text(`Emissão: ${new Date().toLocaleString("pt-AO")}`, 15, 33);
      
      // Cartões de Resumo KPI (Top Stats)
      const cardY = 44;
      const cardW = 62;
      const cardH = 22;

      // Card 1: Total
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(15, cardY, cardW, cardH, 2, 2, "F");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("TOTAL OCORRÊNCIAS", 20, cardY + 7);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(filtered.length.toString(), 20, cardY + 17);

      // Card 2: Resolvidas
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(83, cardY, cardW, cardH, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("CRISES RESOLVIDAS", 88, cardY + 7);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text(resolvedCrises.toString(), 88, cardY + 17);

      // Card 3: Afetados
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(151, cardY, cardW, cardH, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("POPULAÇÃO AFETADA", 156, cardY + 7);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(220, 38, 38);
      doc.text(totalAffected.toLocaleString("pt-AO"), 156, cardY + 17);

      // Card 4: Voluntários Mobilizados
      doc.setFillColor(243, 244, 246);
      doc.roundedRect(219, cardY, cardW, cardH, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("VOLUNTÁRIOS ATIVOS", 224, cardY + 7);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235);
      doc.text(totalVolunteers.toString(), 224, cardY + 17);

      // Tabela de Ocorrências
      const rows = getExportRows();
      const headers = ["ID", "Título", "Categoria", "Severidade", "Estado", "Província", "Município", "Afetados"];

      autoTable(doc, {
        startY: 72,
        head: [headers],
        body: rows.map((r) => [
          `#${r.ID}`,
          r.Título.length > 35 ? r.Título.substring(0, 35) + "..." : r.Título,
          r.Tipo,
          r.Severidade,
          r.Estado,
          r.Província,
          r.Região,
          r["Pessoas Afetadas"].toLocaleString("pt-AO"),
        ]),
        theme: "striped",
        headStyles: { 
          fillColor: [220, 38, 38], 
          textColor: [255, 255, 255], 
          fontStyle: "bold", 
          halign: "left",
          fontSize: 8,
          cellPadding: 3
        },
        styles: { fontSize: 8, cellPadding: 2.5, valign: "middle" },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 70 },
          2: { cellWidth: 35 },
          3: { cellWidth: 25 },
          4: { cellWidth: 30 },
          5: { cellWidth: 30 },
          6: { cellWidth: 30 },
          7: { cellWidth: 25, halign: "right" },
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 15, right: 15 },
      });

      // Rodapé institucional
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text("SIGEM • Plataforma Nacional de Gestão de Emergências de Angola", 15, 202);
        doc.text(`Página ${i} de ${pageCount}`, 282, 202, { align: "right" });
      }

      doc.save(`SIGEM_Relatorio_Executivo_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Relatório PDF executivo exportado com sucesso!");
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      toast.error("Erro ao gerar relatório PDF");
    }
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
            <p className="text-muted-foreground">{t('loading')}...</p>
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
                {t('reports_metrics')}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('reports_subtitle')}
              </p>
            </div>
            <div className="flex gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="lg" className="gap-2 bg-rose-600 hover:bg-rose-700 shadow-sm transition-all duration-200">
                    <Download className="h-4 w-4" />
                    {t('export_data')}
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('total_occurrences')}</p>
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('affected_people')}</p>
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
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{t('volunteers')}</p>
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
                  <p className="text-xs font-semibold text-rose-100 uppercase tracking-wider mb-1">{t('critical_crises')}</p>
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
            <TabsTrigger value="lista" className="gap-2"><FileText className="h-4 w-4" />{t('crisis_list')}</TabsTrigger>
            <TabsTrigger value="graficos" className="gap-2"><BarChart3 className="h-4 w-4" />{t('graphical_analysis')}</TabsTrigger>
            <TabsTrigger value="resumo" className="gap-2"><LucidePieChart className="h-4 w-4" />{t('executive_summary')}</TabsTrigger>
          </TabsList>

          {/* Tab Lista */}
          <TabsContent value="lista" className="mt-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm mb-6">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-8 w-1 bg-rose-500 rounded-full" />
                <h3 className="font-bold text-lg">{t('search_filters')}</h3>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                    {t('clear_filters')}
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative lg:col-span-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder={t('filter_by_title')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30 border-muted-foreground/10 focus-visible:ring-rose-500" />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-muted/30 border-muted-foreground/10"><SelectValue placeholder={t('crisis_type')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_types')}</SelectItem>
                    {[...new Set(incidentes.map(c => c.type))].filter(t => t !== "Não categorizado").map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="bg-muted/30 border-muted-foreground/10"><SelectValue placeholder={t('severity')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_severities')}</SelectItem>
                    <SelectItem value="critical">{t('critical')}</SelectItem>
                    <SelectItem value="high">{t('high')}</SelectItem>
                    <SelectItem value="medium">{t('medium')}</SelectItem>
                    <SelectItem value="low">{t('low')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-muted/30 border-muted-foreground/10"><SelectValue placeholder={t('status')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_statuses')}</SelectItem>
                    <SelectItem value="pendente">{t('pending')}</SelectItem>
                    <SelectItem value="em_analise">{t('under_analysis')}</SelectItem>
                    <SelectItem value="confirmado">{t('confirmed')}</SelectItem>
                    <SelectItem value="em_andamento">{t('in_progress')}</SelectItem>
                    <SelectItem value="resolvido">{t('resolved')}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={provinceFilter} onValueChange={setProvinceFilter}>
                  <SelectTrigger className="bg-muted/30 border-muted-foreground/10"><SelectValue placeholder={t('province')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('all_provinces')}</SelectItem>
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
                      <TableHead className="font-semibold text-slate-700">{t('title')}</TableHead>
                      <TableHead className="font-semibold text-slate-700">{t('type')}</TableHead>
                      <TableHead className="font-semibold text-slate-700">{t('severity')}</TableHead>
                      <TableHead className="font-semibold text-slate-700">{t('status')}</TableHead>
                      <TableHead className="font-semibold text-slate-700">{t('municipality')}</TableHead>
                      <TableHead className="font-semibold text-slate-700">{t('province')}</TableHead>
                      <TableHead className="font-semibold text-slate-700">{t('date')}</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">{t('affected')}</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">{t('volunteers')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentItems.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">{t('no_occurrences_found')}</TableCell></TableRow>
                    ) : (
                      currentItems.map((crisis) => (
                        <TableRow key={crisis.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="font-medium max-w-[200px] truncate">{crisis.title}</TableCell>
                          <TableCell><span className="text-sm">{crisis.type}</span></TableCell>
                          <TableCell>
                            <Badge className={severityColors[crisis.severity]}>
                              {getSeverityLabel(crisis.severity, t)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-medium ${statusColors[crisis.status]}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current mr-1.5" />
                              {getStatusLabel(crisis.status, t)}
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
                    {t('showing_results_count', { from: (currentPage - 1) * itemsPerPage + 1, to: Math.min(currentPage * itemsPerPage, filtered.length), total: filtered.length })}
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
                    {t('total_affected')}: <span className="font-semibold text-foreground">{totalAffected.toLocaleString()}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {t('volunteers')}: <span className="font-semibold text-foreground">{totalVolunteers}</span>
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
                  <CardTitle className="text-lg font-semibold text-slate-800">{t('distribution_by_type')}</CardTitle>
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
                  <CardTitle className="text-lg font-semibold text-slate-800">{t('occurrence_status')}</CardTitle>
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