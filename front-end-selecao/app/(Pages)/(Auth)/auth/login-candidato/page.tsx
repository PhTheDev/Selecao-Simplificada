import BrandMark from "@/components/BrandMark";
import backgroundImage from "@/app/assets/images/imagem-fundo.jpg";
import { FormEventLoginCandidate } from "@/components/auth/FormEventLoginCandidate";
import Link from "next/link";

export default function Login() {
    return (
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Seção da Imagem (Esquerda) */}
            <div
                className="relative flex-1 flex items-center justify-center p-8 min-h-[40vh] lg:min-h-screen"
                style={{
                    backgroundImage: `url(${backgroundImage.src})`,
                    backgroundSize: "cover" as const,
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
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-gradient-to-br from-[#005f73] via-[#0a776e] to-[#0a9396] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-radial from-[#94d2bd]/10 via-transparent to-transparent"></div>
                <div className="absolute top-10 right-10 w-20 h-20 bg-[#e9d8a6]/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-10 left-10 w-16 h-16 bg-[#94d2bd]/10 rounded-full blur-lg"></div>

                <div className="relative z-10 w-full max-w-md">
                    <FormEventLoginCandidate />

                    <div className="mt-8 text-center">
                        <Link
                            href="/password-reset"
                            className="inline-flex items-center text-white/80 hover:text-white transition-all duration-300 group text-sm font-medium"
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
                                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                            </svg>
                            Esqueceu sua senha?
                        </Link>
                        <p className="mt-6 text-xs text-white/60">
                            &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}