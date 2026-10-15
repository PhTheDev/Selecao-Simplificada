'use client';
import BrandMark from "@/components/BrandMark";

import backgroundImage from "@/app/assets/images/imagem-fundo.jpg";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

// Componente que realmente usa useSearchParams (precisa de Suspense)
function ResetPasswordForm() {
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
      toast.error("Token ausente.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
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
            password_confirm: confirm,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data?.error || "Não foi possível redefinir a senha.");
        return;
      }

      toast.success("Senha redefinida com sucesso!");
      router.push("/auth/login-candidato");
    } catch {
      toast.error("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-[#e9d8a6] mb-2">Redefinir senha</h2>
        <p className="text-white/80 text-sm">
          Crie uma nova senha para sua conta.
        </p>
      </div>

      {validating ? (
        <div className="text-white/80 text-center py-6">Validando link...</div>
      ) : !isValidToken ? (
        <div className="bg-red-500/20 border border-red-500/50 text-red-100 rounded-xl p-4 text-sm">
          Token inválido ou expirado. Solicite uma nova recuperação.
          <div className="mt-4 text-center">
            <Link
              href="/auth/recuperar-senha"
              className="text-[#94d2bd] hover:text-[#a8e6cf] font-medium underline"
            >
              Solicitar novo link
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Nova senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#94d2bd] focus:border-transparent transition-all duration-300 disabled:opacity-50"
              placeholder="Nova senha"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Confirmar senha
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-[#94d2bd] focus:border-transparent transition-all duration-300 disabled:opacity-50"
              placeholder="Confirmar senha"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#005f73] to-[#0a9396] hover:from-[#0a9396] hover:to-[#005f73] text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? "Salvando..." : "Redefinir senha"}
          </button>

          <div className="mt-4 text-center">
            <Link
              href="/auth/login-candidato"
              className="text-[#94d2bd] hover:text-[#a8e6cf] font-medium transition-colors duration-300 hover:underline"
            >
              Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </>
  );
}

// Página principal – agora com Suspense
export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Imagem de fundo */}
      <div
        className="relative flex-1 flex items-center justify-center p-8 min-h-[40vh] lg:min-h-screen"
        style={{
          backgroundImage: `url(${backgroundImage.src})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/40 to-black/20"></div>
        <div className="absolute inset-0 bg-noise-pattern opacity-10"></div>
        <div className="relative z-10 text-center">
          <div className="animate-float">
            <BrandMark className="text-white font-semibold tracking-tight" />
          </div>
        </div>
      </div>

      {/* Formulário */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-gradient-to-br from-[#005f73] via-[#0a776e] to-[#0a9396] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-[#94d2bd]/10 via-transparent to-transparent"></div>

        <div className="relative z-10 w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
            <Suspense fallback={<div className="text-white/80 text-center py-6">Carregando...</div>}>
              <ResetPasswordForm />
            </Suspense>

            <p className="mt-6 text-xs text-white/60 text-center">
              &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}