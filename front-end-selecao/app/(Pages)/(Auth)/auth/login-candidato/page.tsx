import BrandMark from "@/components/BrandMark";
import { FormEventLoginCandidate } from "@/components/auth/FormEventLoginCandidate";
import Link from "next/link";

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

                <div className="relative z-10 w-full max-w-md">
                    <FormEventLoginCandidate />

                    <div className="mt-8 text-center">
                        <Link
                            href="/password-reset"
                            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-all duration-300 group text-sm font-medium"
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
                        <p className="mt-6 text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}