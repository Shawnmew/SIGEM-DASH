
import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

interface Usuario {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  status: string;
  tipo?: string;
}

interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
}

const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [tipo, setTipo] = useState<string>("all");

  // Dialog states
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [editUser, setEditUser] = useState<Usuario | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showPenalize, setShowPenalize] = useState(false);
  const [penaltyReason, setPenaltyReason] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [statusToApprove, setStatusToApprove] = useState<string>("");

  const fetchUsuarios = async (pageNum = 1, searchTerm = "", tipoFiltro = "all") => {
    setLoading(true);
    try {
      const params: any = {
        page: pageNum,
        search: searchTerm,
      };
      if (tipoFiltro && tipoFiltro !== "all") params.tipo = tipoFiltro;
      const res = await api.get("/admin/users", { params });
      setUsuarios(res.data.data.users.data || []);
      setMeta({
        current_page: res.data.data.users.current_page,
        last_page: res.data.data.users.last_page,
        per_page: res.data.data.users.per_page,
        total: res.data.data.users.total,
        from: res.data.data.users.from,
        to: res.data.data.users.to,
      });
    } catch (e) {
      setUsuarios([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUsuarios(page, search, tipo);
    // eslint-disable-next-line
  }, [page, tipo]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsuarios(1, search, tipo);
  };

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <h1 className="text-2xl font-extrabold">Usuários</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestão de usuários do sistema</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-4 items-center">
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={tipo} onValueChange={value => { setTipo(value); setPage(1); }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="operador">Operador</SelectItem>
              <SelectItem value="voluntario">Voluntário</SelectItem>
              <SelectItem value="cidadao">Cidadão</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="sm">Buscar</Button>
        </form>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
                </TableRow>
              ) : usuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Nenhum usuário encontrado.</TableCell>
                </TableRow>
              ) : usuarios.map(usuario => (
                <TableRow key={usuario.id}>
                  <TableCell>{usuario.id}</TableCell>
                  <TableCell>{usuario.nome} {usuario.sobrenome}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.telefone}</TableCell>
                  <TableCell>{usuario.tipo || "-"}</TableCell>
                  <TableCell>{usuario.status}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setSelectedUser(usuario)}>Ver</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes do Usuário</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-2">
                          <div><b>ID:</b> {selectedUser?.id}</div>
                          <div><b>Nome:</b> {selectedUser?.nome} {selectedUser?.sobrenome}</div>
                          <div><b>Email:</b> {selectedUser?.email}</div>
                          <div><b>Telefone:</b> {selectedUser?.telefone}</div>
                          <div><b>Status:</b> {selectedUser?.status}</div>
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
                        <Button size="sm" variant="outline" onClick={() => { setEditUser(usuario); setShowEdit(true); }}>Editar</Button>
                      </DialogTrigger>
                      {showEdit && editUser?.id === usuario.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Editar Usuário</DialogTitle>
                          </DialogHeader>
                          <form className="space-y-2" onSubmit={e => { e.preventDefault(); /* implementar update */ setShowEdit(false); }}>
                            <Input value={editUser.nome} onChange={e => setEditUser({ ...editUser, nome: e.target.value })} placeholder="Nome" />
                            <Input value={editUser.sobrenome} onChange={e => setEditUser({ ...editUser, sobrenome: e.target.value })} placeholder="Sobrenome" />
                            <Input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} placeholder="Email" />
                            <Input value={editUser.telefone} onChange={e => setEditUser({ ...editUser, telefone: e.target.value })} placeholder="Telefone" />
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
                        <Button size="sm" variant="outline" onClick={() => { setShowApprove(true); setSelectedUser(usuario); setStatusToApprove(usuario.status); }}>Aprovar</Button>
                      </DialogTrigger>
                      {showApprove && selectedUser?.id === usuario.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Aprovar/Alterar Status</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-2">
                            <Select value={statusToApprove} onValueChange={setStatusToApprove}>
                              <SelectTrigger>
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="suspenso">Suspenso</SelectItem>
                                <SelectItem value="bloqueado">Bloqueado</SelectItem>
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => { setShowPenalize(true); setSelectedUser(usuario); }}>Penalizar</Button>
                      </DialogTrigger>
                      {showPenalize && selectedUser?.id === usuario.id && (
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Penalizar Usuário</DialogTitle>
                          </DialogHeader>
                          <Textarea placeholder="Motivo da penalização" value={penaltyReason} onChange={e => setPenaltyReason(e.target.value)} />
                          <DialogFooter>
                            <Button onClick={() => { /* implementar penalização */ setShowPenalize(false); setPenaltyReason(""); }}>Penalizar</Button>
                            <DialogClose asChild>
                              <Button variant="outline" onClick={() => setShowPenalize(false)}>Cancelar</Button>
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

export default UsuariosPage;
