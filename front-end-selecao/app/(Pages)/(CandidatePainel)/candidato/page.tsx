// app/candidato/page.tsx
'use client';

import { useCandidateDashboard } from '@/api/hooks/useCandidateDashboard';
import { ActionDock } from '@/components/candidate-dashboard/ActionDock';
import { ApplicationsPanel } from '@/components/candidate-dashboard/ApplicationsPanel';
import { DashboardHero } from '@/components/candidate-dashboard/DashboardHero';
import { DashboardSkeleton } from '@/components/candidate-dashboard/DashboardSkeleton';
import { ModernKpiRow } from '@/components/candidate-dashboard/ModernKpiRow';
import { ProfileCompletion } from '@/components/candidate-dashboard/ProfileCompletion';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';

export default function CandidateDashboardPage() {
    const { candidate, avatar, applications, kpis, loading, error, profileCompletion } = useCandidateDashboard();

    if (loading) {
        return (
            <div className="min-h-screen bg-muted">
                <main className="container mx-auto px-4 py-8">
                    <DashboardSkeleton />
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !candidate) {
        return (
            <div className="min-h-screen bg-muted">
                <main className="container mx-auto px-4 py-16">
                    <div className="max-w-md mx-auto bg-card backdrop-blur rounded-2xl border border-border shadow-sm p-6 text-center">
                        <h2 className="text-xl font-bold text-foreground">Não foi possível carregar</h2>
                        <p className="text-muted-foreground mt-2">{error || 'Erro inesperado'}</p>
                        <a
                            href="/auth/login-candidato"
                            className="inline-flex mt-5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
                        >
                            Ir para login
                        </a>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted">

            <main className="container mx-auto px-4 py-8 space-y-6">
                <DashboardHero
                    name={candidate.name}
                    email={candidate.email}
                    avatarUrl={avatar.url}
                    initials={avatar.initials}
                    isActive={candidate.is_active}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, type: 'spring', stiffness: 120, damping: 14 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <ModernKpiRow kpis={kpis} />
                        <ApplicationsPanel items={applications} />
                    </motion.div>

                    <motion.aside
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.05, type: 'spring', stiffness: 120, damping: 14 }}
                        className="space-y-6"
                    >
                        <ProfileCompletion completion={profileCompletion} />
                        <ActionDock />
                    </motion.aside>
                </div>
            </main>

            <Footer />
        </div>
    );
}
