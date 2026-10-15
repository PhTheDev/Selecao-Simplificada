"use client";
import BrandMark from "@/components/BrandMark";
import backgroundImage from "@/app/assets/images/imagem-fundo.jpg";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PasswordResetSuccess() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/"), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
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
        {/* Overlay e efeitos */}
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black/40 to-black/20"></div>
        <div className="absolute inset-0 bg-noise-pattern opacity-10"></div>
        {/* Conteúdo */}
        <div className="relative z-10 text-center">
          <div className="animate-float">
            <BrandMark className="text-white font-semibold tracking-tight" />
          </div>
        </div>
      </div>

      {/* Seção do Conteúdo (Direita) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-gradient-to-br from-green-800 via-green-700 to-green-900 relative overflow-hidden">
        {/* Efeitos de fundo */}
        <div className="absolute inset-0 bg-gradient-radial from-green-500/10 via-transparent to-transparent"></div>

        <div className="relative z-10 w-full max-w-md text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-white mb-2 animate-fade-in">
              E-mail enviado com sucesso!
            </h1>
            <p className="text-green-200 text-lg">
              Verifique sua caixa de entrada e siga as instruções.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-green-400 rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-green-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-4 h-4 bg-green-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center text-green-200 hover:text-white transition-colors group text-lg font-medium"
            >
              Voltar ao Login
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
          </div>

          <p className="mt-12 text-xs text-green-200/70">
            &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
