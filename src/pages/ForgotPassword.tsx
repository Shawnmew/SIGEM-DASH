import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email) {
      setError(t('email_required'));
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError(t('invalid_email'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", { email });
      
      if (response.data.success) {
        toast.success(t('recovery_code_sent'));
        navigate(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        setError(response.data.message || t('error_sending_recovery'));
      }
    } catch (err: any) {
      console.error("Erro ao solicitar recuperação:", err);
      setError(err.response?.data?.message || t('connection_error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg mb-4">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('email_sent_title')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('email_sent_subtitle')}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                {t('email_recovery_instructions')}
              </p>
              <p className="font-medium text-gray-900 bg-gray-50 p-3 rounded-lg mb-6">
                {email}
              </p>
              <p className="text-sm text-gray-500 mb-6">
                {t('reset_password_instructions')}
                {t('link_valid_24h')}
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {t('back_to_login')}
              </Link>
            </div>
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
          <h1 className="text-2xl font-bold text-gray-900">{t('forgot_password_title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('forgot_password_subtitle')}
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
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('sending')}</span>
                </div>
              ) : (
                t('send_recovery_link')
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              {t('back_to_login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;