import React from "react";
import { AppLayout } from "@/components/AppLayout";

const PenalizacoesPage = () => (
  <AppLayout>
    <div className="mb-6 pl-12 lg:pl-0">
      <h1 className="text-2xl font-extrabold">Penalizações de Usuários</h1>
      <p className="text-sm text-muted-foreground mt-1">Gestão e histórico de penalizações aplicadas aos usuários.</p>
    </div>
    <div className="bg-white rounded-lg shadow p-4">
      <p>Em breve: listagem de penalizações.</p>
    </div>
  </AppLayout>
);

export default PenalizacoesPage;
