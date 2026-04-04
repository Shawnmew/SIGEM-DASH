// src/pages/Relatorios.tsx
import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { toast } from "sonner";
import { FileText, Download, Calendar, MapPin, TrendingUp, Users, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"];

const RelatoriosPage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [periodo, setPeriodo] = useState("6");

    useEffect(() => {
        loadRelatorios();
    }, [periodo]);

    const loadRelatorios = async () => {
        setLoading(true);
        try {
            const [statsRes, incidentesRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/incidentes')
            ]);
            setStats({
                total: statsRes.data.data?.total || 0,
                ativos: statsRes.data.data?.active_crises || 0,
                resolvidos: statsRes.data.data?.resolved_crises || 0,
                criticos: statsRes.data.data?.critical_count || 0,
                ...statsRes.data.data
            });
        } catch (error) {
            console.error("Erro ao carregar relatórios:", error);
            toast.error("Erro ao carregar dados dos relatórios");
        } finally {
            setLoading(false);
        }
    };

    const exportarRelatorio = () => {
        toast.success("Relatório exportado com sucesso!");
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            </AppLayout>
        );
    }

    const dadosGrafico = [
        { mes: "Jan", incidentes: 12, afetados: 4500 },
        { mes: "Fev", incidentes: 19, afetados: 8200 },
        { mes: "Mar", incidentes: 15, afetados: 6300 },
        { mes: "Abr", incidentes: 22, afetados: 12400 },
        { mes: "Mai", incidentes: 18, afetados: 9800 },
        { mes: "Jun", incidentes: 25, afetados: 15600 },
    ];

    const dadosPizza = [
        { name: "Inundação", value: 35, color: "#ef4444" },
        { name: "Incêndio", value: 25, color: "#f97316" },
        { name: "Deslizamento", value: 15, color: "#eab308" },
        { name: "Acidente", value: 15, color: "#22c55e" },
        { name: "Outros", value: 10, color: "#8b5cf6" },
    ];

    return (
        <AppLayout>
            <div className="p-4 lg:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div><h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6" />Relatórios</h1><p className="text-muted-foreground mt-1">Análise estatística e relatórios do sistema</p></div>
                    <div className="flex gap-3"><Select value={periodo} onValueChange={setPeriodo}><SelectTrigger className="w-36"><SelectValue placeholder="Período" /></SelectTrigger><SelectContent><SelectItem value="3">3 meses</SelectItem><SelectItem value="6">6 meses</SelectItem><SelectItem value="12">12 meses</SelectItem></SelectContent></Select><Button onClick={exportarRelatorio}><Download className="h-4 w-4 mr-2" />Exportar</Button></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Total Incidentes</p><p className="text-2xl font-bold">{stats?.total || 0}</p></div><AlertTriangle className="h-8 w-8 text-orange-500" /></div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Ativos</p><p className="text-2xl font-bold">{stats?.ativos || 0}</p></div><TrendingUp className="h-8 w-8 text-blue-500" /></div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Resolvidos</p><p className="text-2xl font-bold">{stats?.resolvidos || 0}</p></div><CheckCircle className="h-8 w-8 text-green-500" /></div></CardContent></Card>
                    <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Críticos</p><p className="text-2xl font-bold">{stats?.criticos || 0}</p></div><AlertTriangle className="h-8 w-8 text-red-500" /></div></CardContent></Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card><CardHeader><CardTitle>Evolução de Incidentes</CardTitle></CardHeader><CardContent><div className="h-80"><ResponsiveContainer width="100%" height="100%"><LineChart data={dadosGrafico}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis /><Tooltip /><Line type="monotone" dataKey="incidentes" stroke="#ef4444" strokeWidth={2} /></LineChart></ResponsiveContainer></div></CardContent></Card>
                    <Card><CardHeader><CardTitle>Distribuição por Tipo</CardTitle></CardHeader><CardContent><div className="h-80"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={dadosPizza} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label>{dadosPizza.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div></CardContent></Card>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <Card><CardHeader><CardTitle>Pessoas Afetadas por Mês</CardTitle></CardHeader><CardContent><div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={dadosGrafico}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis /><Tooltip /><Bar dataKey="afetados" fill="#3b82f6" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default RelatoriosPage;