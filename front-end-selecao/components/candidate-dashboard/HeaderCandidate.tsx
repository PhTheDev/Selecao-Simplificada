'use client';
import BrandMark from "@/components/BrandMark";

import {
    getAuthUserFromCookie,
    notifyAuthUserLoggedOut,
} from '@/utils/candidateAuth';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    User,
    X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

type HeaderCandidateProps = {
    sidebarOpen: boolean;
    setSidebarOpen: Dispatch<SetStateAction<boolean>>;
};

export default function HeaderCandidate({ sidebarOpen, setSidebarOpen }: HeaderCandidateProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    type AuthUser = ReturnType<typeof getAuthUserFromCookie>;
    const [authUser, setAuthUser] = useState<AuthUser>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);

    const pathname = usePathname();

    const syncAuthUser = () => {
        try {
            setAuthUser(getAuthUserFromCookie());
        } catch {
            setAuthUser(null);
        }
    };

    // 1) carrega no mount
    useEffect(() => {
        syncAuthUser();
    }, []);

    // 2) recarrega em troca de rota
    useEffect(() => {
        syncAuthUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // 3) escuta eventos: login / perfil atualizado / logout
    useEffect(() => {
        const handler = () => syncAuthUser();

        window.addEventListener('auth_user_updated', handler);
        window.addEventListener('auth_user_logged_in', handler);
        window.addEventListener('auth_user_logged_out', handler);

        return () => {
            window.removeEventListener('auth_user_updated', handler);
            window.removeEventListener('auth_user_logged_in', handler);
            window.removeEventListener('auth_user_logged_out', handler);
        };
    }, []);

    // Clique fora: fecha dropdown e mobile menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !triggerRef.current?.contains(event.target as Node)
            ) {
                setDropdownOpen(false);
            }

            if (
                mobileMenuRef.current &&
                !mobileMenuRef.current.contains(event.target as Node) &&
                !(event.target as Element).closest('.mobile-menu-button')
            ) {
                setMobileMenuOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Fecha o menu mobile quando mudar rota
    useEffect(() => setMobileMenuOpen(false), [pathname]);

    // Trava scroll quando menu mobile aberto
    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    const handleLogout = () => {
        try {
            setDropdownOpen(false);
            setMobileMenuOpen(false);
            setAuthUser(null);

            // remove cookies na raiz (Path=/)
            const cookieNames = ['access-token', 'refresh-token', 'auth_user'];

            cookieNames.forEach((name) => {
                document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;`;
            });

            // avisa app todo
            notifyAuthUserLoggedOut();

            window.location.href = '/auth/login-candidato';
        } catch {
            window.location.href = '/auth/login-candidato';
        }
    };

    const sidebarVariants = {
        open: { width: 280, transition: { duration: 0.25 } },
        closed: { width: 80, transition: { duration: 0.25 } },
    };

    const dropdownVariants = {
        hidden: { opacity: 0, y: -10, scale: 0.98 },
        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18 } },
        exit: { opacity: 0, y: -10, scale: 0.98, transition: { duration: 0.12 } },
    };

    const mobileMenuVariants = {
        hidden: { opacity: 0, x: '-100%' },
        visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
        exit: { opacity: 0, x: '-100%', transition: { duration: 0.25 } },
    };

    const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };

    const SidebarLink = ({
        text,
        href,
        icon,
        submenu,
    }: {
        text: string;
        href: string;
        icon: React.ReactNode;
        submenu?: boolean;
    }) => {
        const isActive = pathname === href || (submenu && pathname?.startsWith(href));
        return (
            <Link
                href={href}
                className={`group flex items-center gap-3 font-medium transition-all duration-300 relative py-3 px-4 rounded-2xl mx-2 ${isActive
                    ? 'text-white bg-white/10 shadow-lg border border-white/10'
                    : 'text-white/80 hover:text-white hover:bg-white/5'
                    }`}
            >
                <div className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-white/80'}`}>{icon}</div>

                <motion.span
                    animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -10 }}
                    transition={{ duration: 0.15 }}
                    className="whitespace-nowrap overflow-hidden text-sm"
                >
                    {text}
                </motion.span>

                {!sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-full ml-2 px-3 py-2 bg-gray-900/95 text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-white/10"
                    >
                        {text}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900/95 rotate-45" />
                    </motion.div>
                )}
            </Link>
        );
    };

    const displayName =
        authUser?.name || (authUser as any)?.full_name || (authUser as any)?.first_name || 'Candidato';

    const displayEmail = authUser?.email || '';

    const profileUrl =
        (authUser as any)?.profile_image_url || (authUser as any)?.profile_image || null;

    // bust só quando a url mudar
    const [bust, setBust] = useState<number>(0);
    useEffect(() => {
        setBust(Date.now());
    }, [profileUrl]);

    const profileUrlWithBust = profileUrl
        ? `${profileUrl}${profileUrl.includes('?') ? '&' : '?'}v=${bust}`
        : null;

    return (
        <>
            {/* Sidebar Desktop */}
            <motion.aside
                initial={false}
                animate={sidebarOpen ? 'open' : 'closed'}
                variants={sidebarVariants}
                className="hidden lg:flex fixed left-0 top-0 h-screen bg-gradient-to-br from-[#044c59] via-[#066578] to-[#044c59] border-r border-white/10 shadow-2xl z-40 overflow-hidden flex-col"
            >
                <div className="flex items-center justify-between h-20 px-4 border-b border-white/10">
                    <motion.div
                        animate={{ opacity: sidebarOpen ? 1 : 0, scale: sidebarOpen ? 1 : 0.98 }}
                        className="flex items-center gap-3"
                    >
                        {sidebarOpen && (
                            <div className="flex flex-col">
                                <span className="text-white font-semibold text-base">Área do Candidato</span>
                                <span className="text-white/70 text-xs">Acompanhe suas inscrições</span>
                            </div>
                        )}
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                        aria-label="Alternar sidebar"
                    >
                        {sidebarOpen ? (
                            <ChevronLeft className="w-4 h-4 text-white/80" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-white/80" />
                        )}
                    </motion.button>
                </div>

                <nav className="flex-1 px-2 py-6 space-y-2">
                    <SidebarLink text="Dashboard" href="/candidato" icon={<LayoutDashboard className="w-5 h-5" />} />
                    <SidebarLink text="Meus Processos" href="/candidato/meus-processos" icon={<FileText className="w-5 h-5" />} submenu />
                </nav>

                <div className="p-4 border-t border-white/10 space-y-4">
                    <motion.div
                        animate={{ opacity: sidebarOpen ? 1 : 0, scale: sidebarOpen ? 1 : 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center gap-3"
                    >
                        <Link href="/candidato">
                            <BrandMark className="text-white font-semibold tracking-tight" />
                        </Link>

                        {sidebarOpen && (
                            <p className="text-[11px] text-white/80 text-center">
                                Plataforma oficial para acompanhar seus processos seletivos.
                            </p>
                        )}
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 text-white/80 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all border border-white/10"
                    >
                        <LogOut className="w-4 h-4" />
                        <motion.span
                            animate={{ opacity: sidebarOpen ? 1 : 0, x: sidebarOpen ? 0 : -10 }}
                            transition={{ duration: 0.15 }}
                            className="text-sm font-medium"
                        >
                            Sair
                        </motion.span>
                    </motion.button>
                </div>
            </motion.aside>

            {/* Header topo */}
            <header
                className={`sticky top-0 z-30 backdrop-blur-xl transition-all duration-300 ${sidebarOpen ? 'lg:pl-[280px]' : 'lg:pl-[80px]'
                    }`}
            >
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border-b border-gray-200/40" />

                <div className="relative flex items-center justify-between h-16 lg:h-20 px-4 lg:px-8">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors mobile-menu-button"
                            aria-label="Abrir menu"
                        >
                            <Menu className="w-5 h-5 text-gray-700" />
                        </button>

                        <div className="hidden sm:block">
                            <p className="text-sm font-bold text-gray-900 leading-none">Área do Candidato</p>
                            <p className="text-xs text-gray-600 mt-1">Acompanhe suas inscrições e atualize seu perfil</p>
                        </div>
                    </div>

                    <div className="relative">
                        <motion.div
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            ref={triggerRef}
                            onClick={() => setDropdownOpen((v) => !v)}
                            className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-gray-100 cursor-pointer border border-gray-200/60 bg-white/70"
                        >
                            <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900 leading-none">
                                    {String(displayName).split(' ')[0] || 'Candidato'}
                                </div>
                                {displayEmail && (
                                    <div className="text-xs text-gray-500 mt-1 truncate max-w-[140px] sm:max-w-none">
                                        {displayEmail}
                                    </div>
                                )}
                            </div>

                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#066578] to-[#0a9396] shadow-sm ring-2 ring-white overflow-hidden flex items-center justify-center">
                                {profileUrlWithBust ? (
                                    <Image
                                        src={profileUrlWithBust}
                                        alt="Foto de perfil"
                                        width={36}
                                        height={36}
                                        className="w-full h-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <User className="w-5 h-5 text-white" />
                                )}
                            </div>
                        </motion.div>

                        <AnimatePresence>
                            {dropdownOpen && (
                                <motion.div
                                    ref={dropdownRef}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    variants={dropdownVariants}
                                    className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-gray-200/60 rounded-2xl shadow-2xl p-4 z-50"
                                >
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#066578] to-[#0a9396] shadow-sm ring-2 ring-gray-100 overflow-hidden flex items-center justify-center">
                                            {profileUrlWithBust ? (
                                                <Image
                                                    src={profileUrlWithBust}
                                                    alt="Foto de perfil"
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <User className="w-7 h-7 text-white" />
                                            )}
                                        </div>

                                        <div className="text-center">
                                            <h3 className="font-bold text-gray-900 text-lg">{displayName}</h3>
                                            {displayEmail ? (
                                                <p className="text-sm text-gray-600 mt-1 break-all">{displayEmail}</p>
                                            ) : null}
                                        </div>

                                        <div className="w-full border-t border-gray-200/60 my-1" />

                                        <Link
                                            href="/candidato/perfil"
                                            onClick={() => setDropdownOpen(false)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
                                        >
                                            <User className="w-4 h-4" />
                                            Meu Perfil
                                        </Link>

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sair do Sistema
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={overlayVariants}
                            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        <motion.div
                            ref={mobileMenuRef}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={mobileMenuVariants}
                            className="lg:hidden fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-[#044c59] via-[#066578] to-[#044c59] shadow-2xl border-r border-white/10 z-50 overflow-y-auto"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/10">
                                <BrandMark className="text-white font-semibold tracking-tight" />
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            <nav className="p-4 space-y-1">
                                {[
                                    { href: '/candidato', icon: LayoutDashboard, text: 'Dashboard' },
                                    { href: '/candidato/meus-processos', icon: FileText, text: 'Meus Processos' },
                                ].map((item) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${isActive
                                                ? 'text-white bg-white/15 border border-white/10'
                                                : 'text-white/80 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            <item.icon className="w-5 h-5" />
                                            <span className="font-medium">{item.text}</span>
                                            {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
                                        </Link>
                                    );
                                })}
                            </nav>

                            <div className="p-6 border-t border-white/10">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-3 px-4 py-3 text-white/85 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all border border-white/10"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="font-medium">Sair</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
