import React, { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Users, MapPin, Phone, CheckCircle, X, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Volunteer {
  id: number;
  name: string;
  region: string;
  specialty: string;
  status: "active" | "available" | "inactive";
  missions: number;
  phone?: string;
  email?: string;
}

const initialVolunteers: Volunteer[] = [
  { id: 1, name: "Ana Ferreira", region: "Luanda", specialty: "Primeiros Socorros", status: "active", missions: 12, phone: "+244 923 456 789", email: "ana@example.com" },
  { id: 2, name: "Carlos Mendes", region: "Benguela", specialty: "Resgate Aquático", status: "active", missions: 8, phone: "+244 923 456 788", email: "carlos@example.com" },
  { id: 3, name: "Maria Santos", region: "Huíla", specialty: "Logística", status: "available", missions: 15, phone: "+244 923 456 787", email: "maria@example.com" },
  { id: 4, name: "Pedro Neto", region: "Luanda", specialty: "Comunicações", status: "active", missions: 6, phone: "+244 923 456 786", email: "pedro@example.com" },
  { id: 5, name: "Sofia Lopes", region: "Cunene", specialty: "Saúde", status: "available", missions: 20, phone: "+244 923 456 785", email: "sofia@example.com" },
  { id: 6, name: "Jorge Almeida", region: "Uíge", specialty: "Engenharia", status: "inactive", missions: 3, phone: "+244 923 456 784", email: "jorge@example.com" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Em Missão", className: "bg-orange-100 text-orange-800" },
  available: { label: "Disponível", className: "bg-green-100 text-green-800" },
  inactive: { label: "Inativo", className: "bg-gray-100 text-gray-800" },
};

const VoluntariosPage = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>(initialVolunteers);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<Volunteer | null>(null);

  const handleView = (vol: Volunteer) => {
    setSelectedVolunteer(vol);
    setIsViewModalOpen(true);
  };

  const handleEdit = (vol: Volunteer) => {
    setEditForm({ ...vol });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editForm) {
      setVolunteers(volunteers.map(v => v.id === editForm.id ? editForm : v));
      setIsEditModalOpen(false);
      toast.success("Voluntário atualizado com sucesso!");
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover este voluntário?")) {
      setVolunteers(volunteers.filter(v => v.id !== id));
      toast.success("Voluntário removido com sucesso!");
    }
  };

  const availableCount = volunteers.filter(v => v.status === "available").length;
  const activeCount = volunteers.filter(v => v.status === "active").length;

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Voluntários</h1>
            <p className="text-sm text-muted-foreground mt-1">Gestão e mobilização de voluntários</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-full text-xs font-semibold">
              {availableCount} disponíveis
            </span>
            <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-xs font-semibold">
              {activeCount} em missão
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {volunteers.map((vol) => (
          <div key={vol.id} className="rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                {vol.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">{vol.name}</h3>
                <p className="text-xs text-muted-foreground">{vol.specialty}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusConfig[vol.status].className}`}>
                {statusConfig[vol.status].label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{vol.region}</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />{vol.missions} missões</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleView(vol)}>Ver</Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => handleEdit(vol)}>Editar</Button>
              <Button size="sm" variant="destructive" className="px-3" onClick={() => handleDelete(vol.id)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Visualização */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Voluntário</DialogTitle>
          </DialogHeader>
          {selectedVolunteer && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedVolunteer.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="font-bold">{selectedVolunteer.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedVolunteer.specialty}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-muted-foreground">Região:</div><div>{selectedVolunteer.region}</div>
                <div className="text-muted-foreground">Status:</div><div>{statusConfig[selectedVolunteer.status].label}</div>
                <div className="text-muted-foreground">Missões:</div><div>{selectedVolunteer.missions}</div>
                <div className="text-muted-foreground">Telefone:</div><div>{selectedVolunteer.phone || "-"}</div>
                <div className="text-muted-foreground">Email:</div><div>{selectedVolunteer.email || "-"}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Voluntário</DialogTitle>
          </DialogHeader>
          {editForm && (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} className="space-y-3">
              <div><Label>Nome</Label><Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required /></div>
              <div><Label>Especialidade</Label><Input value={editForm.specialty} onChange={e => setEditForm({...editForm, specialty: e.target.value})} required /></div>
              <div><Label>Região</Label><Input value={editForm.region} onChange={e => setEditForm({...editForm, region: e.target.value})} required /></div>
              <div><Label>Telefone</Label><Input value={editForm.phone || ""} onChange={e => setEditForm({...editForm, phone: e.target.value})} /></div>
              <div><Label>Email</Label><Input type="email" value={editForm.email || ""} onChange={e => setEditForm({...editForm, email: e.target.value})} /></div>
              <div><Label>Status</Label><Select value={editForm.status} onValueChange={(value) => setEditForm({...editForm, status: value as Volunteer['status']})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="available">Disponível</SelectItem><SelectItem value="active">Em Missão</SelectItem><SelectItem value="inactive">Inativo</SelectItem></SelectContent></Select></div>
              <div><Label>Missões</Label><Input type="number" value={editForm.missions} onChange={e => setEditForm({...editForm, missions: parseInt(e.target.value)})} /></div>
              <DialogFooter><Button type="submit">Salvar</Button><Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancelar</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default VoluntariosPage;