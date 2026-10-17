// components/candidate-dashboard2/ApplicationsPanel.tsx
'use client';

import type { RecentApplication } from '@/api/hooks/useCandidateDashboard';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

const STEPS = ['Enviada', 'Análise', 'Resultado'];

function statusMeta(status: string) {
    if (status === 'approved') return { label: 'Aprovado', cls: 'bg-success-soft text-success', bar: 'bg-success', current: 2, done: true };
    if (status === 'rejected') return { label: 'Reprovado', cls: 'bg-destructive-soft text-destructive', bar: 'bg-destructive', current: 2, done: true };
    return { label: status === 'pending' ? 'Pendente' : status, cls: 'bg-warning-soft text-warning', bar: 'bg-primary', current: 1, done: false };
}

/** Três etapas ligadas por uma linha que se preenche até a etapa atual. */
export function Stepper({ status }: { status: string }) {
    const m = statusMeta(status);
    return (
        <div className="mt-4">
            <div className="relative flex items-center justify-between">
                <div className="absolute left-2 right-2 h-0.5 rounded-full bg-secondary" />
                <motion.div
                    className={`absolute left-2 h-0.5 rounded-full ${m.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `calc(${(m.current / (STEPS.length - 1)) * 100}% - 1rem)` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                />
                {STEPS.map((s, i) => {
                    const reached = i <= m.current;
                    const isNow = i === m.current;
                    return (
                        <div key={s} className="relative z-10 flex h-4 w-4 items-center justify-center">
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.15 + i * 0.15, type: 'spring', stiffness: 400, damping: 20 }}
                                className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                    reached ? `${m.bar} border-transparent` : 'border-input bg-card'
                                } ${isNow && !m.done ? 'ring-4 ring-primary/20' : ''}`}
                            >
                                {reached && i < m.current && <Check className="h-2.5 w-2.5 text-primary-foreground" strokeWidth={3} />}
                            </motion.span>
                        </div>
                    );
                })}
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                {STEPS.map((s) => (
                    <span key={s}>{s}</span>
                ))}
            </div>
        </div>
    );
}

export function ApplicationsPanel({ items }: { items: RecentApplication[] }) {
    const has = items.length > 0;

    return (
        <section className="flex h-full flex-col overflow-hidden rounded-3xl border bg-card">
            <div className="flex items-center justify-between p-6 pb-3">
                <h2 className="text-lg font-medium">Minhas inscrições</h2>
                <Link href="/candidato/meus-processos" className="text-sm font-medium text-primary hover:underline">
                    Ver todas
                </Link>
            </div>

            {!has ? (
                <div className="p-6 pt-2">
                    <div className="rounded-2xl border border-dashed p-8 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                            <Sparkles className="h-6 w-6" strokeWidth={1.5} />
                        </div>
                        <p className="mt-4 font-medium">Você ainda não se inscreveu</p>
                        <p className="mt-1 text-sm text-muted-foreground">Veja processos abertos e faça sua primeira candidatura.</p>
                        <Link
                            href="/processos-seletivos"
                            className="mt-4 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                        >
                            Ver processos seletivos
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="px-3 pb-3">
                    {items.slice(0, 6).map((it, idx) => {
                        const m = statusMeta(it.status);
                        return (
                            <motion.div
                                key={it.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + idx * 0.06 }}
                            >
                                <Link
                                    href="/candidato/meus-processos"
                                    className="group block rounded-2xl p-4 transition-colors hover:bg-secondary"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="truncate font-medium">{it.selection_process_title}</p>
                                            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                <span className={`rounded-full px-2.5 py-0.5 font-semibold ${m.cls}`}>{m.label}</span>
                                                <span className="tabular">
                                                    {it.application_date
                                                        ? `Inscrição em ${new Date(it.application_date).toLocaleDateString('pt-BR')}`
                                                        : 'Inscrição registrada'}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                                    </div>
                                    <Stepper status={it.status} />
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}
