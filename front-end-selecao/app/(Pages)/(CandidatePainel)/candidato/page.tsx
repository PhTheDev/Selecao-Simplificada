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
import { NextStepCard } from '@/components/candidate-dashboard/NextStepCard';
import { Stagger, StaggerItem } from '@/components/motion/Stagger';

export default function CandidateDashboardPage() {
    const { candidate, avatar, applications, kpis, loading, error, profileCompletion } = useCandidateDashboard();

    if (loading) {
        return (
            <div className="min-h-screen bg-muted">
                <main className="container mx-auto px-4 py-8">
                    <DashboardSkeleton />
                </main>
                <Footer compact />
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
                <Footer compact />
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

                {/* Bento: próximo passo + perfil em cima, números, depois inscrições e atalhos */}
                <Stagger className="grid grid-cols-1 gap-4 lg:grid-cols-12" gap={0.07}>
                    <StaggerItem className="lg:col-span-7">
                        <NextStepCard completion={profileCompletion} applications={applications} kpis={kpis} />
                    </StaggerItem>
                    <StaggerItem className="lg:col-span-5">
                        <ProfileCompletion completion={profileCompletion} />
                    </StaggerItem>

                    <div className="grid grid-cols-2 gap-4 lg:col-span-12 lg:grid-cols-4">
                        <ModernKpiRow kpis={kpis} />
                    </div>

                    <StaggerItem className="lg:col-span-8">
                        <ApplicationsPanel items={applications} />
                    </StaggerItem>
                    <StaggerItem className="lg:col-span-4">
                        <ActionDock />
                    </StaggerItem>
                </Stagger>
            </main>

            <Footer compact />
        </div>
    );
}
