'use client';

import Footer from "@/components/Footer";
import { Stepper } from "@/components/candidate-dashboard/ApplicationsPanel";
import CountUp from "@/components/motion/CountUp";
import ApplicationWindow from "@/components/processos/ApplicationWindow";
import { Title } from "@/components/ui/Title";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    Edit,
    Eye,
    File,
    FileText,
    GraduationCap,
    Loader2,
    MapPin,
    RefreshCw,
    Search,
    UserCheck,
    Users,
    XCircle
} from "lucide-react";
import Link from "next/link";
import { isPastInscriptionEnd, parseLocalCalendarDate } from '@/utils/selectionProcessDates';
import { isSafeHttpUrl } from '@/utils/safeNavigation';
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SelectionProcess {
    id: number;
    slug: string;
    title: string;
    subtitle: string;
    course: string;
    ending_date: string;
    is_active: boolean;
    number_vacancies: number;
    salary: string;
    weekly_workload: string;
    local: string;
    process_banner?: string;
    beginning_date: string;
    description?: string;
    requirements?: string;
    benefits?: string;
}

interface Application {
    id: number;
    candidate: number;
    selection_process: number;
    selection_process_details: SelectionProcess | null;
    status: 'pending' | 'approved' | 'rejected' | 'under_review';
    application_date: string;
    identity_document?: string;
    school_records?: string;
    vitae_curriculum?: string;
    frequency_statement?: string;
    course_certificates?: string;
    portfolio_link?: string;
}

// Tipos para status counts
type StatusCounts = {
    pending: number;
    approved: number;
    rejected: number;
    under_review: number;
};

// Tipos para paginação
interface PaginationData {
    count: number;
    next: string | null;
    previous: string | null;
    results: Application[];
}

// Variantes de animação
const pageVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { duration: 0.5 }
    }
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: "easeOut" as const }
    }
} as const;

const modalVariants = {
    hidden: {
        opacity: 0,
        scale: 0.9
    },
    visible: {
        opacity: 1,
        scale: 1,
        transition: {
            type: "spring" as const,
            damping: 25,
            stiffness: 300
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.2 }
    }
} as const;

// Jornada do Candidato - barra de etapas do processo
const CandidateJourney = ({ status }: { status: Application["status"] }) => {
    const stages = [
        {
            id: 1,
            title: "Cadastro",
            description: "Inscrição no processo seletivo",
        },
        {
            id: 2,
            title: "Etapa 1",
            description: "Análise de documentos pessoais, acadêmicos e portfólio",
        },
        {
            id: 3,
            title: "Etapa 2",
            description: "Entrevista e testes técnicos para selecionados",
        },
        {
            id: 4,
            title: "Resultado",
            description: "Aprovação dos melhores candidatos",
        },
    ] as const;

    const getCurrentStage = () => {
        switch (status) {
            case "pending":
                return 1;
            case "under_review":
                return 2;
            case "approved":
            case "rejected":
                return 4;
            default:
                return 1;
        }
    };

    const currentStage = getCurrentStage();
    const isRejected = status === "rejected";

    return (
        <div className="w-full bg-background rounded-xl border border-border px-4 py-3 mb-4">
            <div className="flex items-center justify-between mb-3 gap-2">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                        Jornada do Candidato
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Conheça as etapas do nosso processo seletivo
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3 text-primary-hover" />
                    <span>
                        {status === "pending" && "Aguardando análise dos documentos"}
                        {status === "under_review" && "Em análise pela equipe de seleção"}
                        {status === "approved" && "Processo concluído com aprovação"}
                        {status === "rejected" && "Processo concluído - candidato não selecionado"}
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
                {stages.map((stage, index) => {
                    const isCompleted = stage.id < currentStage;
                    const isCurrent = stage.id === currentStage;

                    const circleBase =
                        "flex items-center justify-center rounded-full w-7 h-7 text-xs font-bold border-2";

                    let circleClasses = "border-input bg-card text-muted-foreground/70";
                    if (isCompleted) {
                        circleClasses = "border-success bg-success text-white";
                    } else if (isCurrent) {
                        if (isRejected && stage.id === 4) {
                            circleClasses = "border-destructive bg-destructive text-white";
                        } else {
                            circleClasses = "border-primary-hover bg-primary-hover text-primary-foreground";
                        }
                    }

                    const labelColor = isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground/70";
                    const descriptionColor =
                        isCompleted || isCurrent ? "text-muted-foreground" : "text-muted-foreground/70";

                    return (
                        <div key={stage.id} className="flex-1 flex items-center gap-2 sm:gap-3">
                            <div className="flex flex-col items-center gap-1 flex-1">
                                <div className={circleBase + " " + circleClasses}>
                                    {isCompleted && stage.id !== 4 ? (
                                        <CheckCircle className="w-3.5 h-3.5" />
                                    ) : (
                                        stage.id
                                    )}
                                </div>
                                <div className="text-center">
                                    <p className={`text-[11px] font-semibold ${labelColor}`}>
                                        {stage.title}
                                    </p>
                                    <p className={`hidden sm:block text-[10px] ${descriptionColor}`}>
                                        {stage.description}
                                    </p>
                                </div>
                            </div>

                            {index < stages.length - 1 && (
                                <div className="hidden sm:block flex-1 h-px bg-border" />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const ResultBanner = ({ status }: { status: Application["status"] }) => {
    if (status !== "approved" && status !== "rejected") return null;

    const isApproved = status === "approved";

    return (
        <div
            className={`w-full px-5 py-3 flex items-center justify-between gap-3
        ${isApproved ? "bg-success-soft border-success/30" : "bg-destructive-soft border-destructive/30"}
        border-b`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center
            ${isApproved ? "bg-success" : "bg-destructive"} text-white`}
                >
                    {isApproved ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>

                <div>
                    <p
                        className={`text-sm font-extrabold tracking-wide uppercase
              ${isApproved ? "text-success" : "text-destructive"}`}
                    >
                        {isApproved ? "APROVADO" : "REPROVADO"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {isApproved
                            ? "Parabéns! Você foi selecionado para a próxima etapa/resultado final."
                            : "Obrigado por participar. Você não foi selecionado desta vez."}
                    </p>
                </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>Confira os detalhes no botão “Ver Detalhes”.</span>
            </div>
        </div>
    );
};


// Componente de Card de Processo
const getAbsoluteUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:3000';
    try {
        const urlObj = new URL(url);
        return `${baseUrl}${urlObj.pathname}${urlObj.search}`;
    } catch {
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return url;
    }
};

const ProcessCard = ({
    application,
    onEditClick,
    onViewDetails,
}: {
    application: Application;
    onEditClick: (app: Application) => void;
    onViewDetails: (app: Application) => void;
}) => {
    // Se não houver detalhes do processo, mostrar card de erro
    if (!application.selection_process_details) {
        return (
            <motion.div
                variants={cardVariants}
                className="bg-card rounded-xl shadow-sm border border-border overflow-hidden p-6"
            >

                <ResultBanner status={application.status} />
                <div className="flex items-center gap-3 text-warning">
                    <AlertCircle className="w-5 h-5" />
                    <div>
                        <h3 className="font-semibold">Processo não encontrado</h3>
                        <p className="text-sm text-muted-foreground">ID da aplicação: {application.id}</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Status: {application.status}</p>
                    </div>
                </div>
            </motion.div>
        );
    }

    const process = application.selection_process_details;
    const [expanded, setExpanded] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Verificar data de término com segurança
    let isEditable = false;
    try {
        isEditable =
            !isPastInscriptionEnd(process.ending_date) &&
            (application.status === 'pending' || application.status === 'under_review');
    } catch (error) {
        console.error('Erro ao verificar data:', error);
        isEditable = false;
    }

    // Formatar data com segurança
    const formatDate = (dateString: string) => {
        try {
            return parseLocalCalendarDate(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }).replace('.', '').toUpperCase();
        } catch (error) {
            return 'Data não disponível';
        }
    };

    // Formatar salário com segurança
    const formatSalary = (salary: string) => {
        try {
            return `R$ ${parseFloat(salary || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } catch (error) {
            return 'R$ 0,00';
        }
    };



    const statusMeta: Record<string, { label: string; cls: string }> = {
        pending: { label: 'Pendente', cls: 'bg-warning-soft text-warning' },
        waiting: { label: 'Em espera', cls: 'bg-info-soft text-info' },
        under_review: { label: 'Em análise', cls: 'bg-info-soft text-info' },
        approved: { label: 'Aprovado', cls: 'bg-success-soft text-success' },
        rejected: { label: 'Reprovado', cls: 'bg-destructive-soft text-destructive' },
    };
    const st = statusMeta[application.status] ?? { label: String(application.status), cls: 'bg-secondary text-muted-foreground' };

    return (
        <motion.div
            variants={cardVariants}
            layout="position"
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
            className="group/card overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md"
        >
            <div className="grid gap-6 p-3 lg:grid-cols-5">
                {/* Coluna da imagem: banner 16:9 + dados logo abaixo */}
                <div className="flex flex-col lg:col-span-2">
                    <div className="relative aspect-video overflow-hidden rounded-2xl bg-secondary">
                        {process.process_banner && !imgError ? (
                            <>
                                <img
                                    src={getAbsoluteUrl(process.process_banner) || ''}
                                    alt={`Banner do processo: ${process.title}`}
                                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                                    onError={() => setImgError(true)}
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <GraduationCap className="h-16 w-16 text-muted-foreground/40" strokeWidth={1.25} />
                            </div>
                        )}
                        <span className={`absolute left-3 top-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>
                            {st.label}
                        </span>
                        {isEditable && (
                            <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-3 py-1 text-xs font-medium text-success">
                                <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
                                Inscrições abertas
                            </span>
                        )}
                    </div>

                    <dl className="mt-3 grid grid-cols-3 gap-2">
                        {[
                            { icon: Users, k: 'Vagas', v: String(process.number_vacancies || 0) },
                            { icon: File, k: 'Carga', v: process.weekly_workload || '—' },
                            { icon: Calendar, k: 'Candidatura', v: formatDate(application.application_date).replace(/ DE /g, ' ').slice(0, 6) },
                        ].map(({ icon: Icon, k, v }) => (
                            <div key={k} className="min-w-0 rounded-2xl bg-secondary p-3">
                                <dt className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                                    <Icon size={13} strokeWidth={1.5} className="shrink-0 text-primary" />
                                    <span className="truncate">{k}</span>
                                </dt>
                                <dd className="tabular mt-1 truncate font-medium" title={v}>{v}</dd>
                            </div>
                        ))}
                    </dl>

                    <div className="mt-3 rounded-2xl bg-secondary px-4 pb-3 pt-1">
                        <Stepper status={application.status} />
                    </div>
                </div>

                {/* Conteúdo */}
                <div className="flex flex-col p-2 lg:col-span-3 lg:p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">
                        {process.course || 'Curso não especificado'}
                    </p>
                    <h3 className="mt-2 text-2xl font-medium leading-tight text-foreground">
                        {process.title || 'Processo sem título'}
                    </h3>
                    <p className="mt-1 text-muted-foreground">{process.subtitle || 'Sem descrição'}</p>

                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                            <span className="truncate">{process.local || 'Local não especificado'}</span>
                        </span>
                        <span className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                            <span className="tabular">Bolsa {formatSalary(process.salary)}</span>
                        </span>
                    </div>

                    <div className="mt-5">
                        <ApplicationWindow start={process.beginning_date} end={process.ending_date} />
                    </div>

                    {process.description && (
                        <p className="mt-5 line-clamp-3 leading-relaxed text-muted-foreground">{process.description}</p>
                    )}

                    {!isEditable && (
                        <div className="mt-auto pt-5">
                            <div className="flex items-start gap-3 rounded-2xl bg-secondary p-4">
                                <span className={`mt-0.5 inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>
                                    {st.label}
                                </span>
                                <p className="text-sm text-muted-foreground">
                                    {application.status === 'approved'
                                        ? 'Parabéns! Sua candidatura foi aprovada nesta seleção.'
                                        : application.status === 'rejected'
                                          ? 'Sua candidatura não avançou nesta seleção.'
                                          : 'Sua inscrição foi recebida e está com a comissão para análise.'}
                                </p>
                            </div>
                        </div>
                    )}

                    {isEditable && (
                        <div className="mt-auto pt-5">
                            <button
                                onClick={() => onEditClick(application)}
                                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
                            >
                                <Edit className="h-4 w-4" />
                                Editar inscrição
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Detalhes Expandidos */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className="bg-background border-t border-border overflow-hidden"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="p-6">
                            <CandidateJourney status={application.status} />

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold text-foreground mb-3 text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-primary" />
                                        Documentos Enviados
                                    </h4>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Documento de Identidade', field: application.identity_document },
                                            { label: 'Histórico Escolar', field: application.school_records },
                                            { label: 'Currículo', field: application.vitae_curriculum },
                                            { label: 'Declaração de Frequência', field: application.frequency_statement },
                                            { label: 'Certificados de Cursos', field: application.course_certificates },
                                        ].map((doc, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${doc.field ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground/70'
                                                        }`}>
                                                        {doc.field ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{doc.label}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {doc.field ? 'Enviado' : 'Não enviado'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {doc.field && (
                                                    <a
                                                        href={doc.field}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1.5 bg-primary-hover text-primary-foreground rounded-lg hover:bg-primary text-sm flex items-center gap-2"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        Baixar
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-bold text-foreground mb-3 text-lg flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-primary" />
                                        Informações Adicionais
                                    </h4>
                                    <div className="space-y-3">
                                        {application.portfolio_link && (
                                            <div className="bg-card rounded-lg border p-4">
                                                <p className="text-sm font-medium text-foreground/80 mb-1">Portfólio</p>
                                                {isSafeHttpUrl(application.portfolio_link) ? (
                                                    <a
                                                        href={application.portfolio_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary-hover hover:underline text-sm break-all"
                                                    >
                                                        {application.portfolio_link}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground break-all">
                                                        {application.portfolio_link}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Botão para expandir/recolher */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="flex w-full items-center justify-center gap-2 border-t py-3 font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
                {expanded ? 'Menos detalhes' : 'Mais detalhes'}
                <motion.div
                    animate={{ rotate: expanded ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown size={20} />
                </motion.div>
            </button>
        </motion.div>
    );
};

// Filtros
const FilterBar = ({
    filters,
    setFilters,
    statusCounts,
    onRefresh,
    loading,
    pagination
}: {
    filters: any;
    setFilters: (filters: any) => void;
    statusCounts: StatusCounts;
    onRefresh: () => void;
    loading: boolean;
    pagination: {
        currentPage: number;
        totalPages: number;
        totalApplications: number;
        pageSize: number;
    };
}) => {
    const totalApplications = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return (
        <motion.div
            className="bg-card rounded-xl shadow-sm border border-border p-6 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar por título, curso ou local..."
                            value={filters.search}
                            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                            className="w-full px-4 py-2.5 pl-10 pr-4 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-hover focus:border-[#ccff00]/50"
                        />
                        <Search className="w-4 h-4 text-muted-foreground/70 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilters({ ...filters, status: 'all', page: 1 })}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${filters.status === 'all'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground/80 hover:bg-border'
                                }`}
                        >
                            Todos ({totalApplications})
                        </button>

                        {Object.entries(statusCounts).map(([status, count]) => {
                            if (count > 0) {
                                return (
                                    <button
                                        key={status}
                                        onClick={() => setFilters({ ...filters, status, page: 1 })}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${filters.status === status
                                            ? status === 'pending' ? 'bg-warning text-white' :
                                                status === 'approved' ? 'bg-success text-white' :
                                                    status === 'rejected' ? 'bg-destructive text-white' :
                                                        'bg-primary text-primary-foreground'
                                            : status === 'pending' ? 'bg-warning-soft text-warning hover:bg-warning-soft' :
                                                status === 'approved' ? 'bg-success-soft text-success hover:bg-success-soft' :
                                                    status === 'rejected' ? 'bg-destructive-soft text-destructive hover:bg-destructive-soft' :
                                                        'bg-primary-soft text-primary hover:bg-primary-soft'
                                            }`}
                                    >
                                        {status === 'pending' ? 'Pendentes' :
                                            status === 'approved' ? 'Aprovados' :
                                                status === 'rejected' ? 'Rejeitados' :
                                                    'Em análise'} ({count})
                                    </button>
                                );
                            }
                            return null;
                        })}
                    </div>

                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="px-4 py-2.5 bg-muted text-foreground/80 rounded-lg hover:bg-border font-medium transition-colors flex items-center gap-2 flex-shrink-0"
                        title="Atualizar lista"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4" />
                        )}
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Informações de paginação */}
            {pagination.totalApplications > 0 && (
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                    <div>
                        Mostrando <span className="font-semibold">{((pagination.currentPage - 1) * pagination.pageSize) + 1}</span> a{' '}
                        <span className="font-semibold">{Math.min(pagination.currentPage * pagination.pageSize, pagination.totalApplications)}</span> de{' '}
                        <span className="font-semibold">{pagination.totalApplications}</span> candidaturas
                    </div>
                    <div>
                        Página <span className="font-semibold">{pagination.currentPage}</span> de{' '}
                        <span className="font-semibold">{pagination.totalPages}</span>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// Componente de Paginação
const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    loading
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    loading: boolean;
}) => {
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage + 1 < maxVisiblePages) {
        if (startPage === 1) {
            endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        } else {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    if (totalPages <= 1) return null;

    return (
        <motion.div
            className="flex items-center justify-center gap-2 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="px-3 py-2 rounded-lg border border-input text-foreground/80 hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
                <ChevronLeft className="w-4 h-4" />
                Anterior
            </button>

            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className={`px-3 py-2 rounded-lg ${1 === currentPage
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-input text-foreground/80 hover:bg-background'
                            }`}
                    >
                        1
                    </button>
                    {startPage > 2 && (
                        <span className="px-2 text-muted-foreground/70">...</span>
                    )}
                </>
            )}

            {pageNumbers.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    disabled={loading}
                    className={`px-3 py-2 rounded-lg ${page === currentPage
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-input text-foreground/80 hover:bg-background'
                        }`}
                >
                    {page}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && (
                        <span className="px-2 text-muted-foreground/70">...</span>
                    )}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className={`px-3 py-2 rounded-lg ${totalPages === currentPage
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-input text-foreground/80 hover:bg-background'
                            }`}
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-2 rounded-lg border border-input text-foreground/80 hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
                Próxima
                <ChevronRight className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

export default function MeusProcessos() {
    const router = useRouter();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Estados para paginação
    const [pagination, setPagination] = useState({
        currentPage: 1,
        totalPages: 1,
        totalApplications: 0,
        pageSize: 10,
        count: 0,
        next: null as string | null,
        previous: null as string | null,
    });

    const [filters, setFilters] = useState({
        search: '',
        status: 'all',
        page: 1,
    });

    // Função para buscar candidaturas com paginação
    const fetchApplications = async (page = 1, showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            } else {
                setRefreshing(true);
            }
            setError(null);

            const token = document.cookie
                .split('; ')
                .find(row => row.startsWith('access-token='))
                ?.split('=')[1];

            if (!token) {
                router.push('/auth/login-candidato');
                return;
            }

            // Construir query string com parâmetros
            const params = new URLSearchParams();
            params.append('page', page.toString());
            params.append('page_size', pagination.pageSize.toString());

            if (filters.search) {
                params.append('search', filters.search);
            }
            if (filters.status !== 'all') {
                params.append('status', filters.status);
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/?${params.toString()}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Erro na resposta da API:', response.status, errorText);
                throw new Error(`Erro ao carregar candidaturas (${response.status})`);
            }

            const data = await response.json() as PaginationData;

            // Mapear os dados da API para o formato esperado pelo frontend
            const mappedApps = data.results.map((app: any) => {
                const processDetails = app.selection_process || null;

                return {
                    id: app.id,
                    candidate: app.candidate?.id || app.candidate,
                    selection_process: app.selection_process?.id || app.selection_process,
                    selection_process_details: processDetails,
                    status: app.status || 'pending',
                    application_date: app.application_date,
                    identity_document: app.identity_document,
                    school_records: app.school_records,
                    vitae_curriculum: app.vitae_curriculum,
                    frequency_statement: app.frequency_statement,
                    course_certificates: app.course_certificates,
                    portfolio_link: app.portfolio_link
                };
            });

            // Filtrar apenas aplicações válidas com detalhes do processo
            const validApps = mappedApps.filter((app: Application) => {
                const isValid = app &&
                    app.id &&
                    app.selection_process_details &&
                    typeof app.selection_process_details === 'object';

                if (!isValid) {
                    console.warn('Aplicação inválida:', app);
                }

                return isValid;
            });

            // Ordenar por data (mais recente primeiro)
            const sortedApps = validApps.sort((a: Application, b: Application) => {
                try {
                    const dateA = new Date(a.application_date || 0).getTime();
                    const dateB = new Date(b.application_date || 0).getTime();
                    return dateB - dateA;
                } catch (error) {
                    return 0;
                }
            });

            setApplications(sortedApps);

            // Atualizar informações de paginação
            const totalPages = Math.ceil(data.count / pagination.pageSize);
            setPagination(prev => ({
                ...prev,
                currentPage: page,
                totalPages: totalPages,
                totalApplications: data.count,
                count: data.count,
                next: data.next,
                previous: data.previous,
            }));

        } catch (error: any) {
            console.error('Erro completo ao buscar candidaturas:', error);
            setError(error.message || 'Erro ao carregar suas candidaturas. Tente novamente.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Atualizar busca quando os filtros mudarem
    useEffect(() => {
        fetchApplications(filters.page);
    }, [filters.page, filters.status]);

    // Filtrar aplicações localmente também (para busca em tempo real)
    const filteredApplications = applications.filter(app => {
        const process = app.selection_process_details;

        if (!process) return false;

        const searchLower = filters.search.toLowerCase();

        const matchesSearch =
            (process.title?.toLowerCase() || '').includes(searchLower) ||
            (process.course?.toLowerCase() || '').includes(searchLower) ||
            (process.local?.toLowerCase() || '').includes(searchLower);

        const matchesStatus = filters.status === 'all' || app.status === filters.status;

        return matchesSearch && matchesStatus;
    });

    // Contar status
    const statusCounts: StatusCounts = applications.reduce((acc: StatusCounts, app) => {
        const status = app.status || 'pending';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, { pending: 0, approved: 0, rejected: 0, under_review: 0 });

    const handleEditClick = (application: Application) => {
        if (!application.selection_process_details) {
            setError('Processo não encontrado para edição');
            return;
        }

        try {
            if (isPastInscriptionEnd(application.selection_process_details.ending_date)) {
                setError('Este processo já está encerrado. Não é possível editar a inscrição.');
                return;
            }

            if (application.status !== 'pending' && application.status !== 'under_review') {
                setError('Esta inscrição não pode mais ser editada.');
                return;
            }

            router.push(`/candidato/editar-inscricao/${application.id}`);
        } catch (error) {
            console.error('Erro ao verificar processo:', error);
            setError('Erro ao tentar editar a inscrição');
        }
    };

    const handleViewDetails = (application: Application) => {
        setSelectedApplication(application);
        setShowDetailsModal(true);
    };

    // Contar candidaturas editáveis
    const editableCount = applications.filter(app => {
        const process = app.selection_process_details;
        if (!process || !process.ending_date) return false;

        try {
            return (
                !isPastInscriptionEnd(process.ending_date) &&
                (app.status === 'pending' || app.status === 'under_review')
            );
        } catch (error) {
            return false;
        }
    }).length;

    // Função para mudar de página
    const handlePageChange = (page: number) => {
        setFilters(prev => ({ ...prev, page }));
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-muted">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <motion.div
                            className="rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <h3 className="text-lg font-semibold text-foreground/80 mb-2">Carregando suas candidaturas...</h3>
                        <p className="text-muted-foreground">Isso pode levar alguns instantes</p>
                    </div>
                </div>
                <Footer compact />
            </div>
        );
    }

    if (error && applications.length === 0) {
        return (
            <div className="min-h-screen bg-muted">
                <div className="container mx-auto px-4 py-8">
                    <Title
                        title="Minhas Candidaturas"
                        icon={FileText}
                        titleButton="Ver Processos Abertos"
                        buttonUrl="/processos-seletivos"
                    />

                    <motion.div
                        className="bg-destructive-soft border border-destructive/30 rounded-xl p-8 mb-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="mx-auto w-20 h-20 bg-destructive-soft rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-10 h-10 text-destructive" />
                        </div>
                        <h3 className="text-xl font-semibold text-destructive mb-3">Erro ao carregar candidaturas</h3>
                        <p className="text-destructive mb-6">{error}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => fetchApplications(filters.page)}
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary font-medium transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4" />
                                    Tentar Novamente
                                </div>
                            </button>
                            <Link
                                href="/processos-seletivos"
                                className="px-6 py-3 border border-input text-foreground/80 rounded-lg hover:bg-background font-medium transition-colors"
                            >
                                Ver Processos Abertos
                            </Link>
                        </div>
                    </motion.div>
                </div>
                <Footer compact />
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-muted"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
        >

            <div className="container mx-auto px-4 py-8">
                {/* Usando o componente Title */}
                <Title
                    title="Minhas Candidaturas"
                    icon={FileText}
                    titleButton="Ver Processos Abertos"
                    buttonUrl="/processos-seletivos"
                />

                {/* Mensagem de erro (se houver) */}
                {error && applications.length > 0 && (
                    <motion.div
                        className="mb-6 bg-warning-soft border border-warning/30 rounded-xl p-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-warning">{error}</p>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setError(null)}
                                        className="text-sm text-warning hover:text-warning underline"
                                    >
                                        Fechar
                                    </button>
                                    <button
                                        onClick={() => fetchApplications(filters.page, false)}
                                        className="text-sm text-warning hover:text-warning underline flex items-center gap-1"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Atualizar lista
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Filtros */}
                <FilterBar
                    filters={filters}
                    setFilters={setFilters}
                    statusCounts={statusCounts}
                    onRefresh={() => fetchApplications(filters.page, false)}
                    loading={refreshing}
                    pagination={{
                        currentPage: pagination.currentPage,
                        totalPages: pagination.totalPages,
                        totalApplications: pagination.totalApplications,
                        pageSize: pagination.pageSize,
                    }}
                />

                {/* Lista de Candidaturas */}
                {filteredApplications.length === 0 ? (
                    <motion.div
                        className="bg-card rounded-xl shadow-sm border border-border p-12 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
                            <FileText className="w-12 h-12 text-muted-foreground/70" />
                        </div>
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            {filters.search || filters.status !== 'all' ? 'Nenhuma candidatura encontrada' : 'Nenhuma candidatura'}
                        </h3>
                        <p className="text-muted-foreground mb-6">
                            {filters.search || filters.status !== 'all'
                                ? 'Tente ajustar os filtros de busca'
                                : 'Você ainda não se candidatou a nenhum processo seletivo'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/processos-seletivos"
                                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary font-medium transition-colors inline-flex items-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                Ver Processos Abertos
                            </Link>
                            {(filters.search || filters.status !== 'all') && (
                                <button
                                    onClick={() => setFilters({ search: '', status: 'all', page: 1 })}
                                    className="px-6 py-3 border border-input text-foreground/80 rounded-lg hover:bg-background font-medium transition-colors"
                                >
                                    Limpar Filtros
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <>
                        {/* Totais */}
                        {applications.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {[
                                    { k: 'Candidaturas', v: pagination.totalApplications, cls: 'text-foreground' },
                                    { k: 'Em análise', v: (statusCounts.under_review || 0) + (statusCounts.pending || 0), cls: 'text-info' },
                                    { k: 'Aprovadas', v: statusCounts.approved || 0, cls: 'text-success' },
                                    { k: 'Editáveis', v: editableCount, cls: 'text-primary' },
                                ].map((t, i) => (
                                    <motion.div
                                        key={t.k}
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.05 + i * 0.06, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                                        className="rounded-3xl border bg-card p-5"
                                    >
                                        <p className={`tabular text-3xl font-medium leading-none ${t.cls}`}>
                                            <CountUp value={t.v} />
                                        </p>
                                        <p className="mt-2 text-sm text-muted-foreground">{t.k}</p>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        <motion.div
                            className="mt-6 grid grid-cols-1 gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ staggerChildren: 0.1 }}
                        >
                            <AnimatePresence initial={false}>
                                {filteredApplications.map((application) => (
                                    <ProcessCard
                                        key={application.id}
                                        application={application}
                                        onEditClick={handleEditClick}
                                        onViewDetails={handleViewDetails}
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>

                        {/* Paginação */}
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                            loading={refreshing}
                        />

                    </>
                )}
            </div>
            <Footer compact />
        </motion.div>
    );
}