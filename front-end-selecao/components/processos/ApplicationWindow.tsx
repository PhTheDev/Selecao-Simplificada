'use client';

import { useI18n } from '@/components/i18n/LanguageProvider';
import { endOfLocalCalendarDay, parseLocalCalendarDate } from '@/utils/selectionProcessDates';
import { motion } from 'framer-motion';

const DAY = 86_400_000;

/** Barra do período de inscrição: quanto do prazo já passou e quantos dias faltam. */
export default function ApplicationWindow({ start, end }: { start: string; end: string }) {
  const { t, lang } = useI18n();
  const s = parseLocalCalendarDate(start).getTime();
  const e = endOfLocalCalendarDay(end).getTime();
  const now = Date.now();
  if (isNaN(s) || isNaN(e) || e <= s) return null;

  const state = now < s ? 'upcoming' : now > e ? 'finished' : 'active';
  const pct = state === 'upcoming' ? 0 : state === 'finished' ? 100 : Math.round(((now - s) / (e - s)) * 100);
  const days = Math.ceil(((state === 'upcoming' ? s : e) - now) / DAY);

  const label =
    state === 'upcoming'
      ? t(days === 1 ? 'Abre em {n} dia' : 'Abre em {n} dias', { n: days })
      : state === 'finished'
        ? t('Inscrições encerradas')
        : days <= 1
          ? t('Último dia para se inscrever')
          : t('Faltam {n} dias', { n: days });

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'short' }).format(parseLocalCalendarDate(iso));

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${state === 'active' ? 'text-primary' : 'text-muted-foreground'}`}>{label}</span>
        <span className="tabular text-xs text-muted-foreground">
          {fmt(start)} — {fmt(end)}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <motion.div
          className={`h-full rounded-full ${state === 'finished' ? 'bg-muted-foreground/40' : 'bg-primary'}`}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}
