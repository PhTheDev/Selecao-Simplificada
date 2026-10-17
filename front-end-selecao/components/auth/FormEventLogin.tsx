"use client";

import { nomeConselho } from "@/config/ConselhoConfig";
import { safeInternalRedirect } from "@/utils/safeNavigation";
import { Eye, EyeOff, Lock, Shield, User } from "lucide-react";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";
import { useI18n } from '@/components/i18n/LanguageProvider';

interface AdminLoginResponse {
  administrator: {
    id: number;
    full_name: string;
    username: string;
    email?: string;
    profile_image_url?: string | null;
  };
  tokens: {
    access: string;
    refresh: string;
  };
}

type FieldErrors = {
  username?: string;
  password?: string;
};

type ErrorResponse = {
  detail?: string;
  non_field_errors?: string[] | string;
  username?: string[] | string;
  password?: string[] | string;
  error?: string[] | string;
  [key: string]: unknown;
};

function joinIfArray(v: unknown): string {
  if (Array.isArray(v)) return v.filter(Boolean).join(", ");
  if (typeof v === "string") return v;
  return "";
}

function parseAdminLoginError(payload: ErrorResponse) {
  const nonField = joinIfArray(payload.non_field_errors);
  const detail = joinIfArray(payload.detail);
  const general = joinIfArray(payload.error);

  const usernameErr = joinIfArray(payload.username);
  const passwordErr = joinIfArray(payload.password);

  const raw = nonField || detail || general || usernameErr || passwordErr;
  const lower = (raw || "").toLowerCase();

  const isInvalidCredentials =
    lower.includes("invalid") ||
    lower.includes("credenciais") ||
    lower.includes("usuário") ||
    lower.includes("usuario") ||
    lower.includes("senha") ||
    lower.includes("incorrect") ||
    lower.includes("not found") ||
    lower.includes("authentication");

  const message = isInvalidCredentials
    ? "Usuário ou senha incorretos. Verifique e tente novamente."
    : raw
      ? raw
      : "Não foi possível entrar. Tente novamente.";

  return {
    message,
    fieldErrors: {
      username: usernameErr || (isInvalidCredentials ? "Confira o usuário." : ""),
      password: passwordErr || (isInvalidCredentials ? "Confira a senha." : ""),
    } as FieldErrors,
    isInvalidCredentials,
  };
}

export function FormEventLogin() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  // ✅ feedback granular
  const [error, setError] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const hasAnyError = useMemo(() => !!error || !!fieldErrors.username || !!fieldErrors.password, [error, fieldErrors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // limpa erro ao digitar
    if (error) setError("");
    if (fieldErrors[name as keyof FieldErrors]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/administration/administrators/login/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const data = (await response.json()) as AdminLoginResponse;

        // ✅ Salva os tokens nos cookies específicos do admin (max-age alinhado ao JWT 1h)
        document.cookie = `admin-access-token=${data.tokens.access}; path=/; max-age=3600; samesite=lax${
          process.env.NODE_ENV === "production" ? "; secure" : ""
        }`;
        document.cookie = `admin-refresh-token=${data.tokens.refresh}; path=/; max-age=604800; samesite=lax${
          process.env.NODE_ENV === "production" ? "; secure" : ""
        }`;
        document.cookie = `admin-user=${encodeURIComponent(JSON.stringify(data.administrator))}; path=/; max-age=3600; samesite=lax${
          process.env.NODE_ENV === "production" ? "; secure" : ""
        }`;

        toast.success(t('Bem-vindo, {name}!', { name: data.administrator.full_name }));

        const urlParams = new URLSearchParams(window.location.search);
        const redirectUrl = safeInternalRedirect(urlParams.get("redirect"), "/painel-admin/");
        window.location.href = redirectUrl;
        return;
      }

      // ❌ erro
      let errorData: ErrorResponse = {};
      try {
        errorData = (await response.json()) as ErrorResponse;
      } catch {
        const txt = await response.text();
        errorData = { detail: txt || "Erro ao fazer login" };
      }

      const parsed = parseAdminLoginError(errorData);
      setError(parsed.message);

      // aplica erros de campo só se tiver algo (pra não ficar mensagem vazia)
      setFieldErrors({
        username: parsed.fieldErrors.username || undefined,
        password: parsed.fieldErrors.password || undefined,
      });

      toast.error(t(parsed.message));
    } catch (err) {
      console.error("Erro no login:", err);
      const msg = t("Erro ao conectar com o servidor. Verifique sua conexão.");
      setError(msg);
      toast.error(t(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card bg-card rounded-3xl p-6 sm:p-8 border">
      {/* Cabeçalho */}
      <div className="text-center mb-8 animate-fade-in">
        <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-hover rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-current" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold text-primary mb-2">
          {t("Painel Administrativo")}
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base font-medium">
          {t('Sistema de Administração')} <br /> {nomeConselho}
        </p>
      </div>

      {/* ✅ Alert de erro geral */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl text-sm bg-destructive/20 border border-destructive/50 text-destructive">
          <div className="flex items-start">
            <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{t(error)}</p>
          </div>
        </div>
      )}

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Username */}
        <div className="space-y-2">
          <label htmlFor="username" className="block text-sm font-semibold text-muted-foreground">
            {t("Usuário:")}
          </label>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-transform group-focus-within:-translate-y-1">
              <User className="h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
            </div>

            <input
              type="text"
              autoComplete="username"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="seu.usuario"
              required
              disabled={loading}
              className={`w-full pl-10 pr-3 py-3 bg-background border rounded-2xl text-foreground placeholder-muted-foreground outline-none transition-all hover:bg-white/15 focus:bg-white/15 backdrop-blur-sm
                ${fieldErrors.username ? "border-destructive/70 focus:ring-2 focus:ring-destructive focus:border-transparent" : "border-input focus:ring-2 focus:ring-white focus:border-transparent"}
              `}
            />
          </div>

          {fieldErrors.username && (
            <p className="text-xs text-destructive">{fieldErrors.username}</p>
          )}
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-semibold text-muted-foreground">
            {t("Senha:")}
          </label>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-transform group-focus-within:-translate-y-1">
              <Lock className="h-5 w-5 text-primary group-focus-within:text-primary transition-colors" />
            </div>

            <input
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              disabled={loading}
              className={`w-full pl-10 pr-10 py-3 bg-background border rounded-2xl text-foreground placeholder-muted-foreground outline-none transition-all hover:bg-white/15 focus:bg-white/15 backdrop-blur-sm
                ${fieldErrors.password ? "border-destructive/70 focus:ring-2 focus:ring-destructive focus:border-transparent" : "border-input focus:ring-2 focus:ring-white focus:border-transparent"}
              `}
            />

            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-primary hover:text-primary transition-colors disabled:opacity-60"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              disabled={loading}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {fieldErrors.password && (
            <p className="text-xs text-destructive">{fieldErrors.password}</p>
          )}
        </div>

        {/* Botão */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-6 py-4 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-bold rounded-2xl transition-all duration-300 flex items-center justify-center group shadow-lg shadow-primary/30 hover:shadow-primary/40
            ${loading ? "opacity-90 cursor-wait" : "hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"}
          `}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t("Acessando...")}
            </>
          ) : (
            <>
              <span className="mr-2">{t("Acessar Painel")}</span>
              <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>

        {/* dica: só aparece se teve erro */}
        {hasAnyError && !loading && (
          <p className="text-xs text-muted-foreground text-center">
            {t("Se você esqueceu a senha, peça ao suporte para redefinir o acesso do administrador.")}
          </p>
        )}
      </form>

      {/* Informação de acesso restrito */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg border border-input">
        <p className="text-muted-foreground text-xs text-center">
          <Shield className="w-3 h-3 inline mr-1" />
          {t("Acesso restrito para administradores do sistema")}
        </p>
      </div>
    </div>
  );
}
