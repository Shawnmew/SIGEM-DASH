import React from "react";
import { AppLayout } from "@/components/AppLayout";

const RegioesPage = () => (
  <AppLayout>
    <div className="mb-6 pl-12 lg:pl-0">
      <h1 className="text-2xl font-extrabold">Regiões</h1>
      <p className="text-sm text-muted-foreground mt-1">Gestão de províncias, municípios e comunas.</p>
    </div>
    <div className="bg-white rounded-lg shadow p-4">
      <p>Em breve: cadastro e visualização de regiões.</p>
    </div>
  </AppLayout>
);

export default RegioesPage;
