import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Toaster } from "sonner";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Usuarios from "./pages/Usuarios";
import Entidades from "./pages/Entidades";
import Voluntarios from "./pages/Voluntarios";
import NotFound from "./pages/NotFound";

// Páginas que ainda serão implementadas (opcionais)
// import Crises from "./pages/Crises";
// import Reportar from "./pages/Reportar";
// import Mapa from "./pages/Mapa";
// import Relatorios from "./pages/Relatorios";
// import Alertas from "./pages/Alertas";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Rota pública */}
          <Route path="/login" element={<Login />} />
          
          {/* Rotas protegidas - apenas autenticados */}
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
          
          {/* Rotas opcionais - descomente quando as páginas estiverem prontas */}
          {/*
          <Route path="/crises" element={
            <ProtectedRoute>
              <Crises />
            </ProtectedRoute>
          } />
          
          <Route path="/reportar" element={
            <ProtectedRoute>
              <Reportar />
            </ProtectedRoute>
          } />
          
          <Route path="/mapa" element={
            <ProtectedRoute>
              <Mapa />
            </ProtectedRoute>
          } />
          
          <Route path="/relatorios" element={
            <ProtectedRoute>
              <Relatorios />
            </ProtectedRoute>
          } />
          
          <Route path="/alertas" element={
            <ProtectedRoute>
              <Alertas />
            </ProtectedRoute>
          } />
          */}
          
          {/* Rota 404 - página não encontrada */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;