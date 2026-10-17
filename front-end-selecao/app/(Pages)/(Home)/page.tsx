// Criado e desenvolvido por Pedro Henrique Faria dos Santos Soares 2025.

'use client';

import { useI18n } from '@/components/i18n/LanguageProvider';
import { useProcessGrid } from '@/api/hooks/useProcessGrid';
import Footer from "@/components/Footer";
import Header from "@/components/main-page/Header";
import CountUp from '@/components/motion/CountUp';
import SplitWords from '@/components/motion/SplitWords';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';
import Reveal from "@/components/Reveal";
import { parseLocalCalendarDate } from '@/utils/selectionProcessDates';
import { ArrowRight, ArrowUpRight, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const groups = useMemo(() => {
    const by = (s: string) => processes.filter((p) => p.status === s);
    return [
      { name: 'Inscrições abertas', list: by('active') },
      { name: 'Em breve', list: by('upcoming') },
      { name: 'Encerrados', list: by('finished').slice(0, 4) },
    ].filter((g) => g.list.length > 0);
  }, [processes]);

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
              <SplitWords text={t('Seu estágio começa')} /><SplitWords text={t('no edital.')} className="font-serif font-normal italic" delay={0.3} />
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
                { v: isLoading ? '…' : <CountUp value={active.length} />, d: t('processos com inscrição aberta') },
                { v: isLoading ? '…' : <CountUp value={vagas} />, d: t('vagas disponíveis nos editais abertos') },
                { v: nextEnd ? fmt(nextEnd.ending_date, loc) : '—', d: t('próximo encerramento de inscrições') },
              ].map((f) => (
                <StaggerItem key={f.d} whileHover={{ y: -4 }} className="rounded-3xl border bg-card p-8 transition-shadow hover:shadow-md">
                  <dd className="tabular text-5xl font-medium leading-none tracking-tight">{f.v}</dd>
                  <dt className="mt-4 text-muted-foreground">{f.d}</dt>
                </StaggerItem>
              ))}
            </dl>
          </Stagger>
        </section>

        {/* Processos */}
        <section id="processos" className="scroll-mt-24 px-5 pb-24 md:px-8 md:pb-36">
          <Reveal>
            <div className="mx-auto max-w-4xl">
              <h2 className="text-4xl font-medium md:text-5xl">{t('Quadro de processos')}</h2>
              <p className="mt-3 text-muted-foreground">{t('Editais publicados, do mais recente ao encerrado.')}</p>

              {isLoading && <p className="mt-10 text-muted-foreground">{t('Carregando editais…')}</p>}
              {!isLoading && groups.length === 0 && (
                <p className="mt-10 rounded-3xl border bg-card p-8 text-lg">{t('Nenhum processo publicado no momento.')}</p>
              )}

              {groups.map((g) => (
                <div key={g.name} className="mt-12">
                  <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{t(g.name)}</h3>
                  <ul className="mt-4 space-y-3">
                    {g.list.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={p.status === 'active' ? `/aplicar/${p.slug}` : '/processos-seletivos'}
                          className="lift group flex items-center justify-between gap-6 rounded-2xl border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-primary-soft md:p-6"
                        >
                          <span>
                            <span className="block text-lg font-medium">{p.title}</span>
                            <span className="block text-sm text-muted-foreground">
                              {p.course} · {t(p.number_vacancies === 1 ? '{n} vaga' : '{n} vagas', { n: p.number_vacancies })}
                            </span>
                          </span>
                          <span className="tabular flex shrink-0 items-center gap-3 text-sm text-muted-foreground">
                            {p.status === 'upcoming' ? t('abre {d}', { d: fmt(p.beginning_date, loc) }) : p.status === 'active' ? t('até {d}', { d: fmt(p.ending_date, loc) }) : t('encerrado')}
                            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.5} />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <p className="mt-10">
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
    </div>
  );
}
