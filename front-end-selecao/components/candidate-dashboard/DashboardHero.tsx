// components/candidate-dashboard2/DashboardHero.tsx
'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CalendarDays, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
}

export function DashboardHero({
    name,
    email,
    avatarUrl,
    initials,
    isActive,
}: {
    name: string;
    email: string;
    avatarUrl: string | null;
    initials: string;
    isActive?: boolean;
}) {
    const firstName = name?.split(' ')[0] || 'Candidato';
    const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-3xl border bg-card"
        >
            {/* brilho suave na cor do tema, só no canto */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />

            <div className="relative flex flex-col gap-6 p-6 md:flex-row md:items-center md:p-8">
                <div className="flex min-w-0 items-center gap-5">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-xl font-semibold text-primary-foreground ring-4 ring-primary-soft">
                        {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            initials
                        )}
                    </div>

                    <div className="min-w-0">
                        <p className="truncate text-sm text-muted-foreground">{email}</p>
                        <h1 className="mt-1 text-3xl font-medium leading-tight md:text-4xl">
                            {greeting()}, <span className="font-serif italic">{firstName}</span>
                        </h1>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.5} />
                                <span className="inline-block first-letter:uppercase">{today}</span>
                            </span>
                            <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                                    isActive ? 'bg-success-soft text-success' : 'bg-destructive-soft text-destructive'
                                }`}
                            >
                                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} />
                                {isActive ? 'Conta ativa' : 'Conta inativa'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 md:ml-auto">
                    <Link
                        href="/processos-seletivos"
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                    >
                        Ver processos abertos <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                    </Link>
                    <Link
                        href="/candidato/perfil"
                        className="inline-flex items-center rounded-full border bg-background px-5 py-2.5 text-sm font-medium transition-colors hover:bg-secondary"
                    >
                        Completar meu perfil
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
