'use client';

import type { ProfileCompletionInfo } from '@/api/hooks/useCandidateDashboard';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

type Props = {
    completion: ProfileCompletionInfo;
};

export function ProfileCompletion({ completion }: Props) {
    const percent = Math.max(0, Math.min(100, completion.percent ?? 0));
    const missing = completion.missing ?? [];

    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, type: 'spring', stiffness: 120, damping: 14 }}
            className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden"
        >
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-foreground/80" />
                    <h2 className="text-lg font-extrabold text-foreground">Completude do perfil</h2>
                </div>

                <a
                    href="/candidato/perfil"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-hover hover:opacity-90"
                >
                    Editar
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>

            <div className="px-5 pb-5">
                <div className="flex items-end justify-between">
                    <p className="text-sm text-muted-foreground">
                        Complete seu perfil para agilizar a análise.
                    </p>
                    <p className="text-2xl font-semibold text-foreground">{percent}%</p>
                </div>

                <div className="mt-3 h-3 rounded-full bg-border/70 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6 }}
                    />
                </div>

                {missing.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-border/70 bg-card p-4">
                        <p className="text-sm font-semibold text-foreground">Faltando:</p>
                        <ul className="mt-2 text-sm text-muted-foreground list-disc pl-5 space-y-1">
                            {missing.slice(0, 6).map((m) => (
                                <li key={m.key}>{m.label ?? m.key}</li>
                            ))}
                        </ul>

                        {missing.length > 6 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                +{missing.length - 6} item(ns)
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl border border-success/70 bg-success-soft/60 p-4">
                        <p className="text-sm font-semibold text-success">
                            Perfil completo ✅
                        </p>
                        <p className="text-sm text-success mt-1">
                            Você está pronto para se candidatar com tudo certo.
                        </p>
                    </div>
                )}
            </div>
        </motion.section>
    );
}
