"use client";
import BrandMark from "@/components/BrandMark";

import { nomeConselho } from "@/config/ConselhoConfig";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    FileText,
    LayoutDashboard,
    LogOut,
    Menu,
    Settings,
    User,
    X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Funções auxiliares para gerenciar cookies (só executam no cliente)
const CookieManager = {
    setCookie(name: string, value: string, days?: number) {
        if (typeof document === 'undefined') return;
        const expires = days ? `; max-age=${days * 24 * 60 * 60}` : '';
        const secure = process.env.NODE_ENV === 'production' ? '; secure' : '';
        document.cookie = `${name}=${value}${expires}; path=/; sameSite=lax${secure}`;
    },

    getCookie(name: string): string | null {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    },

    deleteCookie(name: string) {
        if (typeof document === 'undefined') return;
        document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; sameSite=lax`;
    },

    getAuthUser() {
        if (typeof document === 'undefined') return null;
        const authUser = this.getCookie('auth_admin');
        if (!authUser) return null;
        try {
            const decoded = decodeURIComponent(authUser);
            const cleanJson = decoded.replace(/^"|"$/g, '').replace(/\\"/g, '"');
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Erro ao parsear auth_admin:', error);
            return null;
        }
    },

    clearAuthTokens() {
        if (typeof document === 'undefined') return;
        this.deleteCookie('admin-access-token');
        this.deleteCookie('admin-refresh-token');
        this.deleteCookie('admin-id');
        this.deleteCookie('auth_admin');
        this.deleteCookie('csrftoken');
    }
};

interface HeaderAdminProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

export default function HeaderAdmin({ sidebarOpen, setSidebarOpen }: HeaderAdminProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [adminData, setAdminData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClient, setIsClient] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const mobileMenuRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // Marcar que estamos no cliente após o hydration
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Buscar dados do admin quando o componente montar no cliente
    useEffect(() => {
        if (!isClient) return;

        const fetchAdminData = async () => {
            try {
                const accessToken = CookieManager.getCookie('admin-access-token');

                if (!accessToken) {
                    console.warn('Token de administrador não encontrado');
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/administration/administrators/me/`,
                    {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setAdminData(data);

                    const userData = {
                        id: data.id,
                        full_name: data.full_name,
                        email: data.email,
                        role: data.role,
                        department: data.department
                    };
                    CookieManager.setCookie('auth_admin', JSON.stringify(userData), 1);
                } else {
                    console.error('Erro ao buscar dados do administrador:', response.status);
                }
            } catch (error) {
                console.error('Erro na requisição do administrador:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAdminData();
    }, [isClient]);

    // Fechar dropdowns ao clicar fora
    useEffect(() => {
        if (!isClient) return;

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

        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [isClient]);

    // Fechar menu mobile ao mudar de rota
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Bloquear scroll quando menu mobile estiver aberto
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [mobileMenuOpen]);

    const dropdownVariants = {
        hidden: {
            opacity: 0,
            y: -10,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.2,
                ease: [0.4, 0, 0.2, 1] as const
            }
        },
        exit: {
            opacity: 0,
            y: -10,
            scale: 0.95,
            transition: {
                duration: 0.15,
                ease: [0.4, 0, 1, 1] as const
            }
        },
    };

    const mobileMenuVariants = {
        hidden: {
            opacity: 0,
            x: '-100%'
        },
        visible: {
            opacity: 1,
            x: 0,
            transition: {
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1] as const
            }
        },
        exit: {
            opacity: 0,
            x: '-100%',
            transition: {
                duration: 0.3,
                ease: [0.4, 0, 1, 1] as const
            }
        },
    };

    const overlayVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
        exit: { opacity: 0 }
    };

    const sidebarVariants = {
        open: {
            width: 280,
            transition: {
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1] as const
            }
        },
        closed: {
            width: 80,
            transition: {
                duration: 0.3,
                ease: [0.4, 0, 0.2, 1] as const
            }
        }
    };

    const handleLogout = async () => {
        try {
            const refreshToken = CookieManager.getCookie('admin-refresh-token');
            const accessToken = CookieManager.getCookie('admin-access-token');

            if (refreshToken && accessToken) {
                await fetch(
                    `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/administration/administrators/logout/`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`,
                        },
                        body: JSON.stringify({ refresh_token: refreshToken }),
                    }
                );
            }
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            CookieManager.clearAuthTokens();

            if (typeof window !== 'undefined') {
                localStorage.removeItem('admin-access-token');
                localStorage.removeItem('admin-refresh-token');
                localStorage.removeItem('admin-id');
                sessionStorage.removeItem('admin-access-token');
                sessionStorage.removeItem('admin-refresh-token');
                sessionStorage.removeItem('admin-id');
            }

            window.location.href = '/auth/login-admin';
        }
    };

    // Componente de link da sidebar
    const SidebarLink = ({
        text,
        href,
        icon,
        submenu
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
                    ? "text-white bg-gradient-to-r from-blue-500/30 to-purple-500/30 shadow-lg shadow-blue-500/20 backdrop-blur-sm border border-white/10"
                    : "text-white/70 hover:text-white hover:bg-white/5 hover:shadow-md"
                    }`}
            >
                <div className={`flex-shrink-0 transition-transform duration-300 ${isActive ? "text-white scale-110" : "text-white/70 group-hover:scale-105"}`}>
                    {icon}
                </div>
                <motion.span
                    animate={{
                        opacity: sidebarOpen ? 1 : 0,
                        x: sidebarOpen ? 0 : -10
                    }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="whitespace-nowrap overflow-hidden text-sm font-medium"
                >
                    {text}
                </motion.span>

                {!isActive && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}

                {!sidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute left-full ml-2 px-3 py-2 bg-gray-900/95 backdrop-blur-sm text-white text-sm rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap z-50 shadow-xl border border-white/10"
                    >
                        {text}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-2 h-2 bg-gray-900/95 rotate-45" />
                    </motion.div>
                )}
            </Link>
        );
    };

    // Dados do admin para exibição
    const authAdmin = isClient ? CookieManager.getAuthUser() : null;
    const displayName = adminData?.full_name || authAdmin?.full_name || adminData?.user?.first_name || "Administrador";
    const displayEmail = adminData?.email || authAdmin?.email || adminData?.user?.email || "";
    const displayRole = adminData?.role || authAdmin?.role || "";
    const displayDepartment = adminData?.department || authAdmin?.department || "";

    return (
        <>
            {/* Sidebar Desktop */}
            <motion.div
                initial={false}
                animate={sidebarOpen ? "open" : "closed"}
                variants={sidebarVariants}
                className="hidden lg:flex fixed left-0 top-0 h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-r border-white/5 shadow-2xl z-40 overflow-hidden flex-col"
            >
                {/* Header da Sidebar */}
                <div className="flex items-center justify-between h-20 px-4 border-b border-white/5">
                    <motion.div
                        animate={{ opacity: sidebarOpen ? 1 : 0, scale: sidebarOpen ? 1 : 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center gap-3"
                    >
                        {sidebarOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col"
                            >
                                <div className="text-white font-bold text-lg">SELEÇÃO {nomeConselho}</div>
                                <div className="text-white/40 text-xs">ADMIN PORTAL</div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Toggle Button */}
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.1)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10 backdrop-blur-sm"
                    >
                        {sidebarOpen ? (
                            <ChevronLeft className="w-4 h-4 text-white/70" />
                        ) : (
                            <ChevronRight className="w-4 h-4 text-white/70" />
                        )}
                    </motion.button>
                </div>

                {/* Links de Navegação */}
                <nav className="flex-1 px-2 py-6 space-y-2">
                    <SidebarLink
                        text="Dashboard"
                        href="/painel-admin"
                        icon={<LayoutDashboard className="w-5 h-5" />}
                    />

                    <SidebarLink
                        text="Processos Seletivos"
                        href="/painel-admin/processos"
                        icon={<FileText className="w-5 h-5" />}
                        submenu
                    />

                    <SidebarLink
                        text="Configurações"
                        href="/painel-admin/configuracoes"
                        icon={<Settings className="w-5 h-5" />}
                    />
                </nav>

                {/* Footer da Sidebar */}
                <div className="p-4 border-t border-white/5 space-y-4">
                    <motion.div
                        animate={{ opacity: sidebarOpen ? 1 : 0, scale: sidebarOpen ? 1 : 0.8 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center gap-3 p-4 rounded-2xl"
                    >
                        <Link href="/painel-admin">
                            <BrandMark className="text-white font-semibold tracking-tight" />
                        </Link>
                    </motion.div>

                    <motion.button
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(239, 68, 68, 0.2)" }}
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 text-white/70 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all duration-300 group border border-white/5"
                    >
                        <LogOut className="w-4 h-4" />
                        <motion.span
                            animate={{
                                opacity: sidebarOpen ? 1 : 0,
                                x: sidebarOpen ? 0 : -10
                            }}
                            transition={{ duration: 0.2 }}
                            className="text-sm font-medium"
                        >
                            Sair
                        </motion.span>
                    </motion.button>
                </div>
            </motion.div>

            {/* Main Header */}
            <header className={`sticky top-0 z-30 backdrop-blur-xl transition-all duration-300 ${sidebarOpen ? 'lg:pl-65' : 'lg:pl-15'
                }`}>
                <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50" />

                <div className="relative flex items-center justify-between h-16 lg:h-20 px-4 lg:px-8">

                    {/* Left Section */}
                    <div className="flex items-center gap-3 lg:gap-4">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors mobile-menu-button"
                            aria-label="Abrir menu"
                        >
                            <Menu className="w-5 h-5 text-gray-600" />
                        </button>
                        <div className="flex flex-col">
                            <h1 className="text-lg lg:text-2xl font-bold text-gray-900 leading-tight">
                                {getPageTitle(pathname)}
                            </h1>
                            <p className="text-xs lg:text-sm text-gray-600 mt-0.5 lg:mt-1">
                                {getPageDescription(pathname)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-4">
                        <div className="relative">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                ref={triggerRef}
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 rounded-2xl hover:bg-gray-100 cursor-pointer transition-all duration-200 border border-gray-200/50"
                            >
                                <div className="text-right hidden sm:block">
                                    <div className="text-sm font-semibold text-gray-900 leading-none">
                                        {displayName}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize mt-1">
                                        Administrador
                                    </div>
                                </div>

                                {/* Mostrar nome completo em telas muito pequenas */}
                                <div className="text-right sm:hidden">
                                    <div className="text-sm font-semibold text-gray-900 leading-none">
                                        {displayName.split(' ')[0]}
                                    </div>
                                </div>

                                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-white">
                                    <User className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                                </div>
                            </motion.div>

                            {/* Dropdown Menu */}
                            <AnimatePresence>
                                {dropdownOpen && (
                                    <motion.div
                                        ref={dropdownRef}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        variants={dropdownVariants}
                                        className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl p-4 z-50"
                                    >
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-gray-100">
                                                <User className="w-6 h-6 text-white" />
                                            </div>

                                            <div className="text-center">
                                                <h3 className="font-bold text-gray-900 text-lg">
                                                    {displayName}
                                                </h3>
                                                {displayEmail && (
                                                    <p className="text-sm text-gray-600 mt-1 break-all">{displayEmail}</p>
                                                )}
                                                {displayRole && (
                                                    <p className="text-xs text-gray-400 mt-2 capitalize bg-gray-100 py-1 px-3 rounded-full">
                                                        {displayDepartment}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="w-full border-t border-gray-200/50 my-2" />

                                            <Link
                                                href="/painel-admin/perfil"
                                                onClick={() => setDropdownOpen(false)}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                                            >
                                                <User className="w-4 h-4" />
                                                Meu Perfil
                                            </Link>

                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200"
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
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        {/* Overlay de fundo */}
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={overlayVariants}
                            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => setMobileMenuOpen(false)}
                        />

                        {/* Menu móvel */}
                        <motion.div
                            ref={mobileMenuRef}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={mobileMenuVariants}
                            className="lg:hidden fixed left-0 top-0 h-full w-80 max-w-[85vw] bg-gradient-to-br from-slate-900 to-slate-800 shadow-2xl border-r border-white/10 z-50 overflow-y-auto"
                        >
                            {/* Header do menu móvel */}
                            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
                                <div className="flex items-center gap-3">
                                    <div>
                                        <div className="text-white font-bold text-base">{nomeConselho}</div>
                                        <div className="text-white/60 text-xs">Administração</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* Navegação mobile */}
                            <nav className="p-4 space-y-1">
                                {[
                                    { href: "/painel-admin", icon: LayoutDashboard, text: "Dashboard" },
                                    { href: "/painel-admin/processos", icon: FileText, text: "Processos Seletivos" },
                                    { href: "/painel-admin/configuracoes", icon: Settings, text: "Configurações" },
                                ].map((item) => {
                                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-200 ${isActive
                                                ? "text-white bg-white/20 shadow-lg border border-white/10"
                                                : "text-white/70 hover:text-white hover:bg-white/10"
                                                }`}
                                            onClick={() => setMobileMenuOpen(false)}
                                        >
                                            <item.icon className="w-5 h-5 flex-shrink-0" />
                                            <span className="font-medium">{item.text}</span>
                                            {isActive && (
                                                <div className="ml-auto w-2 h-2 bg-white rounded-full" />
                                            )}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* Footer do menu mobile */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-4">
                                    <Link href="/painel-admin">
                                        <BrandMark className="text-white font-semibold tracking-tight" />
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center justify-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-red-500/10 rounded-2xl transition-all duration-300 border border-white/10"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="font-medium">Sair do Sistema</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// Funções auxiliares para títulos de página
function getPageTitle(pathname: string | null): string {
    if (!pathname) return "Painel Administrativo";

    const routes: { [key: string]: string } = {
        "/painel-admin": "Dashboard",
        "/painel-admin/processos": "Processos Seletivos",
        "/painel-admin/candidatos": "Candidatos",
        "/painel-admin/inscricoes": "Inscrições",
        "/painel-admin/analises": "Análises",
        "/painel-admin/configuracoes": "Configurações",
        "/painel-admin/perfil": "Perfil",
    };

    return routes[pathname] || "Painel Administrativo";
}

function getPageDescription(pathname: string | null): string {
    if (!pathname) return "Visão geral";

    const routes: { [key: string]: string } = {
        "/painel-admin": "Visão geral do sistema",
        "/painel-admin/processos": "Gerencie processos seletivos",
        "/painel-admin/candidatos": "Visualize e gerencie candidatos",
        "/painel-admin/inscricoes": "Acompanhe inscrições",
        "/painel-admin/analises": "Relatórios e estatísticas",
        "/painel-admin/configuracoes": "Configurações do sistema",
        "/painel-admin/perfil": "Gerencie seu perfil",
    };

    return routes[pathname] || `Painel Administrativo do Seleção ${nomeConselho}`;
}