"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

type ValidateResponse = { valid: boolean; error?: string };
type ErrorResponse = {
  detail?: string;
  error?: string;
  token?: string[] | string;
  password?: string[] | string;
  password_confirm?: string[] | string;
};

export function PasswordResetConfirmForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState(false);
  const [checkError, setCheckError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const validate = async () => {
      if (!token) {
        setChecking(false);
        setValid(false);
        setCheckError("Token ausente.");
        return;
      }

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/password_reset_validate/${token}/`,
          { method: "GET" }
        );

        const data = (await res.json()) as ValidateResponse;

        if (res.ok && data.valid) {
          setValid(true);
          setCheckError("");
        } else {
          setValid(false);
          setCheckError(data.error || "Token inválido ou expirado.");
        }
      } catch {
        setValid(false);
        setCheckError("Erro ao validar token.");
      } finally {
        setChecking(false);
      }
    };

    validate();
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!token) return;

    if (password !== passwordConfirm) {
      toast.error("As senhas não coincidem.");
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
            password_confirm: passwordConfirm,
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        toast.success(data?.message || "Senha redefinida com sucesso!");
        router.push("/auth/login-candidato");
        return;
      }

      let err: ErrorResponse = {};
      try {
        err = await res.json();
      } catch {
        err = { error: "Erro ao redefinir senha." };
      }

      const pick = (v?: string[] | string) =>
        Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : "";

      const msg =
        pick(err.password) ||
        pick(err.password_confirm) ||
        pick(err.token) ||
        err.error ||
        err.detail ||
        "Erro ao redefinir senha.";

      toast.error(String(msg));
    } catch {
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="auth-card bg-card rounded-3xl p-8 border text-foreground">
        Validando link...
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="auth-card bg-card rounded-3xl p-8 border">
        <h2 className="text-2xl font-bold text-primary mb-2">Link inválido</h2>
        <p className="text-muted-foreground text-sm mb-6">{checkError || "Token inválido ou expirado."}</p>

        <a
          href="/auth/recuperar-senha"
          className="inline-flex w-full justify-center bg-gradient-to-r from-primary to-primary-hover text-primary-foreground font-bold py-4 px-6 rounded-2xl"
        >
          Solicitar novo link
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="auth-card bg-card rounded-3xl p-8 border">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Nova senha</h2>
          <p className="text-muted-foreground text-sm">Crie uma nova senha para sua conta.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Nova senha"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-foreground text-sm font-medium mb-2">Confirmar senha</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-input rounded-2xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Repita a senha"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold py-4 px-6 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Salvando..." : "Salvar nova senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
