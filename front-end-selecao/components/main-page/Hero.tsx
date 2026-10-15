'use client';

import { useCandidateAuth } from '@/api/hooks/useCandidateAuth';
import { useHeroProcesses } from '@/api/hooks/useProcessGrid';
import { SelectionProcess } from '@/api/types/selection';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { isNowWithinInscriptionWindow } from '@/utils/selectionProcessDates';
import { HeroCarousel } from './HeroCarousel';

// Dados fallback para quando não houver processos
const fallbackProcesses: SelectionProcess[] = [
    {
        id: 0,
        title: `Processo Seletivo`,
        subtitle: "Em breve novas oportunidades de estágio",
        description: "Fique atento às nossas redes sociais para não perder os próximos processos seletivos",
        course: "Administração",
        slug: "processos-futuros",
        beginning_date: new Date().toISOString(),
        ending_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_accepted: "5º ao 10º período",
        bout: "2024.2",
        weekly_workload: "20 horas",
        salary: "Bolsa auxílio",
        notice_doc: "",
        notice_documents: [],
        number_vacancies: 0,
        local: "Sede da instituição",
        requirements: "",
        benefits: "Bolsa auxílio, certificado de estágio, experiência profissional",
        process_banner: "/images/hero-carousel/fallback.png",
        is_active: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "created"
    }
];

// Função para mapear SelectionProcess para o formato do carrossel
const mapProcessToCarouselImage = (process: SelectionProcess) => ({
    src: process.process_banner || '/images/hero-carousel/fallback.png',
    alt: process.title
});

// Função para verificar se o processo está ativo
const isProcessActive = (process: SelectionProcess) => {
    if (!process.is_active) return false;
    return isNowWithinInscriptionWindow(process.beginning_date, process.ending_date);
};

// Função para gerar texto do botão baseado no processo
const getButtonText = (process: SelectionProcess, isLoadingAuth: boolean) => {
    if (isLoadingAuth) return 'Verificando...';

    const isActive =
        process.is_active &&
        isNowWithinInscriptionWindow(process.beginning_date, process.ending_date);
    return isActive ? 'Candidatar-se' : 'Ver Detalhes';
};

const getHeroTitleClassName = (title: string) => {
    const base = 'font-black text-[#e9d8a6] mb-3 md:mb-4 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)] break-words hyphens-auto';

    if (title.length > 90) {
        return `${base} text-2xl sm:text-3xl md:text-[clamp(1.75rem,2.4vw,2.5rem)]`;
    }

    if (title.length > 60) {
        return `${base} text-3xl sm:text-4xl md:text-[clamp(2rem,2.8vw,3rem)]`;
    }

    return `${base} text-3xl sm:text-4xl md:text-[clamp(2.25rem,3.2vw,3.75rem)]`;
};

export default function Hero() {
    const { processesData, isLoading, error, isEmpty } = useHeroProcesses();
    const { isAuthenticated, isLoading: isLoadingAuth } = useCandidateAuth();
    const [isArrowVisible, setIsArrowVisible] = useState(true);
    const [activeSlide, setActiveSlide] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isMobile, setIsMobile] = useState(false);

    // Usar dados fallback se não houver dados da API
    const displayProcesses = processesData && processesData.length > 0 ? processesData : fallbackProcesses;

    const scrollToNextSection = () => {
        const nextSection = document.getElementById('processos');
        if (nextSection) {
            nextSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Função para atualizar o slide ativo com direção
    const handleSlideChange = (index: number) => {
        setDirection(index > activeSlide ? 0 : 1);
        setActiveSlide(index);
    };

    // Função para lidar com clique no botão principal
    const handleMainButtonClick = (process: SelectionProcess) => {
        const processActive =
            process.is_active &&
            isNowWithinInscriptionWindow(process.beginning_date, process.ending_date);

        if (!processActive) {
            window.location.href = '/processos-seletivos';
            return;
        }

        // Processo ativo: verificar autenticação
        if (isLoadingAuth) {
            // Aguardando verificação
            return;
        }

        if (isAuthenticated) {
            // Usuário logado - redirecionar para formulário de candidatura
            window.location.href = `/aplicar/${process.slug}`;
        } else {
            // Usuário não logado - redirecionar para login
            window.location.href = '/auth/login-candidato';
        }
    };

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 100) {
                setIsArrowVisible(false);
            } else {
                setIsArrowVisible(true);
            }
        };

        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Estado de loading
    if (isLoading) {
        return (
            <section className="relative bg-gradient-to-br from-[#005f73] via-[#0a9396] to-[#94d2bd] text-white overflow-hidden pb-20 md:pb-30 pt-20 md:pt-0 min-h-[70vh] md:min-h-[80vh] flex items-center justify-center">
                <div className="container mx-auto px-4 text-center">
                    <div className="animate-pulse">
                        <div className="h-8 bg-white/20 rounded w-3/4 mx-auto mb-4"></div>
                        <div className="h-4 bg-white/20 rounded w-1/2 mx-auto mb-6"></div>
                        <div className="h-12 bg-white/20 rounded w-48 mx-auto"></div>
                    </div>
                </div>
            </section>
        );
    }

    const currentProcess = displayProcesses[activeSlide];
    const isUsingFallback = processesData && processesData.length === 0;

    const handleCarouselImageClick = (index: number) => {
        if (isUsingFallback) {
            window.location.href = '/processos-seletivos';
            return;
        }
        const target = displayProcesses[index];
        if (target) {
            handleMainButtonClick(target);
        }
    };

    // Gera o texto do subtítulo
    const getSubtitleText = (process: SelectionProcess) => {
        if (process.subtitle) {
            return process.subtitle;
        }

        // Fallback: usa a descrição ou gera um subtítulo baseado nas informações
        if (process.description) {
            return process.description.length > 120
                ? process.description.substring(0, 120) + '...'
                : process.description;
        }

        return `Processo seletivo para ${process.course} • ${process.number_vacancies} vagas`;
    };

    // Variantes de animação para o texto
    const textVariants = {
        enter: (direction: number) => ({
            x: isMobile ? 0 : (direction === 0 ? 100 : -100),
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: isMobile ? 0 : (direction === 0 ? -100 : 100),
            opacity: 0
        })
    };

    return (
        <section
            className="relative bg-gradient-to-br from-[#005f73] via-[#0a9396] to-[#94d2bd] text-white overflow-hidden pb-20 md:pb-30 pt-20 md:pt-0"
            aria-labelledby="hero-title"
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center min-h-[70vh] md:min-h-[80vh] py-12 md:py-20 lg:py-0">
                    {/* Coluna da Esquerda: Texto e Botões Dinâmicos com Animação */}
                    <div className="text-center md:text-left flex flex-col justify-center h-full order-2 md:order-1">
                        <div className="relative min-h-[200px] sm:min-h-[250px] md:min-h-[280px] flex items-center">
                            <AnimatePresence mode="wait" custom={direction}>
                                <motion.div
                                    key={activeSlide}
                                    custom={direction}
                                    variants={textVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    transition={{
                                        x: { type: "spring", stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.2 }
                                    }}
                                    className="w-full"
                                >
                                    <h1
                                        id="hero-title"
                                        className={getHeroTitleClassName(currentProcess.title)}
                                    >
                                        {currentProcess.title}
                                    </h1>

                                    <p className="text-lg sm:text-xl md:text-2xl mb-6 md:mb-8 leading-relaxed opacity-95 max-w-2xl mx-auto md:mx-0">
                                        {getSubtitleText(currentProcess)}
                                    </p>

                                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center md:justify-start items-center">
                                        {!isUsingFallback ? (
                                            <>
                                                <motion.button
                                                    className={`${isLoadingAuth || !isProcessActive(currentProcess) ? 'bg-white/50 cursor-not-allowed' : 'bg-white hover:bg-[#e9d8a6]'} text-[#005f73] px-6 sm:px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto group text-sm md:text-base`}
                                                    aria-label={`${getButtonText(currentProcess, isLoadingAuth)} do ${currentProcess.title}`}
                                                    onClick={() => handleMainButtonClick(currentProcess)}
                                                    whileHover={isProcessActive(currentProcess) && !isLoadingAuth ? { scale: 1.05 } : {}}
                                                    whileTap={isProcessActive(currentProcess) && !isLoadingAuth ? { scale: 0.95 } : {}}
                                                    disabled={!isProcessActive(currentProcess) || isLoadingAuth}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        {getButtonText(currentProcess, isLoadingAuth)}
                                                        {!isLoadingAuth && isProcessActive(currentProcess) && (
                                                            <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                            </svg>
                                                        )}
                                                    </span>
                                                </motion.button>
                                                <motion.button
                                                    className="border-2 border-white/50 text-white px-6 sm:px-8 py-3 rounded-xl font-bold hover:bg-white/10 backdrop-blur-sm transition-all duration-300 w-full sm:w-auto group text-sm md:text-base"
                                                    aria-label="Ver todos os processos seletivos"
                                                    onClick={() => window.location.href = '/processos-seletivos'}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        Ver Todos
                                                        <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </span>
                                                </motion.button>
                                            </>
                                        ) : (
                                            // Botões para estado fallback
                                            <>
                                                <motion.button
                                                    className="bg-white text-[#005f73] px-6 sm:px-8 py-3 rounded-xl font-bold hover:bg-[#e9d8a6] transition-all duration-300 transform hover:scale-105 shadow-lg w-full sm:w-auto group text-sm md:text-base"
                                                    aria-label="Cadastrar interesse"
                                                    onClick={() => window.location.href = '/cadastro-interesse'}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        Cadastrar Interesse
                                                        <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                        </svg>
                                                    </span>
                                                </motion.button>
                                                <motion.button
                                                    className="border-2 border-white/50 text-white px-6 sm:px-8 py-3 rounded-xl font-bold hover:bg-white/10 backdrop-blur-sm transition-all duration-300 w-full sm:w-auto group text-sm md:text-base"
                                                    aria-label="Receber notificações"
                                                    onClick={() => window.location.href = '/notificacoes'}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <span className="flex items-center justify-center gap-2">
                                                        Receber Notificações
                                                        <svg className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.93 4.93l9.07 9.07-9.07 9.07L4.93 4.93z" />
                                                        </svg>
                                                    </span>
                                                </motion.button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Indicadores de Slide para Mobile */}
                        {!isUsingFallback && (
                            <div className="flex justify-center md:justify-start gap-2 mt-6 md:mt-8 md:hidden">
                                {displayProcesses.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleSlideChange(index)}
                                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${index === activeSlide ? 'bg-white scale-110' : 'bg-white/50'
                                            }`}
                                        aria-label={`Ir para slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Coluna da Direita: Carrossel de Imagens */}
                    <div className="relative flex items-center justify-center h-full order-1 md:order-2 mb-8 md:mb-0">
                        <div className="w-full max-w-lg lg:max-w-2xl xl:max-w-3xl">
                            <HeroCarousel
                                images={displayProcesses.map(mapProcessToCarouselImage)}
                                onSlideChange={handleSlideChange}
                                onImageClick={handleCarouselImageClick}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Divisor de Onda SVG */}
            <div className="absolute bottom-[-1px] left-0 right-0 w-full h-auto z-0">
                <svg
                    viewBox="0 0 1440 120"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    preserveAspectRatio="none"
                    className="w-full h-20 md:h-24 lg:h-28 xl:h-32"
                >
                    <path d="M1440 29.6254V120H0V29.6254C120 5.62539 240 -5.37461 360 2.62539C480 10.6254 600 46.6254 720 54.6254C840 62.6254 960 42.6254 1080 29.6254C1200 16.6254 1320 17.6254 1440 29.6254Z" fill="white" />
                </svg>
            </div>

            {/* Seta Animada com Círculo - Visível apenas em Desktop */}
            <div className={`hidden md:block absolute bottom-1 left-1/2 transform -translate-x-1/2 z-30 transition-all duration-500 ease-in-out ${isArrowVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <motion.button
                    onClick={scrollToNextSection}
                    className="flex flex-col items-center gap-2 group cursor-pointer"
                    aria-label="Role para a próxima seção"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <div className="relative w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-2 border-gray-500 group-hover:border-[#006074] group-hover:bg-white/20 transition-all duration-300"></div>
                        <svg
                            className="w-5 h-5 md:w-6 md:h-6 text-gray-500 group-hover:text-[#006074] transition-colors duration-300 relative z-10 animate-bounce"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 14l-7 7m0 0l-7-7m7 7V3"
                            />
                        </svg>
                    </div>
                </motion.button>
            </div>

        </section>
    );
}