import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Image, 
  Video, 
  User, 
  Calendar, 
  MessageSquare,
  ZoomIn,
  Play,
  X,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import api from '@/lib/api';

interface ProvaVoluntario {
  id: number;
  voluntario_nome: string;
  voluntario_email: string;
  resposta: string;
  midia_url: string;
  midia_tipo: string;
  mensagem: string;
  data: string;
}

interface HistoricoStatus {
  id: number;
  status_anterior: string;
  status_novo: string;
  tipo_midia: string;
  caminho_midia: string;
  notas: string;
  criado_em: string;
  usuario_nome: string;
}

interface AtualizacoesIncidenteProps {
  incidenteId: number;
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

const statusLabels: Record<string, { label: string; icon: JSX.Element; color: string }> = {
  pendente: { label: 'Pendente', icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-800' },
  em_analise: { label: 'Em Análise', icon: <Clock className="h-3 w-3" />, color: 'bg-blue-100 text-blue-800' },
  confirmado: { label: 'Confirmado', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-100 text-green-800' },
  em_andamento: { label: 'Em Andamento', icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-orange-100 text-orange-800' },
  resolvido: { label: 'Resolvido', icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-500 text-white' },
  encerrado: { label: 'Encerrado', icon: <Clock className="h-3 w-3" />, color: 'bg-gray-100 text-gray-800' },
  cancelado: { label: 'Cancelado', icon: <AlertTriangle className="h-3 w-3" />, color: 'bg-red-100 text-red-800' },
};

export const AtualizacoesIncidente: React.FC<AtualizacoesIncidenteProps> = ({
  incidenteId,
  isOpen,
  onClose,
  token
}) => {
  const [loading, setLoading] = useState(true);
  const [provas, setProvas] = useState<ProvaVoluntario[]>([]);
  const [historico, setHistorico] = useState<HistoricoStatus[]>([]);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<any>(null);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [selectedMediaType, setSelectedMediaType] = useState<string>('');

  useEffect(() => {
    if (isOpen && incidenteId) {
      loadAtualizacoes();
    }
  }, [isOpen, incidenteId]);

  const loadAtualizacoes = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/incidentes/${incidenteId}/atualizacoes`);
      if (response.data.success) {
        setProvas(response.data.data.alertas_com_provas || []);
        setHistorico(response.data.data.historico_atualizacoes || []);
        setUltimaAtualizacao(response.data.data.ultima_atualizacao);
      }
    } catch (error) {
      console.error('Erro ao carregar atualizações:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRespostaBadge = (resposta: string) => {
    const config: Record<string, { label: string; color: string }> = {
      aceito: { label: 'Aceito', color: 'bg-green-100 text-green-800' },
      recusado: { label: 'Recusado', color: 'bg-red-100 text-red-800' },
      pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    };
    const c = config[resposta] || config.pendente;
    return <Badge className={c.color}>{c.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config = statusLabels[status] || statusLabels.pendente;
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        {config.icon}
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date: string) => {
    if (!date) return 'Data não disponível';
    return new Date(date).toLocaleString('pt-AO', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const openMediaModal = (url: string, tipo: string) => {
    setSelectedMedia(url);
    setSelectedMediaType(tipo);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Atualizações do Incidente #{incidenteId}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <Tabs defaultValue="provas" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="provas">Provas dos Voluntários</TabsTrigger>
              <TabsTrigger value="historico">Histórico de Status</TabsTrigger>
              <TabsTrigger value="ultima">Última Atualização</TabsTrigger>
            </TabsList>

            <TabsContent value="provas" className="space-y-4 mt-4">
              {provas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma prova enviada pelos voluntários</p>
                </div>
              ) : (
                provas.map((prova, index) => (
                  <Card key={prova.id || index} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{prova.voluntario_nome}</p>
                            <p className="text-xs text-muted-foreground">{prova.voluntario_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getRespostaBadge(prova.resposta)}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(prova.data)}
                          </span>
                        </div>
                      </div>

                      {prova.mensagem && (
                        <div className="bg-muted p-3 rounded-lg mb-3">
                          <p className="text-sm whitespace-pre-wrap">{prova.mensagem}</p>
                        </div>
                      )}

                      {prova.midia_url && (
                        <div 
                          className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100"
                          onClick={() => openMediaModal(prova.midia_url, prova.midia_tipo)}
                        >
                          {prova.midia_tipo === 'foto' ? (
                            <img 
                              src={prova.midia_url} 
                              alt="Prova" 
                              className="w-full max-h-48 object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Erro+ao+carregar';
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-48 bg-gray-900">
                              <Play className="h-12 w-12 text-white" />
                              <span className="ml-2 text-white">Clique para ver vídeo</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ZoomIn className="h-8 w-8 text-white" />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="historico" className="space-y-4 mt-4">
              {historico.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma alteração de status registrada</p>
                </div>
              ) : (
                historico.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{item.usuario_nome || 'Sistema'}</p>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.criado_em)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-sm">Status alterado de:</span>
                        {getStatusBadge(item.status_anterior)}
                        <span>→</span>
                        {getStatusBadge(item.status_novo)}
                      </div>

                      {item.notas && (
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{item.notas}</p>
                        </div>
                      )}

                      {item.caminho_midia && (
                        <div 
                          className="mt-3 cursor-pointer text-primary hover:underline flex items-center gap-2"
                          onClick={() => openMediaModal(item.caminho_midia!, item.tipo_midia)}
                        >
                          {item.tipo_midia === 'foto' ? (
                            <Image className="h-4 w-4" />
                          ) : (
                            <Video className="h-4 w-4" />
                          )}
                          <span className="text-sm">Ver mídia anexada</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="ultima" className="mt-4">
              {ultimaAtualizacao ? (
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {ultimaAtualizacao.voluntario || 'Voluntário'}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(ultimaAtualizacao.data)}
                      </span>
                    </div>

                    {ultimaAtualizacao.mensagem && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{ultimaAtualizacao.mensagem}</p>
                      </div>
                    )}

                    {ultimaAtualizacao.midia_url && (
                      <div 
                        className="relative group cursor-pointer rounded-lg overflow-hidden bg-gray-100"
                        onClick={() => openMediaModal(ultimaAtualizacao.midia_url, ultimaAtualizacao.midia_tipo)}
                      >
                        {ultimaAtualizacao.midia_tipo === 'foto' ? (
                          <img 
                            src={ultimaAtualizacao.midia_url} 
                            alt="Última prova" 
                            className="w-full max-h-64 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/600x400?text=Erro+ao+carregar';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-64 bg-gray-900">
                            <Play className="h-12 w-12 text-white" />
                            <span className="ml-2 text-white">Clique para reproduzir vídeo</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma atualização registrada ainda</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Modal de visualização de mídia */}
        <Dialog open={!!selectedMedia} onOpenChange={() => setSelectedMedia(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95">
            <button
              onClick={() => setSelectedMedia(null)}
              className="absolute right-4 top-4 z-50 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            {selectedMedia && (
              <div className="flex items-center justify-center w-full h-full min-h-[60vh]">
                {selectedMediaType === 'foto' ? (
                  <img 
                    src={selectedMedia} 
                    alt="Mídia" 
                    className="max-w-full max-h-[85vh] object-contain"
                  />
                ) : (
                  <video 
                    src={selectedMedia} 
                    controls 
                    autoPlay 
                    className="max-w-full max-h-[85vh]"
                  />
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};