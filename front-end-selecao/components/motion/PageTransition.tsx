'use client';

import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const ease = [0.76, 0, 0.24, 1] as const;
const COVER_MS = 550;

const zone = (p: string) =>
  p.startsWith('/painel-admin') ? 'admin'
  : p.startsWith('/candidato') ? 'candidate'
  : p.startsWith('/auth') || p.startsWith('/password-reset') ? 'auth'
  : 'public';

/**
 * Cortina só onde ajuda: ao trocar de zona (público, login, painel do candidato, painel admin)
 * e entre páginas públicas. Dentro dos painéis e do fluxo de login a navegação é direta,
 * porque o usuário clica ali o tempo todo e a cortina viraria espera.
 */
const wantsCurtain = (from: string, to: string) => zone(from) !== zone(to) || zone(to) === 'public';

/** Cortina entre rotas: cobre a tela ao clicar num link interno, navega e revela a nova página. */
export default function PageTransition() {
  const router = useRouter();
  const pathname = usePathname();
  const controls = useAnimationControls();
  const reduced = useReducedMotion();
  const pending = useRef(false);
  const failsafe = useRef<ReturnType<typeof setTimeout>>(undefined);

  const prevPath = useRef(pathname);

  const reveal = async () => {
    if (!pending.current) return;
    pending.current = false;
    clearTimeout(failsafe.current);
    await controls.start({ y: '-100%', transition: { duration: 0.6, ease } });
    controls.set({ y: '100%' });
  };

  // a rota mudou: abre a cortina
  useEffect(() => {
    const from = prevPath.current;
    if (from === pathname) return;
    prevPath.current = pathname;
    if (reduced) return;
    if (!pending.current) {
      if (!wantsCurtain(from, pathname)) return;
      // navegação feita por código (router.push, redirect): fecha na hora e abre
      pending.current = true;
      controls.set({ y: 0 });
    }
    reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (reduced) return;
    const onClick = async (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest('a');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // âncora ou mesma página
      // captura: roda antes do <Link> do Next, que senão navega sozinho
      if (!wantsCurtain(location.pathname, url.pathname)) return; // deixa o Link navegar normalmente
      e.preventDefault();
      e.stopPropagation();
      if (pending.current) return;
      pending.current = true;
      failsafe.current = setTimeout(reveal, 5000); // se a navegação falhar, não prende a tela
      await controls.start({ y: 0, transition: { duration: COVER_MS / 1000, ease } });
      router.push(url.pathname + url.search + url.hash);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, router]);

  return (
    <motion.div
      aria-hidden="true"
      initial={{ y: '100%' }}
      animate={controls}
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center bg-foreground"
    >
      <svg viewBox="0 0 36 36" className="h-14 w-14">
        <rect width="36" height="36" rx="9" className="fill-primary" />
        <path d="M10 18.5l5.5 5.5L26 12.5" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground" />
      </svg>
    </motion.div>
  );
}
