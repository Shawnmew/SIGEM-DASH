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
import { Filter } from "lucide-react";

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
    status: "pendente"
  });

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
          telefone: "", tipo: "cidadao", municipio_id: "", status: "pendente"
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
      pendente: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config[status] || config.pendente}`}>
      {status === 'activo' ? 'Ativo' : status === 'inactivo' ? 'Inativo' : status === 'bloqueado' ? 'Bloqueado' : 'Pendente'}
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
                <SelectItem value="bloqueado">Bloqueado</SelectItem>
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
                    <TableCell>{getStatusBadge(usuario.status)}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => setSelectedUser(usuario)}>Ver</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Detalhes do Usuário</DialogTitle></DialogHeader>
                          <div className="space-y-2">
                            <div className="flex gap-2"><b className="w-24 text-muted-foreground">ID:</b><span className="text-foreground">{selectedUser?.id}</span></div>
                            <div className="flex gap-2"><b className="w-24 text-muted-foreground">Nome:</b><span className="text-foreground">{selectedUser?.nome} {selectedUser?.sobrenome}</span></div>
                            <div className="flex gap-2"><b className="w-24 text-muted-foreground">Email:</b><span className="text-foreground">{selectedUser?.email}</span></div>
                            <div className="flex gap-2"><b className="w-24 text-muted-foreground">Telefone:</b><span className="text-foreground">{selectedUser?.telefone || "-"}</span></div>
                            <div className="flex gap-2"><b className="w-24 text-muted-foreground">Tipo:</b><span className="text-foreground">{selectedUser?.tipo || "Cidadão"}</span></div>
                            <div className="flex gap-2"><b className="w-24 text-muted-foreground">Status:</b>{getStatusBadge(selectedUser?.status || "pendente")}</div>
                          </div>
                          <DialogFooter><DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose></DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={showEdit && editUser?.id === usuario.id} onOpenChange={setShowEdit}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => { setEditUser(usuario); setShowEdit(true); }}>Editar</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
                          <form onSubmit={handleUpdateUser} className="space-y-3">
                            <Input value={editUser?.nome || ""} onChange={e => setEditUser(prev => prev ? {...prev, nome: e.target.value} : null)} placeholder="Nome" />
                            <Input value={editUser?.sobrenome || ""} onChange={e => setEditUser(prev => prev ? {...prev, sobrenome: e.target.value} : null)} placeholder="Sobrenome" />
                            <Input type="email" value={editUser?.email || ""} onChange={e => setEditUser(prev => prev ? {...prev, email: e.target.value} : null)} placeholder="Email" />
                            <Input value={editUser?.telefone || ""} onChange={e => setEditUser(prev => prev ? {...prev, telefone: e.target.value} : null)} placeholder="Telefone" />
                            <Select value={editUser?.tipo || "cidadao"} onValueChange={value => setEditUser(prev => prev ? {...prev, tipo: value} : null)}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="operador">Operador</SelectItem>
                                <SelectItem value="voluntario">Voluntário</SelectItem>
                                <SelectItem value="cidadao">Cidadão</SelectItem>
                              </SelectContent>
                            </Select>
                            <DialogFooter>
                              <Button type="submit">Salvar</Button>
                              <DialogClose asChild><Button variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button></DialogClose>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={showApprove && selectedUser?.id === usuario.id} onOpenChange={setShowApprove}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => { setShowApprove(true); setSelectedUser(usuario); setStatusToApprove(usuario.status); }}>Status</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Alterar Status</DialogTitle></DialogHeader>
                          <Select value={statusToApprove} onValueChange={setStatusToApprove}>
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="activo">Ativo</SelectItem>
                              <SelectItem value="inactivo">Inativo</SelectItem>
                              <SelectItem value="bloqueado">Bloqueado</SelectItem>
                              <SelectItem value="pendente">Pendente</SelectItem>
                            </SelectContent>
                          </Select>
                          <DialogFooter>
                            <Button onClick={handleStatusChange}>Salvar</Button>
                            <DialogClose asChild><Button variant="outline" onClick={() => setShowApprove(false)}>Cancelar</Button></DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={showPenalize && selectedUser?.id === usuario.id} onOpenChange={setShowPenalize}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => { setShowPenalize(true); setSelectedUser(usuario); }}>Penalizar</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Penalizar Usuário</DialogTitle></DialogHeader>
                          <Textarea placeholder="Motivo da penalização..." value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} rows={4} />
                          <DialogFooter>
                            <Button onClick={handlePenalizeUser}>Penalizar</Button>
                            <DialogClose asChild><Button variant="outline" onClick={() => setShowPenalize(false)}>Cancelar</Button></DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      
                      {currentUser?.id !== usuario.id && (
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(usuario.id)}>Remover</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
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