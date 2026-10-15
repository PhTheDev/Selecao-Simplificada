'use client';

import Footer from "@/components/Footer";
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
        <div className="w-full bg-slate-50 rounded-xl border border-slate-200 px-4 py-3 mb-4">
            <div className="flex items-center justify-between mb-3 gap-2">
                <div>
                    <p className="text-xs font-semibold tracking-wide text-[#005f73] uppercase">
                        Jornada do Candidato
                    </p>
                    <p className="text-xs text-slate-500">
                        Conheça as etapas do nosso processo seletivo
                    </p>
                </div>
                <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3 text-[#0a9396]" />
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

                    let circleClasses = "border-slate-300 bg-white text-slate-400";
                    if (isCompleted) {
                        circleClasses = "border-emerald-500 bg-emerald-500 text-white";
                    } else if (isCurrent) {
                        if (isRejected && stage.id === 4) {
                            circleClasses = "border-red-500 bg-red-500 text-white";
                        } else {
                            circleClasses = "border-[#0a9396] bg-[#0a9396] text-white";
                        }
                    }

                    const labelColor = isCompleted || isCurrent ? "text-slate-900" : "text-slate-400";
                    const descriptionColor =
                        isCompleted || isCurrent ? "text-slate-500" : "text-slate-400";

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
                                <div className="hidden sm:block flex-1 h-px bg-gradient-to-r from-slate-200 via-slate-200 to-slate-200" />
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
        ${isApproved ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}
        border-b`}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center
            ${isApproved ? "bg-emerald-500" : "bg-red-500"} text-white`}
                >
                    {isApproved ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>

                <div>
                    <p
                        className={`text-sm font-extrabold tracking-wide uppercase
              ${isApproved ? "text-emerald-700" : "text-red-700"}`}
                    >
                        {isApproved ? "APROVADO" : "REPROVADO"}
                    </p>
                    <p className="text-xs text-slate-600">
                        {isApproved
                            ? "Parabéns! Você foi selecionado para a próxima etapa/resultado final."
                            : "Obrigado por participar. Você não foi selecionado desta vez."}
                    </p>
                </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
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
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden p-6"
            >

                <ResultBanner status={application.status} />
                <div className="flex items-center gap-3 text-yellow-600">
                    <AlertCircle className="w-5 h-5" />
                    <div>
                        <h3 className="font-semibold">Processo não encontrado</h3>
                        <p className="text-sm text-gray-500">ID da aplicação: {application.id}</p>
                        <p className="text-xs text-gray-400 mt-1">Status: {application.status}</p>
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



    return (
        <motion.div
            variants={cardVariants}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            whileHover={{ y: -5 }}
        >
            <div className="flex flex-col lg:flex-row">
                {/* Coluna da Imagem */}
                <div className="lg:w-2/5">
                    <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-[#005f73] to-[#0a9396]">
                        {/* Imagem do banner do processo */}
                        {process.process_banner && !imgError ? (
                            <>
                                <img
                                    src={getAbsoluteUrl(process.process_banner) || ''}
                                    alt={`Banner do processo: ${process.title}`}
                                    className="w-full h-full object-cover"
                                    onError={() => setImgError(true)}
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                            </>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <GraduationCap className="w-20 h-20 text-white/50" />
                            </div>
                        )}
                    </div>

                    {/* Badges abaixo da imagem */}
                    <div className="p-4 flex flex-col items-center gap-3">
                        <div className="flex flex-wrap gap-2 justify-center">
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                <Users size={12} />
                                {process.number_vacancies || 0} vaga{process.number_vacancies !== 1 ? 's' : ''}
                            </span>
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                                <File size={12} />
                                {process.weekly_workload || 'Carga horária não especificada'}
                            </span>
                            {isEditable && (
                                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                                    <CheckCircle size={12} />
                                    Inscrições abertas
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="lg:w-3/5 p-6">
                    <div className="flex flex-col h-full">
                        {/* Cabeçalho */}
                        <div className="flex-1">
                            <div className="flex flex-col gap-4 mb-4">
                                <div className="flex-1">
                                    <div className="flex items-start gap-3 mb-2">
                                        <UserCheck className="w-6 h-6 text-[#0a9396] mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                {process.title || 'Processo sem título'}
                                            </h3>
                                            <p className="text-gray-600 mb-2 text-sm">
                                                {process.subtitle || 'Sem descrição'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-4">
                                        <span className="flex items-center gap-1">
                                            <GraduationCap className="w-4 h-4 flex-shrink-0 text-[#005f73]" />
                                            <span className="truncate">{process.course || 'Curso não especificado'}</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4 flex-shrink-0 text-[#005f73]" />
                                            <span className="truncate">{process.local || 'Local não especificado'}</span>
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4 flex-shrink-0 text-[#005f73]" />
                                            <span>Prazo: {formatDate(process.ending_date)}</span>
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-500">Data da Candidatura</p>
                                            <p className="font-medium text-gray-900">
                                                {formatDate(application.application_date)}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-500">Bolsa/Mensalidade</p>
                                            <p className="font-medium text-gray-900">{formatSalary(process.salary)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ações */}
                        <div
                            className={`flex flex-col sm:flex-row gap-3 pt-4 ${isEditable ? "border-t border-gray-200" : ""
                                }`}
                        >
                            {isEditable && (
                                <button
                                    onClick={() => onEditClick(application)}
                                    className="flex-1 px-4 py-3 border-2 border-[#0a9396] text-[#0a9396] rounded-xl hover:bg-[#e6f7f9] font-bold transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Editar Inscrição
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Detalhes Expandidos */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        className="bg-gray-50 border-t border-gray-100 overflow-hidden"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="p-6">
                            <CandidateJourney status={application.status} />

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-[#005f73]" />
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
                                            <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${doc.field ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                                        }`}>
                                                        {doc.field ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <AlertCircle className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm">{doc.label}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {doc.field ? 'Enviado' : 'Não enviado'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {doc.field && (
                                                    <a
                                                        href={doc.field}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="px-3 py-1.5 bg-[#0a9396] text-white rounded-lg hover:bg-[#087e8b] text-sm flex items-center gap-2"
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
                                    <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-[#005f73]" />
                                        Informações Adicionais
                                    </h4>
                                    <div className="space-y-3">
                                        {application.portfolio_link && (
                                            <div className="bg-white rounded-lg border p-4">
                                                <p className="text-sm font-medium text-gray-700 mb-1">Portfólio</p>
                                                {isSafeHttpUrl(application.portfolio_link) ? (
                                                    <a
                                                        href={application.portfolio_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#0a9396] hover:underline text-sm break-all"
                                                    >
                                                        {application.portfolio_link}
                                                    </a>
                                                ) : (
                                                    <p className="text-sm text-gray-500 break-all">
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
                className="w-full py-3 bg-gray-50 hover:bg-gray-100 border-t border-gray-200 flex items-center justify-center gap-2 text-gray-600 font-medium"
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
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8"
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
                            className="w-full px-4 py-2.5 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a9396] focus:border-transparent"
                        />
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setFilters({ ...filters, status: 'all', page: 1 })}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${filters.status === 'all'
                                ? 'bg-[#005f73] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
                                            ? status === 'pending' ? 'bg-yellow-500 text-white' :
                                                status === 'approved' ? 'bg-green-500 text-white' :
                                                    status === 'rejected' ? 'bg-red-500 text-white' :
                                                        'bg-blue-500 text-white'
                                            : status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
                                                status === 'approved' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                                    status === 'rejected' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                                        'bg-blue-100 text-blue-800 hover:bg-blue-200'
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
                        className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors flex items-center gap-2 flex-shrink-0"
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
                <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-600">
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
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
                <ChevronLeft className="w-4 h-4" />
                Anterior
            </button>

            {startPage > 1 && (
                <>
                    <button
                        onClick={() => onPageChange(1)}
                        className={`px-3 py-2 rounded-lg ${1 === currentPage
                            ? 'bg-[#005f73] text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        1
                    </button>
                    {startPage > 2 && (
                        <span className="px-2 text-gray-400">...</span>
                    )}
                </>
            )}

            {pageNumbers.map(page => (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    disabled={loading}
                    className={`px-3 py-2 rounded-lg ${page === currentPage
                        ? 'bg-[#005f73] text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                >
                    {page}
                </button>
            ))}

            {endPage < totalPages && (
                <>
                    {endPage < totalPages - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                    )}
                    <button
                        onClick={() => onPageChange(totalPages)}
                        className={`px-3 py-2 rounded-lg ${totalPages === currentPage
                            ? 'bg-[#005f73] text-white'
                            : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
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
            <div className="min-h-screen bg-zinc-100">
                <div className="container mx-auto px-4 py-16">
                    <div className="text-center">
                        <motion.div
                            className="rounded-full h-16 w-16 border-b-2 border-[#005f73] mx-auto mb-4"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Carregando suas candidaturas...</h3>
                        <p className="text-gray-500">Isso pode levar alguns instantes</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error && applications.length === 0) {
        return (
            <div className="min-h-screen bg-zinc-100">
                <div className="container mx-auto px-4 py-8">
                    <Title
                        title="Minhas Candidaturas"
                        icon={FileText}
                        titleButton="Ver Processos Abertos"
                        buttonUrl="/processos-seletivos"
                    />

                    <motion.div
                        className="bg-red-50 border border-red-200 rounded-xl p-8 mb-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <AlertCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-red-800 mb-3">Erro ao carregar candidaturas</h3>
                        <p className="text-red-600 mb-6">{error}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => fetchApplications(filters.page)}
                                className="px-6 py-3 bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white rounded-lg hover:from-[#006d84] hover:to-[#0ba5a8] font-medium transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4" />
                                    Tentar Novamente
                                </div>
                            </button>
                            <Link
                                href="/processos-seletivos"
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                                Ver Processos Abertos
                            </Link>
                        </div>
                    </motion.div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-zinc-100"
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
                        className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-yellow-800">{error}</p>
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() => setError(null)}
                                        className="text-sm text-yellow-700 hover:text-yellow-800 underline"
                                    >
                                        Fechar
                                    </button>
                                    <button
                                        onClick={() => fetchApplications(filters.page, false)}
                                        className="text-sm text-yellow-700 hover:text-yellow-800 underline flex items-center gap-1"
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
                        className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                            <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            {filters.search || filters.status !== 'all' ? 'Nenhuma candidatura encontrada' : 'Nenhuma candidatura'}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {filters.search || filters.status !== 'all'
                                ? 'Tente ajustar os filtros de busca'
                                : 'Você ainda não se candidatou a nenhum processo seletivo'}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link
                                href="/processos-seletivos"
                                className="px-6 py-3 bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white rounded-lg hover:from-[#006d84] hover:to-[#0ba5a8] font-medium transition-colors inline-flex items-center gap-2"
                            >
                                <Eye className="w-4 h-4" />
                                Ver Processos Abertos
                            </Link>
                            {(filters.search || filters.status !== 'all') && (
                                <button
                                    onClick={() => setFilters({ search: '', status: 'all', page: 1 })}
                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                >
                                    Limpar Filtros
                                </button>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            className="grid grid-cols-1 gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ staggerChildren: 0.1 }}
                        >
                            {filteredApplications.map((application) => (
                                <ProcessCard
                                    key={application.id}
                                    application={application}
                                    onEditClick={handleEditClick}
                                    onViewDetails={handleViewDetails}
                                />
                            ))}
                        </motion.div>

                        {/* Paginação */}
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                            loading={refreshing}
                        />

                        {/* Estatísticas */}
                        {applications.length > 0 && (
                            <motion.div
                                className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Total de Candidaturas</p>
                                    <p className="text-2xl font-bold text-gray-900">{pagination.totalApplications}</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Em Análise</p>
                                    <p className="text-2xl font-bold text-blue-600">{statusCounts.under_review || 0}</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Aprovados</p>
                                    <p className="text-2xl font-bold text-green-600">{statusCounts.approved || 0}</p>
                                </div>
                                <div className="bg-white rounded-xl p-6 border border-gray-200">
                                    <p className="text-sm text-gray-500 mb-1">Editáveis</p>
                                    <p className="text-2xl font-bold text-[#0a9396]">{editableCount}</p>
                                </div>
                            </motion.div>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </motion.div>
    );
}