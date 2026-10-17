// components/candidate-dashboard2/DashboardHero.tsx
'use client';

import { motion } from 'framer-motion';
import { CalendarDays, Sparkles, ShieldCheck } from 'lucide-react';

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
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 120, damping: 14 }}
            className="relative overflow-hidden rounded-3xl border border-border bg-white/50 shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
        >
            <div className="absolute inset-0 bg-primary/15" />
            <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
            <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />

            <div className="relative p-6 md:p-8 flex flex-col md:flex-row gap-6 md:items-center">
                <div className="flex items-center gap-4 min-w-0">
                    <motion.div
                        whileHover={{ rotate: 1, scale: 1.02 }}
                        className="w-16 h-16 rounded-2xl overflow-hidden border border-white/60 bg-card flex items-center justify-center font-bold text-xl text-foreground shadow-sm"
                    >
                        {avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            initials
                        )}
                    </motion.div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Sparkles className="w-4 h-4" />
                            <span className="truncate">Área do candidato • {email}</span>
                        </div>

                        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mt-1">
                            Olá, {firstName} 👋
                        </h1>

                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-card border border-border text-foreground/80">
                                <CalendarDays className="w-4 h-4" />
                                {today}
                            </span>

                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-card border border-border text-foreground/80">
                                <ShieldCheck className="w-4 h-4" />
                                {isActive ? 'Conta ativa' : 'Conta inativa'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="md:ml-auto flex flex-wrap gap-3">
                    <motion.a
                        href="/processos-seletivos"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow-sm"
                    >
                        Ver processos abertos
                    </motion.a>

                    <motion.a
                        href="/candidato/perfil"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-4 py-2 rounded-xl text-sm font-semibold bg-card border border-border text-foreground"
                    >
                        Completar meu perfil
                    </motion.a>
                </div>
            </div>
        </motion.div>
    );
}
