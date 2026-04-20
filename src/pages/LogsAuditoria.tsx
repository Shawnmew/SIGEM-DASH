import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Download,
  Filter,
  RefreshCw,
  Calendar,
  User,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  Trash2,
} from "lucide-react";

interface Log {
  id: number;
  event: string;
  description: string;
  status: string;
  channel: string;
  ip_address: string;
  user_agent: string;
  properties: any;
  created_at: string;
  user: {
    id: number;
    nome: string;
    sobrenome: string;
    email: string;
    nome_completo: string;
  } | null;
}

interface Stats {
  total: number;
  last_24h: number;
  last_7d: number;
  by_event: Array<{ event: string; total: number }>;
  by_status: Array<{ status: string; total: number }>;
  by_channel: Array<{ channel: string; total: number }>;
}

interface UserOption {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
}

const eventLabels: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  created: "Criação",
  updated: "Atualização",
  deleted: "Eliminação",
  viewed: "Visualização",
  sent: "Envio",
  received: "Recebimento",
};

const statusConfig: Record<string, { label: string; color: string; icon: JSX.Element }> = {
  success: { label: "Sucesso", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle className="h-3 w-3" /> },
  failed: { label: "Falha", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: <XCircle className="h-3 w-3" /> },
  warning: { label: "Aviso", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <AlertCircle className="h-3 w-3" /> },
};

const channelLabels: Record<string, string> = {
  general: "Geral",
  system: "Sistema",
  security: "Segurança",
  audit: "Auditoria",
};

const LogsAuditoriaPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();

  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearDays, setClearDays] = useState(30);
  const [clearing, setClearing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [userIdFilter, setUserIdFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [page, setPage] = useState(1);

  // Filter options
  const [eventOptions, setEventOptions] = useState<{ value: string; label: string }[]>([]);
  const [statusOptions, setStatusOptions] = useState<{ value: string; label: string; color: string }[]>([]);
  const [channelOptions, setChannelOptions] = useState<{ value: string; label: string }[]>([]);

  if (!authLoading && !isAdmin) {
    toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
    return <Navigate to="/" replace />;
  }

  const fetchFilterOptions = async () => {
    try {
      const [eventsRes, statusesRes, channelsRes] = await Promise.all([
        api.get("/admin/logs/events"),
        api.get("/admin/logs/statuses"),
        api.get("/admin/logs/channels"),
      ]);
      setEventOptions(eventsRes.data.data || []);
      setStatusOptions(statusesRes.data.data || []);
      setChannelOptions(channelsRes.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar opções de filtro:", error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        per_page: 20,
      };
      if (search) params.search = search;
      if (eventFilter !== "all") params.event = eventFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (channelFilter !== "all") params.channel = channelFilter;
      if (userIdFilter !== "all") params.user_id = userIdFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await api.get("/admin/logs", { params });
      
      if (response.data.success) {
        setLogs(response.data.data.logs.data || []);
        setStats(response.data.data.stats);
        setUsers(response.data.data.users || []);
        setMeta({
          current_page: response.data.data.logs.current_page,
          last_page: response.data.data.logs.last_page,
          per_page: response.data.data.logs.per_page,
          total: response.data.data.logs.total,
          from: response.data.data.logs.from,
          to: response.data.data.logs.to,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      toast.error("Erro ao carregar logs de auditoria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFilterOptions();
      fetchLogs();
    }
  }, [page, eventFilter, statusFilter, channelFilter, userIdFilter, dateFrom, dateTo, isAdmin]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch("");
    setEventFilter("all");
    setStatusFilter("all");
    setChannelFilter("all");
    setUserIdFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    setTimeout(() => fetchLogs(), 0);
  };

  const handleExport = async () => {
    try {
      const params: any = {};
      if (eventFilter !== "all") params.event = eventFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const response = await api.get("/admin/logs/export", {
        params,
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `logs_auditoria_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success("Logs exportados com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar logs:", error);
      toast.error("Erro ao exportar logs");
    }
  };

  const handleClearOldLogs = async () => {
    setClearing(true);
    try {
      const response = await api.delete("/admin/logs/clear-old", {
        data: { days: clearDays },
      });
      if (response.data.success) {
        toast.success(response.data.message);
        setShowClearModal(false);
        fetchLogs();
      }
    } catch (error) {
      console.error("Erro ao limpar logs:", error);
      toast.error("Erro ao limpar logs antigos");
    } finally {
      setClearing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.success;
    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const getEventLabel = (event: string) => {
    return eventLabels[event] || event;
  };

  const getChannelLabel = (channel: string) => {
    return channelLabels[channel] || channel;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-AO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const hasActiveFilters =
    search !== "" ||
    eventFilter !== "all" ||
    statusFilter !== "all" ||
    channelFilter !== "all" ||
    userIdFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold dark:text-white">Logs de Auditoria</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Histórico completo de atividades do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="destructive" onClick={() => setShowClearModal(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Logs Antigos
            </Button>
            <Button variant="outline" onClick={fetchLogs}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Últimas 24h</p>
                <p className="text-2xl font-bold">{stats?.last_24h || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
                <p className="text-2xl font-bold">{stats?.last_7d || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventos Distintos</p>
                <p className="text-2xl font-bold">{stats?.by_event?.length || 0}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Filtros</h3>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters}>
              Limpar Filtros
            </Button>
          )}
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="col-span-1 md:col-span-2"
            />
            
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger><SelectValue placeholder="Evento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os eventos</SelectItem>
                {eventOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statusOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                {channelOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={userIdFilter} onValueChange={setUserIdFilter}>
              <SelectTrigger><SelectValue placeholder="Usuário" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os usuários</SelectItem>
                {users.map(user => (
                  <SelectItem key={user.id} value={String(user.id)}>
                    {user.nome} {user.sobrenome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              placeholder="Data inicial"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              placeholder="Data final"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Aplicar Filtros</Button>
          </div>
        </form>
      </div>

      {/* Logs Table */}
      <div className="bg-card rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2">Carregando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Nenhum log encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.id}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {formatDate(log.created_at)}
                    </TableCell>
                    <TableCell>
                      {log.user?.nome_completo || "Sistema"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getEventLabel(log.event)}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {log.description}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {getChannelLabel(log.channel)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {log.ip_address || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowDetailsModal(true);
                        }}
                      >
                        Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {meta && meta.last_page > 1 && (
          <Pagination className="p-4 border-t">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(meta.last_page, 7) }, (_, i) => {
                let pageNum = i + 1;
                if (pageNum <= meta.last_page && pageNum > 0) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={page === pageNum}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                  className={page === meta.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {meta && (
          <div className="p-4 text-xs text-muted-foreground text-center border-t">
            Mostrando {meta.from} a {meta.to} de {meta.total} logs
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Log</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="text-sm font-medium">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data/Hora</p>
                  <p className="text-sm font-medium">{formatDate(selectedLog.created_at)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Usuário</p>
                  <p className="text-sm font-medium">
                    {selectedLog.user?.nome_completo || "Sistema"}
                    {selectedLog.user?.email && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({selectedLog.user.email})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Evento</p>
                  <p className="text-sm font-medium">{getEventLabel(selectedLog.event)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Canal</p>
                  <Badge variant="secondary">{getChannelLabel(selectedLog.channel)}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">IP Address</p>
                  <p className="text-sm font-mono">{selectedLog.ip_address || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">User Agent</p>
                  <p className="text-xs font-mono break-all">{selectedLog.user_agent || "-"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Descrição</p>
                  <p className="text-sm">{selectedLog.description}</p>
                </div>
                {selectedLog.properties && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Propriedades</p>
                    <pre className="text-xs bg-muted p-2 rounded-lg overflow-x-auto">
                      {JSON.stringify(selectedLog.properties, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Limpeza de Logs */}
      <Dialog open={showClearModal} onOpenChange={setShowClearModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpar Logs Antigos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta ação removerá permanentemente todos os logs com mais de X dias.
              Esta operação não pode ser desfeita.
            </p>
            <div>
              <label className="block text-sm font-medium mb-2">
                Remover logs com mais de (dias):
              </label>
              <Input
                type="number"
                min={1}
                max={365}
                value={clearDays}
                onChange={(e) => setClearDays(parseInt(e.target.value) || 30)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowClearModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleClearOldLogs}
              disabled={clearing}
            >
              {clearing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Limpando...
                </div>
              ) : (
                "Confirmar Limpeza"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default LogsAuditoriaPage;