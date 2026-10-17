'use client';

import { useI18n } from '@/components/i18n/LanguageProvider';
import Image from 'next/image';

type Status = 'active' | 'upcoming' | 'finished';

const tone: Record<Status, { dot: string; label: string }> = {
  active: { dot: 'bg-success animate-pulse', label: 'Inscrições abertas' },
  upcoming: { dot: 'bg-primary', label: 'Em breve' },
  finished: { dot: 'bg-muted-foreground', label: 'Encerrado' },
};

/** Imagem do cartão: zoom no hover, status no canto e um selo opcional (ex.: nº de documentos). */
export default function ProcessMedia({
  src,
  alt,
  status,
  priority,
  onError,
  badge,
}: {
  src: string;
  alt: string;
  status: Status;
  priority?: boolean;
  onError?: () => void;
  badge?: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl bg-secondary">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 40vw"
        onError={onError}
        className="object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
      <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-card/95 px-3 py-1 text-xs font-medium text-foreground">
        <span className={`h-2 w-2 rounded-full ${tone[status].dot}`} />
        {t(tone[status].label)}
      </span>
      {badge && (
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1 text-xs font-medium text-foreground">
          {badge}
        </span>
      )}
    </div>
  );
}
