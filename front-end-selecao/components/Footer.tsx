'use client';
import BrandMark from "@/components/BrandMark";

import { emailContato, enderecoConselho, FaceBookConselho, InstagramConselho, linkPoliticaCookies, linkPoliticaPrivacidade, nomeConselho, telefoneConselho, YoutubeConselho } from '@/config/ConselhoConfig';
import { ChevronUp, Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QuickLink {
    label: string;
    href: string;
    target?: '_blank' | '_self';
}

interface FooterProps {
    quickLinks?: QuickLink[];
}

export default function Footer({ quickLinks = [] }: FooterProps) {
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Links rápidos padrão caso não sejam fornecidos via props
    const defaultQuickLinks: QuickLink[] = [
        { label: 'Processos Ativos', href: '/processos-seletivos', target: '_self' },
        { label: 'Editais', href: '/editais', target: '_self' },
        { label: 'Dúvidas Frequentes', href: '/faq', target: '_self' },
        { label: 'Política de Privacidade', href: linkPoliticaPrivacidade, target: '_blank' },
        { label: 'Política de Cookies', href: linkPoliticaCookies, target: '_blank' }
    ];

    // Usa os links fornecidos ou os padrões
    const finalQuickLinks = quickLinks.length > 0 ? quickLinks : defaultQuickLinks;

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <>
            <footer className="bg-gradient-to-br from-[#005f73] to-[#0a9396] text-white pt-16 pb-8 relative overflow-hidden">
                {/* Elementos decorativos otimizados */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
                <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl -z-10" />
                <div className="absolute bottom-20 left-10 w-48 h-48 bg-white/5 rounded-full blur-3xl -z-10" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mb-12">
                        {/* Coluna Logo e Sobre */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-4 mb-6">
                                <BrandMark className="text-white font-semibold tracking-tight" />
                            </div>
                            <p className="text-white/80 text-lg max-w-lg leading-relaxed mb-6">
                                Transformando talentos em profissionais de excelência através do nosso programa de estágio.
                            </p>
                            <div className="flex gap-4">
                                {[
                                    {
                                        name: 'Facebook',
                                        icon: <Facebook size={20} />,
                                        href: FaceBookConselho
                                    },
                                    {
                                        name: 'Instagram',
                                        icon: <Instagram size={20} />,
                                        href: InstagramConselho
                                    },
                                    {
                                        name: 'YouTube',
                                        icon: <Youtube size={20} />,
                                        href: YoutubeConselho
                                    }
                                ].map((social) => (
                                    <a
                                        key={social.name}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/50"
                                        aria-label={`Siga-nos no ${social.name}`}
                                    >
                                        {social.icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Links Rápidos */}
                        <div>
                            <h4 className="font-bold text-xl mb-6 text-white border-b border-white/20 pb-2">
                                Links Rápidos
                            </h4>
                            <ul className="space-y-4 text-white/80">
                                {finalQuickLinks.map((link) => (
                                    <li key={link.label}>
                                        <a
                                            href={link.href}
                                            target={link.target || '_self'}
                                            rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                                            className="hover:text-white transition duration-300 flex items-center gap-3 group"
                                        >
                                            <span className="w-2 h-2 bg-white/50 rounded-full group-hover:bg-white transition-colors" />
                                            {link.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Contato */}
                        <div>
                            <h4 className="font-bold text-xl mb-6 text-white border-b border-white/20 pb-2">
                                Contato
                            </h4>
                            <ul className="space-y-4 text-white/80">
                                <li className="flex items-center gap-3 hover:text-white transition duration-300">
                                    <Phone size={20} className="flex-shrink-0" />
                                    {telefoneConselho}
                                </li>
                                <li className="flex items-center gap-3 hover:text-white transition duration-300">
                                    <Mail size={20} className="flex-shrink-0" />
                                    {emailContato}
                                </li>
                                <li className="flex items-start gap-3 hover:text-white transition duration-300">
                                    <MapPin size={20} className="flex-shrink-0 mt-1" />
                                    {enderecoConselho}
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Divisor e Copyright */}
                    <div className="border-t border-white/20 pt-8 text-center text-white/70">
                        <p className="text-sm">
                            &copy; {new Date().getFullYear()} {nomeConselho}. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            </footer>

            {/* Botão Voltar ao Topo Melhorado */}
            <button
                onClick={scrollToTop}
                aria-label="Voltar ao topo"
                className={`fixed bottom-8 right-8 w-12 h-12 bg-gradient-to-br from-[#016175] to-[#379f9f] backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white hover:from-[#017185] hover:to-[#48afaf] transition-all duration-300 z-50 shadow-lg hover:shadow-xl hover:scale-110 ${showScrollTop
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-10 pointer-events-none'
                    }`}
            >
                <ChevronUp size={24} />
            </button>
        </>
    );
}