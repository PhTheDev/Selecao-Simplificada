'use client';
import BrandMark from "@/components/BrandMark";

import { emailContato, enderecoConselho, linkPoliticaCookies, linkPoliticaPrivacidade, nomeConselho, telefoneConselho } from '@/config/ConselhoConfig';
import { useI18n } from '@/components/i18n/LanguageProvider';
import Link from 'next/link';

interface QuickLink {
    label: string;
    href: string;
    target?: '_blank' | '_self';
}

interface FooterProps {
    quickLinks?: QuickLink[];
}

const defaultLinks: QuickLink[] = [
    { label: 'Processos ativos', href: '/processos-seletivos' },
    { label: 'Editais', href: '/editais' },
    { label: 'Dúvidas frequentes', href: '/faq' },
    { label: 'Política de privacidade', href: linkPoliticaPrivacidade },
    { label: 'Política de cookies', href: linkPoliticaCookies },
];

export default function Footer({ quickLinks = [] }: FooterProps) {
    const links = quickLinks.length > 0 ? quickLinks : defaultLinks;
    const { t } = useI18n();

    return (
        <footer className="bg-background px-3 pb-6 pt-12 md:px-8">
            <div className="mx-auto max-w-6xl rounded-3xl border bg-card px-6 pb-10 pt-12 md:px-14 md:pb-12">
                <div className="grid gap-12 md:grid-cols-2">
                    <div>
                        <BrandMark />
                        <p className="mt-8 max-w-md font-serif text-3xl leading-tight md:text-4xl">
                            {t('Um edital, uma chance.')}
                        </p>
                        <p className="mt-4 max-w-md text-muted-foreground">
                            {t('Inscrição, acompanhamento e resultado do processo seletivo de estágio, em um só lugar.')}
                        </p>
                    </div>

                    <div className="grid gap-10 sm:grid-cols-2">
                        <ul className="space-y-3">
                            {links.map((l) => (
                                <li key={l.label}>
                                    <Link href={l.href} target={l.target} className="text-foreground/80 transition-colors hover:text-primary">
                                        {t(l.label)}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        <address className="space-y-3 not-italic">
                            <p><a href={`mailto:${emailContato}`} className="text-foreground/80 transition-colors hover:text-primary">{emailContato}</a></p>
                            <p>{telefoneConselho}</p>
                            <p className="text-muted-foreground">{enderecoConselho}</p>
                        </address>
                    </div>
                </div>

                <p className="mt-12 border-t pt-6 text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} {nomeConselho}. {t('Todos os direitos reservados.')}
                </p>
            </div>
        </footer>
    );
}
