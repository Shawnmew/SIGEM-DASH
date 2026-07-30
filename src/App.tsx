// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "sonner";
import Index from "./pages/Index";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Usuarios from "./pages/Usuarios";
import Entidades from "./pages/Entidades";
import Voluntarios from "./pages/Voluntarios";
import Reportar from "./pages/Reportar";
import NotFound from "./pages/NotFound";
import Mapa from "./pages/Mapa";
import Alertas from "./pages/Alertas";
import Crises from "./pages/Crises";
import Relatorios from "./pages/Relatorios";
import CriseDetalhes from "./pages/CriseDetalhes";
import LogsAuditoria from "./pages/LogsAuditoria";
import TodasCrises from "./pages/TodasCrises";
import Perfil from "./pages/Perfil";
import Abrigos from "./pages/Abrigos";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          
          <Route path="/usuarios" element={
            <ProtectedRoute requireAdmin>
              <Usuarios />
            </ProtectedRoute>
          } />
          
          <Route path="/entidades" element={
            <ProtectedRoute requireAdmin>
              <Entidades />
            </ProtectedRoute>
          } />
          
          <Route path="/voluntarios" element={
            <ProtectedRoute>
              <Voluntarios />
            </ProtectedRoute>
          } />
          
          <Route path="/reportar" element={
            <ProtectedRoute>
              <Reportar />
            </ProtectedRoute>
          } />
          
          <Route path="/mapa" element={<ProtectedRoute><Mapa /></ProtectedRoute>} />
          <Route path="/alertas" element={<ProtectedRoute><Alertas /></ProtectedRoute>} />
          <Route path="/crises" element={<ProtectedRoute><Crises /></ProtectedRoute>} />
          <Route path="/crises/:id" element={<ProtectedRoute><CriseDetalhes /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
          <Route path="/abrigos" element={<ProtectedRoute><Abrigos /></ProtectedRoute>} />
          <Route path="/logs-auditoria" element={
            <ProtectedRoute requireAdmin>
              <LogsAuditoria />
            </ProtectedRoute>
          } />
          <Route path="/todas-crises" element={
            <ProtectedRoute>
              <TodasCrises />
            </ProtectedRoute>
          } />
          
          <Route path="/perfil" element={
            <ProtectedRoute>
              <Perfil />
            </ProtectedRoute>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;