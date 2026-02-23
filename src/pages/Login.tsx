import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff, AlertTriangle } from "lucide-react";

const LoginPage = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Verifique o seu email para confirmar o registo.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden crisis-gradient items-end p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(358_44%_62%/0.4),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,hsl(0_0%_100%/0.06),transparent_70%)]" />
        <div className="relative z-10 text-primary-foreground max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 backdrop-blur-sm flex items-center justify-center border border-primary-foreground/20">
              <Shield className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">SIGEC</span>
          </div>
          <h2 className="text-3xl font-bold leading-tight mb-4 text-balance">
            Sistema Integrado de Gestão de Crises
          </h2>
          <p className="text-primary-foreground/70 text-sm leading-relaxed">
            Plataforma de monitoramento, coordenação e resposta a emergências em todo o território nacional.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl crisis-gradient flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">SIGEC</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1">
              {isSignUp ? "Criar conta" : "Bem-vindo de volta"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isSignUp
                ? "Registe-se para aceder ao sistema"
                : "Introduza as suas credenciais para continuar"}
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-5 rounded-lg bg-destructive/8 border border-destructive/15 text-destructive text-xs">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 mb-5 rounded-lg bg-crisis-low/8 border border-crisis-low/15 text-crisis-low text-xs font-medium">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Ana Ferreira"
                  className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
                className="w-full bg-background border border-input rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block uppercase tracking-wide">
                Palavra-passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  className="w-full bg-background border border-input rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Aguarde..." : isSignUp ? "Criar Conta" : "Entrar"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-center text-xs text-muted-foreground">
              {isSignUp ? "Já tem conta?" : "Não tem conta?"}{" "}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setError(""); setMessage(""); }}
                className="text-primary font-semibold hover:underline"
              >
                {isSignUp ? "Iniciar Sessão" : "Registar-se"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
