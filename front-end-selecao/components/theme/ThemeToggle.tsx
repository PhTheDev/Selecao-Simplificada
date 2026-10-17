'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useI18n } from '@/components/i18n/LanguageProvider';
import { useTheme } from './ThemeProvider';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t('Ativar modo claro') : t('Ativar modo escuro')}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full border bg-card text-foreground transition-colors hover:bg-secondary ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? 'moon' : 'sun'}
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex"
        >
          {dark ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
