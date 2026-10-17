// components/candidate-dashboard2/ModernKpiRow.tsx
'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Layers, XCircle } from 'lucide-react';

function KpiCard({
    title,
    value,
    icon: Icon,
    hint,
    delay,
}: {
    title: string;
    value: number;
    icon: any;
    hint: string;
    delay: number;
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay, type: 'spring', stiffness: 120, damping: 14 }}
            whileHover={{ y: -3 }}
            className="rounded-2xl border border-border bg-card shadow-sm p-4"
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs text-muted-foreground">{title}</p>
                    <p className="text-2xl font-extrabold text-foreground mt-1">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-card border border-border flex items-center justify-center">
                    <Icon className="w-5 h-5 text-foreground/80" />
                </div>
            </div>
        </motion.div>
    );
}

export function ModernKpiRow({ kpis }: { kpis: { total: number; in_progress: number; approved: number; rejected: number } }) {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard title="Inscrições" value={kpis.total} icon={Layers} hint="Total registradas" delay={0.05} />
            <KpiCard title="Em análise" value={kpis.in_progress} icon={Clock} hint="Acompanhamento" delay={0.09} />
            <KpiCard title="Aprovadas" value={kpis.approved} icon={CheckCircle2} hint="Resultados positivos" delay={0.13} />
            <KpiCard title="Reprovadas" value={kpis.rejected} icon={XCircle} hint="Finalizadas" delay={0.17} />
        </div>
    );
}
