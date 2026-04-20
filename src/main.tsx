import { createRoot } from "react-dom/client";
import App from "./App";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SessionProvider } from "@/contexts/SessionContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <AuthProvider>
      <SessionProvider timeoutMinutes={30} warningMinutes={2}>
        <App />
      </SessionProvider>
    </AuthProvider>
  </ThemeProvider>
);