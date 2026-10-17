'use client';

import { useI18n } from '@/components/i18n/LanguageProvider';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { useState } from 'react';

/** Botão lateral que volta ao topo; aparece depois de rolar e o anel mostra o progresso da página. */
export default function BackToTop() {
  const { t } = useI18n();
  const { scrollY, scrollYProgress } = useScroll();
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, 'change', (y) => setShow(y > 600));

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          type="button"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.25 }}
          whileHover={{ y: -3 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={t('Voltar ao topo')}
          className="fixed bottom-6 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full border bg-card text-foreground shadow-lg transition-colors hover:bg-secondary md:right-8"
        >
          <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden="true">
            <motion.circle cx="24" cy="24" r="22" fill="none" strokeWidth="2" strokeLinecap="round" className="stroke-primary" style={{ pathLength: scrollYProgress }} />
          </svg>
          <ArrowUp className="h-5 w-5" strokeWidth={1.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
