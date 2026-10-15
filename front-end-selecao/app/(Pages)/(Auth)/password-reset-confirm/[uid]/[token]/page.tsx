"use client";
import BrandMark from "@/components/BrandMark";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import backgroundImage from "@/app/assets/images/imagem-fundo.jpg";

export default function PasswordResetConfirmPage() {
  const params = useParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Obter parâmetros de forma segura (API usa apenas o token)
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError("Link inválido ou expirado");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    setError("");

    const apiBase =
      process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";

    try {
      const response = await fetch(
        `${apiBase}/api/selection/candidates/password_reset_confirm/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            password,
            password_confirm: confirmPassword,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        router.push("/auth/login-candidato");
      } else {
        setError(data.error || data.detail || "Falha ao redefinir a senha");
      }
    } catch (error) {
      setError("Erro de conexão com o servidor");
      console.error("Erro detalhado:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* Seção da Imagem (Esquerda) */}
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

      {/* Seção do Formulário (Direita) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-gradient-to-br from-green-800 via-green-700 to-green-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-green-500/10 via-transparent to-transparent"></div>

        <div className="relative z-10 w-full max-w-md space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">
              Redefinir Senha
            </h1>
            <p className="text-green-200">Crie uma nova senha para sua conta</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nova senha"
                  className="w-full px-4 py-3 rounded-lg bg-green-50 border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className="w-full px-4 py-3 rounded-lg bg-green-50 border border-green-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-300 text-sm text-center">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-all duration-200 ease-in-out transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? "Processando..." : "Redefinir Senha"}
            </button>
          </form>

          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center text-green-200 hover:text-white transition-colors group text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-2 group-hover:animate-shake"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Voltar para o login
            </Link>
            <p className="mt-6 text-xs text-green-200/70">
              &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos
              reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
