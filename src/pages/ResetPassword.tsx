import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ password?: string; confirmation?: string }>({});

  useEffect(() => {
    if (!token || !email) {
      setError("Link de recuperação inválido ou incompleto.");
    }
  }, [token, email]);

  const validateForm = () => {
    const errors: { password?: string; confirmation?: string } = {};
    
    if (!password) {
      errors.password = "Nova senha é obrigatória";
    } else if (password.length < 6) {
      errors.password = "A senha deve ter pelo menos 6 caracteres";
    }
    
    if (!passwordConfirmation) {
      errors.confirmation = "Confirme sua nova senha";
    } else if (password !== passwordConfirmation) {
      errors.confirmation = "As senhas não conferem";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    if (!token || !email) {
      setError("Link de recuperação inválido.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      
      if (response.data.success) {
        setIsSubmitted(true);
        toast.success("Senha alterada com sucesso!");
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.data.message || "Erro ao redefinir senha");
      }
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);
      
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;
        if (apiErrors.token) {
          setError(apiErrors.token[0]);
        } else if (apiErrors.email) {
          setError(apiErrors.email[0]);
        } else {
          setError(err.response?.data?.message || "Erro ao redefinir senha");
        }
      } else {
        setError(err.response?.data?.message || "Erro ao conectar ao servidor");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Link Inválido</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Senha Redefinida!</h1>
            <p className="text-sm text-gray-500 mt-1">
              Sua senha foi alterada com sucesso
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
            <p className="text-gray-600 mb-6">
              Agora você pode fazer login com sua nova senha.
            </p>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 rounded-lg font-medium transition-all inline-block"
            >
              Ir para o login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Redefinir Senha</h1>
          <p className="text-sm text-gray-500 mt-1">
            Digite sua nova senha
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-9 pr-9 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    validationErrors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className={`w-full pl-9 pr-9 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    validationErrors.confirmation ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {validationErrors.confirmation && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.confirmation}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || !token || !email}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Redefinindo...</span>
                </div>
              ) : (
                "Redefinir senha"
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Voltar para o login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;