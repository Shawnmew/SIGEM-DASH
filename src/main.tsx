import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "@/contexts/SessionContext";
import { initSoundService } from "@/services/soundService";
import "./index.css";

// Initialize sound service (prepares audio context on user interaction)
initSoundService();

// Set page title for screen readers
document.title = "SIGEM - Sistema Integrado de Gestão de Emergências";

// Add keyboard navigation hint for screen readers
const metaDescription = document.createElement('meta');
metaDescription.name = "description";
metaDescription.content = "Sistema Integrado de Gestão de Emergências para Angola. Reporte incidentes, mobilize voluntários e coordene respostas a emergências.";
document.head.appendChild(metaDescription);

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <SessionProvider timeoutMinutes={30} warningMinutes={2}>
        <App />
      </SessionProvider>
    </AuthProvider>
  </ThemeProvider>
);