// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/authcontext";
import { ProtectedRoute } from "@/components/protectedroute";
import { Toaster } from "sonner";
import Index from "./pages/index";
import Login from "./pages/login";
import Usuarios from "./pages/usuarios";
import Entidades from "./pages/entidades";
import Voluntarios from "./pages/voluntarios";
import Reportar from "./pages/Reportar";
import NotFound from "./pages/notfound";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/login" element={<Login />} />
          
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
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;