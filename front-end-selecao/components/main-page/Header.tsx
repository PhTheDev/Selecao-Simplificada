'use client';
import LanguageToggle from '@/components/i18n/LanguageToggle';
import { useI18n } from '@/components/i18n/LanguageProvider';
import ThemeToggle from '@/components/theme/ThemeToggle';
import BrandMark from "@/components/BrandMark";

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const links = [
    { href: '/processos-seletivos', label: 'Processos' },
    { href: '/editais', label: 'Editais' },
    { href: '/faq', label: 'Dúvidas' },
];

export default function Header() {
    const pathname = usePathname();
    const { t } = useI18n();
    const [open, setOpen] = useState(false);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        setAuthed(document.cookie.split('; ').some((c) => c.startsWith('access-token=')));
    }, []);

    const area = authed ? '/candidato' : '/auth/login-candidato';

    return (
        <header className="sticky top-0 z-50 px-3 pt-3 md:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border bg-background/80 px-5 py-2.5 backdrop-blur md:px-6">
                <Link href="/" aria-label={t('Ir para a página inicial')} onClick={() => setOpen(false)}>
                    <BrandMark />
                </Link>

                <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
                    {links.map((l) => (
                        <Link key={l.href} href={l.href} className="group rounded-full px-4 py-2 text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground">
                            <span className="relative">
                                {t(l.label)}
                                <span
                                    className={`absolute -bottom-1 left-0 h-0.5 rounded-full bg-primary transition-all duration-300 group-hover:w-full ${pathname === l.href ? 'w-full' : 'w-0'}`}
                                />
                            </span>
                        </Link>
                    ))}
                    <LanguageToggle className="ml-2" />
                    <ThemeToggle />
                    <Link
                        href={area}
                        className="ml-3 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                    >
                        {t('Área do candidato')}
                    </Link>
                </nav>

                <div className="flex items-center gap-2 md:hidden">
                <LanguageToggle />
                <ThemeToggle />
                <button
                    className="p-2"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? t('Fechar menu') : t('Abrir menu')}
                    aria-expanded={open}
                >
                    {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
                </div>
            </div>

            {open && (
                <nav className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-3xl border bg-card px-5 pb-5 pt-2 md:hidden" aria-label="Principal">
                    {links.map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="py-3 text-xl">
                            {t(l.label)}
                        </Link>
                    ))}
                    <Link
                        href={area}
                        onClick={() => setOpen(false)}
                        className="mt-3 rounded-full bg-primary px-5 py-3 text-center font-medium text-primary-foreground"
                    >
                        {t('Área do candidato')}
                    </Link>
                </nav>
            )}
        </header>
    );
}
