// Criado e desenvolvido por Pedro Henrique Faria dos Santos Soares 2025.

'use client';

import { useI18n } from '@/components/i18n/LanguageProvider';
import { useProcessGrid } from '@/api/hooks/useProcessGrid';
import Footer from "@/components/Footer";
import BackToTop from '@/components/main-page/BackToTop';
import Header from "@/components/main-page/Header";
import CountUp from '@/components/motion/CountUp';
import SplitWords from '@/components/motion/SplitWords';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import Reveal from "@/components/Reveal";
import { parseLocalCalendarDate } from '@/utils/selectionProcessDates';
import { ArrowRight, ArrowUpRight, CalendarClock, ChevronDown, ChevronLeft, ChevronRight, FolderOpen, Users } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Three.js só carrega no cliente e só em telas largas.
const HeroScene = dynamic(() => import('@/components/main-page/HeroScene'), { ssr: false });

const fmt = (iso: string, locale = 'pt-BR') => {
  const d = parseLocalCalendarDate(iso);
  return isNaN(d.getTime())
    ? '—'
    : new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long' }).format(d);
};

const steps = [
  { title: 'Crie seu cadastro', text: 'Dados pessoais e e-mail. Leva poucos minutos e vale para todos os processos.' },
  { title: 'Escolha o edital', text: 'Leia requisitos, benefícios, carga horária e bolsa antes de decidir.' },
  { title: 'Envie a inscrição', text: 'Preencha o formulário e anexe documentos. Dá para editar enquanto o prazo estiver aberto.' },
  { title: 'Aguarde a análise', text: 'A comissão avalia as inscrições em etapas, seguindo os critérios do edital.' },
  { title: 'Veja o resultado', text: 'O resultado e a convocação aparecem na sua área, sem precisar procurar.' },
];

const faq = [
  { q: 'Preciso de cadastro para ver os editais?', a: 'Não. Os editais e processos são públicos. O cadastro só é necessário no momento de se inscrever.' },
  { q: 'Posso alterar minha inscrição depois de enviar?', a: 'Sim, enquanto o processo estiver com inscrições abertas. Depois do encerramento, os dados ficam bloqueados.' },
  { q: 'Quais documentos devo enviar?', a: 'Cada edital lista os seus. Em geral: documento de identidade, histórico escolar e declaração de frequência.' },
  { q: 'Como sei se fui aprovado?', a: 'Pela sua área do candidato. Você acompanha o status da inscrição e as convocações em um só lugar.' },
  { q: 'Tenho outra dúvida. Com quem falo?', a: 'Veja a página de dúvidas frequentes ou escreva para o e-mail de contato no rodapé.' },
];

export default function Home() {
  const { t, lang } = useI18n();
  const loc = lang === 'en' ? 'en-US' : 'pt-BR';
  const { processes, isLoading } = useProcessGrid();
  const [open, setOpen] = useState(0);
  const [wide, setWide] = useState(false);
  const [tab, setTab] = useState<'all' | 'active' | 'upcoming' | 'finished'>('all');
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const tabs = [
    { key: 'all', name: 'Todos' },
    { key: 'active', name: 'Inscrições abertas' },
    { key: 'upcoming', name: 'Em breve' },
    { key: 'finished', name: 'Encerrados' },
  ] as const;
  const countOf = (k: string) => (k === 'all' ? processes.length : processes.filter((p) => p.status === k).length);
  const shown = tab === 'all' ? processes : processes.filter((p) => p.status === tab);
  const n = shown.length;
  const cur = n ? index % n : 0;
  const go = (d: number) => setIndex((cur + d + n) % n);
  // Avança sozinho; pausa com o mouse em cima e respeita "reduzir movimento".
  useEffect(() => {
    if (n < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % n), 4000);
    return () => clearInterval(id);
  }, [n, paused]);
  // Distância circular até o card central: o carrossel é um loop.
  const offsetOf = (i: number) => {
    const o = (((i - cur) % n) + n) % n;
    return o > n / 2 ? o - n : o;
  };

  const active = processes.filter((p) => p.status === 'active');
  const vagas = active.reduce((n, p) => n + (p.number_vacancies || 0), 0);
  const nextEnd = [...active].sort((a, b) => a.ending_date.localeCompare(b.ending_date))[0];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden px-5 pb-24 pt-20 md:px-8 md:pb-36 md:pt-32">
          {wide && <HeroScene />}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-0 h-40 bg-gradient-to-t from-background to-transparent" />
          <div className="relative mx-auto max-w-4xl text-center">
            <p className="rise mx-auto inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-highlight ring-2 ring-primary/30" />
              {active.length > 0
                ? t(active.length === 1 ? '{n} processo aberto agora' : '{n} processos abertos agora', { n: active.length })
                : t('Acompanhe os próximos processos')}
            </p>
            <h1 className="rise mt-8 text-[clamp(2.75rem,7vw,5.5rem)] font-medium leading-[0.98]" style={{ ['--i' as string]: 1 }}>
              <SplitWords text={t('Seu próximo passo')} /><SplitWords text={t('é um estágio.')} className="font-serif font-normal italic" delay={0.3} />
            </h1>
            <p className="rise mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl" style={{ ['--i' as string]: 2 }}>
              {t('Veja os processos abertos, inscreva-se e acompanhe cada etapa até o resultado.')}
            </p>
            <div className="rise mt-10 flex flex-wrap items-center justify-center gap-3" style={{ ['--i' as string]: 3 }}>
              <Link
                href="/processos-seletivos"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                {t('Ver processos seletivos')} <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center rounded-full border bg-card px-6 py-3 font-medium transition-colors hover:bg-secondary"
              >
                {t('Criar cadastro')}
              </Link>
            </div>
          </div>
        </section>

        {/* Fatos */}
        <section className="px-5 pb-24 md:px-8 md:pb-36">
          <Stagger>
            <dl className="mx-auto grid max-w-6xl gap-4 md:grid-cols-3">
              {[
                { Icon: FolderOpen, v: isLoading ? '…' : <CountUp value={active.length} />, d: t('processos com inscrição aberta') },
                { Icon: Users, v: isLoading ? '…' : <CountUp value={vagas} />, d: t('vagas disponíveis nos editais abertos') },
                { Icon: CalendarClock, v: nextEnd ? fmt(nextEnd.ending_date, loc) : '—', d: t('próximo encerramento de inscrições') },
              ].map(({ Icon, v, d }) => (
                <StaggerItem key={d} whileHover={{ y: -4 }} className="group relative overflow-hidden rounded-3xl border bg-card p-8 transition-shadow hover:border-primary/40 hover:shadow-md">
                  <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-accent-foreground">
                    <Icon className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <dd className="tabular mt-6 text-5xl font-medium leading-none tracking-tight">{v}</dd>
                  <dt className="mt-4 text-muted-foreground">{d}</dt>
                </StaggerItem>
              ))}
            </dl>
          </Stagger>
        </section>

        {/* Processos */}
        <section id="processos" className="scroll-mt-24 px-5 pb-24 md:px-8 md:pb-36">
          <Reveal>
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-4xl font-medium md:text-5xl">{t('Quadro de processos')}</h2>
                  <p className="mt-3 text-muted-foreground">{t('Editais publicados, do mais recente ao encerrado.')}</p>
                </div>
                <div className="flex gap-2">
                  {[-1, 1].map((d) => (
                    <button key={d} onClick={() => go(d)} disabled={n < 2} aria-label={d < 0 ? 'Anterior' : 'Próximo'} className="flex h-11 w-11 items-center justify-center rounded-full border bg-card transition-colors hover:bg-secondary disabled:opacity-40">
                      {d < 0 ? <ChevronLeft className="h-5 w-5" strokeWidth={1.5} /> : <ChevronRight className="h-5 w-5" strokeWidth={1.5} />}
                    </button>
                  ))}
                </div>
              </div>

              <div role="tablist" className="mt-8 flex flex-wrap gap-2">
                {tabs.map((x) => (
                  <button
                    key={x.key}
                    role="tab"
                    aria-selected={tab === x.key}
                    onClick={() => { setTab(x.key); setIndex(0); }}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${tab === x.key ? 'border-primary bg-primary text-primary-foreground' : 'bg-card hover:bg-secondary'}`}
                  >
                    {t(x.name)} <span className="tabular opacity-70">{countOf(x.key)}</span>
                  </button>
                ))}
              </div>

              {isLoading && <p className="mt-10 text-muted-foreground">{t('Carregando editais…')}</p>}
              {!isLoading && shown.length === 0 && (
                <p className="mt-8 rounded-3xl border bg-card p-8 text-lg">{t('Nenhum processo publicado no momento.')}</p>
              )}

              {/* Coverflow: no máximo 5 cards visíveis, o do meio em destaque */}
              <motion.ul
                className="relative mt-8 h-[25rem] touch-pan-y select-none overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_15%,black_85%,transparent)]"
                onHoverStart={() => setPaused(true)}
                onHoverEnd={() => setPaused(false)}
                onPanEnd={(_, info) => { if (info.offset.x < -50) go(1); else if (info.offset.x > 50) go(-1); }}
              >
                {shown.map((p, i) => {
                  const o = offsetOf(i);
                  const a = Math.abs(o);
                  return (
                  <motion.li
                    key={p.id}
                    initial={false}
                    animate={{ x: `calc(-50% + ${o * (wide ? 270 : 110)}px)`, scale: 1 - a * 0.12, opacity: a > 2 ? 0 : 1 - a * 0.25 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    style={{ zIndex: 10 - a, pointerEvents: a > 2 ? 'none' : 'auto' }}
                    className="absolute left-1/2 top-0 w-64 md:w-80"
                  >
                    <Link
                      href={p.status === 'active' ? `/aplicar/${p.slug}` : '/processos-seletivos'}
                      onClick={(e) => { if (o !== 0) { e.preventDefault(); setIndex(i); } }}
                      draggable={false}
                      className="lift group flex h-[24rem] flex-col overflow-hidden rounded-3xl border bg-card shadow-lg transition-colors hover:border-primary/40"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/30 to-primary-soft">
                        {p.process_banner && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.process_banner} alt="" loading="lazy" draggable={false} className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${p.status === 'finished' ? 'grayscale' : ''}`} />
                        )}
                        <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-background/90 px-3 py-1 text-xs font-medium">
                          <span className={`h-1.5 w-1.5 rounded-full ${p.status === 'active' ? 'bg-highlight' : p.status === 'upcoming' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                          {p.status === 'upcoming' ? t('abre {d}', { d: fmt(p.beginning_date, loc) }) : p.status === 'active' ? t('até {d}', { d: fmt(p.ending_date, loc) }) : t('encerrado')}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-5 pt-3">
                        <span className="w-fit rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{p.course}</span>
                        <span className="mt-3 line-clamp-2 text-lg font-medium leading-snug">{p.title}</span>
                        <div className="mt-auto flex items-center justify-between border-t pt-4 text-sm">
                          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-4 w-4" strokeWidth={1.5} />
                            {t(p.number_vacancies === 1 ? '{n} vaga' : '{n} vagas', { n: p.number_vacancies })}
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-primary">
                            {t(p.status === 'active' ? 'Inscrever-se' : 'Ver detalhes')}
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.li>
                  );
                })}
              </motion.ul>

              <p className="mt-6">
                <Link href="/processos-seletivos" className="font-medium text-primary underline-offset-4 hover:underline">{t('Ver todos os processos')}</Link>
              </p>
            </div>
          </Reveal>
        </section>

        {/* Etapas */}
        <section id="como-funciona" className="scroll-mt-24 px-5 pb-24 md:px-8 md:pb-36">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-4xl font-medium md:text-5xl">{t('Do cadastro ao resultado')}</h2>
            <Stagger className="mt-12" gap={0.1}>
              <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
                {steps.map((s, i) => (
                  <StaggerItem
                    key={s.title}
                    as="li"
                    whileHover={{ y: -4 }}
                    className={`rounded-3xl border bg-card p-7 transition-shadow hover:shadow-md lg:col-span-2 ${i >= 3 ? 'lg:col-span-3' : ''}`}
                  >
                    <span className="tabular flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-medium text-accent-foreground">
                      {i + 1}
                    </span>
                    <p className="mt-6 text-xl font-medium">{t(s.title)}</p>
                    <p className="mt-2 text-muted-foreground">{t(s.text)}</p>
                  </StaggerItem>
                ))}
              </ol>
            </Stagger>
          </div>
        </section>

        {/* Dúvidas */}
        <section id="duvidas" className="scroll-mt-24 px-5 pb-24 md:px-8 md:pb-36">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-4xl font-medium md:text-5xl">{t('Dúvidas comuns')}</h2>
            <Reveal>
              <div className="mt-10 space-y-3">
                {faq.map((f, i) => {
                  const isOpen = open === i;
                  return (
                    <div key={f.q} className="rounded-2xl border bg-card">
                      <button
                        onClick={() => setOpen(isOpen ? -1 : i)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-lg font-medium"
                      >
                        {t(f.q)}
                        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} strokeWidth={1.5} />
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden"
                          >
                            <p className="max-w-[60ch] px-6 pb-6 text-muted-foreground">{t(f.a)}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </Reveal>
            <p className="mt-8"><Link href="/faq" className="font-medium text-primary underline-offset-4 hover:underline">{t('Todas as dúvidas frequentes')}</Link></p>
          </div>
        </section>

        {/* CTA final */}
        <section className="px-5 pb-8 md:px-8">
          <Reveal>
            <div className="mx-auto max-w-6xl rounded-[2rem] bg-foreground px-8 py-16 text-center text-background md:py-24">
              <h2 className="text-4xl font-medium md:text-6xl">
                {t('Reserve')} <span className="font-serif font-normal italic">{t('sua vaga.')}</span>
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-background/70">{t('Cadastro gratuito. Você escolhe o edital depois.')}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/auth/register" className="rounded-full bg-highlight px-7 py-3 font-medium text-highlight-foreground transition-opacity hover:opacity-90">
                  {t('Criar cadastro')}
                </Link>
                <Link href="/auth/login-candidato" className="rounded-full border border-background/25 px-7 py-3 font-medium transition-colors hover:bg-background/10">
                  {t('Já tenho cadastro')}
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
