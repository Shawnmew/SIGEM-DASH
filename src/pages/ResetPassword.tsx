import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft, Hash } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";
  const tokenFromUrl = searchParams.get("token") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState(tokenFromUrl);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ 
    email?: string; 
    code?: string; 
    password?: string; 
    confirmation?: string 
  }>({});

  useEffect(() => {
    if (emailFromUrl) setEmail(emailFromUrl);
    if (tokenFromUrl) setCode(tokenFromUrl);
  }, [emailFromUrl, tokenFromUrl]);

  const validateForm = () => {
    const errors: { email?: string; code?: string; password?: string; confirmation?: string } = {};
    
    if (!email) {
      errors.email = t('email_required');
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = t('invalid_email');
    }

    if (!code) {
      errors.code = t('code_required');
    } else if (code.length !== 6) {
      errors.code = t('code_invalid_length');
    }

    if (!password) {
      errors.password = t('new_password_required');
    } else if (password.length < 6) {
      errors.password = t('password_too_short');
    }
    
    if (!passwordConfirmation) {
      errors.confirmation = t('confirm_password_required');
    } else if (password !== passwordConfirmation) {
      errors.confirmation = t('passwords_dont_match');
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

    setIsLoading(true);

    try {
      const response = await api.post("/auth/reset-password", {
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      });
      
      if (response.data.success) {
        setIsSubmitted(true);
        toast.success(t('password_changed_success'));
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(response.data.message || t('error_resetting_password'));
      }
    } catch (err: any) {
      console.error("Erro ao redefinir senha:", err);
      
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors;
        if (apiErrors.code) {
          setError(apiErrors.code[0]);
        } else if (apiErrors.email) {
          setError(apiErrors.email[0]);
        } else {
          setError(err.response?.data?.message || t('error_resetting_password'));
        }
      } else {
        setError(err.response?.data?.message || t('connection_error'));
      }
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
            <h1 className="text-2xl font-bold text-gray-900">{t('reset_password_success_title')}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {t('reset_password_success_subtitle')}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 text-center">
            <p className="text-gray-600 mb-6">
              {t('can_login_now')}
            </p>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 rounded-lg font-medium transition-all inline-block"
            >
              {t('go_to_login')}
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
          <h1 className="text-2xl font-bold text-gray-900">{t('reset_password_title')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('reset_password_subtitle')}
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
                {t('recovery_code_label')}
              </label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className={`w-full pl-9 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                    validationErrors.code ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="000000"
                  disabled={isLoading}
                />
              </div>
              {validationErrors.code && (
                <p className="text-xs text-red-500 mt-1">{validationErrors.code}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('new_password_label')}
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
                {t('confirm_new_password_label')}
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
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{t('resetting')}</span>
                </div>
              ) : (
                t('reset_password_button')
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-gray-600 hover:text-primary transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              {t('request_new_code')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;