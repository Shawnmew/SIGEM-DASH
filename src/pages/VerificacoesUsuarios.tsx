import React from "react";
import { AppLayout } from "@/components/AppLayout";

const VerificacoesUsuariosPage = () => (
  <AppLayout>
    <div className="mb-6 pl-12 lg:pl-0">
      <h1 className="text-2xl font-extrabold">Verificações de Usuários</h1>
      <p className="text-sm text-muted-foreground mt-1">Aprovação e gestão de verificações de identidade, telefone e email dos usuários.</p>
    </div>
    <div className="bg-white rounded-lg shadow p-4">
      <p>Em breve: listagem e aprovação de verificações.</p>
    </div>
  </AppLayout>
);

export default VerificacoesUsuariosPage;
