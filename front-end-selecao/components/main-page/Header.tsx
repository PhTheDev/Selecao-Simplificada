'use client';
import LanguageToggle from '@/components/i18n/LanguageToggle';
import { useI18n } from '@/components/i18n/LanguageProvider';
import ThemeToggle from '@/components/theme/ThemeToggle';
import BrandMark from "@/components/BrandMark";

import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const ease = [0.16, 1, 0.3, 1] as const;

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

    // fecha ao trocar de rota (a cortina de transição intercepta o onClick dos links), com Esc e trava a rolagem
    useEffect(() => setOpen(false), [pathname]);
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open]);

    const area = authed ? '/candidato' : '/auth/login-candidato';

    return (
        <header className="sticky top-0 z-50 px-3 pt-3 md:px-8">
            <div className="relative z-[70] mx-auto flex max-w-6xl items-center justify-between rounded-full border bg-background/80 px-5 py-2.5 backdrop-blur md:px-6">
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
                    className="relative flex h-10 w-10 items-center justify-center rounded-full"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? t('Fechar menu') : t('Abrir menu')}
                    aria-expanded={open}
                >
                    {/* três barras viram um X */}
                    <motion.span
                        className="absolute h-0.5 w-5 rounded-full bg-foreground"
                        animate={open ? { y: 0, rotate: 45 } : { y: -6, rotate: 0 }}
                        transition={{ duration: 0.35, ease }}
                    />
                    <motion.span
                        className="absolute h-0.5 w-5 rounded-full bg-foreground"
                        animate={open ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                        transition={{ duration: 0.2 }}
                    />
                    <motion.span
                        className="absolute h-0.5 w-5 rounded-full bg-foreground"
                        animate={open ? { y: 0, rotate: -45 } : { y: 6, rotate: 0 }}
                        transition={{ duration: 0.35, ease }}
                    />
                </button>
                </div>
            </div>

            {/* Menu mobile: círculo que nasce no botão e cobre a tela; links sobem em sequência */}
            <AnimatePresence>
                {open && (
                    <motion.nav
                        aria-label="Principal"
                        className="fixed inset-0 z-[60] flex flex-col justify-between bg-background px-6 pb-8 pt-28 md:hidden"
                        initial={{ clipPath: 'circle(0px at calc(100% - 2.75rem) 2.75rem)' }}
                        animate={{ clipPath: 'circle(150vmax at calc(100% - 2.75rem) 2.75rem)' }}
                        exit={{ clipPath: 'circle(0px at calc(100% - 2.75rem) 2.75rem)', transition: { duration: 0.5, ease: [0.76, 0, 0.24, 1] } }}
                        transition={{ duration: 0.75, ease: [0.76, 0, 0.24, 1] }}
                    >
                        <ul className="space-y-1">
                            {links.map((l, i) => (
                                <li key={l.href} className="overflow-hidden border-b py-1">
                                    <motion.div
                                        initial={{ y: '110%' }}
                                        animate={{ y: 0, transition: { delay: 0.3 + i * 0.08, duration: 0.7, ease } }}
                                        exit={{ y: '110%', transition: { duration: 0.2 } }}
                                    >
                                        <Link
                                            href={l.href}
                                            onClick={() => setOpen(false)}
                                            className={`flex items-baseline justify-between py-3 text-4xl font-medium tracking-tight ${pathname === l.href ? 'text-primary' : 'text-foreground'}`}
                                        >
                                            <span>{t(l.label)}</span>
                                            <span className="tabular text-sm font-normal text-muted-foreground">0{i + 1}</span>
                                        </Link>
                                    </motion.div>
                                </li>
                            ))}
                        </ul>

                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.55, duration: 0.6, ease } }}
                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                        >
                            <Link
                                href={area}
                                onClick={() => setOpen(false)}
                                className="block rounded-full bg-primary px-5 py-4 text-center text-lg font-medium text-primary-foreground"
                            >
                                {t('Área do candidato')}
                            </Link>
                            <p className="mt-4 text-center font-serif text-xl italic text-muted-foreground">
                                {t('Um edital, uma chance.')}
                            </p>
                        </motion.div>
                    </motion.nav>
                )}
            </AnimatePresence>
        </header>
    );
}
