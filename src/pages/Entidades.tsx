
import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

interface Entidade {
  id: number;
  nome: string;
  tipo: string;
  status: string;
  regiao?: string;
  email?: string;
  telefone?: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const EntidadesPage = () => {
  const [entidades, setEntidades] = useState<Entidade[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  // Dialog states
  const [selectedEntity, setSelectedEntity] = useState<Entidade | null>(null);
  const [editEntity, setEditEntity] = useState<Entidade | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showApprove, setShowApprove] = useState(false);
  const [statusToApprove, setStatusToApprove] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [newEntity, setNewEntity] = useState<Entidade>({ id: 0, nome: "", tipo: "publica", status: "ativa", regiao: "", email: "", telefone: "" });

  const fetchEntidades = async (pageNum = 1, searchTerm = "", tipoFiltro = "all", statusFiltro = "all") => {
    setLoading(true);
    try {
      const params: any = {
        page: pageNum,
        search: searchTerm,
      };
      if (tipoFiltro && tipoFiltro !== "all") params.tipo = tipoFiltro;
      if (statusFiltro && statusFiltro !== "all") params.status = statusFiltro;
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
      setEntidades([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntidades(page, search, tipo, status);
    // eslint-disable-next-line
  }, [page, tipo, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEntidades(1, search, tipo, status);
  };

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <h1 className="text-2xl font-extrabold">Entidades Promotoras</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de entidades promotoras do sistema</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-2 mb-4 items-center w-full">
          <form onSubmit={handleSearch} className="flex flex-1 flex-nowrap gap-2 items-center min-w-0">
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="max-w-xs flex-shrink"
            />
            <Select value={tipo} onValueChange={value => { setTipo(value); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="publica">Pública</SelectItem>
                <SelectItem value="privada">Privada</SelectItem>
                <SelectItem value="ong">ONG</SelectItem>
                <SelectItem value="comunitaria">Comunitária</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={value => { setStatus(value); setPage(1); }}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="suspensa">Suspensa</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" size="sm">Buscar</Button>
          </form>
          <div className="flex-none">
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowCreate(true)}>Cadastrar Nova Entidade</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cadastrar Nova Entidade</DialogTitle>
                </DialogHeader>
                <form className="space-y-2" onSubmit={async e => {
                  e.preventDefault();
                  try {
                    await api.post("/admin/entities", {
                      nome: newEntity.nome,
                      tipo: newEntity.tipo,
                      email: newEntity.email,
                      telefone: newEntity.telefone,
                      regiao: newEntity.regiao,
                      status: newEntity.status,
                    });
                    setShowCreate(false);
                    setNewEntity({ id: 0, nome: "", tipo: "publica", status: "ativa", regiao: "", email: "", telefone: "" });
                    fetchEntidades(1, search, tipo, status);
                    setPage(1);
                  } catch (err) {
                    alert("Erro ao cadastrar entidade. Verifique os dados e tente novamente.");
                  }
                }}>
                  <Input value={newEntity.nome} onChange={e => setNewEntity({ ...newEntity, nome: e.target.value })} placeholder="Nome" required />
                  <Select value={newEntity.tipo} onValueChange={value => setNewEntity({ ...newEntity, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publica">Pública</SelectItem>
                      <SelectItem value="privada">Privada</SelectItem>
                      <SelectItem value="ong">ONG</SelectItem>
                      <SelectItem value="comunitaria">Comunitária</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={newEntity.email} onChange={e => setNewEntity({ ...newEntity, email: e.target.value })} placeholder="Email" />
                  <Input value={newEntity.telefone} onChange={e => setNewEntity({ ...newEntity, telefone: e.target.value })} placeholder="Telefone" />
                  <Input value={newEntity.regiao} onChange={e => setNewEntity({ ...newEntity, regiao: e.target.value })} placeholder="Região" />
                  <DialogFooter>
                    <Button type="submit">Cadastrar</Button>
                    <DialogClose asChild>
                      <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
                    </DialogClose>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Região</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : entidades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Nenhuma entidade encontrada.</TableCell>
                </TableRow>
              ) : entidades.map(entidade => (
                <TableRow key={entidade.id}>
                  <TableCell>{entidade.id}</TableCell>
                  <TableCell>{entidade.nome}</TableCell>
                  <TableCell>{entidade.tipo}</TableCell>
                  <TableCell>{entidade.status}</TableCell>
                  <TableCell>{entidade.regiao || "-"}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedEntity(entidade)}>Ver</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes da Entidade</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <div><b>ID:</b> {selectedEntity?.id}</div>
                          <div><b>Nome:</b> {selectedEntity?.nome}</div>
                          <div><b>Tipo:</b> {selectedEntity?.tipo}</div>
                          <div><b>Status:</b> {selectedEntity?.status}</div>
                          <div><b>Região:</b> {selectedEntity?.regiao || "-"}</div>
                          <div><b>Email:</b> {selectedEntity?.email || "-"}</div>
                          <div><b>Telefone:</b> {selectedEntity?.telefone || "-"}</div>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Fechar</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => { setEditEntity(entidade); setShowEdit(true); }}>Editar</Button>
                      </DialogTrigger>
                      {showEdit && editEntity?.id === entidade.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Entidade</DialogTitle>
                          </DialogHeader>
                          <form className="space-y-2" onSubmit={e => { e.preventDefault(); /* implementar update */ setShowEdit(false); }}>
                            <Input value={editEntity.nome} onChange={e => setEditEntity({ ...editEntity, nome: e.target.value })} placeholder="Nome" />
                            <Input value={editEntity.email} onChange={e => setEditEntity({ ...editEntity, email: e.target.value })} placeholder="Email" />
                            <Input value={editEntity.telefone} onChange={e => setEditEntity({ ...editEntity, telefone: e.target.value })} placeholder="Telefone" />
                            <DialogFooter>
                              <Button type="submit">Salvar</Button>
                              <DialogClose asChild>
                                <Button variant="outline" onClick={() => setShowEdit(false)}>Cancelar</Button>
                              </DialogClose>
                            </DialogFooter>
                          </form>
                        </DialogContent>
                      )}
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => { setShowApprove(true); setSelectedEntity(entidade); setStatusToApprove(entidade.status); }}>Aprovar/Suspender</Button>
                      </DialogTrigger>
                      {showApprove && selectedEntity?.id === entidade.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Aprovar/Suspender Entidade</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Select value={statusToApprove} onValueChange={setStatusToApprove}>
                              <SelectTrigger>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ativa">Ativa</SelectItem>
                                <SelectItem value="suspensa">Suspensa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => { /* implementar aprovação/status */ setShowApprove(false); }}>Salvar</Button>
                            <DialogClose asChild>
                              <Button variant="outline" onClick={() => setShowApprove(false)}>Cancelar</Button>
                            </DialogClose>
                          </DialogFooter>
                        </DialogContent>
                      )}
                    </Dialog>
                    <Button size="sm" variant="destructive" onClick={() => { /* implementar remoção */ }}>Remover</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {meta && meta.last_page > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  aria-disabled={page === 1}
                  tabIndex={page === 1 ? -1 : 0}
                />
              </PaginationItem>
              {Array.from({ length: meta.last_page }, (_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    isActive={page === i + 1}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setPage(p => Math.min(meta.last_page, p + 1))}
                  aria-disabled={page === meta.last_page}
                  tabIndex={page === meta.last_page ? -1 : 0}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </AppLayout>
  );
};

export default EntidadesPage;
