// components/candidate-dashboard2/ModernKpiRow.tsx
'use client';

import CountUp from '@/components/motion/CountUp';
import { StaggerItem } from '@/components/motion/Stagger';
import { CheckCircle2, Clock, Layers, XCircle } from 'lucide-react';

const tones = {
    default: 'bg-secondary text-foreground',
    info: 'bg-info-soft text-info',
    success: 'bg-success-soft text-success',
    danger: 'bg-destructive-soft text-destructive',
};

function KpiCard({
    title,
    value,
    icon: Icon,
    hint,
    tone,
}: {
    title: string;
    value: number;
    icon: typeof Layers;
    hint: string;
    tone: keyof typeof tones;
}) {
    return (
        <StaggerItem whileHover={{ y: -3 }} className="rounded-3xl border bg-card p-5 transition-shadow hover:shadow-md">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${tones[tone]}`}>
                <Icon className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <p className="tabular mt-4 text-4xl font-medium leading-none">
                <CountUp value={value} />
            </p>
            <p className="mt-2 text-sm font-medium">{title}</p>
            <p className="text-xs text-muted-foreground">{hint}</p>
        </StaggerItem>
    );
}

export function ModernKpiRow({ kpis }: { kpis: { total: number; in_progress: number; approved: number; rejected: number } }) {
    return (
        <>
            <KpiCard title="Inscrições" value={kpis.total} icon={Layers} hint="Total registradas" tone="default" />
            <KpiCard title="Em análise" value={kpis.in_progress} icon={Clock} hint="Em acompanhamento" tone="info" />
            <KpiCard title="Aprovadas" value={kpis.approved} icon={CheckCircle2} hint="Resultados positivos" tone="success" />
            <KpiCard title="Reprovadas" value={kpis.rejected} icon={XCircle} hint="Finalizadas" tone="danger" />
        </>
    );
}
