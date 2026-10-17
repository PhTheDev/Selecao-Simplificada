"use client";
import BrandMark from "@/components/BrandMark";

import { FormEventLogin } from "@/components/auth/FormEventLogin";

export default function Login() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Seção da Imagem (Esquerda) */}
      <div className="relative hidden flex-1 flex-col justify-between bg-primary-soft p-12 lg:flex lg:min-h-screen">
        <BrandMark />
        <p className="max-w-sm font-serif text-5xl leading-[1.05] text-foreground">
          Um edital, <span className="italic">uma chance.</span>
        </p>
        <p className="text-sm text-muted-foreground">Inscrição, acompanhamento e resultado em um só lugar.</p>
      </div>


      {/* Seção do Formulário (Direita) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-background">
        {/* Efeitos de fundo */}

        {/* Elementos decorativos */}

        {/* Container do formulário */}
        <div className="relative z-10 w-full max-w-md">
          <FormEventLogin />

          {/* Rodapé */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              Caso esqueceu a senha entre em contanto com o suporte
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}