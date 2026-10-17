"use client";
import BrandMark from "@/components/BrandMark";
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-background">
      {/* Seção da Imagem (Esquerda) */}
      <div className="relative hidden flex-1 flex-col justify-between bg-primary-soft p-12 lg:flex lg:min-h-screen">
        <BrandMark />
        <p className="max-w-sm font-serif text-5xl leading-[1.05] text-foreground">
          Um edital, <span className="italic">uma chance.</span>
        </p>
        <p className="text-sm text-muted-foreground">Inscrição, acompanhamento e resultado em um só lugar.</p>
      </div>

      {/* Seção do Conteúdo (Direita) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-gradient-to-br from-success via-success to-success relative overflow-hidden">
        {/* Efeitos de fundo */}

        <div className="auth-card relative z-10 w-full max-w-md text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground mb-2 animate-fade-in">
              E-mail enviado com sucesso!
            </h1>
            <p className="text-success text-lg">
              Verifique sua caixa de entrada e siga as instruções.
            </p>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 bg-success rounded-full animate-bounce"></div>
              <div className="w-4 h-4 bg-success rounded-full animate-bounce delay-100"></div>
              <div className="w-4 h-4 bg-success rounded-full animate-bounce delay-200"></div>
            </div>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center text-success hover:text-foreground transition-colors group text-lg font-medium"
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

          <p className="mt-12 text-xs text-success/70">
            &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos
            reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
