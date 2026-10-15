'use client';

import { useCandidateAuth } from '@/api/hooks/useCandidateAuth';
import { useProcessGrid } from '@/api/hooks/useProcessGrid';
import { SelectionProcess } from '@/api/types/selection';
import { nomeConselho } from '@/config/ConselhoConfig';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
    endOfLocalCalendarDay,
    INSCRIPTION_OPEN_TIME_LABEL,
    parseLocalCalendarDate,
} from '@/utils/selectionProcessDates';

// ==========================
// 🧠 Helpers
// ==========================

type UIStatus = 'active' | 'upcoming' | 'finished';
type ApiStatus = SelectionProcess['status'];

type HookProcess = Omit<SelectionProcess, 'status'> & {
    // o hook pode estar retornando status da UI (ou da API) — vamos aceitar ambos
    status: ApiStatus | UIStatus | string;
};

function isApiStatus(v: unknown): v is ApiStatus {
    return v === 'created' || v === 'in_application' || v === 'in_analysis' || v === 'finished';
}

function deriveUIStatus(p: Omit<SelectionProcess, 'status'> & { status?: unknown; is_active: boolean; beginning_date: string; ending_date: string }): UIStatus {
    const now = new Date();
    const start = p.beginning_date ? parseLocalCalendarDate(p.beginning_date) : null;
    const end = p.ending_date ? endOfLocalCalendarDay(p.ending_date) : null;

    // se a API já marcou finished (quando tivermos apiStatus)
    if (p.status === 'finished') return 'finished';

    if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
        return p.is_active ? 'active' : 'upcoming';
    }

    if (now < start) return 'upcoming';
    if (now > end) return 'finished';

    return p.is_active ? 'active' : 'upcoming';
}

function formatDisplayDate(iso: string): string {
    const d = parseLocalCalendarDate(iso);
    if (isNaN(d.getTime())) return '--- -- ---';

    const parts = new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).formatToParts(d);

    const day = parts.find((p) => p.type === 'day')?.value ?? '--';
    const monthRaw = parts.find((p) => p.type === 'month')?.value ?? '---';
    const year = parts.find((p) => p.type === 'year')?.value ?? '----';

    const month = monthRaw.replace('.', '').toUpperCase();
    return `${day} ${month} ${year}`;
}

// ==========================
// 🕐 ProcessTimer
// ==========================

const ProcessTimer = ({ targetDate, status }: { targetDate: string; status?: string }) => {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        expired: false,
    });
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);

        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - new Date().getTime();

            if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
                expired: false,
            };
        };

        setTimeLeft(calculateTimeLeft());
        const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

    const TimerLayout = ({ days, hours, minutes, seconds }: { days: string; hours: string; minutes: string; seconds: string }) => (
        <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
                {[
                    { v: days, l: 'dias' },
                    { v: hours, l: 'horas' },
                    { v: minutes, l: 'min' },
                    { v: seconds, l: 'seg' },
                ].map((x, idx) => (
                    <div key={x.l} className="flex items-center gap-3">
                        {idx > 0 && <span className="text-xl font-bold text-gray-900">|</span>}
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-gray-900">{x.v}</span>
                            <span className="text-xs text-gray-600">{x.l}</span>
                        </div>
                    </div>
                ))}
            </div>
            {status && <span className="text-sm font-semibold text-gray-700">{status}</span>}
        </div>
    );

    if (!isClient) return <TimerLayout days="00" hours="00" minutes="00" seconds="00" />;

    if (timeLeft.expired) {
        return <div className="text-center">{status && <span className="text-sm font-semibold text-gray-700">{status}</span>}</div>;
    }

    return (
        <TimerLayout
            days={String(timeLeft.days)}
            hours={timeLeft.hours.toString().padStart(2, '0')}
            minutes={timeLeft.minutes.toString().padStart(2, '0')}
            seconds={timeLeft.seconds.toString().padStart(2, '0')}
        />
    );
};

// ==========================
// 🏷️ StatusBadge
// ==========================

const StatusBadge = ({ status }: { status: UIStatus }) => {
    const statusConfig: Record<UIStatus, { label: string; color: string }> = {
        active: { label: 'INSCRIÇÕES ABERTAS', color: 'bg-green-500 text-white' },
        upcoming: { label: 'EM BREVE', color: 'bg-blue-500 text-white' },
        finished: { label: 'FINALIZADO', color: 'bg-gray-500 text-white' },
    };

    const config = statusConfig[status];

    return (
        <motion.span
            className={`${config.color} px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
        >
            {config.label}
        </motion.span>
    );
};

// ==========================
// 🧭 Bout helpers
// ==========================

type Bout = 'M' | 'T' | 'E' | string;

const getBoutLabel = (bout?: Bout | null) => {
    if (!bout) return 'Não informado';
    if (bout === 'M') return 'Matutino';
    if (bout === 'T') return 'Vespertino';
    if (bout === 'E') return 'Escala';
    return String(bout);
};

// ==========================
// 🃏 ProcessCard
// ==========================

type ProcessCardViewModel = Omit<SelectionProcess, 'status'> & {
    apiStatus: ApiStatus;
    uiStatus: UIStatus;
    displayDate: string;
    displayTime: string;
    bout?: Bout | null;
};

const ProcessCard = ({ process }: { process: ProcessCardViewModel }) => {
    const { isAuthenticated, isLoading } = useCandidateAuth();

    const boutLabel = useMemo(() => getBoutLabel(process.bout), [process.bout]);

    const handleCardNavigate = () => {
        if (process.uiStatus === 'active') {
            if (isLoading) return;
            window.location.href = isAuthenticated
                ? `/aplicar/${process.slug}`
                : '/auth/login-candidato';
            return;
        }
        window.location.href = '/processos-seletivos';
    };

    const handleCandidatarClick = () => {
        if (process.uiStatus !== 'active') return;
        if (isLoading) return;

        window.location.href = isAuthenticated ? `/aplicar/${process.slug}` : '/auth/login-candidato';
    };

    const getStatusText = () => {
        switch (process.uiStatus) {
            case 'active':
                return 'Inscrições abertas';
            case 'upcoming':
                return 'Em breve';
            case 'finished':
                return 'Processo finalizado';
        }
    };

    const getTargetDate = () => {
        switch (process.uiStatus) {
            case 'active':
                return endOfLocalCalendarDay(process.ending_date).toISOString();
            case 'upcoming':
                return parseLocalCalendarDate(process.beginning_date).toISOString();
            case 'finished':
                return endOfLocalCalendarDay(process.ending_date).toISOString();
        }
    };

    const truncateDescription = (text: string | null, maxLength: number = 120) => {
        if (!text) return `Vagas disponíveis para ${process.course}`;
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <motion.div
            className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            transition={{ duration: 0.3 }}
        >
            <div
                className="relative h-48 overflow-hidden cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0a9396]/50"
                role="button"
                tabIndex={0}
                aria-label={`Abrir ${process.title}`}
                onClick={handleCardNavigate}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCardNavigate();
                    }
                }}
            >
                <Image
                    src={process.process_banner || '/images/hero-carousel/fallback.png'}
                    alt={process.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute top-4 right-4">
                    <StatusBadge status={process.uiStatus} />
                </div>

                <motion.div
                    className="absolute bottom-4 left-4"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                    <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-center min-w-[80px]">
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                            {process.displayDate.split(' ')[0]}
                        </div>
                        <div className="text-lg font-black text-gray-900">{process.displayDate.split(' ')[1]}</div>
                        <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                            {process.displayDate.split(' ')[2]}
                        </div>
                        <div className="text-sm font-bold text-[#005f73] mt-1">{process.displayTime}</div>
                    </div>
                </motion.div>
            </div>

            <div className="p-6">
                <motion.div className="mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                    <h3 className="text-xl font-black text-gray-900 mb-1 line-clamp-2">{process.title}</h3>
                    <p className="text-sm text-gray-600 font-medium line-clamp-2">
                        {process.subtitle || `Processo Seletivo para ${process.course}`}
                    </p>
                </motion.div>

                <motion.div className="flex items-center gap-2 mb-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm text-gray-600 line-clamp-1">{process.local || nomeConselho}</span>
                </motion.div>

                <motion.div className="flex items-center gap-2 mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.35 }}>
                    <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">Turno: {boutLabel}</span>
                </motion.div>

                <motion.p
                    className="text-gray-600 mb-4 leading-relaxed text-sm line-clamp-3 min-h-[4.5rem]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    title={process.description || `Vagas disponíveis para ${process.course}`}
                >
                    {truncateDescription(process.description)}
                </motion.p>

                <motion.div className="flex items-center gap-2 mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.5 }}>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                        {process.number_vacancies} vaga(s) disponível(s)
                    </span>
                </motion.div>

                <motion.div className="bg-gray-50 rounded-xl p-4 mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6 }}>
                    <ProcessTimer targetDate={getTargetDate()} status={getStatusText()} />
                </motion.div>

                <motion.div className="flex flex-col gap-3" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }}>
                    <motion.button
                        className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-300 ${process.uiStatus === 'active'
                            ? 'bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white hover:from-[#0a9396] hover:to-[#005f73] transform hover:scale-105'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                        disabled={process.uiStatus !== 'active'}
                        whileHover={process.uiStatus === 'active' ? { scale: 1.02 } : {}}
                        whileTap={process.uiStatus === 'active' ? { scale: 0.98 } : {}}
                        onClick={handleCandidatarClick}
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Verificando...
                            </span>
                        ) : process.uiStatus === 'active' ? (
                            'Candidatar-se'
                        ) : process.uiStatus === 'upcoming' ? (
                            'Em Breve'
                        ) : (
                            'Processo Finalizado'
                        )}
                    </motion.button>

                    <motion.button
                        className="border-2 border-[#005f73] text-[#005f73] px-4 py-2 rounded-xl font-bold hover:bg-[#005f73] hover:text-white transition-all duration-300 group text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => (window.location.href = '/processos-seletivos')}
                    >
                        <span className="flex items-center justify-center gap-2">
                            Saiba Mais
                            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </span>
                    </motion.button>
                </motion.div>
            </div>
        </motion.div>
    );
};

// ==========================
// 💀 Skeleton
// ==========================

const ProcessCardSkeleton = () => (
    <div className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
        <div className="relative h-48 bg-gray-300" />
        <div className="p-6">
            <div className="mb-4">
                <div className="h-6 bg-gray-300 rounded mb-2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
            <div className="flex items-center gap-2 mb-3">
                <div className="w-4 h-4 bg-gray-300 rounded" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="mb-4">
                <div className="h-6 bg-gray-200 rounded w-1/3" />
            </div>
            <div className="mb-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
            <div className="mb-4">
                <div className="h-6 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
                <div className="space-y-2">
                    <div className="flex justify-center gap-3">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex flex-col items-center">
                                <div className="h-6 bg-gray-300 rounded w-8" />
                                <div className="h-3 bg-gray-200 rounded w-6 mt-1" />
                            </div>
                        ))}
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto" />
                </div>
            </div>
            <div className="flex flex-col gap-3">
                <div className="h-12 bg-gray-300 rounded-xl" />
                <div className="h-10 bg-gray-200 rounded-xl" />
            </div>
        </div>
    </div>
);

// ==========================
// 🏠 ProcessGrid
// ==========================

export default function ProcessGrid() {
    const { processes, isLoading, error } = useProcessGrid();

    const safeProcesses = Array.isArray(processes) ? (processes as HookProcess[]) : [];

    const displayedProcesses = safeProcesses.slice(0, 3);
    const skeletonCount = Math.max(0, 3 - displayedProcesses.length);

    if (isLoading) {
        return (
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <div className="h-8 bg-gray-300 rounded w-64 mx-auto mb-4 animate-pulse" />
                        <div className="h-12 bg-gray-300 rounded w-96 mx-auto mb-4 animate-pulse" />
                        <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto animate-pulse" />
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((item) => (
                            <ProcessCardSkeleton key={item} />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (error) {
        console.error('❌ ProcessGrid - Erro:', error);
        return (
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-black text-gray-900 mb-4">Erro ao carregar processos</h2>
                    <p className="text-gray-600 mb-8">Tente recarregar a página</p>
                    <button onClick={() => window.location.reload()} className="bg-[#005f73] text-white px-6 py-3 rounded-xl font-bold">
                        Recarregar
                    </button>
                </div>
            </section>
        );
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    // ✅ ViewModels SEM conflito: apiStatus sempre vira ApiStatus (nunca UIStatus)
    const viewModels: ProcessCardViewModel[] = displayedProcesses.map((p) => {
        const uiStatus = deriveUIStatus(p);

        const baseDate = uiStatus === 'upcoming' ? p.beginning_date : p.beginning_date;

        // se o hook mandou status UI, a gente NÃO usa como apiStatus
        const apiStatus: ApiStatus = isApiStatus(p.status) ? p.status : 'created';

        const { status: _ignored, ...rest } = p;

        return {
            ...rest,
            apiStatus,
            uiStatus,
            displayDate: formatDisplayDate(baseDate),
            displayTime: INSCRIPTION_OPEN_TIME_LABEL,
            bout: p.bout,
        };
    });

    return (
        <motion.section
            id="processos"
            className="py-20 bg-white relative overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
        >
            <div className="container mx-auto px-4 relative z-10">
                <motion.div className="text-center mb-16" variants={itemVariants}>
                    <span className="text-[#0a9396] font-bold text-sm uppercase tracking-wider mb-2 block">Processos Seletivos</span>
                    <h2 className="text-5xl font-black text-gray-900 mb-4">
                        Oportunidades de <span className="text-[#005f73]">Estágio</span>
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        Confira os processos seletivos em andamento para estagiário no {nomeConselho}
                    </p>
                </motion.div>

                <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8" variants={containerVariants}>
                    {viewModels.map((process) => (
                        <motion.div key={process.id} variants={itemVariants}>
                            <ProcessCard process={process} />
                        </motion.div>
                    ))}

                    {skeletonCount > 0 &&
                        Array.from({ length: skeletonCount }).map((_, index) => (
                            <motion.div key={`skeleton-${index}`} variants={itemVariants}>
                                <ProcessCardSkeleton />
                            </motion.div>
                        ))}
                </motion.div>

                {(safeProcesses.length ?? 0) > 3 && (
                    <motion.div className="text-center mt-16" variants={itemVariants}>
                        <Link
                            href="/processos-seletivos"
                            className="bg-transparent border-2 border-[#005f73] text-[#005f73] px-10 py-4 rounded-2xl font-bold hover:bg-[#005f73] hover:text-white transition-all duration-300 group inline-block"
                        >
                            <motion.span className="flex items-center justify-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                Ver Todos os Processos
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </motion.span>
                        </Link>
                    </motion.div>
                )}
            </div>
        </motion.section>
    );
}
