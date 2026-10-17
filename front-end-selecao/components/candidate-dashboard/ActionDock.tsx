// components/candidate-dashboard2/ActionDock.tsx
'use client';

import { ArrowRight, FileText, FolderOpen, UserCog } from 'lucide-react';
import Link from 'next/link';

const actions = [
    { title: 'Processos seletivos', desc: 'Veja vagas e editais disponíveis.', href: '/processos-seletivos', icon: FolderOpen },
    { title: 'Meu perfil', desc: 'Atualize dados e documentos.', href: '/candidato/perfil', icon: UserCog },
    { title: 'Meus processos', desc: 'Acompanhe etapas e status.', href: '/candidato/meus-processos', icon: FileText },
];

export function ActionDock() {
    return (
        <section className="h-full rounded-3xl border bg-card p-6">
            <h3 className="text-lg font-medium">Atalhos</h3>

            <div className="mt-4 space-y-2">
                {actions.map((a) => {
                    const Icon = a.icon;
                    return (
                        <Link
                            key={a.title}
                            href={a.href}
                            className="group flex items-center gap-3 rounded-2xl p-3 transition-colors hover:bg-secondary"
                        >
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary transition-transform group-hover:scale-105">
                                <Icon className="h-5 w-5" strokeWidth={1.5} />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block font-medium">{a.title}</span>
                                <span className="block text-xs text-muted-foreground">{a.desc}</span>
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
