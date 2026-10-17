'use client';

import BrandMark from "@/components/BrandMark";
import LoginSceneLazy from "@/components/auth/LoginSceneLazy";
import { usePathname } from "next/navigation";

// Telas que mostram o painel; as páginas reservam o espaço com um spacer de meia largura.
const WITH_PANEL = ["/auth/login-admin", "/auth/login-candidato", "/auth/register", "/auth/recuperar-senha", "/auth/redefinir-senha"];

/**
 * Painel esquerdo fixo, montado no layout de auth: persiste entre as páginas,
 * então a cena 3D não reinicia a cada navegação. Some abaixo de lg.
 */
export default function AuthPanel() {
  const pathname = usePathname();
  if (!WITH_PANEL.some((p) => pathname.startsWith(p))) return null;
  return (
    <div className="fixed inset-y-0 left-0 hidden w-1/2 overflow-hidden bg-primary dark:bg-primary-soft lg:block" aria-hidden="true">
      <LoginSceneLazy />
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <BrandMark tone="light" className="text-4xl xl:text-5xl" />
      </div>
    </div>
  );
}
