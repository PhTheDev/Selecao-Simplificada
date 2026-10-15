// components/candidate-dashboard2/ActionDock.tsx
'use client';

import { motion } from 'framer-motion';
import { FileText, FolderOpen, UserCog, ArrowRight } from 'lucide-react';

const actions = [
    {
        title: 'Processos seletivos',
        desc: 'Veja vagas e editais disponíveis.',
        href: '/processos-seletivos',
        icon: FolderOpen,
    },
    {
        title: 'Meu perfil',
        desc: 'Atualize dados e documentos.',
        href: '/candidato/perfil',
        icon: UserCog,
    },
    {
        title: 'Meus processos',
        desc: 'Acompanhe etapas e status.',
        href: '/candidato/meus-processos',
        icon: FileText,
    },
];

export function ActionDock() {
    return (
        <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, type: 'spring', stiffness: 120, damping: 14 }}
            className="rounded-3xl border border-white/30 bg-white/60 backdrop-blur-xl shadow-sm p-5"
        >
            <h3 className="font-extrabold text-gray-900">Atalhos</h3>
            <p className="text-sm text-gray-600 mt-1">Acesso rápido às principais áreas.</p>

            <div className="mt-4 space-y-3">
                {actions.map((a, idx) => {
                    const Icon = a.icon;
                    return (
                        <motion.a
                            key={a.title}
                            href={a.href}
                            whileHover={{ scale: 1.01, y: -1 }}
                            whileTap={{ scale: 0.99 }}
                            className="flex items-center gap-3 p-3 rounded-2xl bg-white/70 border border-white/70"
                        >
                            <div className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                                <Icon className="w-5 h-5 text-gray-700" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="font-bold text-gray-900">{a.title}</p>
                                <p className="text-xs text-gray-600">{a.desc}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-500" />
                        </motion.a>
                    );
                })}
            </div>
        </motion.section>
    );
}
