'use client';

import { useCandidateAuth } from '@/api/hooks/useCandidateAuth';
import { useSelectionProcesses } from '@/api/hooks/useSelectionProcess';
import { SelectionProcess } from '@/api/types/selection';
import Footer from '@/components/Footer';
import { useI18n } from '@/components/i18n/LanguageProvider';
import Header from '@/components/main-page/Header';
import SplitWords from '@/components/motion/SplitWords';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronDown, Clock, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    formatShortWeekdayDatePtBr,
    getPublicProcessCardStatus,
    INSCRIPTION_CLOSE_TIME_LABEL,
    INSCRIPTION_OPEN_TIME_LABEL,
} from '@/utils/selectionProcessDates';

type ProcessStatus = 'active' | 'upcoming' | 'finished';

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((item) => (
      <div key={item} className="animate-pulse overflow-hidden rounded-3xl border bg-card p-3">
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="aspect-video rounded-2xl bg-secondary lg:w-2/5" />
          <div className="flex-1 space-y-4 p-4">
            <div className="h-7 w-3/4 rounded-full bg-secondary" />
            <div className="h-4 w-1/2 rounded-full bg-secondary" />
            <div className="h-20 rounded-2xl bg-secondary" />
            <div className="flex gap-3">
              <div className="h-12 flex-1 rounded-full bg-secondary" />
              <div className="h-12 w-36 rounded-full bg-secondary" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

// Determina o status do processo (inscrições: 00:00 do 1º dia até 23:59 do último)
const getProcessStatus = (process: SelectionProcess): ProcessStatus => {
  return getPublicProcessCardStatus(process);
};

const formatDate = formatShortWeekdayDatePtBr;

// Imagem padrão baseada no curso
const getDefaultImage = (course: string): string => {
  const courseImages: { [key: string]: string } = {
    tecnologia: '/images/hero-carousel/1.png',
    ti: '/images/hero-carousel/1.png',
    rh: '/images/hero-carousel/3.png',
    jurídico: '/images/hero-carousel/2.png',
    direito: '/images/hero-carousel/2.png',
    comunicação: '/images/hero-carousel/4.png',
    administrativo: '/images/hero-carousel/1.png',
  };

  const lowerCourse = course.toLowerCase();
  for (const [key, image] of Object.entries(courseImages)) {
    if (lowerCourse.includes(key)) return image;
  }

  return '/images/hero-carousel/1.png';
};

// Transforma a URL para o domínio público, permitindo que o next/image baixe pelo Nginx
const getAbsoluteUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:3000';
    try {
        const urlObj = new URL(url);
        return `${baseUrl}${urlObj.pathname}${urlObj.search}`;
    } catch {
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return url;
    }
};

// Mapeamento de turno
const boutLabelMap: Record<string, string> = {
  M: 'Matutino',
  T: 'Vespertino',
  E: 'Escala',
};

export default function ProcessosSeletivos() {
  const { t } = useI18n();
  const [selectedStatus, setSelectedStatus] = useState<ProcessStatus | 'all'>('all');
  const [expandedProcess, setExpandedProcess] = useState<number | null>(null);
  const [failedBannerIds, setFailedBannerIds] = useState<number[]>([]);
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useCandidateAuth();
  const { data: processesData, isLoading: processesLoading, error } = useSelectionProcesses();

  const handleCandidatarClick = (process: any) => {
    if (process.status !== 'active') return;
    if (authLoading) return;

    router.push(isAuthenticated ? `/aplicar/${process.slug}` : '/auth/login-candidato');
  };

  const statusFilters = [
    { value: 'all', label: t('Todos') },
    { value: 'active', label: t('Abertos') },
    { value: 'upcoming', label: t('Em breve') },
    { value: 'finished', label: t('Finalizados') },
  ];

  // Mapeamento dos processos com campos formatados
  const processes =
    processesData?.map((process): any => {
      const status = getProcessStatus(process);
      const bout = (process as any).bout;
      const boutLabel = bout ? boutLabelMap[bout] ?? bout : 'Não informado';

      return {
        id: process.id,
        title: process.title,
        subtitle: process.subtitle || `Processo Seletivo para ${process.course}`,
        location: process.local || 'Seleção Simplificada - Local a definir',
        vacancies: process.number_vacancies,
        status,
        slug: process.slug,
        description: process.description || 'Processo seletivo para estágio na Seleção Simplificada.',
        image: {
          src: getAbsoluteUrl(process.process_banner) || getDefaultImage(process.course),
          alt: `Processo Seletivo para ${process.title}`,
        },
        bout,
        boutLabel,
        // Datas brutas (usadas nos detalhes)
        startDate: process.beginning_date,
        endDate: process.ending_date,
        // Datas formatadas para exibição no card
        startDateFormatted: formatDate(process.beginning_date),
        startTimeFormatted: INSCRIPTION_OPEN_TIME_LABEL,
        endDateFormatted: formatDate(process.ending_date),
        endTimeFormatted: INSCRIPTION_CLOSE_TIME_LABEL,
        requirements: process.requirements
          ? process.requirements.split(';').filter((req) => req.trim())
          : [
              'Cursando ensino superior na área relacionada',
              'Disponibilidade de horário conforme edital',
              'Documentação completa conforme especificado',
            ],
        benefits: process.benefits
          ? process.benefits.split(';').filter((benefit) => benefit.trim())
          : [
              'Bolsa auxílio compatível com o mercado',
              'Vale transporte',
              'Experiência em órgão público',
              'Ambiente de trabalho inclusivo',
            ],
      };
    }) || [];

  const filteredProcesses = processes.filter(
    (process) => selectedStatus === 'all' || process.status === selectedStatus
  );

  const toggleExpand = (id: number) => setExpandedProcess(expandedProcess === id ? null : id);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <div className="rounded-3xl border bg-card p-10">
            <h2 className="text-2xl font-semibold">{t('Erro ao carregar processos seletivos')}</h2>
            <p className="mt-3 text-muted-foreground">{t('Tente recarregar a página ou entre em contato com o suporte.')}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary-hover"
            >
              {t('Recarregar página')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const openCount = processes.filter((p) => p.status === 'active').length;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="px-5 pb-10 pt-16 text-center md:px-8 md:pb-14 md:pt-24">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-highlight ring-2 ring-primary/30" />
          {processesLoading ? t('Carregando processos') : t('{n} com inscrição aberta', { n: openCount })}
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-[1]">
          <SplitWords text={t('Processos')} /><SplitWords text={t('seletivos')} className="font-serif font-normal italic" delay={0.15} />
        </h1>
        <motion.p
          className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {t('Oportunidades de estágio abertas, futuras e já finalizadas, com todos os detalhes de cada edital.')}
        </motion.p>
      </section>

      {/* Filtros */}
      <div className="sticky top-[4.5rem] z-40 px-5 pb-6 md:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div
            className="flex w-full gap-1 overflow-x-auto rounded-full border bg-card/90 p-1 backdrop-blur sm:w-auto"
            role="tablist"
            aria-label="Filtrar por status"
          >
            {statusFilters.map((filter) => {
              const on = selectedStatus === filter.value;
              return (
                <button
                  key={filter.value}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSelectedStatus(filter.value as any)}
                  className={`relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    on ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {on && (
                    <motion.span
                      layoutId="status-filter"
                      className="absolute inset-0 rounded-full bg-primary"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative">{filter.label}</span>
                </button>
              );
            })}
          </div>
          <p className="tabular text-sm text-muted-foreground">
            {processesLoading ? t('Carregando…') : t('{n} processo(s)', { n: filteredProcesses.length })}
          </p>
        </div>
      </div>

      <style jsx global>{`
        .styled-scroll { scrollbar-width: thin; scrollbar-color: rgba(85, 118, 28, 0.45) transparent; }
        .styled-scroll::-webkit-scrollbar { width: 8px; }
        .styled-scroll::-webkit-scrollbar-track { background: transparent; }
        .styled-scroll::-webkit-scrollbar-thumb { background: rgba(85, 118, 28, 0.45); border-radius: 999px; }
        .styled-scroll::-webkit-scrollbar-thumb:hover { background: rgba(85, 118, 28, 0.7); }
      `}</style>

      {/* Lista */}
      <div className="mx-auto max-w-5xl px-5 pb-24 md:px-8">
        {processesLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid gap-6">
            {filteredProcesses.map((process, index) => (
              <motion.article
                key={process.id}
                className="overflow-hidden rounded-3xl border bg-card transition-shadow hover:shadow-md"
                id={
                  process.status === 'active'
                    ? 'processos-ativos'
                    : process.status === 'upcoming'
                      ? 'processos-futuros'
                      : undefined
                }
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: Math.min(index, 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="flex flex-col gap-6 p-3 lg:flex-row">
                  {/* Imagem */}
                  <div className="lg:w-2/5">
                    <div className="group relative aspect-video overflow-hidden rounded-2xl bg-secondary">
                      <Image
                        src={failedBannerIds.includes(process.id) ? getDefaultImage(process.course) : process.image.src}
                        alt={process.image.alt}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority={process.status === 'active'}
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        onError={() =>
                          setFailedBannerIds((prev) => (prev.includes(process.id) ? prev : [...prev, process.id]))
                        }
                      />
                      {process.status === 'active' && (
                        <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-card/95 px-3 py-1 text-xs font-medium text-success">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                          {t('Inscrições abertas')}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-accent-foreground">
                        <Users size={12} strokeWidth={1.5} />
                        {t(process.vacancies > 1 ? '{n} vagas' : '{n} vaga', { n: process.vacancies })}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Clock size={12} strokeWidth={1.5} />
                        {process.boutLabel}
                      </span>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex flex-1 flex-col p-2 lg:p-4">
                    <h3 className="text-2xl font-medium">{process.title}</h3>
                    <p className="mt-1 text-muted-foreground">{process.subtitle}</p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <MapPin size={16} strokeWidth={1.5} className="text-primary" />
                        {process.location}
                      </span>
                      <span className="tabular flex items-center gap-2">
                        <Calendar size={16} strokeWidth={1.5} className="text-primary" />
                        {process.startDateFormatted} {process.startTimeFormatted} — {process.endDateFormatted}{' '}
                        {process.endTimeFormatted}
                      </span>
                    </div>

                    <div className="styled-scroll mt-4 max-h-[132px] overflow-y-auto rounded-2xl bg-secondary p-4">
                      <p className="whitespace-pre-line leading-relaxed text-foreground/80">{process.description}</p>
                    </div>

                    <div className="mt-auto flex flex-col gap-3 pt-5 sm:flex-row">
                      <button
                        className={`flex-1 rounded-full px-6 py-3 font-medium transition-colors ${
                          process.status === 'active'
                            ? 'bg-primary text-primary-foreground hover:bg-primary-hover'
                            : 'cursor-not-allowed bg-secondary text-muted-foreground'
                        }`}
                        disabled={process.status !== 'active' || authLoading}
                        onClick={() => handleCandidatarClick(process)}
                      >
                        {authLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            {t('Verificando...')}
                          </span>
                        ) : process.status === 'active' ? (
                          t('Realizar inscrição')
                        ) : process.status === 'upcoming' ? (
                          t('Inscrições em breve')
                        ) : (
                          t('Processo finalizado')
                        )}
                      </button>

                      <button
                        onClick={() => toggleExpand(process.id)}
                        aria-expanded={expandedProcess === process.id}
                        className="flex items-center justify-center gap-2 rounded-full border px-6 py-3 font-medium transition-colors hover:bg-secondary"
                      >
                        {expandedProcess === process.id ? t('Menos detalhes') : t('Mais detalhes')}
                        <motion.span
                          animate={{ rotate: expandedProcess === process.id ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown size={18} strokeWidth={1.5} />
                        </motion.span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detalhes */}
                <AnimatePresence initial={false}>
                  {expandedProcess === process.id && (
                    <motion.div
                      className="overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className="m-3 mt-0 rounded-2xl bg-secondary p-6">
                        <div className="grid gap-8 md:grid-cols-2">
                          <div>
                            <h4 className="text-lg font-medium">{t('Requisitos')}</h4>
                            <ul className="mt-4 space-y-3">
                              {process.requirements.map((req: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3 text-foreground/80">
                                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-lg font-medium">{t('Benefícios')}</h4>
                            <ul className="mt-4 space-y-3">
                              {process.benefits.map((benefit: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-3 text-foreground/80">
                                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>

                            <div className="tabular mt-6 rounded-2xl border bg-card p-4">
                              <h5 className="font-medium">{t('Período do processo')}</h5>
                              <div className="mt-3 space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Início das inscrições')}</span>
                                  <span className="font-medium">
                                    {new Date(process.startDate).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Término das inscrições')}</span>
                                  <span className="font-medium">
                                    {new Date(process.endDate).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{t('Turno')}</span>
                                  <span className="font-medium">{process.boutLabel}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 border-t pt-6 sm:flex-row">
                          <a
                            className="rounded-full bg-foreground px-6 py-3 text-center font-medium text-background transition-opacity hover:opacity-90"
                            href="/editais"
                          >
                            {t('Olhar edital')}
                          </a>
                          <a
                            className="rounded-full border bg-card px-6 py-3 text-center font-medium transition-colors hover:bg-background"
                            href="/faq"
                          >
                            {t('Tirar dúvidas')}
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            ))}
          </div>
        )}

        <AnimatePresence>
          {!processesLoading && filteredProcesses.length === 0 && (
            <motion.div
              className="rounded-3xl border bg-card px-6 py-16 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <Users size={48} strokeWidth={1.25} className="mx-auto text-muted-foreground/60" />
              <h3 className="mt-4 text-2xl font-medium">{t('Nenhum processo encontrado')}</h3>
              <p className="mx-auto mt-2 max-w-md text-muted-foreground">
                {t('Não há processos seletivos disponíveis para o filtro selecionado no momento.')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}
