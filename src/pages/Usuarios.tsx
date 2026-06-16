import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { 
  Filter, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Settings, 
  AlertTriangle, 
  Trash, 
  RefreshCcw,
  RefreshCw,
  Loader2,
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
  foto_perfil_url?: string | null;
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
  const { t } = useTranslation();
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updating, setUpdating] = useState(false);
  
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
    toast.error(t('access_denied'));
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
      toast.error(t('select_municipality')); // Fallback error
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
      setUsuarios([]);
      setMeta(null);
      toast.error(t('loading')); // Fallback
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
      const response = await api.get('/bi', { params: { bi: nif } });
      if (response.data.success && response.data.data) {
        const { nome, apelido } = response.data.data;
        
        let first = nome;
        let last = "";
        
        if (apelido && apelido.trim()) {
          const cleanApelido = apelido.trim();
          if (nome.endsWith(cleanApelido)) {
            first = nome.substring(0, nome.length - cleanApelido.length).trim();
            last = cleanApelido;
          } else {
            const parts = nome.trim().split(' ');
            first = parts[0];
            last = parts.length > 1 ? parts.slice(1).join(' ') : "";
          }
        } else {
          const parts = nome.trim().split(' ');
          first = parts[0];
          last = parts.length > 1 ? parts.slice(1).join(' ') : "";
        }
        
        setNewUser({
          ...newUser,
          nome: first,
          sobrenome: last
        });
        toast.success("Dados do BI/NIF carregados automaticamente.");
      }
    } catch (error) {
      console.error("Erro ao buscar BI:", error);
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
        toast.error("Conflito: " + (err.response.data.message || "Dados já cadastrados no sistema."));
      } else {
        toast.error(err.response?.data?.message || "Erro ao cadastrar usuário.");
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
    } catch (err: any) {
      if (err.response?.status === 422) {
        const backendErrors = err.response.data.errors;
        if (backendErrors) {
          const firstError = Object.values(backendErrors)[0] as string[];
          toast.error(firstError[0] || "Erro de validação");
        }
      } else {
        toast.error(err.response?.data?.message || "Erro ao atualizar usuário.");
      }
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

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword) return;
    
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }
    
    setUpdating(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}/password`, { 
        password: newPassword,
        password_confirmation: confirmPassword
      });
      toast.success(`Senha de ${selectedUser.nome} alterada com sucesso`);
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      toast.error(error.response?.data?.message || "Erro ao alterar senha");
    } finally {
      setUpdating(false);
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
      {status === 'activo' ? t('active') : 
       status === 'inactivo' ? t('inactive') : 
       status === 'bloqueado' ? t('blocked') : 
       status === 'suspenso' ? t('suspended') :
       status === 'removido' ? t('removed') : t('pending')}
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
      {tipo === 'admin' ? t('admin') : tipo === 'operador' ? t('operator') : tipo === 'voluntario' ? t('volunteer') : t('citizen')}
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
              {t('users')}
              <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 px-2 py-1 rounded-full">{t('admin')}</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t('user_management')}</p>
          </div>
          <span className="text-xs text-muted-foreground">Total: {meta?.total || 0} usuários</span>
        </div>
      </div>
      
      <div className="bg-card rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2 mb-4 items-center justify-between">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-2 items-center">
            <Input 
              placeholder={t('search_user_placeholder')} 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="w-64" 
            />
            <Select value={tipo} onValueChange={value => { setTipo(value); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder={t('type')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="admin">{t('admin')}</SelectItem>
                <SelectItem value="operador">{t('operator')}</SelectItem>
                <SelectItem value="voluntario">{t('volunteer')}</SelectItem>
                <SelectItem value="cidadao">{t('citizen')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={value => { setStatus(value); setPage(1); }}>
              <SelectTrigger className="w-36"><SelectValue placeholder={t('status')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all')}</SelectItem>
                <SelectItem value="activo">{t('active')}</SelectItem>
                <SelectItem value="inactivo">{t('inactive')}</SelectItem>
                <SelectItem value="pendente">{t('pending')}</SelectItem>
                <SelectItem value="suspenso">{t('suspended')}</SelectItem>
                <SelectItem value="bloqueado">{t('blocked')}</SelectItem>
                <SelectItem value="removido">{t('removed')}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit">{t('verify')}</Button>
          </form>
          
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="bg-primary">+ {t('new_user')}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{t('create_user_title')}</DialogTitle></DialogHeader>
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
                  <div><Label>Nome *</Label><Input value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})} className={formErrors.nome ? "border-red-500 bg-muted" : "bg-muted cursor-not-allowed"} disabled />{formErrors.nome && <p className="text-xs text-red-500">{formErrors.nome}</p>}</div>
                  <div><Label>Sobrenome *</Label><Input value={newUser.sobrenome} onChange={e => setNewUser({...newUser, sobrenome: e.target.value})} className={formErrors.sobrenome ? "border-red-500 bg-muted" : "bg-muted cursor-not-allowed"} disabled />{formErrors.sobrenome && <p className="text-xs text-red-500">{formErrors.sobrenome}</p>}</div>
                </div>
                <div><Label>Email *</Label><Input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className={formErrors.email ? "border-red-500" : ""} />{formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}</div>
                <div><Label>Senha *</Label><Input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className={formErrors.password ? "border-red-500" : ""} />{formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}</div>
                <div><Label>Confirmar Senha *</Label><Input type="password" value={newUser.password_confirmation} onChange={e => setNewUser({...newUser, password_confirmation: e.target.value})} className={formErrors.password_confirmation ? "border-red-500" : ""} />{formErrors.password_confirmation && <p className="text-xs text-red-500">{formErrors.password_confirmation}</p>}</div>
                <div><Label>Telefone</Label><Input value={newUser.telefone} onChange={e => setNewUser({...newUser, telefone: e.target.value})} placeholder="+244 9XX XXX XXX" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>{t('type')} *</Label><Select value={newUser.tipo} onValueChange={value => setNewUser({...newUser, tipo: value})}><SelectTrigger><SelectValue placeholder={t('type')} /></SelectTrigger><SelectContent><SelectItem value="admin">{t('admin')}</SelectItem><SelectItem value="operador">{t('operator')}</SelectItem><SelectItem value="voluntario">{t('volunteer')}</SelectItem><SelectItem value="cidadao">{t('citizen')}</SelectItem></SelectContent></Select>{formErrors.tipo && <p className="text-xs text-red-500">{formErrors.tipo}</p>}</div>
                  <div><Label>{t('status')}</Label><Select value={newUser.status} onValueChange={value => setNewUser({...newUser, status: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="activo">{t('active')}</SelectItem><SelectItem value="inactivo">{t('inactive')}</SelectItem><SelectItem value="pendente">{t('pending')}</SelectItem><SelectItem value="bloqueado">{t('blocked')}</SelectItem></SelectContent></Select></div>
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
                <DialogFooter><Button type="submit">{t('register_btn')}</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>{t('cancel')}</Button></DialogFooter>
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
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold cursor-zoom-in hover:opacity-80 transition-opacity">
                              {usuario.foto_perfil_url ? (
                                <img src={usuario.foto_perfil_url} alt={usuario.nome} className="w-full h-full object-cover" />
                              ) : (
                                <>{usuario.nome[0]}{usuario.sobrenome[0]}</>
                              )}
                            </div>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none">
                            <VisuallyHidden asChild>
                              <DialogTitle>{t('profile_photo_preview')}</DialogTitle>
                            </VisuallyHidden>
                            <VisuallyHidden asChild>
                              <DialogDescription>
                                {t('profile_photo_preview_desc')}
                              </DialogDescription>
                            </VisuallyHidden>
                            <div className="relative w-full h-full flex items-center justify-center">
                              {usuario.foto_perfil_url && (
                                <img 
                                  src={usuario.foto_perfil_url} 
                                  alt={usuario.nome} 
                                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                                />
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        <span>{usuario.nome} {usuario.sobrenome}</span>
                      </div>
                    </TableCell>
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
                          <DropdownMenuLabel>{t('actions')}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setShowDetails(true); }}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>{t('view_details')}</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => { setEditUser(usuario); setShowEdit(true); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>{t('edit')}</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setStatusToApprove(usuario.status); setShowApprove(true); }}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>{t('change_status')}</span>
                          </DropdownMenuItem>
                          
                          {usuario.tipo === 'cidadao' && (
                            <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setShowPenalize(true); }} className="text-orange-600 focus:text-orange-600">
                              <AlertTriangle className="mr-2 h-4 w-4" />
                              <span>{t('penalize')}</span>
                            </DropdownMenuItem>
                          )}

                          {['suspenso', 'removido', 'bloqueado', 'inactivo'].includes(usuario.status) && (
                            <DropdownMenuItem onClick={() => handleRecoverUser(usuario.id)} className="text-green-600 focus:text-green-600">
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              <span>{t('recover_account')}</span>
                            </DropdownMenuItem>
                          )}
                          
                          <DropdownMenuItem onClick={() => { setSelectedUser(usuario); setShowPasswordModal(true); }}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            <span>{t('password')}</span>
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          {currentUser?.id !== usuario.id && (
                            <DropdownMenuItem onClick={() => handleDeleteUser(usuario.id)} className="text-red-600 focus:text-red-600 font-medium">
                              <Trash className="mr-2 h-4 w-4" />
                              <span>{t('remove')}</span>
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
            <DialogHeader>
              <DialogTitle>{t('user_details')}</DialogTitle>
              <VisuallyHidden asChild>
                <DialogDescription>{t('user_details_desc')}</DialogDescription>
              </VisuallyHidden>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary text-xl font-bold cursor-zoom-in hover:opacity-80 transition-opacity shadow-sm">
                      {selectedUser?.foto_perfil_url ? (
                        <img src={selectedUser.foto_perfil_url} alt={selectedUser.nome} className="w-full h-full object-cover" />
                      ) : (
                        <>{selectedUser?.nome?.[0]}{selectedUser?.sobrenome?.[0]}</>
                      )}
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <VisuallyHidden asChild>
                      <DialogTitle>{t('profile_photo_preview')}</DialogTitle>
                    </VisuallyHidden>
                    <VisuallyHidden asChild>
                      <DialogDescription>
                        {t('profile_photo_preview_desc')}
                      </DialogDescription>
                    </VisuallyHidden>
                    <div className="relative w-full h-full flex items-center justify-center">
                      {selectedUser?.foto_perfil_url && (
                        <img 
                          src={selectedUser.foto_perfil_url} 
                          alt={selectedUser.nome} 
                          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                        />
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
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
                  <p className="text-xs text-muted-foreground">{t('phone')}</p>
                  <p className="text-sm font-medium">{selectedUser?.telefone || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('type')}</p>
                  <div>{selectedUser && getTipoBadge(selectedUser.tipo || "cidadao")}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('status')}</p>
                  <div>{selectedUser && getStatusBadge(selectedUser.status)}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('reputation')}</p>
                  <p className="text-sm font-bold text-primary">{Math.round((selectedUser?.reputation_score || 0) * 100)}%</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">{t('member_since')}</p>
                  <p className="text-sm font-medium">{selectedUser?.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : "-"}</p>
                </div>
              </div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setShowDetails(false)}>{t('close')}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showEdit} onOpenChange={setShowEdit}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('edit_user')}</DialogTitle>
              <VisuallyHidden asChild>
                <DialogDescription>{t('edit_user_desc')}</DialogDescription>
              </VisuallyHidden>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-3 pt-4">
              <div className="space-y-1">
                <Label>{t('name')}</Label>
                <Input value={editUser?.nome || ""} onChange={e => setEditUser(prev => prev ? {...prev, nome: e.target.value} : null)} placeholder={t('name')} className="bg-muted cursor-not-allowed" disabled />
              </div>
              <div className="space-y-1">
                <Label>{t('last_name')}</Label>
                <Input value={editUser?.sobrenome || ""} onChange={e => setEditUser(prev => prev ? {...prev, sobrenome: e.target.value} : null)} placeholder={t('last_name')} className="bg-muted cursor-not-allowed" disabled />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input type="email" value={editUser?.email || ""} onChange={e => setEditUser(prev => prev ? {...prev, email: e.target.value} : null)} placeholder="Email" />
              </div>
              <div className="space-y-1">
                <Label>{t('phone')}</Label>
                <Input value={editUser?.telefone || ""} onChange={e => setEditUser(prev => prev ? {...prev, telefone: e.target.value} : null)} placeholder={t('phone')} />
              </div>
              <div className="space-y-1">
                <Label>{t('type')}</Label>
                <Select value={editUser?.tipo || "cidadao"} onValueChange={value => setEditUser(prev => prev ? {...prev, tipo: value} : null)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="operador">{t('operator')}</SelectItem>
                    <SelectItem value="voluntario">{t('volunteer')}</SelectItem>
                    <SelectItem value="cidadao">{t('citizen')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button variant="outline" onClick={() => setShowEdit(false)}>{t('cancel')}</Button>
                <Button type="submit">{t('save_changes')}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={showApprove} onOpenChange={setShowApprove}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('change_status_title')}</DialogTitle>
              <VisuallyHidden asChild>
                <DialogDescription>{t('change_status_desc')}</DialogDescription>
              </VisuallyHidden>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm">{t('user')}: <b>{selectedUser?.nome} {selectedUser?.sobrenome}</b></p>
                <p className="text-xs text-muted-foreground mt-1">{t('current_status')}: {selectedUser?.status}</p>
              </div>
              <div className="space-y-2">
                <Label>{t('new_status')}</Label>
                <Select value={statusToApprove} onValueChange={setStatusToApprove}>
                  <SelectTrigger><SelectValue placeholder={t('select_status')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">{t('active')}</SelectItem>
                    <SelectItem value="inactivo">{t('inactive')}</SelectItem>
                    <SelectItem value="bloqueado">{t('blocked')}</SelectItem>
                    <SelectItem value="suspenso">{t('suspended')}</SelectItem>
                    <SelectItem value="removido">{t('removed')}</SelectItem>
                    <SelectItem value="pendente">{t('pending')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprove(false)}>{t('cancel')}</Button>
              <Button onClick={handleStatusChange}>{t('confirm_change')}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showPenalize} onOpenChange={setShowPenalize}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                {t('penalize_user')}
              </DialogTitle>
              <VisuallyHidden asChild>
                <DialogDescription>{t('penalize_user_desc')}</DialogDescription>
              </VisuallyHidden>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                {t('penalize_warning', { name: selectedUser?.nome })}
              </p>
              <div className="space-y-2">
                <Label>{t('penalty_reason')}</Label>
                <Textarea 
                   placeholder={t('penalty_reason_placeholder')} 
                  value={penaltyReason} 
                  onChange={e => setPenaltyReason(e.target.value)} 
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPenalize(false)}>{t('cancel')}</Button>
              <Button variant="destructive" onClick={handlePenalizeUser}>{t('apply_penalty')}</Button>
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
            {t('showing_users_count', { from: meta.from, to: meta.to, total: meta.total })}
          </div>
        )}
      </div>
      {/* Modal de Alterar Senha */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário <strong>{selectedUser?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Repita a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleChangePassword} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal de Alterar Senha */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário <strong>{selectedUser?.nome}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Senha</Label>
              <Input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Repita a nova senha"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordModal(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleChangePassword} disabled={updating}>
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Senha"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default UsuariosPage;