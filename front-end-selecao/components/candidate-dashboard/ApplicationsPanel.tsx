// components/candidate-dashboard2/ApplicationsPanel.tsx
'use client';

import type { RecentApplication } from '@/api/hooks/useCandidateDashboard';
import { motion } from 'framer-motion';
import { ChevronRight, Dot, FolderOpen, Sparkles } from 'lucide-react';

function statusPill(status: string) {
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
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
            className="rounded-3xl border border-white/30 bg-white/60 backdrop-blur-xl shadow-sm overflow-hidden"
        >
            <div className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-gray-700" />
                    <h2 className="text-lg font-extrabold text-gray-900">Minhas inscrições</h2>
                </div>
                <a href="/candidato/meus-processos" className="text-sm font-semibold text-[#0a9396]">
                    Ver todas
                </a>
            </div>

            {!has ? (
                <div className="p-6 pt-2">
                    <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 p-6 text-center">
                        <div className="mx-auto w-12 h-12 rounded-2xl bg-white/70 border border-white/70 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-gray-700" />
                        </div>
                        <p className="mt-4 font-semibold text-gray-900">Você ainda não se inscreveu</p>
                        <p className="text-sm text-gray-600 mt-1">Veja processos abertos e faça sua primeira candidatura.</p>
                        <a
                            href="/processos-seletivos"
                            className="inline-flex mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white font-semibold"
                        >
                            Ver processos seletivos
                        </a>
                    </div>
                </div>
            ) : (
                <div className="divide-y divide-gray-200/60">
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
                                    <p className="font-bold text-gray-900 truncate">{it.selection_process_title}</p>

                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                                        <span className="inline-flex items-center gap-1">
                                            <Dot className="w-5 h-5 -ml-2 text-gray-400" />
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
                                        <div className="h-2 rounded-full bg-gray-200/70 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-gradient-to-r from-[#005f73] to-[#0a9396]"
                                                style={{
                                                    width:
                                                        it.status === 'approved' ? '100%' : it.status === 'rejected' ? '100%' : '55%',
                                                }}
                                            />
                                        </div>
                                        <div className="mt-2 flex justify-between text-[11px] text-gray-500">
                                            <span>Enviada</span>
                                            <span>Análise</span>
                                            <span>Resultado</span>
                                        </div>
                                    </div>
                                </div>

                                <ChevronRight className="w-5 h-5 text-gray-400 mt-1" />
                            </div>
                        </motion.a>
                    ))}
                </div>
            )}
        </motion.section>
    );
}
