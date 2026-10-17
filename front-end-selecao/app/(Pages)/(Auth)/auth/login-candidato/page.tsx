import BrandMark from "@/components/BrandMark";
import { FormEventLoginCandidate } from "@/components/auth/FormEventLoginCandidate";
import Link from "next/link";

export default function Login() {
    return (
        <div className="flex flex-col lg:flex-row min-h-screen">
            {/* Seção da Imagem (Esquerda) */}
            <div className="hidden flex-1 lg:block" aria-hidden="true" />

            {/* Seção do Formulário (Direita) */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-background">

                <div className="relative z-10 w-full max-w-md">
                    <div className="mb-10 flex justify-center lg:hidden"><BrandMark /></div>
                    <FormEventLoginCandidate />

                    <div className="mt-8 text-center">
                        <p className="mt-6 text-xs text-muted-foreground">
                            &copy; {new Date().getFullYear()} Seleção Simplificada. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}