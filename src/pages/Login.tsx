// src/pages/Login.tsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const LoginPage = () => {
  const navigate = useNavigate();
  const { signIn, loading, savedProfiles, switchProfile } = useAuth();
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [switching, setSwitching] = useState<string | null>(null);

  const handleSwitchProfile = async (profileEmail: string) => {
    setSwitching(profileEmail);
    await switchProfile(profileEmail);
    setSwitching(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Preencha todos os campos");
      return;
    }

    try {
      const success = await signIn(email, password);
      if (success) {
        navigate("/");
      } else {
        // O signIn já exibe o toast
        setError("Credenciais inválidas ou acesso negado.");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "Erro ao fazer login";
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg mb-4">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('system_name')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('system_description')}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {t('access_system')}
            </h2>
            <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg flex items-center justify-between gap-4">
              <p className="text-xs text-yellow-800 dark:text-yellow-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{t('access_warning')}</span>
              </p>
              <LanguageSwitcher />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}
            
            {savedProfiles && savedProfiles.length > 0 && (
                <div className="mb-6 space-y-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t('saved_accounts')}
                  </label>
                  {savedProfiles.map((p) => (
                    <div 
                      key={p.user.email} 
                      onClick={() => !switching && handleSwitchProfile(p.user.email)}
                      className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${switching === p.user.email ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center font-bold">
                          {p.user.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {p.user.nome} {p.user.sobrenome}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{p.user.email}</p>
                        </div>
                      </div>
                      {switching === p.user.email ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                          <div className="text-gray-400">&rarr;</div>
                      )}
                    </div>
                  ))}
                  
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white dark:bg-gray-800 px-2 text-xs text-gray-500 dark:text-gray-400">
                        {t('other_account')}
                      </span>
                    </div>
                  </div>
                </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="admin@sistem.ao"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="••••••"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-xs text-primary hover:text-primary/80 transition-colors"
              >
                {t('forgot_password')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('loading')}</span>
                </div>
              ) : (
                t('login')
              )}
            </button>
          </form>


        </div>

        <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          {t('copyright')}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;