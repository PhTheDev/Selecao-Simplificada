'use client';

import type { DashboardKpis, ProfileCompletionInfo, RecentApplication } from '@/api/hooks/useCandidateDashboard';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, FileSearch, Sparkles, UserCog } from 'lucide-react';
import Link from 'next/link';

type Step = { icon: typeof Sparkles; eyebrow: string; title: string; text: string; cta: string; href: string };

/** Escolhe a próxima ação mais útil para o candidato, do mais urgente para o menos. */
function pickStep(completion: ProfileCompletionInfo, applications: RecentApplication[], kpis: DashboardKpis): Step {
    const missing = completion.missing?.length ?? 0;
    if (missing > 0) {
        return {
            icon: UserCog,
            eyebrow: 'Próximo passo',
            title: 'Complete seu perfil',
            text: `Faltam ${missing} ${missing === 1 ? 'dado' : 'dados'} para você se candidatar sem travar na análise.`,
            cta: 'Completar perfil',
            href: '/candidato/perfil',
        };
    }
    if (applications.length === 0) {
        return {
            icon: Sparkles,
            eyebrow: 'Próximo passo',
            title: 'Faça sua primeira inscrição',
            text: 'Seu perfil está pronto. Escolha um edital aberto e envie a candidatura.',
            cta: 'Ver processos abertos',
            href: '/processos-seletivos',
        };
    }
    if (kpis.approved > 0) {
        return {
            icon: CheckCircle2,
            eyebrow: 'Boa notícia',
            title: `${kpis.approved} ${kpis.approved === 1 ? 'candidatura aprovada' : 'candidaturas aprovadas'}`,
            text: 'Confira os detalhes e as orientações da convocação na página da inscrição.',
            cta: 'Ver resultado',
            href: '/candidato/meus-processos',
        };
    }
    return {
        icon: FileSearch,
        eyebrow: 'Em andamento',
        title: `${kpis.in_progress} ${kpis.in_progress === 1 ? 'inscrição em análise' : 'inscrições em análise'}`,
        text: 'A comissão está avaliando. Você pode acompanhar cada etapa e editar enquanto o prazo estiver aberto.',
        cta: 'Acompanhar inscrições',
        href: '/candidato/meus-processos',
    };
}

export function NextStepCard({
    completion,
    applications,
    kpis,
}: {
    completion: ProfileCompletionInfo;
    applications: RecentApplication[];
    kpis: DashboardKpis;
}) {
    const s = pickStep(completion, applications, kpis);
    const Icon = s.icon;

    return (
        <section className="group relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border bg-primary-soft p-6 md:p-8">
            <motion.div
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-primary/25 blur-3xl"
                animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-card/80 px-3 py-1 text-xs font-medium text-accent-foreground">
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    {s.eyebrow}
                </span>
                <h2 className="mt-5 max-w-md text-3xl font-medium leading-tight md:text-4xl">{s.title}</h2>
                <p className="mt-3 max-w-md text-muted-foreground">{s.text}</p>
            </div>
            <Link
                href={s.href}
                className="relative mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
                {s.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
            </Link>
        </section>
    );
}
