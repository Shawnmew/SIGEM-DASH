// src/pages/Abrigos.tsx
import { useEffect, useState, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Building2,
  Users,
  Home,
  Plus,
  Filter,
  Search,
  CheckCircle,
  AlertTriangle,
  Edit,
  Trash2,
  MapPin,
  Phone,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

interface Abrigo {
  id: number;
  nome: string;
  capacidade_total: number;
  ocupacao_atual: number;
  endereco?: string;
  contacto?: string;
  status: "disponivel" | "lotado" | "manutencao" | "inativo";
  municipio?: {
    id: number;
    nome: string;
    provincia?: {
      id: number;
      nome: string;
    };
  };
}

export default function Abrigos() {
  const { t } = useTranslation();
  const [abrigos, setAbrigos] = useState<Abrigo[]>([]);
  const [loading, setLoading] = useState(true);
  const [provincias, setProvincias] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);

  // Filtros
  const [search, setSearch] = useState("");
  const [selectedProvincia, setSelectedProvincia] = useState("all");
  const [selectedMunicipio, setSelectedMunicipio] = useState("all");
  const [statusFilter, setStatusFilter] = useState("todos");

  // Modal Novo Abrigo
  const [openModal, setOpenModal] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoMunicipioId, setNovoMunicipioId] = useState("");
  const [novaCapacidade, setNovaCapacidade] = useState("100");
  const [novoEndereco, setNovoEndereco] = useState("");
  const [novoContacto, setNovoContacto] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Editar Ocupação
  const [editAbrigo, setEditAbrigo] = useState<Abrigo | null>(null);
  const [novaOcupacao, setNovaOcupacao] = useState(0);

  const loadAbrigos = async () => {
    try {
      setLoading(true);
      const response = await api.get("/abrigos", {
        params: {
          provincia_id: selectedProvincia,
          municipio_id: selectedMunicipio,
          status: statusFilter,
        },
      });
      setAbrigos(response.data.data || []);
    } catch (error) {
      console.error("Erro ao carregar abrigos:", error);
      toast.error("Erro ao carregar abrigos de emergência");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAbrigos();
  }, [selectedProvincia, selectedMunicipio, statusFilter]);

  useEffect(() => {
    const loadLocations = async () => {
      try {
        const resProv = await api.get("/provincias");
        setProvincias(resProv.data.data || []);
        const resMun = await api.get("/municipios");
        setMunicipios(resMun.data.data || []);
      } catch (e) {}
    };
    loadLocations();
  }, []);

  const filteredAbrigos = useMemo(() => {
    return abrigos.filter((a) => {
      const matchSearch =
        !search ||
        a.nome.toLowerCase().includes(search.toLowerCase()) ||
        a.municipio?.nome.toLowerCase().includes(search.toLowerCase());
      return matchSearch;
    });
  }, [abrigos, search]);

  const totalCapacidade = useMemo(
    () => filteredAbrigos.reduce((sum, a) => sum + (a.capacidade_total || 0), 0),
    [filteredAbrigos]
  );
  const totalOcupacao = useMemo(
    () => filteredAbrigos.reduce((sum, a) => sum + (a.ocupacao_atual || 0), 0),
    [filteredAbrigos]
  );
  const vagasLivres = totalCapacidade - totalOcupacao;
  const taxaLotacaoMedia =
    totalCapacidade > 0 ? Math.round((totalOcupacao / totalCapacidade) * 100) : 0;

  const handleCreateAbrigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome || !novoMunicipioId) {
      toast.error("Preencha o nome e o município do abrigo");
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post("/abrigos", {
        nome: novoNome,
        municipio_id: parseInt(novoMunicipioId),
        capacidade_total: parseInt(novaCapacidade) || 100,
        endereco: novoEndereco,
        contacto: novoContacto,
      });

      toast.success("Abrigo de emergência cadastrado com sucesso!");
      setOpenModal(false);
      setNovoNome("");
      setNovoEndereco("");
      setNovoContacto("");
      loadAbrigos();
    } catch (e) {
      toast.error("Erro ao cadastrar abrigo");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateOcupacao = async () => {
    if (!editAbrigo) return;
    try {
      await api.put(`/abrigos/${editAbrigo.id}`, {
        ocupacao_atual: novaOcupacao,
      });
      toast.success("Lotação do abrigo atualizada com sucesso!");
      setEditAbrigo(null);
      loadAbrigos();
    } catch (e) {
      toast.error("Erro ao atualizar ocupação");
    }
  };

  const handleDeleteAbrigo = async (id: number) => {
    if (!confirm("Tem certeza que deseja remover este abrigo?")) return;
    try {
      await api.delete(`/abrigos/${id}`);
      toast.success("Abrigo removido com sucesso!");
      loadAbrigos();
    } catch (e) {
      toast.error("Erro ao remover abrigo");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Home className="h-6 w-6 text-primary" />
              Gestão de Abrigos de Emergência
            </h1>
            <p className="text-sm text-muted-foreground">
              Monitoramento de capacidade e lotação de centros de acolhimento em tempo real
            </p>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Novo Abrigo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Abrigo de Socorro</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAbrigo} className="space-y-4 py-2">
                <div>
                  <Label>Nome do Centro / Escola / Pavilhão</Label>
                  <Input
                    placeholder="Ex: Pavilhão da Cidadania de Luanda"
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Município de Localização</Label>
                  <Select value={novoMunicipioId} onValueChange={setNovoMunicipioId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o município" />
                    </SelectTrigger>
                    <SelectContent>
                      {municipios.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.nome} ({m.provincia?.nome})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Capacidade Total (Pessoas)</Label>
                    <Input
                      type="number"
                      value={novaCapacidade}
                      onChange={(e) => setNovaCapacidade(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Contacto de Emergência</Label>
                    <Input
                      placeholder="+244 923 000 000"
                      value={novoContacto}
                      onChange={(e) => setNovoContacto(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Endereço / Ponto de Referência</Label>
                  <Input
                    placeholder="Bairro, Rua, Ponto de referência"
                    value={novoEndereco}
                    onChange={(e) => setNovoEndereco(e.target.value)}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "A guardar..." : "Cadastrar Abrigo"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cartões Estatísticos KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Abrigos Registados
              </CardTitle>
              <Building2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredAbrigos.length}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Centros mapeados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Capacidade Total
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCapacidade.toLocaleString("pt-AO")}</div>
              <p className="text-[11px] text-muted-foreground mt-1">Vagas de acolhimento</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Vagas Livres
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {vagasLivres > 0 ? vagasLivres.toLocaleString("pt-AO") : 0}
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">Disponíveis imediatamente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
                Taxa de Lotação
              </CardTitle>
              <AlertTriangle
                className={`h-4 w-4 ${
                  taxaLotacaoMedia >= 90
                    ? "text-red-500"
                    : taxaLotacaoMedia >= 75
                    ? "text-orange-500"
                    : "text-green-500"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taxaLotacaoMedia}%</div>
              <Progress value={taxaLotacaoMedia} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Filtros de Busca */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border p-4 rounded-xl">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Procurar abrigo por nome ou local..."
              className="pl-9 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] h-9">
                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos Status</SelectItem>
                <SelectItem value="disponivel">Disponível</SelectItem>
                <SelectItem value="lotado">Lotado</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de Abrigos */}
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredAbrigos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAbrigos.map((abrigo) => {
              const porcentagem = Math.round(
                (abrigo.ocupacao_atual / abrigo.capacidade_total) * 100
              );

              return (
                <Card
                  key={abrigo.id}
                  className="hover:border-primary/40 transition-all shadow-sm flex flex-col justify-between"
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge
                        variant="outline"
                        className={`uppercase text-[10px] font-bold ${
                          abrigo.status === "disponivel"
                            ? "border-green-500 text-green-600 bg-green-50"
                            : abrigo.status === "lotado"
                            ? "border-red-500 text-red-600 bg-red-50"
                            : "border-yellow-500 text-yellow-600 bg-yellow-50"
                        }`}
                      >
                        {abrigo.status}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditAbrigo(abrigo);
                            setNovaOcupacao(abrigo.ocupacao_atual);
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500"
                          onClick={() => handleDeleteAbrigo(abrigo.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-base font-bold leading-snug mt-1">
                      {abrigo.nome}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-red-500" />
                      {abrigo.municipio?.nome}, {abrigo.municipio?.provincia?.nome}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-2">
                    {abrigo.endereco && (
                      <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                        📍 {abrigo.endereco}
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Lotação Atual</span>
                        <span
                          className={
                            porcentagem >= 90
                              ? "text-red-600 font-bold"
                              : porcentagem >= 75
                              ? "text-orange-600 font-bold"
                              : "text-green-600 font-bold"
                          }
                        >
                          {abrigo.ocupacao_atual} / {abrigo.capacidade_total} ({porcentagem}%)
                        </span>
                      </div>
                      <Progress
                        value={porcentagem}
                        className={`h-2 ${
                          porcentagem >= 90
                            ? "[&>div]:bg-red-500"
                            : porcentagem >= 75
                            ? "[&>div]:bg-orange-500"
                            : "[&>div]:bg-green-500"
                        }`}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" /> {abrigo.contacto || "Sem contacto"}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => {
                          setEditAbrigo(abrigo);
                          setNovaOcupacao(abrigo.ocupacao_atual);
                        }}
                      >
                        Atualizar Vagas
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
            <Home className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-30" />
            <p className="text-sm font-medium">Nenhum abrigo de emergência cadastrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Clique em "Novo Abrigo" para registrar o primeiro centro de acolhimento.
            </p>
          </div>
        )}

        {/* Modal de Atualizar Ocupação */}
        {editAbrigo && (
          <Dialog open={!!editAbrigo} onOpenChange={() => setEditAbrigo(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atualizar Lotação: {editAbrigo.nome}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-3">
                <div>
                  <Label>Ocupação Atual (Pessoas no Abrigo)</Label>
                  <Input
                    type="number"
                    min="0"
                    max={editAbrigo.capacidade_total}
                    value={novaOcupacao}
                    onChange={(e) => setNovaOcupacao(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Capacidade Máxima: {editAbrigo.capacidade_total} vagas
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditAbrigo(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateOcupacao}>Salvar Lotação</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AppLayout>
  );
}
