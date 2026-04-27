import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { AlertTriangle, MapPin, Calendar, Users, CheckCircle, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";

interface Incidente {
    id: number;
    title: string;
    descricao: string;
    status: string;
    latitude: string;
    longitude: string;
    categoria_id: number;
    municipio_id: number;
    created_at: string;
    categoria?: { id: number; nome: string };
    municipio?: { id: number; nome: string; provincia?: { id: number; nome: string } };
}

const getStatusConfig = (t: any): Record<string, { label: string; color: string }> => ({
    pendente: { label: t('pending'), color: "bg-yellow-100 text-yellow-800" },
    em_analise: { label: t('under_analysis'), color: "bg-blue-100 text-blue-800" },
    confirmado: { label: t('confirmed'), color: "bg-green-100 text-green-800" },
    em_andamento: { label: t('in_progress'), color: "bg-orange-100 text-orange-800" },
    resolvido: { label: t('resolved_status'), color: "bg-green-500 text-white" },
    encerrado: { label: t('closed'), color: "bg-gray-100 text-gray-800" },
    cancelado: { label: t('cancelled'), color: "bg-red-100 text-red-800" },
});

const CrisesPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const statusConfig = getStatusConfig(t);
    const [incidentes, setIncidentes] = useState<Incidente[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        loadIncidentes();
    }, []);

    const loadIncidentes = async () => {
        try {
            const response = await api.get('/incidentes');
            const data = response.data.data.data || response.data.data || [];
            setIncidentes(data);
        } catch (error) {
            console.error("Erro ao carregar incidentes:", error);
            toast.error(t('login_error')); // Fallback common error
        } finally {
            setLoading(false);
        }
    };

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(hours / 24);
        if (hours < 1) return t('now');
        if (hours < 24) return t('hours_ago', { count: hours });
        return t('days_ago', { count: days });
    };

    const filteredIncidentes = incidentes.filter(i => {
        const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || i.descricao?.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || i.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const activeCount = incidentes.filter(i => !['resolvido', 'encerrado', 'cancelado'].includes(i.status)).length;
    const resolvedCount = incidentes.filter(i => i.status === 'resolvido').length;

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-4 lg:p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <AlertTriangle className="h-6 w-6" />
                            {t('active_crises')}
                        </h1>
                        <p className="text-muted-foreground mt-1">{t('crisis_management')}</p>
                    </div>
                    <div className="flex gap-3">
                        <Badge className="bg-orange-100 text-orange-800 px-3 py-2">{activeCount} {t('active')}</Badge>
                        <Badge className="bg-green-100 text-green-800 px-3 py-2">{resolvedCount} {t('resolved')}</Badge>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <Input placeholder={t('search_crises')} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder={t('filter_status')} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">{t('all')}</SelectItem>
                            <SelectItem value="pendente">{t('pending')}</SelectItem>
                            <SelectItem value="em_analise">{t('under_analysis')}</SelectItem>
                            <SelectItem value="confirmado">{t('confirmed')}</SelectItem>
                            <SelectItem value="em_andamento">{t('in_progress')}</SelectItem>
                            <SelectItem value="resolvido">{t('resolved_status')}</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => navigate("/reportar")}>+ {t('new_incident')}</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredIncidentes.length === 0 ? (<Card><CardContent className="py-8 text-center text-muted-foreground">{t('no_crises_found')}</CardContent></Card>
                    ) : (
                        filteredIncidentes.map((incidente) => (
                            <Card key={incidente.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/crises/${incidente.id}`)}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2"><Badge className={statusConfig[incidente.status]?.color || "bg-gray-100"}>{statusConfig[incidente.status]?.label || incidente.status}</Badge><span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{getTimeAgo(incidente.created_at)}</span></div>
                                    <h3 className="font-bold text-lg mt-2">{incidente.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{incidente.descricao}</p>
                                    <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{incidente.municipio?.nome || "N/A"}</span>
                                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{incidente.categoria?.nome || "Sem categoria"}</span>
                                    </div>
                                    <div className="mt-3 flex gap-2">
                                        <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/crises/${incidente.id}`); }}>
                                            <Eye className="h-3 w-3 mr-1" />
                                            {t('view_details')}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
};

export default CrisesPage;