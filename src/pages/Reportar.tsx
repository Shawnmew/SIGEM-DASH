import { AppLayout } from "@/components/AppLayout";
import { useState } from "react";
import { CrisisType, CrisisSeverity, crisisTypeLabels, severityLabels } from "@/data/crisisData";
import { AlertTriangle, CheckCircle, MapPin, Send } from "lucide-react";

const ReportarPage = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  if (submitted) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-crisis-low/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-crisis-low" />
            </div>
            <h2 className="text-xl font-bold mb-2">Emergência Reportada!</h2>
            <p className="text-sm text-muted-foreground">
              A sua denúncia foi recebida e será analisada pela equipa de resposta.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6 pl-12 lg:pl-0">
        <h1 className="text-2xl font-extrabold">Reportar Emergência</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preencha o formulário para reportar uma crise ou emergência
        </p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Título da Emergência</label>
            <input
              type="text"
              required
              placeholder="Ex: Inundação no bairro X"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Type + Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Tipo de Desastre</label>
              <select
                required
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                {Object.entries(crisisTypeLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Severidade</label>
              <select
                required
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Selecionar...</option>
                {Object.entries(severityLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Region */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Província</label>
              <input
                type="text"
                required
                placeholder="Ex: Luanda"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Localidade</label>
              <input
                type="text"
                required
                placeholder="Ex: Bairro Sambizanga"
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Descrição</label>
            <textarea
              required
              rows={4}
              placeholder="Descreva a situação com o máximo de detalhes possível..."
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          {/* Affected */}
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Estimativa de Pessoas Afetadas</label>
            <input
              type="number"
              min={0}
              placeholder="Ex: 500"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <button
            type="submit"
            className="w-full crisis-gradient text-primary-foreground font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          >
            <Send className="h-4 w-4" />
            Submeter Relatório
          </button>
        </form>
      </div>
    </AppLayout>
  );
};

export default ReportarPage;
