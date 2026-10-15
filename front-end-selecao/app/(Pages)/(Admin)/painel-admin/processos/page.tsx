'use client';

import {
    ApiResponse,
    Benefit,
    Prerequisite,
    SelectionProcess,
    SelectionProcessFormData,
} from '@/api/types/selection';
import EditProcessModal from '@/components/admin/EditProcessModal';
import ViewProcessModal from '@/components/admin/ViewProcessModal';
import { Title } from '@/components/ui/Title';
import {
    AlertTriangle,
    Briefcase,
    Calendar,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Clock,
    DollarSign,
    Edit,
    Eye,
    Flag,
    ListChecks,
    Loader2,
    MapPin,
    Plus,
    Search,
    UserCheck,
    Users,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type StatusFilter = 'all' | 'active' | 'inactive';

type AnalyzeButtonState = {
    primary: {
        label: string;
        icon: any;
        enabled: boolean;
        variant: 'enabled' | 'disabled';
    };
    secondary?: {
        label: string;
        icon: any;
        enabled: boolean;
        variant: 'enabled' | 'disabled';
    };
};

function getCookieValue(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

/**
 * Parse seguro de data vindo do backend (YYYY-MM-DD).
 * - beginning_date: começa 00:00:00
 * - ending_date: considera fim do dia 23:59:59 (pra não fechar “no começo” do dia final)
 */
function parseProcessDates(processo: SelectionProcess) {
    const beginning = new Date(`${processo.beginning_date}T00:00:00`);
    const ending = new Date(`${processo.ending_date}T23:59:59`);
    const today = new Date();
    return { beginning, ending, today };
}

/**
 * Estado dos botões:
 * - primary: regra “analisar inscrições” (só quando acabou inscrição e não finalizou)
 * - secondary: “Abrir Análise” (sempre que já for permitido abrir, inclusive finished)
 */
function getAnalyzeButtonState(processo: SelectionProcess): AnalyzeButtonState {
    if (!processo.is_active) {
        return {
            primary: { label: 'Inativo', icon: XCircle, enabled: false, variant: 'disabled' },
        };
    }

    const { beginning, ending, today } = parseProcessDates(processo);

    // ✅ Só mostra "Abrir Análise" quando FINALIZADO
    const secondary =
        processo.status === 'finished'
            ? {
                label: 'Abrir Análise',
                icon: Eye,
                enabled: true,
                variant: 'enabled' as const,
            }
            : undefined;

    if (processo.status === 'finished') {
        return {
            primary: { label: 'Finalizado', icon: Flag, enabled: false, variant: 'disabled' },
            secondary,
        };
    }

    if (today < beginning) {
        return {
            primary: { label: 'Aguardando início', icon: Calendar, enabled: false, variant: 'disabled' },
            secondary, // (vai ser undefined aqui)
        };
    }

    if (today >= beginning && today <= ending) {
        return {
            primary: { label: 'Inscrições abertas', icon: Clock, enabled: false, variant: 'disabled' },
            secondary, // (undefined)
        };
    }

    // acabou inscrição: pode analisar
    return {
        primary: { label: 'Analisar inscrições', icon: ListChecks, enabled: true, variant: 'enabled' },
        secondary, // (undefined)
    };
}


/**
 * Status badge da UI (chip no banner) com regra por datas + finished + inactive
 */
function getStatusBadgeInfo(processo: SelectionProcess) {
    if (!processo.is_active) {
        return {
            status: 'inactive',
            label: 'Inativo',
            color: 'bg-gradient-to-r from-red-500 to-rose-600',
            icon: XCircle,
            textColor: 'text-white',
        };
    }

    if (processo.status === 'finished') {
        return {
            status: 'finished',
            label: 'Finalizado',
            color: 'bg-gradient-to-r from-gray-600 to-slate-700',
            icon: Flag,
            textColor: 'text-white',
        };
    }

    const { beginning, ending, today } = parseProcessDates(processo);

    if (today < beginning) {
        return {
            status: 'created',
            label: 'Criado',
            color: 'bg-gradient-to-r from-blue-500 to-indigo-600',
            icon: Calendar,
            textColor: 'text-white',
        };
    }

    if (today >= beginning && today <= ending) {
        const daysUntilEnd = Math.ceil((ending.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntilEnd <= 7 && daysUntilEnd >= 0) {
            return {
                status: 'expiring',
                label: 'Expirando',
                color: 'bg-gradient-to-r from-amber-500 to-orange-600',
                icon: AlertTriangle,
                textColor: 'text-white',
            };
        }

        return {
            status: 'in_application',
            label: 'Em Inscrição',
            color: 'bg-gradient-to-r from-emerald-500 to-green-600',
            icon: CheckCircle,
            textColor: 'text-white',
        };
    }

    return {
        status: 'in_analysis',
        label: 'Em Análise',
        color: 'bg-gradient-to-r from-orange-500 to-amber-600',
        icon: ListChecks,
        textColor: 'text-white',
    };
}

function calculateProgress(processo: SelectionProcess) {
    const { beginning, ending, today } = parseProcessDates(processo);

    if (today < beginning) return 0;
    if (today > ending) return 100;

    const totalDuration = ending.getTime() - beginning.getTime();
    const elapsedTime = today.getTime() - beginning.getTime();

    if (totalDuration <= 0) return 0;
    return Math.min(100, Math.max(0, (elapsedTime / totalDuration) * 100));
}

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

export default function Processos() {
    const [processos, setProcessos] = useState<SelectionProcess[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedProcess, setSelectedProcess] = useState<SelectionProcess | null>(null);

    // paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const [previousPage, setPreviousPage] = useState<string | null>(null);

    // apenas para “conferir” que cookie está vindo — não é obrigatório usar
    const adminAccessToken = useMemo(() => {
        const raw = getCookieValue('admin-access-token');
        return raw ? decodeURIComponent(raw) : null;
    }, []);

    const fetchProcessos = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);

            const accessToken = getCookieValue('admin-access-token');
            if (!accessToken) {
                setError('Token de acesso não encontrado');
                return;
            }

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/selection-processes/?page=${page}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
                    },
                }
            );

            if (!response.ok) {
                setError('Erro ao buscar processos seletivos');
                return;
            }

            const data: ApiResponse<SelectionProcess> = await response.json();

            setProcessos(data.results);
            setTotalCount(data.count);
            setNextPage(data.next);
            setPreviousPage(data.previous);

            // se seu backend usa page_size=12, ok. Se mudar, ajuste aqui.
            const pageSize = 12;
            setTotalPages(Math.ceil(data.count / pageSize));
            setCurrentPage(page);
        } catch {
            setError('Erro na requisição');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProcessos(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const filteredProcessos = useMemo(() => {
        return processos.filter((processo) => {
            const matchesSearch =
                processo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                processo.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (processo.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                processo.slug.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'all' ||
                (statusFilter === 'active' && processo.is_active) ||
                (statusFilter === 'inactive' && !processo.is_active);

            return matchesSearch && matchesStatus;
        });
    }, [processos, searchTerm, statusFilter]);

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

    /**
     * Endpoints opcionais de check/force (mantive).
     * Use só quando fizer sentido (ex.: ao salvar ou ao abrir análise).
     */
    const checkAndUpdateProcessStatus = async (processSlug: string) => {
        try {
            const accessToken = getCookieValue('admin-access-token');
            if (!accessToken) return null;

            const checkResponse = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/selection-processes/${processSlug}/check_status/`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!checkResponse.ok) return null;

            const checkData = await checkResponse.json();

            if (!checkData.needs_update) return checkData.current_status;

            const updateResponse = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/selection-processes/${processSlug}/force_update_status/`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ old_status: checkData.current_status }),
                }
            );

            if (!updateResponse.ok) return null;

            const updateData = await updateResponse.json();

            await fetchProcessos(currentPage);
            return updateData.new_status;
        } catch {
            return null;
        }
    };

    const handleAnalyzeProcess = async (processo: SelectionProcess) => {
        const state = getAnalyzeButtonState(processo);

        if (!state.primary.enabled) {
            toast.info(state.primary.label);
            return;
        }

        await checkAndUpdateProcessStatus(processo.slug);

        window.location.href = `/painel-admin/processos/analise/${processo.slug}`;
    };

    const handleOpenAnalysisPage = async (processo: SelectionProcess) => {
        await checkAndUpdateProcessStatus(processo.slug);
        window.location.href = `/painel-admin/processos/analise/${processo.slug}`;
    };

    // paginação
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) fetchProcessos(page);
    };

    const handleNextPage = () => {
        if (!nextPage) return;
        const nextPageNumber = currentPage + 1;
        if (nextPageNumber <= totalPages) fetchProcessos(nextPageNumber);
    };

    const handlePreviousPage = () => {
        if (!previousPage) return;
        const prevPageNumber = currentPage - 1;
        if (prevPageNumber >= 1) fetchProcessos(prevPageNumber);
    };

    const handleFirstPage = () => fetchProcessos(1);
    const handleLastPage = () => fetchProcessos(totalPages);

    const getPageNumbers = () => {
        const pages: number[] = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) pages.push(i);
        return pages;
    };

    // modais
    const handleViewProcess = (processo: SelectionProcess) => {
        setSelectedProcess(processo);
        setShowViewModal(true);
    };

    const handleEditProcess = (processo: SelectionProcess) => {
        setSelectedProcess(processo);
        setShowEditModal(true);
    };

    const handleCloseModals = () => {
        setShowViewModal(false);
        setShowEditModal(false);
        setSelectedProcess(null);
    };

    // salvar alterações (EditProcessModal)
    const handleUpdateProcess = async (data: {
        formData: SelectionProcessFormData;
        benefits: Benefit[];
        prerequisites: Prerequisite[];
        bannerPreview: string | null;
        noticeDocFiles: File[];
        deletedDocumentIds: number[];
    }) => {
        if (!selectedProcess) return;

        const { formData, benefits, prerequisites, bannerPreview, noticeDocFiles, deletedDocumentIds } = data;

        try {
            const accessToken = getCookieValue('admin-access-token');
            if (!accessToken) {
                toast.error('Token de acesso não encontrado');
                return;
            }

            const token = decodeURIComponent(accessToken);

            // 1️⃣ Deletar documentos removidos
            if (deletedDocumentIds.length > 0) {
                await Promise.all(
                    deletedDocumentIds.map(async (id) => {
                        const res = await fetch(
                            `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/notice-documents/${id}/`,
                            {
                                method: 'DELETE',
                                headers: { Authorization: `Bearer ${token}` },
                            }
                        );
                        if (!res.ok) throw new Error(`Erro ao deletar documento ${id}`);
                    })
                );
            }

            // 2️⃣ Preparar FormData
            const submitData = new FormData();

            const formattedData = {
                ...formData,
                benefits: benefits
                    .map((b) => b.value.trim())
                    .filter((v) => v !== '')
                    .join(';'),
                requirements: prerequisites
                    .map((p) => p.value.trim())
                    .filter((v) => v !== '')
                    .join(';'),
                number_vacancies: formData.number_vacancies || 0,
                is_active: formData.is_active !== undefined ? formData.is_active : true,
            };

            Object.entries(formattedData).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    submitData.append(key, String(value));
                }
            });

            // Banner (se alterado)
            if (bannerPreview && bannerPreview.startsWith('data:image')) {
                const response = await fetch(bannerPreview);
                const blob = await response.blob();
                submitData.append('process_banner', blob, 'banner.jpg');
            }

            // 📁 Novos documentos do edital (múltiplos)
            noticeDocFiles.forEach((file) => {
                submitData.append('notice_doc_files', file);
            });

            // 3️⃣ Enviar PUT
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/selection-processes/${selectedProcess.slug}/`,
                {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` },
                    body: submitData,
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                if (errorData.slug) toast.error(`Erro no slug: ${errorData.slug.join(', ')}`);
                else toast.error(errorData.detail || 'Erro ao atualizar processo');
                return;
            }

            const updatedProcess = await response.json();

            // 4️⃣ Atualizar status (opcional)
            await checkAndUpdateProcessStatus(updatedProcess.slug);

            // 5️⃣ Atualizar lista de processos
            setProcessos((prev) =>
                prev.map((p) => (p.id === selectedProcess.id ? updatedProcess : p))
            );

            toast.success('Processo atualizado com sucesso!');
            handleCloseModals();
        } catch (error: any) {
            toast.error(error.message || 'Erro na requisição de atualização');
        }
    };


    const handleNewProcess = () => {
        window.location.href = '/painel-admin/processos/novo';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
                    <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-600/30" />
                </div>
                <p className="mt-6 text-gray-600 font-medium text-lg">Carregando processos seletivos...</p>
                <p className="text-gray-400 text-sm mt-2">Isso pode levar alguns instantes</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <Title
                title="Processos Seletivos"
                icon={ListChecks}
                titleButton="Novo Processo"
                buttonUrl="/painel-admin/processos/novo"
                iconButton={Plus}
            />

            {/* Filtros e Search */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar por título, curso, slug ou descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                            />
                        </div>
                    </div>

                    {/* Filtro de Status */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${statusFilter === 'all'
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${statusFilter === 'active'
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
                                }`}
                        >
                            Ativos
                        </button>
                        <button
                            onClick={() => setStatusFilter('inactive')}
                            className={`px-5 py-3 rounded-xl font-medium transition-all duration-200 ${statusFilter === 'inactive'
                                ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow'
                                }`}
                        >
                            Inativos
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid de Processos */}
            {error ? (
                <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 text-center shadow-sm">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <AlertTriangle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-red-800 font-semibold text-lg mb-2">Erro ao carregar</h3>
                    <p className="text-red-700 mb-4">{error}</p>
                    <button
                        onClick={() => fetchProcessos(1)}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
                    >
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Tentar Novamente
                    </button>
                </div>
            ) : filteredProcessos.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full mb-6">
                        <Users className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-gray-900 font-semibold text-xl mb-2">Nenhum processo seletivo encontrado</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {searchTerm || statusFilter !== 'all'
                            ? 'Não encontramos processos com os filtros selecionados. Tente ajustar os termos de busca.'
                            : 'Comece criando o primeiro processo seletivo para gerenciar inscrições e candidaturas.'}
                    </p>
                    <button
                        onClick={handleNewProcess}
                        className="inline-flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
                    >
                        <Plus className="w-5 h-5" />
                        Criar Primeiro Processo
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 mb-6">
                        {filteredProcessos.map((processo) => {
                            const statusInfo = getStatusBadgeInfo(processo);
                            const StatusIcon = statusInfo.icon;

                            const progress = calculateProgress(processo);
                            const analyzeState = getAnalyzeButtonState(processo);
                            const AnalyzeIcon = analyzeState.primary.icon;



                                    return (
                                <div
                                    key={processo.id}
                                    className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer"
                                    onClick={() => handleViewProcess(processo)}
                                >
                                    {/* Header com Status */}
                                    <div className="relative">
                                        <div className="aspect-w-16 aspect-h-9 relative overflow-hidden">
                                            <img
                                                src={getAbsoluteUrl(processo.process_banner) || '/fallback-banner.png'}
                                                alt={processo.title}
                                                className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/fallback-banner.png';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                            {/* Botões de ação no hover */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/50">
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewProcess(processo);
                                                        }}
                                                        className="p-3 bg-white/95 text-gray-700 rounded-xl hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                                                        title="Visualizar"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleEditProcess(processo);
                                                        }}
                                                        className="p-3 bg-white/95 text-gray-700 rounded-xl hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg delay-75"
                                                        title="Editar"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        {/* Título e Subtítulo */}
                                        <div className="mb-4">
                                            <h3 className="font-bold text-gray-900 text-base line-clamp-2 leading-tight mb-1.5 group-hover:text-blue-600 transition-colors">
                                                {processo.title}
                                            </h3>
                                            <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{processo.subtitle}</p>
                                        </div>

                                        {/* Informações Rápidas */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                                    <Users className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium truncate">{processo.course}</span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                                    <MapPin className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium truncate">{processo.local}</span>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                                                    <DollarSign className="w-4 h-4 text-amber-600" />
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium">R$ {processo.salary}</span>
                                            </div>

                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center shrink-0">
                                                    <Clock className="w-4 h-4 text-purple-600" />
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium truncate">
                                                    Até {formatDate(processo.ending_date)}
                                                </span>
                                            </div>

                                            <div
                                                className="flex items-center gap-3 min-w-0"
                                                title="Candidatos com inscrição neste processo"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                                    <UserCheck className="w-4 h-4 text-indigo-600" />
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium truncate">
                                                    {(processo.enrollments_count ?? 0).toLocaleString('pt-BR')}{' '}
                                                    {(processo.enrollments_count ?? 0) === 1 ? 'inscrito' : 'inscritos'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center shrink-0">
                                                    <Briefcase className="w-4 h-4 text-sky-600" />
                                                </div>
                                                <span className="text-sm text-gray-700 font-medium truncate">
                                                    {processo.number_vacancies}{' '}
                                                    {processo.number_vacancies === 1 ? 'vaga' : 'vagas'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Barra de Progresso (somente na janela de inscrição) */}
                                        {(() => {
                                            const { beginning, ending, today } = parseProcessDates(processo);
                                            const inWindow = today >= beginning && today <= ending;
                                            return (
                                                inWindow && (
                                                    <div className="mb-4">
                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                            <span className="font-medium">Progresso:</span>
                                                            <span>{Math.round(progress)}%</span>
                                                        </div>
                                                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${statusInfo.status === 'expiring'
                                                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                                                    : 'bg-gradient-to-r from-emerald-500 to-green-500'
                                                                    }`}
                                                                style={{ width: `${progress}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )
                                            );
                                        })()}

                                        {/* Botões (Analisar + Abrir Análise) */}
                                        <div className="mt-4 space-y-2">
                                            {/* Primário */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAnalyzeProcess(processo);
                                                }}
                                                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${analyzeState.primary.enabled
                                                    ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:shadow-lg hover:scale-[1.02]'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 cursor-not-allowed opacity-80'
                                                    }`}
                                                disabled={!analyzeState.primary.enabled}
                                            >
                                                <AnalyzeIcon className="w-4 h-4" />
                                                <span className="text-sm">{analyzeState.primary.label}</span>
                                            </button>

                                            {/* Secundário: Abrir Análise (sempre que existir) */}
                                            {analyzeState.secondary?.enabled && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenAnalysisPage(processo);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span className="text-sm">{analyzeState.secondary.label}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-600">
                                    Mostrando <span className="font-bold text-gray-900">{processos.length}</span> de{' '}
                                    <span className="font-bold text-gray-900">{totalCount}</span> processos
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleFirstPage}
                                        disabled={currentPage === 1}
                                        className="p-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                                        title="Primeira página"
                                    >
                                        <ChevronsLeft className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={handlePreviousPage}
                                        disabled={!previousPage}
                                        className="p-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                                        title="Página anterior"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>

                                    <div className="flex gap-2">
                                        {getPageNumbers().map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => handlePageChange(page)}
                                                className={`w-11 h-11 rounded-xl border transition-all duration-200 ${currentPage === page
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-600 shadow-md'
                                                    : 'border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 hover:shadow'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleNextPage}
                                        disabled={!nextPage}
                                        className="p-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                                        title="Próxima página"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    <button
                                        onClick={handleLastPage}
                                        disabled={currentPage === totalPages}
                                        className="p-2.5 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                                        title="Última página"
                                    >
                                        <ChevronsRight className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="text-sm text-gray-600">
                                    Página <span className="font-bold text-gray-900">{currentPage}</span> de{' '}
                                    <span className="font-bold text-gray-900">{totalPages}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal de Visualização */}
            <ViewProcessModal
                isOpen={showViewModal}
                onClose={handleCloseModals}
                processData={selectedProcess}
                onEdit={() => selectedProcess && handleEditProcess(selectedProcess)}
            />

            {/* Modal de Edição */}
            <EditProcessModal
                isOpen={showEditModal}
                onClose={handleCloseModals}
                process={selectedProcess}
                onSave={handleUpdateProcess}
            />
        </div>
    );
}
