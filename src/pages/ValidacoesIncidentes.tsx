import React from "react";
import { AppLayout } from "@/components/AppLayout";

const ValidacoesIncidentesPage = () => (
  <AppLayout>
    <div className="mb-6 pl-12 lg:pl-0">
      <h1 className="text-2xl font-extrabold">Validações de Incidentes</h1>
      <p className="text-sm text-muted-foreground mt-1">Gestão e aprovação de incidentes reportados.</p>
    </div>
    <div className="bg-white rounded-lg shadow p-4">
      <p>Em breve: validação manual/automática de incidentes.</p>
    </div>
  </AppLayout>
);

export default ValidacoesIncidentesPage;
