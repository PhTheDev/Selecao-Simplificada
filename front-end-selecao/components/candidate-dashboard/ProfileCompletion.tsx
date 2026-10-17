'use client';

import type { ProfileCompletionInfo } from '@/api/hooks/useCandidateDashboard';
import CountUp from '@/components/motion/CountUp';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

type Props = {
    completion: ProfileCompletionInfo;
};

const R = 52;
const C = 2 * Math.PI * R;

export function ProfileCompletion({ completion }: Props) {
    const percent = Math.max(0, Math.min(100, completion.percent ?? 0));
    const missing = completion.missing ?? [];

    return (
        <section className="flex h-full flex-col rounded-3xl border bg-card p-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Perfil</h2>
                <Link href="/candidato/perfil" className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
                    Editar <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
                </Link>
            </div>

            <div className="mt-5 flex items-center gap-5">
                <div className="relative h-28 w-28 shrink-0">
                    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                        <circle cx="60" cy="60" r={R} fill="none" strokeWidth="9" className="stroke-secondary" />
                        <motion.circle
                            cx="60"
                            cy="60"
                            r={R}
                            fill="none"
                            strokeWidth="9"
                            strokeLinecap="round"
                            className="stroke-primary"
                            strokeDasharray={C}
                            initial={{ strokeDashoffset: C }}
                            animate={{ strokeDashoffset: C * (1 - percent / 100) }}
                            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-2xl font-medium">
                        <span className="tabular"><CountUp value={percent} />%</span>
                    </div>
                </div>

                <p className="text-sm text-muted-foreground">
                    {missing.length === 0
                        ? 'Tudo certo: você está pronto para se candidatar.'
                        : 'Complete o cadastro para agilizar a análise das suas inscrições.'}
                </p>
            </div>

            {missing.length > 0 ? (
                <ul className="mt-5 space-y-2">
                    {missing.slice(0, 4).map((m, i) => (
                        <motion.li
                            key={m.key}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + i * 0.07 }}
                            className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm"
                        >
                            <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                            {m.label ?? m.key}
                        </motion.li>
                    ))}
                    {missing.length > 4 && <li className="px-1 text-xs text-muted-foreground">+{missing.length - 4} item(ns)</li>}
                </ul>
            ) : (
                <div className="mt-5 flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 text-sm font-medium text-success">
                    <Check className="h-4 w-4" strokeWidth={2} />
                    Perfil completo
                </div>
            )}
        </section>
    );
}
