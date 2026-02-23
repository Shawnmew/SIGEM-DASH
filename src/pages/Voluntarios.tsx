import { AppLayout } from "@/components/AppLayout";
import { Users, MapPin, Phone, CheckCircle } from "lucide-react";

const volunteers = [
  { id: 1, name: "Ana Ferreira", region: "Luanda", specialty: "Primeiros Socorros", status: "active", missions: 12 },
  { id: 2, name: "Carlos Mendes", region: "Benguela", specialty: "Resgate Aquático", status: "active", missions: 8 },
  { id: 3, name: "Maria Santos", region: "Huíla", specialty: "Logística", status: "available", missions: 15 },
  { id: 4, name: "Pedro Neto", region: "Luanda", specialty: "Comunicações", status: "active", missions: 6 },
  { id: 5, name: "Sofia Lopes", region: "Cunene", specialty: "Saúde", status: "available", missions: 20 },
  { id: 6, name: "Jorge Almeida", region: "Uíge", specialty: "Engenharia", status: "inactive", missions: 3 },
];

const statusBadge: Record<string, { label: string; className: string }> = {
  active: { label: "Em Missão", className: "bg-crisis-high/10 text-crisis-high" },
  available: { label: "Disponível", className: "bg-crisis-low/10 text-crisis-low" },
  inactive: { label: "Inativo", className: "bg-muted text-muted-foreground" },
};

const VoluntariosPage = () => {
  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Voluntários</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestão e mobilização de voluntários
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-crisis-low/10 text-crisis-low px-3 py-1.5 rounded-full font-semibold">
              {volunteers.filter(v => v.status === "available").length} disponíveis
            </span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {volunteers.map((vol) => (
          <div key={vol.id} className="rounded-xl border border-border bg-card p-4 animate-slide-up hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full crisis-gradient flex items-center justify-center text-primary-foreground font-bold text-sm">
                {vol.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm truncate">{vol.name}</h3>
                <p className="text-xs text-muted-foreground">{vol.specialty}</p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${statusBadge[vol.status].className}`}>
                {statusBadge[vol.status].label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{vol.region}</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" />{vol.missions} missões</span>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

export default VoluntariosPage;
