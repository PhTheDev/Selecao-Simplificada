'use client';

import { motion, useAnimationControls, useReducedMotion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

const ease = [0.76, 0, 0.24, 1] as const;
const COLS = 5;
const STEP = 0.04; // atraso entre colunas: o degrau
const DUR = 0.28;
// cobrir ≈ 0,44s e revelar ≈ 0,44s: rápido o bastante para não virar espera
// rampa na cor do tema: do tom mais fundo ao mais claro, fechando com o destaque (lima)
const SHADES = [
  'color-mix(in srgb, var(--primary) 30%, #0b0a10)',
  'color-mix(in srgb, var(--primary) 65%, #0b0a10)',
  'var(--primary)',
  'color-mix(in srgb, var(--primary) 70%, white)',
  'var(--highlight)',
];
const variants = {
  hidden: { y: '100%' },
  cover: (i: number) => ({ y: 0, transition: { duration: DUR, delay: i * STEP, ease } }),
  reveal: (i: number) => ({ y: '-100%', transition: { duration: DUR, delay: i * STEP, ease } }),
};

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
    await controls.start('reveal');
    controls.set('hidden');
  };

  // a rota mudou: abre a cortina
  useEffect(() => {
    const from = prevPath.current;
    if (from === pathname) return;
    prevPath.current = pathname;
    if (reduced) return;
    // navegação por código sem cortina prévia (redirect, router.push direto): não fecha depois que
    // a página já trocou, isso piscava. Para ter cortina, use navigateWithCurtain().
    if (!pending.current || !wantsCurtain(from, pathname)) return;
    reveal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // navegação por código com cortina: veja navigateWithCurtain()
  useEffect(() => {
    if (reduced) return;
    const onNavigate = async (e: Event) => {
      const detail = (e as CustomEvent<{ href: string; handled: boolean }>).detail;
      const url = new URL(detail.href, location.href);
      if (url.origin !== location.origin || !wantsCurtain(location.pathname, url.pathname) || pending.current) return;
      detail.handled = true;
      pending.current = true;
      failsafe.current = setTimeout(reveal, 5000);
      await controls.start('cover');
      router.push(url.pathname + url.search + url.hash);
    };
    window.addEventListener('curtain:navigate', onNavigate);
    return () => window.removeEventListener('curtain:navigate', onNavigate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, router]);

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
      await controls.start('cover');
      router.push(url.pathname + url.search + url.hash);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, router]);

  // Cinco colunas que sobem em degrau, em degradê da cor do tema.
  return (
    <motion.div aria-hidden="true" initial="hidden" animate={controls} className="pointer-events-none fixed inset-0 z-[200] overflow-hidden">
      {Array.from({ length: COLS }, (_, i) => (
        <motion.div
          key={i}
          custom={i}
          variants={variants}
          style={{ left: `${(i * 100) / COLS}%`, width: `calc(${100 / COLS}% + 1px)`, background: SHADES[i] }}
          className="absolute inset-y-0"
        />
      ))}
    </motion.div>
  );
}
