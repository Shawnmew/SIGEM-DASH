import React from "react";
import { AppLayout } from "@/components/AppLayout";

const TermosVoluntariadoPage = () => (
  <AppLayout>
    <div className="mb-6 pl-12 lg:pl-0">
      <h1 className="text-2xl font-extrabold">Termos de Voluntariado</h1>
      <p className="text-sm text-muted-foreground mt-1">Gestão dos termos assinados pelos voluntários.</p>
    </div>
    <div className="bg-white rounded-lg shadow p-4">
      <p>Em breve: listagem e gestão de termos.</p>
    </div>
  </AppLayout>
);

export default TermosVoluntariadoPage;
