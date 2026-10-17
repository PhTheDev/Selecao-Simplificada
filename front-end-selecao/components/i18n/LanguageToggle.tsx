'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';
import { useI18n, type Lang } from './LanguageProvider';

const langs: Lang[] = ['pt', 'en'];

/** PT | EN com o destaque deslizando para o idioma escolhido. */
export default function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n();
  // layoutId único por instância: o cabeçalho renderiza o seletor mais de uma vez (desktop e mobile),
  // e um id compartilhado fazia o destaque "voar" para a instância escondida e sumir.
  const pill = useId();
  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={`relative flex h-10 items-center gap-0.5 rounded-full border bg-card p-1 ${className}`}
    >
      {langs.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`relative h-8 rounded-full px-3 text-xs font-semibold uppercase transition-colors ${
            lang === l ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {lang === l && (
            <motion.span
              layoutId={pill}
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative">{l}</span>
        </button>
      ))}
    </div>
  );
}
