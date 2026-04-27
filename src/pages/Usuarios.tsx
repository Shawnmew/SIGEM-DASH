import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Settings, 
  AlertTriangle, 
  Trash, 
  RefreshCcw,
  ShieldCheck
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { dashboardService } from "@/services/dashboardService";

interface Usuario {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  status: string;
  tipo?: string;
  municipio?: string;
  municipio_id?: number;
  created_at?: string;
  reputation_score?: number;
  suspended_until?: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

interface FormErrors {
  nome?: string;
  sobrenome?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
  telefone?: string;
  tipo?: string;
  municipio_id?: string;
  nif?: string;
}

interface NewUser {
  nome: string;
  sobrenome: string;
  email: string;
  password: string;
  password_confirmation: string;
  telefone: string;
  tipo: string;
  municipio_id: string;
  status: string;
  nif: string;
}

const UsuariosPage = () => {
  const { user: currentUser, loading: authLoading, isAdmin } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showPenalize, setShowPenalize] = useState(false);
  const [penaltyReason, setPenaltyReason] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [statusToApprove, setStatusToApprove] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const [newUser, setNewUser] = useState<NewUser>({
    nome: "",
    sobrenome: "",
    email: "",
    password: "",
    password_confirmation: "",
    telefone: "",
    tipo: "cidadao",
    municipio_id: "",
    status: "pendente",
    nif: ""
  });

  const [loadingNif, setLoadingNif] = useState(false);

  if (!authLoading && !isAdmin) {
    toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
    return <Navigate to="/" replace />;
  }

  const fetchMunicipios = async () => {
    setLoadingMunicipios(true);
    try {
      const response = await api.get("/municipios");
      console.log("Municípios carregados:", response.data);
      setMunicipios(response.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar municípios:", error);
      toast.error("Erro ao carregar municípios");
    } finally {
      setLoadingMunicipios(false);
    }
  };

  const fetchUsuarios = async (pageNum = 1, searchTerm = "", tipoFiltro = "all", statusFiltro = "all") => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, search: searchTerm };
      if (tipoFiltro !== "all") params.tipo = tipoFiltro;
      if (statusFiltro !== "all") params.status = statusFiltro;
      
      const res = await api.get("/admin/users", { params });
      
      // CORREÇÃO: Acessar os dados corretamente independente da estrutura
      let usersArray = [];
      let metaData = null;
      
      if (res.data.data?.users?.data) {
        usersArray = res.data.data.users.data;
        metaData = {
          current_page: res.data.data.users.current_page,
          last_page: res.data.data.users.last_page,
          per_page: res.data.data.users.per_page,
          total: res.data.data.users.total,
          from: res.data.data.users.from,
          to: res.data.data.users.to,
        };
      } else if (res.data.data?.users && Array.isArray(res.data.data.users)) {
        usersArray = res.data.data.users;
        metaData = res.data.meta;
      } else if (res.data.users && Array.isArray(res.data.users)) {
        usersArray = res.data.users;
        metaData = res.data.meta;
      } else if (res.data.data && Array.isArray(res.data.data)) {
        usersArray = res.data.data;
        metaData = res.data.meta;
      } else {
        usersArray = [];
        metaData = null;
      }
      
      setUsuarios(usersArray);
      setMeta(metaData);
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
      setUsuarios([]);
      setMeta(null);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsuarios(page, search, tipo, status);
      fetchMunicipios();
    }
  }, [page, tipo, status, isAdmin]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsuarios(1, search, tipo, status);
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    
    if (!newUser.nome.trim()) errors.nome = "Nome é obrigatório";
    if (!newUser.sobrenome.trim()) errors.sobrenome = "Sobrenome é obrigatório";
    if (!newUser.email.trim()) errors.email = "Email é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(newUser.email)) errors.email = "Email inválido";
    
    if (!newUser.password) errors.password = "Senha é obrigatória";
    else if (newUser.password.length < 6) errors.password = "Senha deve ter pelo menos 6 caracteres";
    
    if (!newUser.password_confirmation) errors.password_confirmation = "Confirmação de senha é obrigatória";
    else if (newUser.password !== newUser.password_confirmation) errors.password_confirmation = "As senhas não conferem";
    
    if (!newUser.tipo) errors.tipo = "Tipo de usuário é obrigatório";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNifLookup = async () => {
    const nif = newUser.nif.trim();
    if (nif.length < 9) return;

    setLoadingNif(true);
    try {
      const response = await api.get('/nif', { params: { nif } });
      if (response.data.success && response.data.data) {
        const { nome } = response.data.data;
        // Split name into nome and sobrenome
        const parts = nome.trim().split(' ');
        const first = parts[0];
        const last = parts.length > 1 ? parts.slice(1).join(' ') : "";
        
        setNewUser({
          ...newUser,
          nome: first,
          sobrenome: last
        });
        toast.success("Dados do NIF carregados automaticamente.");
      }
    } catch (error) {
      console.error("Erro ao buscar NIF:", error);
      // Don't show toast error here to not be annoying if they just typed it wrong
    } finally {
      setLoadingNif(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const userData = {
        nome: newUser.nome.trim(),
        sobrenome: newUser.sobrenome.trim(),
        email: newUser.email.trim(),
        password: newUser.password,
        password_confirmation: newUser.password_confirmation,
        telefone: newUser.telefone?.trim() || null,
        tipo: newUser.tipo,
        municipio_id: newUser.municipio_id ? parseInt(newUser.municipio_id) : null,
        status: newUser.status
      };

      const response = await api.post("/admin/users", userData);
      
      if (response.status === 201 || response.status === 200) {
        setShowCreate(false);
        setNewUser({
          nome: "", sobrenome: "", email: "", password: "", password_confirmation: "",
          telefone: "", tipo: "cidadao", municipio_id: "", status: "pendente", nif: ""
        });
        setFormErrors({});
        fetchUsuarios(1, search, tipo, status);
        setPage(1);
        toast.success("Usuário cadastrado com sucesso!");
      }
    } catch (err: any) {
      if (err.response?.status === 422) {
        const backendErrors = err.response.data.errors;
        const newErrors: FormErrors = {};
        if (backendErrors) {
          Object.keys(backendErrors).forEach(key => {
            newErrors[key as keyof FormErrors] = backendErrors[key][0];
          });
          setFormErrors(newErrors);
        }
        toast.error("Erro de validação: Verifique os campos destacados.");
      } else if (err.response?.status === 409) {
        toast.error("Email já cadastrado no sistema.");
      } else {
        toast.error("Erro ao cadastrar usuário.");
      }
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      const updateData = {
        nome: editUser.nome,
        sobrenome: editUser.sobrenome,
        email: editUser.email,
        telefone: editUser.telefone,
        tipo: editUser.tipo
      };
      
      await api.put(`/admin/users/${editUser.id}`, updateData);
      setShowEdit(false);
      fetchUsuarios(page, search, tipo, status);
      toast.success("Usuário atualizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar usuário.");
    }
  };

  const handleStatusChange = async () => {
    if (!selectedUser) return;

    try {
      await api.patch(`/admin/users/${selectedUser.id}/status`, { status: statusToApprove });
      setShowApprove(false);
      fetchUsuarios(page, search, tipo, status);
      toast.success(`Status alterado para ${statusToApprove} com sucesso!`);
    } catch (err) {
      toast.error("Erro ao alterar status.");
    }
  };

  const handlePenalizeUser = async () => {
    if (!selectedUser) return;
    if (!penaltyReason.trim()) {
      toast.error("Informe o motivo da penalização.");
      return;
    }

    try {
      await api.post(`/admin/users/${selectedUser.id}/penalize`, { reason: penaltyReason });
      setShowPenalize(false);
      setPenaltyReason("");
      fetchUsuarios(page, search, tipo, status);
      toast.success("Usuário penalizado com sucesso!");
    } catch (err) {
      toast.error("Erro ao penalizar usuário.");
    }
  };

  const handleRecoverUser = async (id: number) => {
    if (!confirm("Deseja recuperar a conta deste usuário e restaurar sua reputação?")) return;

    try {
      await dashboardService.recoverUserAccount(id);
      fetchUsuarios(page, search, tipo, status);
      toast.success("Conta recuperada com sucesso!");
    } catch (err) {
      toast.error("Erro ao recuperar conta.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;

    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsuarios(page, search, tipo, status);
      toast.success("Usuário removido com sucesso!");
    } catch (err) {
      toast.error("Erro ao remover usuário.");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      activo: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
      inactivo: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400",
      bloqueado: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
      pendente: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
      suspenso: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400",
      removido: "bg-red-500 text-white"
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config[status] || config.pendente}`}>
      {status === 'activo' ? 'Ativo' : 
       status === 'inactivo' ? 'Inativo' : 
       status === 'bloqueado' ? 'Bloqueado' : 
       status === 'suspenso' ? 'Suspenso' :
       status === 'removido' ? 'Removido' : 'Pendente'}
    </span>;
  };

  const getTipoBadge = (tipo: string) => {
    const config: Record<string, string> = {
      admin: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400",
      operador: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
      voluntario: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
      cidadao: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-400"
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config[tipo] || config.cidadao}`}>
      {tipo === 'admin' ? 'Admin' : tipo === 'operador' ? 'Operador' : tipo === 'voluntario' ? 'Voluntário' : 'Cidadão'}
    </span>;
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold dark:text-white flex items-center gap-2">
              Usuários
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded-full">Admin</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão de usuários do sistema</p>
          </div>
          <span className="text-xs text-muted-foreground">Total: {meta?.total || 0} usuários</span>
        </div>
      </div>
      
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-center">
            <Input 
              placeholder="Buscar por nome, email ou telefone..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-64" 
            />
            <Select value={tipo} onValueChange={value => { setTipo(value); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="operador">Operador</SelectItem>
                <SelectItem value="voluntario">Voluntário</SelectItem>
                <SelectItem value="cidadao">Cidadão</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={value => { setStatus(value); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Ativo</SelectItem>
                <SelectItem value="inactivo">Inativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="suspenso">Suspenso</SelectItem>
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
                <SelectItem value="removido">Removido</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">Buscar</Button>
          </form>
          
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-primary">+ Novo Usuário</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Cadastrar Novo Usuário</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="relative">
                    <Label>NIF / BI (Preenchimento Automático)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={newUser.nif} 
                        onChange={e => setNewUser({...newUser, nif: e.target.value})} 
                        onBlur={handleNifLookup}
                        placeholder="Digite o NIF para carregar os dados"
                        maxLength={14}
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleNifLookup}
                        disabled={loadingNif || newUser.nif.length < 9}
                      >
                        {loadingNif ? <RefreshCcw className="h-4 w-4 animate-spin" /> : "Verificar"}
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nome *</Label><Input value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})} className={formErrors.nome ? "border-red-500" : ""} />{formErrors.nome && <p className="text-xs text-red-500">{formErrors.nome}</p>}</div>
                  <div><Label>Sobrenome *</Label><Input value={newUser.sobrenome} onChange={e => setNewUser({...newUser, sobrenome: e.target.value})} className={formErrors.sobrenome ? "border-red-500" : ""} />{formErrors.sobrenome && <p className="text-xs text-red-500">{formErrors.sobrenome}</p>}</div>
                </div>
                <div><Label>Email *</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className={formErrors.email ? "border-red-500" : ""} />{formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}</div>
                <div><Label>Senha *</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className={formErrors.password ? "border-red-500" : ""} />{formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}</div>
                <div><Label>Confirmar Senha *</Label><Input type="password" value={newUser.password_confirmation} onChange={e => setNewUser({...newUser, password_confirmation: e.target.value})} className={formErrors.password_confirmation ? "border-red-500" : ""} />{formErrors.password_confirmation && <p className="text-xs text-red-500">{formErrors.password_confirmation}</p>}</div>
                <div><Label>Telefone</Label><Input value={newUser.telefone} onChange={e => setNewUser({...newUser, telefone: e.target.value})} placeholder="+244 9XX XXX XXX" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tipo *</Label><Select value={newUser.tipo} onValueChange={value => setNewUser({...newUser, tipo: value})}><SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger><SelectContent><SelectItem value="admin">Administrador</SelectItem><SelectItem value="operador">Operador</SelectItem><SelectItem value="voluntario">Voluntário</SelectItem><SelectItem value="cidadao">Cidadão</SelectItem></SelectContent></Select>{formErrors.tipo && <p className="text-xs text-red-500">{formErrors.tipo}</p>}</div>
                  <div><Label>Status</Label><Select value={newUser.status} onValueChange={value => setNewUser({...newUser, status: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="activo">Ativo</SelectItem><SelectItem value="inactivo">Inativo</SelectItem><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="bloqueado">Bloqueado</SelectItem></SelectContent></Select></div>
                </div>
                <div><Label>Município</Label>
                  <Select value={newUser.municipio_id || "none"} onValueChange={value => setNewUser({...newUser, municipio_id: value === "none" ? "" : value})}>
                    <SelectTrigger><SelectValue placeholder={loadingMunicipios ? "Carregando..." : "Selecione o município"} /></SelectTrigger>
                    <SelectContent className="max-h-64">
                      <SelectItem value="none">Nenhum</SelectItem>
                      {municipios.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter><Button type="submit">Cadastrar</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border">
                <TableHead className="text-foreground">ID</TableHead>
                <TableHead className="text-foreground">Nome</TableHead>
                <TableHead className="text-foreground">Email</TableHead>
                <TableHead className="text-foreground">Telefone</TableHead>
                <TableHead className="text-foreground">Tipo</TableHead>
                <TableHead className="text-foreground">Reputação</TableHead>
                <TableHead className="text-foreground">Status</TableHead>
                <TableHead className="text-right text-foreground">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span className="ml-2 text-muted-foreground">Carregando...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                usuarios.map(usuario => (
                  <TableRow key={usuario.id} className="border-b border-border">
                    <TableCell className="text-foreground">{usuario.id}</TableCell>
                    <TableCell className="font-medium text-foreground">{usuario.nome} {usuario.sobrenome}</TableCell>
                    <TableCell className="text-foreground">{usuario.email}</TableCell>
                    <TableCell className="text-foreground">{usuario.telefone || "-"}</TableCell>
                    <TableCell>{getTipoBadge(usuario.tipo || "cidadao")}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold">{Math.round((usuario.reputation_score || 0) * 100)}%</span>
                            <div className="w-12 bg-secondary rounded-full h-1">
                                <div 
                                    className={`h-1 rounded-full ${
                                        (usuario.reputation_score || 0) > 0.7 ? 'bg-green-500' : 
                                        (usuario.reputation_score || 0) > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} 
                                    style={{ width: `${(usuario.reputation_score || 0) * 100}%` }}
                                />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setShowDetails(true); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>Ver Detalhes</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => { setEditUser(usuario); setShowEdit(true); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setStatusToApprove(usuario.status); setShowApprove(true); }}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Alterar Status</span>
                          </DropdownMenuItem>
                          
                          {usuario.tipo === 'cidadao' && (
                            <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setShowPenalize(true); }} className="text-orange-600 focus:text-orange-600">
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              <span>Penalizar</span>
                            </DropdownMenuItem>
                          )}

                          {['suspenso', 'removido', 'bloqueado', 'inactivo'].includes(usuario.status) && (
                            <DropdownMenuItem onClick={() => handleRecoverUser(usuario.id)} className="text-green-600 focus:text-green-600">
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              <span>Recuperar Conta</span>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuSeparator />
                          
                          {currentUser?.id !== usuario.id && (
                            <DropdownMenuItem onClick={() => handleDeleteUser(usuario.id)} className="text-red-600 focus:text-red-600 font-medium">
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Remover</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Modais fora do loop para melhor performance */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent>
            <DialogHeader><DialogTitle>Detalhes do Usuário</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
                  {selectedUser?.nome?.[0]}{selectedUser?.sobrenome?.[0]}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{selectedUser?.nome} {selectedUser?.sobrenome}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser?.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">ID</p>
                  <p className="text-sm font-medium">{selectedUser?.id}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Telefone</p>
                  <p className="text-sm font-medium">{selectedUser?.telefone || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Tipo de Conta</p>
                  <div>{selectedUser && getTipoBadge(selectedUser.tipo || "cidadao")}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div>{selectedUser && getStatusBadge(selectedUser.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Reputação</p>
                  <p className="text-sm font-bold text-primary">{Math.round((selectedUser?.reputation_score || 0) * 100)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Membro desde</p>
                  <p className="text-sm font-medium">{selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowDetails(false)}>Fechar</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-3 pt-4">
              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={editUser?.nome || ""} onChange={e => setEditUser(prev => prev ? {...prev, nome: e.target.value} : null)} placeholder="Nome" />
              </div>
              <div className="space-y-1">
                <Label>Sobrenome</Label>
                <Input value={editUser?.sobrenome || ""} onChange={e => setEditUser(prev => prev ? {...prev, sobrenome: e.target.value} : null)} placeholder="Sobrenome" />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={editUser?.email || ""} onChange={e => setEditUser(prev => prev ? {...prev, email: e.target.value} : null)} placeholder="Email" />
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                <Input value={editUser?.telefone || ""} onChange={e => setEditUser(prev => prev ? {...prev, telefone: e.target.value} : null)} placeholder="Telefone" />
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select value={editUser?.tipo || "cidadao"} onValueChange={value => setEditUser(prev => prev ? {...prev, tipo: value} : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="voluntario">Voluntário</SelectItem>
                    <SelectItem value="cidadao">Cidadão</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showApprove} onOpenChange={setShowApprove}>
          <DialogContent>
            <DialogHeader><DialogTitle>Alterar Status da Conta</DialogTitle></DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">Usuário: <b>{selectedUser?.nome} {selectedUser?.sobrenome}</b></p>
                <p className="text-xs text-muted-foreground mt-1">Status atual: {selectedUser?.status}</p>
              </div>
              <div className="space-y-2">
                <Label>Novo Status</Label>
                <Select value={statusToApprove} onValueChange={setStatusToApprove}>
                  <SelectTrigger><SelectValue placeholder="Selecione o novo status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Ativo</SelectItem>
                    <SelectItem value="inactivo">Inativo</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    <SelectItem value="suspenso">Suspenso</SelectItem>
                    <SelectItem value="removido">Removido</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprove(false)}>Cancelar</Button>
              <Button onClick={handleStatusChange}>Confirmar Mudança</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPenalize} onOpenChange={setShowPenalize}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Penalizar Usuário
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Esta ação reduzirá a reputação de <b>{selectedUser?.nome}</b> e poderá resultar em suspensão automática se o score atingir 0%.
              </p>
              <div className="space-y-2">
                <Label>Motivo da Penalização</Label>
                <Textarea 
                  placeholder="Descreva o motivo (ex: Reporte falso repetitivo, má conduta...)" 
                  value={penaltyReason} 
                  onChange={e => setPenaltyReason(e.target.value)} 
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPenalize(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={handlePenalizeUser}>Aplicar Penalização</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {meta && meta.last_page > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                />
              </PaginationItem>
              {Array.from({ length: Math.min(meta.last_page, 7) }, (_, i) => {
                let pageNum = i + 1;
                if (pageNum <= meta.last_page && pageNum > 0) {
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink isActive={page === pageNum} onClick={() => setPage(pageNum)}>
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                }
                return null;
              })}
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} 
                  className={page === meta.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"} 
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
        
        {meta && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Mostrando {meta.from} a {meta.to} de {meta.total} usuários
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default UsuariosPage;