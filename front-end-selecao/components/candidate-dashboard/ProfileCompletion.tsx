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
            className="rounded-3xl border border-white/30 bg-white/60 backdrop-blur-xl shadow-sm overflow-hidden"
        >
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-extrabold text-gray-900">Completude do perfil</h2>
                </div>

                <a
                    href="/candidato/perfil"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a9396] hover:opacity-90"
                >
                    Editar
                    <ArrowRight className="w-4 h-4" />
                </a>
            </div>

            <div className="px-5 pb-5">
                <div className="flex items-end justify-between">
                    <p className="text-sm text-gray-600">
                        Complete seu perfil para agilizar a análise.
                    </p>
                    <p className="text-2xl font-black text-gray-900">{percent}%</p>
                </div>

                <div className="mt-3 h-3 rounded-full bg-gray-200/70 overflow-hidden">
                    <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#005f73] to-[#0a9396]"
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.6 }}
                    />
                </div>

                {missing.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-gray-200/70 bg-white/60 p-4">
                        <p className="text-sm font-semibold text-gray-900">Faltando:</p>
                        <ul className="mt-2 text-sm text-gray-600 list-disc pl-5 space-y-1">
                            {missing.slice(0, 6).map((m) => (
                                <li key={m.key}>{m.label ?? m.key}</li>
                            ))}
                        </ul>

                        {missing.length > 6 && (
                            <p className="text-xs text-gray-500 mt-2">
                                +{missing.length - 6} item(ns)
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl border border-emerald-200/70 bg-emerald-50/60 p-4">
                        <p className="text-sm font-semibold text-emerald-900">
                            Perfil completo ✅
                        </p>
                        <p className="text-sm text-emerald-800 mt-1">
                            Você está pronto para se candidatar com tudo certo.
                        </p>
                    </div>
                )}
            </div>
        </motion.section>
    );
}
