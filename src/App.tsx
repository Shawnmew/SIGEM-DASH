import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CrisesPage from "./pages/Crises";
import ReportarPage from "./pages/Reportar";
import MapaPage from "./pages/Mapa";
import VoluntariosPage from "./pages/Voluntarios";
import RelatoriosPage from "./pages/Relatorios";
import AlertasPage from "./pages/Alertas";
import LoginPage from "./pages/Login";
import UsuariosPage from "./pages/Usuarios";
import EntidadesPage from "./pages/Entidades";
import VerificacoesUsuariosPage from "./pages/VerificacoesUsuarios";
import PenalizacoesPage from "./pages/Penalizacoes";
import ValidacoesIncidentesPage from "./pages/ValidacoesIncidentes";
import RegioesPage from "./pages/Regioes";
import TermosVoluntariadoPage from "./pages/TermosVoluntariado";
import AtribuicoesPage from "./pages/Atribuicoes";
import LogsUSSDPage from "./pages/LogsUSSD";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/crises" element={<ProtectedRoute><CrisesPage /></ProtectedRoute>} />
            <Route path="/reportar" element={<ProtectedRoute><ReportarPage /></ProtectedRoute>} />
            <Route path="/mapa" element={<ProtectedRoute><MapaPage /></ProtectedRoute>} />
            <Route path="/voluntarios" element={<ProtectedRoute><VoluntariosPage /></ProtectedRoute>} />
            <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
            <Route path="/alertas" element={<ProtectedRoute><AlertasPage /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute><UsuariosPage /></ProtectedRoute>} />
            <Route path="/entidades" element={<ProtectedRoute><EntidadesPage /></ProtectedRoute>} />
            <Route path="/verificacoes-usuarios" element={<ProtectedRoute><VerificacoesUsuariosPage /></ProtectedRoute>} />
            <Route path="/penalizacoes" element={<ProtectedRoute><PenalizacoesPage /></ProtectedRoute>} />
            <Route path="/validacoes-incidentes" element={<ProtectedRoute><ValidacoesIncidentesPage /></ProtectedRoute>} />
            <Route path="/regioes" element={<ProtectedRoute><RegioesPage /></ProtectedRoute>} />
            <Route path="/termos-voluntariado" element={<ProtectedRoute><TermosVoluntariadoPage /></ProtectedRoute>} />
            <Route path="/atribuicoes" element={<ProtectedRoute><AtribuicoesPage /></ProtectedRoute>} />
            <Route path="/logs-ussd" element={<ProtectedRoute><LogsUSSDPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
