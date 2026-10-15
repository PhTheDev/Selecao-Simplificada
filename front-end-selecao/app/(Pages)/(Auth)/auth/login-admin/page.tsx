"use client";
import BrandMark from "@/components/BrandMark";

import backgroundImage from "@/app/assets/images/imagem-fundo.jpg";
import { FormEventLogin } from "@/components/auth/FormEventLogin";

export default function Login() {
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
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


      {/* Seção do Formulário (Direita) */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-gradient-to-br from-[#005f73] via-[#0a776e] to-[#0a9396] relative overflow-hidden">
        {/* Efeitos de fundo */}
        <div className="absolute inset-0 bg-gradient-radial from-[#94d2bd]/10 via-transparent to-transparent"></div>

        {/* Elementos decorativos */}
        <div className="absolute top-10 right-10 w-20 h-20 bg-[#e9d8a6]/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 left-10 w-16 h-16 bg-[#94d2bd]/10 rounded-full blur-lg"></div>

        {/* Container do formulário */}
        <div className="relative z-10 w-full max-w-md">
          <FormEventLogin />

          {/* Rodapé */}
          <div className="mt-8 text-center">
            <p className="text-xs text-white/60">
              Caso esqueceu a senha entre em contanto com o suporte
            </p>
            <p className="mt-6 text-xs text-white/60">
              &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}