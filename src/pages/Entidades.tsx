import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/authcontext";
import { Navigate } from "react-router-dom";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Filter, RefreshCw } from "lucide-react";

interface Entidade {
  id: number;
  nome: string;
  tipo: string;
  servico_tipo?: string;
  status: string;
  regiao?: string;
  municipio_nome?: string;
  provincia_nome?: string;
  email?: string;
  telefone?: string;
  nif?: string;
  municipio_id?: number;
  bairro?: string;
  endereco_completo?: string;
  responsavel?: string;
  horario_funcionamento?: string;
  capacidade_pessoas?: number;
  latitude?: number;
  longitude?: number;
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
  nif?: string;
  email?: string;
  password?: string;
  municipio_id?: string;
}

interface Provincia {
  id: number;
  nome: string;
  sigla: string;
}

const servicoTipoLabels: Record<string, string> = {
  policia: "Polícia",
  bombeiros: "Bombeiros",
  hospital: "Hospital",
  inema: "INEMA",
  protecao_civil: "Proteção Civil",
  cruz_vermelha: "Cruz Vermelha",
  exercito: "Exército",
  servico_municipal: "Serviço Municipal",
  posto_medico: "Posto Médico",
  centro_saude: "Centro de Saúde",
};

const EntidadesPage = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState<string>("all");
  const [servicoTipo, setServicoTipo] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [provinciaId, setProvinciaId] = useState<string>("all");
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [provincias, setProvincias] = useState<Provincia[]>([]);
  const [municipiosFiltrados, setMunicipiosFiltrados] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entidade | null>(null);
  const [editEntity, setEditEntity] = useState<Entidade | null>(null);
  const [statusToApprove, setStatusToApprove] = useState<string>("");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const [newEntity, setNewEntity] = useState({
    nome: "", nif: "", password: "", municipio_id: "", tipo: "publica", status: "pendente", email: "", telefone: ""
  });

  if (!authLoading && !isAdmin) {
    toast.error("Acesso negado. Apenas administradores podem acessar esta página.");
    return <Navigate to="/" replace />;
  }

  const fetchProvincias = async () => {
    try {
      const response = await api.get("/provincias");
      setProvincias(response.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar províncias:", error);
    }
  };

  const fetchMunicipios = async () => {
    try {
      const response = await api.get("/municipios");
      setMunicipios(response.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar municípios:", error);
    }
  };

  // Filtrar municípios por província selecionada
  useEffect(() => {
    if (provinciaId && provinciaId !== "all") {
      const filtered = municipios.filter(m => m.provincia_id === parseInt(provinciaId));
      setMunicipiosFiltrados(filtered);
    } else {
      setMunicipiosFiltrados(municipios);
    }
  }, [provinciaId, municipios]);

  const fetchEntidades = async (pageNum = 1, searchTerm = "", tipoFiltro = "all", statusFiltro = "all", servicoFiltro = "all", provinciaFiltro = "all") => {
    setLoading(true);
    try {
      const params: any = { page: pageNum, search: searchTerm };
      if (tipoFiltro !== "all") params.tipo = tipoFiltro;
      if (statusFiltro !== "all") params.status = statusFiltro;
      if (servicoFiltro !== "all") params.servico_tipo = servicoFiltro;
      if (provinciaFiltro !== "all") params.provincia_id = provinciaFiltro;
      
      const res = await api.get("/admin/entities", { params });
      setEntidades(res.data.data.entities.data || []);
      setMeta({
        current_page: res.data.data.entities.current_page,
        last_page: res.data.data.entities.last_page,
        per_page: res.data.data.entities.per_page,
        total: res.data.data.entities.total,
        from: res.data.data.entities.from,
        to: res.data.data.entities.to,
      });
    } catch (e) {
      console.error("Erro ao carregar entidades:", e);
      setEntidades([]);
      setMeta(null);
      toast.error("Erro ao carregar entidades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEntidades(page, search, tipo, status, servicoTipo, provinciaId);
      fetchMunicipios();
      fetchProvincias();
    }
  }, [page, tipo, status, servicoTipo, provinciaId, isAdmin]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEntidades(1, search, tipo, status, servicoTipo, provinciaId);
  };

  const handleResetFilters = () => {
    setSearch("");
    setTipo("all");
    setStatus("all");
    setServicoTipo("all");
    setProvinciaId("all");
    setPage(1);
    fetchEntidades(1, "", "all", "all", "all", "all");
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!newEntity.nome.trim()) errors.nome = "Nome é obrigatório";
    if (!newEntity.nif.trim()) errors.nif = "NIF é obrigatório";
    if (!newEntity.email.trim()) errors.email = "Email é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(newEntity.email)) errors.email = "Email inválido";
    if (!newEntity.password) errors.password = "Senha é obrigatória";
    else if (newEntity.password.length < 6) errors.password = "Senha deve ter pelo menos 6 caracteres";
    if (!newEntity.municipio_id) errors.municipio_id = "Município é obrigatório";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const entityData = {
        nome: newEntity.nome.trim(),
        nif: newEntity.nif.trim(),
        email: newEntity.email.trim(),
        password: newEntity.password,
        municipio_id: parseInt(newEntity.municipio_id),
        tipo: newEntity.tipo,
        telefone: newEntity.telefone?.trim() || null,
        status: newEntity.status
      };
      await api.post("/admin/entities", entityData);
      setShowCreate(false);
      setNewEntity({ nome: "", nif: "", password: "", municipio_id: "", tipo: "publica", status: "pendente", email: "", telefone: "" });
      setFormErrors({});
      fetchEntidades(1, search, tipo, status, servicoTipo, provinciaId);
      setPage(1);
      toast.success("Entidade cadastrada com sucesso!");
    } catch (err: any) {
      if (err.response?.status === 422) {
        const backendErrors = err.response.data.errors;
        const newErrors: FormErrors = {};
        if (backendErrors) Object.keys(backendErrors).forEach(key => { newErrors[key as keyof FormErrors] = backendErrors[key][0]; });
        setFormErrors(newErrors);
        toast.error("Erro de validação: Verifique os campos destacados.");
      } else {
        toast.error("Erro ao cadastrar entidade.");
      }
    }
  };

  const handleUpdateEntity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEntity) return;
    try {
      await api.put(`/admin/entities/${editEntity.id}`, { nome: editEntity.nome, email: editEntity.email, telefone: editEntity.telefone });
      setShowEdit(false);
      fetchEntidades(page, search, tipo, status, servicoTipo, provinciaId);
      toast.success("Entidade atualizada com sucesso!");
    } catch (err) {
      toast.error("Erro ao atualizar entidade.");
    }
  };

  const handleStatusChange = async () => {
    if (!selectedEntity) return;
    try {
      await api.patch(`/admin/entities/${selectedEntity.id}/status`, { status: statusToApprove });
      setShowApprove(false);
      fetchEntidades(page, search, tipo, status, servicoTipo, provinciaId);
      toast.success(`Status alterado para ${statusToApprove}!`);
    } catch (err) {
      toast.error("Erro ao alterar status.");
    }
  };

  const handleDeleteEntity = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover esta entidade?")) return;
    try {
      await api.delete(`/admin/entities/${id}`);
      fetchEntidades(page, search, tipo, status, servicoTipo, provinciaId);
      toast.success("Entidade removida com sucesso!");
    } catch (err) {
      toast.error("Erro ao remover entidade.");
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = { 
      activo: "bg-green-100 text-green-800", 
      inactivo: "bg-gray-100 text-gray-800", 
      bloqueado: "bg-red-100 text-red-800", 
      pendente: "bg-yellow-100 text-yellow-800" 
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${config[status] || config.pendente}`}>
      {status === 'activo' ? 'Ativo' : status === 'inactivo' ? 'Inativo' : status === 'bloqueado' ? 'Bloqueado' : 'Pendente'}
    </span>;
  };

  const getServicoTipoLabel = (servicoTipo?: string) => {
    if (!servicoTipo) return "-";
    return servicoTipoLabels[servicoTipo] || servicoTipo;
  };

  const hasActiveFilters = search !== "" || tipo !== "all" || status !== "all" || servicoTipo !== "all" || provinciaId !== "all";

  if (authLoading) return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAdmin) return null;

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Entidades Promotoras</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão de entidades promotoras e serviços de emergência</p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-4">
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
                <SelectItem value="publica">Pública</SelectItem>
                <SelectItem value="privada">Privada</SelectItem>
                <SelectItem value="ong">ONG</SelectItem>
                <SelectItem value="associacao">Associação</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={servicoTipo} onValueChange={value => { setServicoTipo(value); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Serviço" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os serviços</SelectItem>
                <SelectItem value="policia">Polícia</SelectItem>
                <SelectItem value="bombeiros">Bombeiros</SelectItem>
                <SelectItem value="hospital">Hospital</SelectItem>
                <SelectItem value="inema">INEMA</SelectItem>
                <SelectItem value="protecao_civil">Proteção Civil</SelectItem>
                <SelectItem value="cruz_vermelha">Cruz Vermelha</SelectItem>
                <SelectItem value="exercito">Exército</SelectItem>
                <SelectItem value="servico_municipal">Serviço Municipal</SelectItem>
                <SelectItem value="posto_medico">Posto Médico</SelectItem>
                <SelectItem value="centro_saude">Centro de Saúde</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={provinciaId} onValueChange={value => { setProvinciaId(value); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Província" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas províncias</SelectItem>
                {provincias.map(p => (
                  <SelectItem key={p.id} value={String(p.id)}>{p.nome}</SelectItem>
                ))}
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
            <DialogTrigger asChild><Button>+ Nova Entidade</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Cadastrar Nova Entidade</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateEntity} className="space-y-4">
                <div><Label>Nome *</Label><Input value={newEntity.nome} onChange={e => setNewEntity({...newEntity, nome: e.target.value})} className={formErrors.nome ? "border-red-500" : ""} />{formErrors.nome && <p className="text-xs text-red-500">{formErrors.nome}</p>}</div>
                <div><Label>NIF *</Label><Input value={newEntity.nif} onChange={e => setNewEntity({...newEntity, nif: e.target.value})} className={formErrors.nif ? "border-red-500" : ""} />{formErrors.nif && <p className="text-xs text-red-500">{formErrors.nif}</p>}</div>
                <div><Label>Email *</Label><Input type="email" value={newEntity.email} onChange={e => setNewEntity({...newEntity, email: e.target.value})} className={formErrors.email ? "border-red-500" : ""} />{formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}</div>
                <div><Label>Senha *</Label><Input type="password" value={newEntity.password} onChange={e => setNewEntity({...newEntity, password: e.target.value})} className={formErrors.password ? "border-red-500" : ""} />{formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}</div>
                <div><Label>Município *</Label>
                  <Select value={newEntity.municipio_id} onValueChange={value => setNewEntity({...newEntity, municipio_id: value})}>
                    <SelectTrigger className={formErrors.municipio_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione o município" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {municipiosFiltrados.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {formErrors.municipio_id && <p className="text-xs text-red-500">{formErrors.municipio_id}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Tipo</Label><Select value={newEntity.tipo} onValueChange={value => setNewEntity({...newEntity, tipo: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="publica">Pública</SelectItem><SelectItem value="privada">Privada</SelectItem><SelectItem value="ong">ONG</SelectItem><SelectItem value="associacao">Associação</SelectItem></SelectContent></Select></div>
                  <div><Label>Status</Label><Select value={newEntity.status} onValueChange={value => setNewEntity({...newEntity, status: value})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pendente">Pendente</SelectItem><SelectItem value="activo">Ativo</SelectItem><SelectItem value="inactivo">Inativo</SelectItem><SelectItem value="bloqueado">Bloqueado</SelectItem></SelectContent></Select></div>
                </div>
                <div><Label>Telefone</Label><Input value={newEntity.telefone} onChange={e => setNewEntity({...newEntity, telefone: e.target.value})} placeholder="+244 9XX XXX XXX" /></div>
                <DialogFooter><Button type="submit">Cadastrar</Button><Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Província</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="text-center py-8"><div className="flex justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div><span className="ml-2">Carregando...</span></div></TableCell></TableRow>
              : entidades.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8">Nenhuma entidade encontrada.</TableCell></TableRow>
              : entidades.map(entity => (
                <TableRow key={entity.id}>
                  <TableCell>{entity.id}</TableCell>
                  <TableCell className="font-medium">{entity.nome}</TableCell>
                  <TableCell>{entity.tipo === 'publica' ? 'Pública' : entity.tipo === 'privada' ? 'Privada' : entity.tipo === 'ong' ? 'ONG' : 'Associação'}</TableCell>
                  <TableCell>{getServicoTipoLabel(entity.servico_tipo)}</TableCell>
                  <TableCell>{entity.provincia_nome || "-"}</TableCell>
                  <TableCell>{entity.municipio_nome || "-"}</TableCell>
                  <TableCell>{getStatusBadge(entity.status)}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Dialog><DialogTrigger asChild><Button size="sm" variant="outline" onClick={() => setSelectedEntity(entity)}>Ver</Button></DialogTrigger>
                      <DialogContent><DialogHeader><DialogTitle>Detalhes da Entidade</DialogTitle></DialogHeader>
                        <div className="space-y-2">
                          <div><b>ID:</b> {selectedEntity?.id}</div>
                          <div><b>Nome:</b> {selectedEntity?.nome}</div>
                          <div><b>Tipo:</b> {selectedEntity?.tipo === 'publica' ? 'Pública' : selectedEntity?.tipo === 'privada' ? 'Privada' : selectedEntity?.tipo === 'ong' ? 'ONG' : 'Associação'}</div>
                          <div><b>Serviço:</b> {getServicoTipoLabel(selectedEntity?.servico_tipo)}</div>
                          <div><b>Status:</b> {selectedEntity?.status}</div>
                          <div><b>Email:</b> {selectedEntity?.email || "-"}</div>
                          <div><b>Telefone:</b> {selectedEntity?.telefone || "-"}</div>
                          <div><b>NIF:</b> {selectedEntity?.nif || "-"}</div>
                          <div><b>Província:</b> {selectedEntity?.provincia_nome || "-"}</div>
                          <div><b>Município:</b> {selectedEntity?.municipio_nome || "-"}</div>
                          <div><b>Bairro:</b> {selectedEntity?.bairro || "-"}</div>
                          <div><b>Endereço:</b> {selectedEntity?.endereco_completo || "-"}</div>
                          <div><b>Responsável:</b> {selectedEntity?.responsavel || "-"}</div>
                          <div><b>Horário:</b> {selectedEntity?.horario_funcionamento || "-"}</div>
                          <div><b>Capacidade:</b> {selectedEntity?.capacidade_pessoas || "-"} pessoas</div>
                        </div>
                        <DialogFooter><DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose></DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showEdit && editEntity?.id === entity.id} onOpenChange={setShowEdit}>
                      <DialogTrigger asChild><Button size="sm" variant="outline" onClick={() => { setEditEntity(entity); setShowEdit(true); }}>Editar</Button></DialogTrigger>
                      <DialogContent><DialogHeader><DialogTitle>Editar Entidade</DialogTitle></DialogHeader>
                        <form onSubmit={handleUpdateEntity} className="space-y-3">
                          <Input value={editEntity?.nome || ""} onChange={e => setEditEntity(prev => prev ? {...prev, nome: e.target.value} : null)} placeholder="Nome" />
                          <Input value={editEntity?.email || ""} onChange={e => setEditEntity(prev => prev ? {...prev, email: e.target.value} : null)} placeholder="Email" />
                          <Input value={editEntity?.telefone || ""} onChange={e => setEditEntity(prev => prev ? {...prev, telefone: e.target.value} : null)} placeholder="Telefone" />
                          <DialogFooter><Button type="submit">Salvar</Button><DialogClose asChild><Button variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button></DialogClose></DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={showApprove && selectedEntity?.id === entity.id} onOpenChange={setShowApprove}>
                      <DialogTrigger asChild><Button size="sm" variant="outline" onClick={() => { setShowApprove(true); setSelectedEntity(entity); setStatusToApprove(entity.status); }}>Status</Button></DialogTrigger>
                      <DialogContent><DialogHeader><DialogTitle>Alterar Status</DialogTitle></DialogHeader>
                        <Select value={statusToApprove} onValueChange={setStatusToApprove}>
                          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="activo">Ativo</SelectItem>
                            <SelectItem value="inactivo">Inativo</SelectItem>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="bloqueado">Bloqueado</SelectItem>
                          </SelectContent>
                        </Select>
                        <DialogFooter><Button onClick={handleStatusChange}>Salvar</Button><DialogClose asChild><Button variant="outline" onClick={() => setShowApprove(false)}>Cancelar</Button></DialogClose></DialogFooter>
                      </DialogContent>
                    </Dialog>
                    
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteEntity(entity.id)}>Remover</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {meta && meta.last_page > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem><PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
              {Array.from({ length: Math.min(meta.last_page, 7) }, (_, i) => {
                let pageNum = i + 1;
                if (pageNum <= meta.last_page && pageNum > 0) return <PaginationItem key={pageNum}><PaginationLink isActive={page === pageNum} onClick={() => setPage(pageNum)}>{pageNum}</PaginationLink></PaginationItem>;
                return null;
              })}
              <PaginationItem><PaginationNext onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} className={page === meta.last_page ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
        
        {meta && (
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Mostrando {meta.from} a {meta.to} de {meta.total} entidades
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default EntidadesPage;