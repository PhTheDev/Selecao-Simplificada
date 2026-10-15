"use client";
import BrandMark from "@/components/BrandMark";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import backgroundImage from "@/app/assets/images/imagem-fundo.jpg";

export default function PasswordReset() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const apiBase =
      process.env.NEXT_PUBLIC_DJANGO_API_URL || "http://localhost:8000";

    try {
      const response = await fetch(
        `${apiBase}/api/selection/candidates/password_reset_request/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        }
      );

      if (response.ok) {
        setSuccessMessage("Instruções enviadas para seu e-mail!");
        router.push("/password-reset/success");
      } else {
        let message = "Erro ao enviar solicitação";
        try {
          const data = await response.json();
          message = data.error || data.detail || message;
        } catch {
          /* ignore */
        }
        setErrorMessage(message);
      }
    } catch {
      setErrorMessage("Erro de conexão com o servidor");
    } finally {
      setIsLoading(false);
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

        <div className="relative z-10 w-full max-w-md">
          {/* Cabeçalho */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-green-100 mb-4">
              Redefinir Senha
            </h1>
            <p className="text-green-200/90 text-lg">
              Digite seu e-mail para redefinir a senha
            </p>
          </div>

          {/* Mensagens de status */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Endereço de E-mail"
                required
                className="w-full px-4 py-3 bg-white/95 backdrop-blur-xl rounded-lg border-2 border-green-300/20 focus:ring-4 focus:ring-green-400/30 focus:border-green-400 focus:outline-none transition-all duration-300 shadow-lg"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enviando...
                </div>
              ) : (
                "Enviar Instruções"
              )}
            </button>

            {/* Link de voltar para login */}
            <div className="text-center mt-6">
              <Link
                href="/"
                className="text-green-200 hover:text-green-100 transition-colors text-sm inline-flex items-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Voltar para o login
              </Link>
            </div>
          </form>

          {/* Rodapé */}
          <p className="text-center text-green-200/70 text-xs mt-10">
            &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
