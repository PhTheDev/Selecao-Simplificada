'use client';
import BrandMark from "@/components/BrandMark";

import { Home, LogIn, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// Funções auxiliares para gerenciar cookies
const CookieManager = {
    getCookie(name: string): string | null {
        if (typeof document === 'undefined') return null;
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
        return null;
    }
};

export default function ProcessHeader() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    // Verificar autenticação ao carregar o componente
    useEffect(() => {
        checkAuthentication();
    }, []);

    const checkAuthentication = useCallback((): void => {
        const accessToken = CookieManager.getCookie('access-token');
        setIsAuthenticated(!!accessToken);
    }, []);

    const handleScroll = useCallback((): void => {
        setIsScrolled(window.scrollY > 50);
    }, []);

    const handleResize = useCallback((): void => {
        if (window.innerWidth >= 768) {
            setIsMenuOpen(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, [handleScroll, handleResize]);

    const toggleMenu = useCallback((): void => {
        setIsMenuOpen(prev => !prev);
    }, []);

    const closeMenu = useCallback((): void => {
        setIsMenuOpen(false);
    }, []);

    const handleCandidateAreaClick = useCallback(async (): Promise<void> => {
        if (isAuthenticated) {
            window.location.href = '/candidato';
        } else {
            window.location.href = '/auth/login-candidato';
        }
    }, [isAuthenticated]);

    return (
        <header className={`fixed w-full top-0 z-50 transition-all duration-300 ${isMenuOpen ? 'h-screen bg-[#006074]' :
            isScrolled ? 'bg-[#006074]/90 backdrop-blur-md shadow-lg' : 'bg-transparent'
            }`}>
            <div className="container mx-auto px-4 py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link
                        href="/"
                        aria-label="Ir para a página inicial"
                        onClick={closeMenu}
                        className="flex items-center space-x-3 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                        <BrandMark className="text-white font-semibold tracking-tight" />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-6 items-center">
                        <a
                            href="/"
                            className="group flex items-center gap-2 font-semibold text-white transition-all duration-300 hover:text-[#a8e6cf] relative py-2 px-3 rounded-lg hover:bg-white/10"
                        >
                            <Home className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                            <span className="relative">
                                Inicio
                                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#a8e6cf] transition-all duration-300 group-hover:w-full"></span>
                            </span>
                        </a>

                        <button
                            onClick={handleCandidateAreaClick}
                            className={`group flex items-center gap-2 px-8 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${isScrolled ? 'bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white hover:from-[#0a9396] hover:to-[#005f73]' : 'bg-white text-[#005f73] hover:bg-gray-100'}`}
                        >
                            <LogIn className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                            Área do Candidato
                        </button>
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden transition-all duration-300 p-2 hover:bg-white/10 rounded-lg"
                        onClick={toggleMenu}
                        aria-label={isMenuOpen ? "Fechar menu" : "Abrir menu"}
                    >
                        {isMenuOpen ? (
                            <X className="w-6 h-6 text-white transition-transform duration-300 hover:scale-110" />
                        ) : (
                            <Menu className="w-6 h-6 text-white transition-transform duration-300 hover:scale-110" />
                        )}
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden transition-all duration-300 overflow-hidden ${isMenuOpen ? 'max-h-96 opacity-100 pt-6' : 'max-h-0 opacity-0'}`}>
                    <nav className="flex flex-col space-y-2 py-4 gap-2 pt-6 border-t border-white/20">
                        <a
                            href="/"
                            className="group flex items-center gap-3 font-semibold text-white hover:text-[#a8e6cf] transition-all duration-300 p-3 rounded-lg hover:bg-white/10 active:bg-white/20"
                        >
                            <Home className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            <span className="flex-1">Inicio</span>
                            <div className="w-1 h-8 bg-transparent group-hover:bg-[#a8e6cf] rounded-full transition-all duration-300"></div>
                        </a>

                        <button
                            onClick={() => {
                                handleCandidateAreaClick();
                                closeMenu();
                            }}
                            className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl mt-4"
                        >
                            <LogIn className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                            Área do Candidato
                        </button>
                    </nav>
                </div>
            </div>
        </header>
    );
}