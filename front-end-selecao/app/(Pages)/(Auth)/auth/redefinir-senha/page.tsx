'use client';
import BrandMark from "@/components/BrandMark";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { useI18n } from '@/components/i18n/LanguageProvider';

// Componente que realmente usa useSearchParams (precisa de Suspense)
function ResetPasswordForm() {
  const { t } = useI18n();
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setIsValidToken(false);
        setValidating(false);
        return;
      }
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/password_reset_validate/${token}/`
        );
        const data = await res.json();
        setIsValidToken(Boolean(data.valid));
      } catch {
        setIsValidToken(false);
      } finally {
        setValidating(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error(t("Token ausente."));
      return;
    }
    if (password.length < 6) {
      toast.error(t("A senha deve ter pelo menos 6 caracteres."));
      return;
    }
    if (password !== confirm) {
      toast.error(t("As senhas não coincidem."));
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/password_reset_confirm/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password,
            password_confirm: confirm,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(t(data?.error || "Não foi possível redefinir a senha."));
        return;
      }

      toast.success(t("Senha redefinida com sucesso!"));
      router.push("/auth/login-candidato");
    } catch {
      toast.error(t("Erro ao conectar com o servidor."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-2">{t("Redefinir senha")}</h2>
        <p className="text-muted-foreground text-sm">
          {t("Crie uma nova senha para sua conta.")}
        </p>
      </div>

      {validating ? (
        <div className="text-muted-foreground text-center py-6">{t("Validando link...")}</div>
      ) : !isValidToken ? (
        <div className="bg-destructive/20 border border-destructive/50 text-destructive rounded-2xl p-4 text-sm">
          {t("Token inválido ou expirado. Solicite uma nova recuperação.")}
          <div className="mt-4 text-center">
            <Link
              href="/auth/recuperar-senha"
              className="text-primary hover:text-primary font-medium underline"
            >
              {t("Solicitar novo link")}
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              {t("Nova senha")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 disabled:opacity-50"
              placeholder={t("Nova senha")}
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              {t("Confirmar senha")}
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-300 disabled:opacity-50"
              placeholder={t("Confirmar senha")}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-4 px-6 rounded-2xl transition-all duration-300 shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : t("Redefinir senha")}
          </button>

          <div className="mt-4 text-center">
            <Link
              href="/auth/login-candidato"
              className="text-primary hover:text-primary font-medium transition-colors duration-300 hover:underline"
            >
              {t("Voltar para o login")}
            </Link>
          </div>
        </form>
      )}
    </>
  );
}

// Página principal – agora com Suspense
export default function ResetPasswordPage() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Imagem de fundo */}
      <div className="hidden flex-1 lg:block" aria-hidden="true" />

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-background">

        <div className="relative z-10 w-full max-w-md">
<div className="mb-10 flex justify-center lg:hidden"><BrandMark /></div>
          <div className="auth-card bg-card rounded-3xl p-8 border">
            <Suspense fallback={<div className="text-muted-foreground text-center py-6">{t('Carregando...')}</div>}>
              <ResetPasswordForm />
            </Suspense>

            <p className="mt-6 text-xs text-muted-foreground text-center">
              &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}