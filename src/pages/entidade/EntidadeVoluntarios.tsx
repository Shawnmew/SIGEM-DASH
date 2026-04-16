import React, { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import api from "@/lib/api";
import { useAuth } from "@/contexts/authcontext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { 
  Users, 
  Search, 
  UserPlus, 
  UserCheck, 
  AlertCircle, 
  Loader2,
  Eye,
  X,
  Upload,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Voluntario {
  id: number;
  user_id: number;
  numero_bi: string;
  data_nascimento: string;
  area_actuacao: string;
  status: string;
  created_at: string;
  user: {
    id: number;
    nome: string;
    sobrenome: string;
    email: string;
    telefone: string;
  };
  municipio: {
    id: number;
    nome: string;
  };
}

interface UsuarioEncontrado {
  id: number;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  tipo: string;
  status: string;
}

interface NovoVoluntario {
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string;
  password: string;
  password_confirmation: string;
  numero_bi: string;
  data_nascimento: string;
  municipio_id: string;
  area_actuacao: string;
}

const EntidadeVoluntariosPage = () => {
  const { user, isEntidade, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [voluntarios, setVoluntarios] = useState<Voluntario[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [usuarioEncontrado, setUsuarioEncontrado] = useState<UsuarioEncontrado | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [jaVoluntario, setJaVoluntario] = useState(false);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [showPromoverModal, setShowPromoverModal] = useState(false);
  const [showCadastrarModal, setShowCadastrarModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [selectedVoluntario, setSelectedVoluntario] = useState<Voluntario | null>(null);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [formData, setFormData] = useState<NovoVoluntario>({
    nome: "",
    sobrenome: "",
    email: "",
    telefone: "",
    password: "",
    password_confirmation: "",
    numero_bi: "",
    data_nascimento: "",
    municipio_id: "",
    area_actuacao: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [documentoFile, setDocumentoFile] = useState<File | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && !isEntidade) {
    toast.error("Acesso negado. Apenas entidades promotoras podem acessar esta página.");
    navigate("/");
    return null;
  }

  const fetchMunicipios = async () => {
    try {
      const response = await api.get("/municipios");
      setMunicipios(response.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar municípios:", error);
    }
  };

  const fetchVoluntarios = async () => {
    setLoading(true);
    try {
      const response = await api.get("/entidade/voluntarios");
      setVoluntarios(response.data.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar voluntários:", error);
      toast.error("Erro ao carregar voluntários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEntidade) {
      fetchVoluntarios();
      fetchMunicipios();
    }
  }, [isEntidade]);

  const handleBuscarUsuario = async () => {
    if (!searchEmail.trim()) {
      toast.error("Digite um email para buscar");
      return;
    }

    setBuscando(true);
    setErroBusca(null);
    setUsuarioEncontrado(null);
    setJaVoluntario(false);

    try {
      const response = await api.post("/entidade/voluntarios/buscar", { email: searchEmail });
      
      if (response.data.success) {
        if (response.data.ja_voluntario) {
          setJaVoluntario(true);
          setUsuarioEncontrado(response.data.data);
          if (response.data.vinculado_entidade) {
            toast.info("Este usuário já é voluntário e já está vinculado à sua entidade");
          } else {
            toast.warning("Este usuário já é voluntário, mas não está vinculado à sua entidade");
          }
        } else {
          setUsuarioEncontrado(response.data.data);
          toast.success("Usuário encontrado!");
        }
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setErroBusca("Usuário não encontrado. Deseja cadastrar um novo voluntário?");
      } else if (error.response?.status === 403) {
        setErroBusca(error.response.data?.message || "Este usuário não pode ser promovido a voluntário");
      } else {
        setErroBusca("Erro ao buscar usuário. Tente novamente.");
      }
    } finally {
      setBuscando(false);
    }
  };

  const handlePromoverVoluntario = async () => {
    if (!usuarioEncontrado) return;
    
    setSubmitting(true);
    try {
      const response = await api.post("/entidade/voluntarios/promover", {
        user_id: usuarioEncontrado.id,
        numero_bi: formData.numero_bi || "PENDENTE_" + Date.now(),
        data_nascimento: formData.data_nascimento || "2000-01-01",
        area_actuacao: formData.area_actuacao || "Geral"
      });
      
      if (response.data.success) {
        toast.success("Usuário promovido a voluntário com sucesso!");
        setShowPromoverModal(false);
        setUsuarioEncontrado(null);
        setSearchEmail("");
        setFormData({
          nome: "", sobrenome: "", email: "", telefone: "", password: "",
          password_confirmation: "", numero_bi: "", data_nascimento: "",
          municipio_id: "", area_actuacao: ""
        });
        fetchVoluntarios();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erro ao promover voluntário");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCadastrarVoluntario = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    if (!formData.nome) errors.nome = "Nome é obrigatório";
    if (!formData.sobrenome) errors.sobrenome = "Sobrenome é obrigatório";
    if (!formData.email) errors.email = "Email é obrigatório";
    if (!formData.password) errors.password = "Senha é obrigatória";
    if (formData.password !== formData.password_confirmation) errors.password_confirmation = "Senhas não conferem";
    if (!formData.numero_bi) errors.numero_bi = "BI é obrigatório";
    if (!formData.municipio_id) errors.municipio_id = "Município é obrigatório";
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("nome", formData.nome);
      formDataToSend.append("sobrenome", formData.sobrenome);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("telefone", formData.telefone);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("numero_bi", formData.numero_bi);
      formDataToSend.append("data_nascimento", formData.data_nascimento);
      formDataToSend.append("municipio_id", formData.municipio_id);
      formDataToSend.append("area_actuacao", formData.area_actuacao);
      if (documentoFile) formDataToSend.append("documento_identificacao", documentoFile);
      if (fotoFile) formDataToSend.append("foto", fotoFile);
      
      const response = await api.post("/entidade/voluntarios/cadastrar", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (response.data.success) {
        toast.success("Voluntário cadastrado com sucesso!");
        setShowCadastrarModal(false);
        setFormData({
          nome: "", sobrenome: "", email: "", telefone: "", password: "",
          password_confirmation: "", numero_bi: "", data_nascimento: "",
          municipio_id: "", area_actuacao: ""
        });
        setDocumentoFile(null);
        setFotoFile(null);
        setFormErrors({});
        fetchVoluntarios();
      }
    } catch (error: any) {
      if (error.response?.status === 422) {
        setFormErrors(error.response.data.errors || {});
        toast.error("Erro de validação. Verifique os campos.");
      } else {
        toast.error(error.response?.data?.message || "Erro ao cadastrar voluntário");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, string> = {
      activo: "bg-green-100 text-green-800",
      inactivo: "bg-gray-100 text-gray-800",
      pendente: "bg-yellow-100 text-yellow-800",
      suspenso: "bg-red-100 text-red-800"
    };
    return <Badge className={config[status] || config.pendente}>{status === 'activo' ? 'Ativo' : status === 'inactivo' ? 'Inativo' : status === 'suspenso' ? 'Suspenso' : 'Pendente'}</Badge>;
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isEntidade) return null;

  return (
    <AppLayout>
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            Gestão de Voluntários
          </h1>
          <p className="text-muted-foreground mt-1">
            Promova cidadãos a voluntários ou cadastre novos voluntários
          </p>
        </div>

        <Tabs defaultValue="lista" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lista">Meus Voluntários</TabsTrigger>
            <TabsTrigger value="promover">Promover Voluntário</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Voluntários Vinculados</h2>
              <Button onClick={() => setShowCadastrarModal(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Voluntário
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>BI</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : voluntarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhum voluntário vinculado à sua entidade
                      </TableCell>
                    </TableRow>
                  ) : (
                    voluntarios.map((vol) => (
                      <TableRow key={vol.id}>
                        <TableCell className="font-medium">{vol.user?.nome} {vol.user?.sobrenome}</TableCell>
                        <TableCell>{vol.user?.email}</TableCell>
                        <TableCell>{vol.user?.telefone || "-"}</TableCell>
                        <TableCell>{vol.numero_bi}</TableCell>
                        <TableCell>{vol.area_actuacao}</TableCell>
                        <TableCell>{getStatusBadge(vol.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedVoluntario(vol);
                              setShowDetalhesModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="promover" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buscar Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o email do usuário..."
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    disabled={buscando}
                  />
                  <Button onClick={handleBuscarUsuario} disabled={buscando}>
                    <Search className="h-4 w-4 mr-2" />
                    {buscando ? "Buscando..." : "Buscar"}
                  </Button>
                </div>

                {erroBusca && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-yellow-800">{erroBusca}</p>
                        <Button variant="outline" size="sm" className="mt-2" onClick={() => setShowCadastrarModal(true)}>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Cadastrar Novo Voluntário
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {usuarioEncontrado && !jaVoluntario && (
                  <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{usuarioEncontrado.nome} {usuarioEncontrado.sobrenome}</h4>
                        <p className="text-sm text-gray-600">{usuarioEncontrado.email}</p>
                        <p className="text-sm text-gray-600">{usuarioEncontrado.telefone || "Sem telefone"}</p>
                      </div>
                      <Button onClick={() => setShowPromoverModal(true)}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        Promover a Voluntário
                      </Button>
                    </div>
                  </div>
                )}

                {usuarioEncontrado && jaVoluntario && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-3">
                      <UserCheck className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-blue-800 font-medium">
                          {usuarioEncontrado.nome} {usuarioEncontrado.sobrenome} já é voluntário!
                        </p>
                        <p className="text-blue-600 text-sm mt-1">
                          Este usuário já está cadastrado como voluntário no sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Promoção */}
        <Dialog open={showPromoverModal} onOpenChange={setShowPromoverModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Promover a Voluntário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p>Confirmar promoção de <strong>{usuarioEncontrado?.nome} {usuarioEncontrado?.sobrenome}</strong> a voluntário?</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número do BI *</Label>
                  <Input 
                    placeholder="Digite o número do BI"
                    value={formData.numero_bi}
                    onChange={(e) => setFormData({...formData, numero_bi: e.target.value})}
                  />
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input 
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <Label>Área de Atuação</Label>
                <Input 
                  placeholder="Ex: Resgate, Saúde, Logística"
                  value={formData.area_actuacao}
                  onChange={(e) => setFormData({...formData, area_actuacao: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPromoverModal(false)}>Cancelar</Button>
              <Button onClick={handlePromoverVoluntario} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Cadastro */}
        <Dialog open={showCadastrarModal} onOpenChange={setShowCadastrarModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Voluntário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCadastrarVoluntario} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome *</Label>
                  <Input value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className={formErrors.nome ? "border-red-500" : ""} />
                  {formErrors.nome && <p className="text-xs text-red-500">{formErrors.nome}</p>}
                </div>
                <div>
                  <Label>Sobrenome *</Label>
                  <Input value={formData.sobrenome} onChange={(e) => setFormData({...formData, sobrenome: e.target.value})} className={formErrors.sobrenome ? "border-red-500" : ""} />
                  {formErrors.sobrenome && <p className="text-xs text-red-500">{formErrors.sobrenome}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email *</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className={formErrors.email ? "border-red-500" : ""} />
                  {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={formData.telefone} onChange={(e) => setFormData({...formData, telefone: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Senha *</Label>
                  <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className={formErrors.password ? "border-red-500" : ""} />
                  {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
                </div>
                <div>
                  <Label>Confirmar Senha *</Label>
                  <Input type="password" value={formData.password_confirmation} onChange={(e) => setFormData({...formData, password_confirmation: e.target.value})} className={formErrors.password_confirmation ? "border-red-500" : ""} />
                  {formErrors.password_confirmation && <p className="text-xs text-red-500">{formErrors.password_confirmation}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número do BI *</Label>
                  <Input value={formData.numero_bi} onChange={(e) => setFormData({...formData, numero_bi: e.target.value})} className={formErrors.numero_bi ? "border-red-500" : ""} />
                  {formErrors.numero_bi && <p className="text-xs text-red-500">{formErrors.numero_bi}</p>}
                </div>
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={formData.data_nascimento} onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Município *</Label>
                  <Select value={formData.municipio_id} onValueChange={(value) => setFormData({...formData, municipio_id: value})}>
                    <SelectTrigger className={formErrors.municipio_id ? "border-red-500" : ""}>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipios.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {formErrors.municipio_id && <p className="text-xs text-red-500">{formErrors.municipio_id}</p>}
                </div>
                <div>
                  <Label>Área de Atuação</Label>
                  <Input value={formData.area_actuacao} onChange={(e) => setFormData({...formData, area_actuacao: e.target.value})} />
                </div>
              </div>
              <div>
                <Label>Documento de Identificação (BI)</Label>
                <Input type="file" accept="image/*,application/pdf" onChange={(e) => setDocumentoFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <Label>Foto</Label>
                <Input type="file" accept="image/*" onChange={(e) => setFotoFile(e.target.files?.[0] || null)} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCadastrarModal(false)}>Cancelar</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalhes */}
        <Dialog open={showDetalhesModal} onOpenChange={setShowDetalhesModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalhes do Voluntário</DialogTitle>
            </DialogHeader>
            {selectedVoluntario && (
              <div className="space-y-3">
                <div><b>Nome:</b> {selectedVoluntario.user?.nome} {selectedVoluntario.user?.sobrenome}</div>
                <div><b>Email:</b> {selectedVoluntario.user?.email}</div>
                <div><b>Telefone:</b> {selectedVoluntario.user?.telefone || "-"}</div>
                <div><b>BI:</b> {selectedVoluntario.numero_bi}</div>
                <div><b>Data Nascimento:</b> {selectedVoluntario.data_nascimento ? new Date(selectedVoluntario.data_nascimento).toLocaleDateString() : "-"}</div>
                <div><b>Município:</b> {selectedVoluntario.municipio?.nome || "-"}</div>
                <div><b>Área de Atuação:</b> {selectedVoluntario.area_actuacao || "-"}</div>
                <div><b>Status:</b> {getStatusBadge(selectedVoluntario.status)}</div>
                <div><b>Data Cadastro:</b> {new Date(selectedVoluntario.created_at).toLocaleDateString()}</div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default EntidadeVoluntariosPage;