// components/candidate-dashboard2/ApplicationsPanel.tsx
'use client';

import type { RecentApplication } from '@/api/hooks/useCandidateDashboard';
import { motion } from 'framer-motion';
import { ChevronRight, Dot, FolderOpen, Sparkles } from 'lucide-react';

function statusPill(status: string) {
    if (status === 'approved') return 'bg-success-soft text-success';
    if (status === 'rejected') return 'bg-destructive-soft text-destructive';
    return 'bg-primary-soft text-primary';
}
function statusLabel(status: string) {
    if (status === 'approved') return 'Aprovado';
    if (status === 'rejected') return 'Reprovado';
    if (status === 'pending') return 'Pendente';
    return status;
}

export function ApplicationsPanel({ items }: { items: RecentApplication[] }) {
    const has = items.length > 0;

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, type: 'spring', stiffness: 120, damping: 14 }}
            className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden"
        >
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-foreground/80" />
                    <h2 className="text-lg font-extrabold text-foreground">Minhas inscrições</h2>
                </div>
                <a href="/candidato/meus-processos" className="text-sm font-semibold text-primary-hover">
                    Ver todas
                </a>
            </div>

            {!has ? (
                <div className="p-6 pt-2">
                    <div className="rounded-2xl border border-dashed border-input bg-card p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-card border border-border flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-foreground/80" />
                        </div>
                        <p className="mt-4 font-semibold text-foreground">Você ainda não se inscreveu</p>
                        <p className="text-sm text-muted-foreground mt-1">Veja processos abertos e faça sua primeira candidatura.</p>
                        <a
                            href="/processos-seletivos"
                            className="inline-flex mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
                        >
                            Ver processos seletivos
                        </a>
                    </div>
                </div>
            ) : (
                <div className="divide-y divide-border/60">
                    {items.slice(0, 6).map((it, idx) => (
                        <motion.a
                            key={it.id}
                            href="/candidato/meus-processos"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.06 + idx * 0.05 }}
                            className="block p-5 hover:bg-white/50 transition-colors"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                    <p className="font-bold text-foreground truncate">{it.selection_process_title}</p>

                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Dot className="w-5 h-5 -ml-2 text-muted-foreground/70" />
                                            {it.application_date
                                                ? `Inscrição em ${new Date(it.application_date).toLocaleDateString('pt-BR')}`
                                                : 'Inscrição registrada'}
                                        </span>

                                        <span className={`px-2.5 py-1 rounded-full font-semibold ${statusPill(it.status)}`}>
                                            {statusLabel(it.status)}
                                        </span>
                                    </div>

                                    {/* mini timeline visual */}
                                    <div className="mt-4">
                                        <div className="h-2 rounded-full bg-border/70 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{
                                                    width:
                                                        it.status === 'approved' ? '100%' : it.status === 'rejected' ? '100%' : '55%',
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
                                            <span>Enviada</span>
                                            <span>Análise</span>
                                            <span>Resultado</span>
                                        </div>
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-muted-foreground/70 mt-1" />
                            </div>
                        </motion.a>
                    ))}
                </div>
            )}
        </motion.section>
    );
}
