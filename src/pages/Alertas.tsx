// src/pages/Alertas.tsx
import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { toast } from "sonner";
import { Bell, AlertTriangle, Info, AlertCircle, CheckCircle, Eye, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Alerta {
    id: number;
    incidente_id: number;
    tipo: 'critico' | 'urgente' | 'aviso' | 'informativo';
    mensagem: string;
    data_envio: string;
    lido: boolean;
    incidente?: {
        id: number;
        title: string;
    };
}

const alertaIcons = {
    critico: AlertTriangle,
    urgente: AlertCircle,
    aviso: AlertCircle,
    informativo: Info,
};

const alertaCores = {
    critico: "bg-red-100 text-red-800 border-red-200",
    urgente: "bg-orange-100 text-orange-800 border-orange-200",
    aviso: "bg-yellow-100 text-yellow-800 border-yellow-200",
    informativo: "bg-blue-100 text-blue-800 border-blue-200",
};

const AlertasPage = () => {
    const [alertas, setAlertas] = useState<Alerta[]>([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadAlertas();
    }, []);

    const loadAlertas = async () => {
        try {
            const response = await api.get('/alertas');
            const data = response.data.data || response.data || [];
            setAlertas(data);
            setUnreadCount(data.filter((a: Alerta) => !a.lido).length);
        } catch (error) {
            console.error("Erro ao carregar alertas:", error);
            toast.error("Erro ao carregar alertas");
        } finally {
            setLoading(false);
        }
    };

    const marcarComoLido = async (id: number) => {
        try {
            await api.patch(`/alertas/${id}/read`);
            setAlertas(alertas.map(a => a.id === id ? { ...a, lido: true } : a));
            setUnreadCount(unreadCount - 1);
            toast.success("Alerta marcado como lido");
        } catch (error) {
            console.error("Erro ao marcar como lido:", error);
            toast.error("Erro ao marcar alerta como lido");
        }
    };

    const marcarTodosComoLidos = async () => {
        try {
            await api.patch('/alertas/read-all');
            setAlertas(alertas.map(a => ({ ...a, lido: true })));
            setUnreadCount(0);
            toast.success("Todos os alertas marcados como lidos");
        } catch (error) {
            console.error("Erro ao marcar todos como lidos:", error);
            toast.error("Erro ao marcar alertas como lidos");
        }
    };

    const getTimeAgo = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return "Agora";
        if (minutes < 60) return `${minutes} min atrás`;
        if (hours < 24) return `${hours} h atrás`;
        return `${days} d atrás`;
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center h-screen">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="p-4 lg:p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <Bell className="h-6 w-6" />
                            Alertas
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Central de notificações e alertas do sistema
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={marcarTodosComoLidos}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar todos como lidos ({unreadCount})
                        </Button>
                    )}
                </div>

                <Tabs defaultValue="todos" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="todos">Todos ({alertas.length})</TabsTrigger>
                        <TabsTrigger value="nao-lidos">Não lidos ({unreadCount})</TabsTrigger>
                        <TabsTrigger value="criticos">Críticos</TabsTrigger>
                    </TabsList>

                    <TabsContent value="todos" className="space-y-3">
                        {alertas.length === 0 ? (
                            <Card>
                                <CardContent className="py-8 text-center text-muted-foreground">
                                    Nenhum alerta encontrado
                                </CardContent>
                            </Card>
                        ) : (
                            alertas.map((alerta) => (
                                <Card key={alerta.id} className={`${!alerta.lido ? 'border-l-4 border-l-red-500' : ''}`}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-3">
                                                {React.createElement(alertaIcons[alerta.tipo] || Info, { 
                                                    className: `h-5 w-5 ${alerta.tipo === 'critico' ? 'text-red-500' : 'text-blue-500'}` 
                                                })}
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <Badge className={alertaCores[alerta.tipo]}>
                                                            {alerta.tipo.toUpperCase()}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            {getTimeAgo(alerta.data_envio)}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1">{alerta.mensagem}</p>
                                                    {alerta.incidente && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Incidente: {alerta.incidente.title}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {!alerta.lido && (
                                                <Button size="sm" variant="ghost" onClick={() => marcarComoLido(alerta.id)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="nao-lidos" className="space-y-3">
                        {alertas.filter(a => !a.lido).length === 0 ? (
                            <Card><CardContent className="py-8 text-center text-muted-foreground">Não há alertas não lidos</CardContent></Card>
                        ) : (
                            alertas.filter(a => !a.lido).map((alerta) => (
                                <Card key={alerta.id} className="border-l-4 border-l-red-500">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex gap-3">
                                                {React.createElement(alertaIcons[alerta.tipo] || Info, { className: "h-5 w-5 text-red-500" })}
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={alertaCores[alerta.tipo]}>{alerta.tipo.toUpperCase()}</Badge>
                                                        <span className="text-xs text-muted-foreground">{getTimeAgo(alerta.data_envio)}</span>
                                                    </div>
                                                    <p className="mt-1">{alerta.mensagem}</p>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="ghost" onClick={() => marcarComoLido(alerta.id)}><Eye className="h-4 w-4" /></Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="criticos" className="space-y-3">
                        {alertas.filter(a => a.tipo === 'critico').length === 0 ? (
                            <Card><CardContent className="py-8 text-center text-muted-foreground">Não há alertas críticos</CardContent></Card>
                        ) : (
                            alertas.filter(a => a.tipo === 'critico').map((alerta) => (
                                <Card key={alerta.id} className="border-l-4 border-l-red-500 bg-red-50">
                                    <CardContent className="p-4">
                                        <div className="flex gap-3">
                                            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                                            <div>
                                                <div className="flex items-center gap-2"><Badge className="bg-red-500 text-white">CRÍTICO</Badge><span className="text-xs text-muted-foreground">{getTimeAgo(alerta.data_envio)}</span></div>
                                                <p className="mt-1 font-bold">{alerta.mensagem}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
};

export default AlertasPage;