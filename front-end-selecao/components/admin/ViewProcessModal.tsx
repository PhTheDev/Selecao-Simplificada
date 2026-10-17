'use client';

import { useProcessApplicationsModal } from '@/api/hooks/useProcessApplication';
import { SelectionProcess } from '@/api/types/selection';
import Modal from '@/components/ui/Modal';
import {
    AlertTriangle,
    Award,
    Briefcase,
    Check,
    CheckCircle,
    Clock as ClockIcon,
    DollarSign,
    Download,
    Eye,
    FileCheck,
    FileText, // ✅ Adicionado para exibir ícone dos documentos
    Mail,
    MapPin,
    RefreshCw,
    User,
    Users,
    X,
    XCircle
} from 'lucide-react';
import { useState } from 'react';

interface ViewProcessModalProps {
    isOpen: boolean;
    onClose: () => void;
    processData: SelectionProcess | null;
    onEdit: () => void;
}

const ViewProcessModal: React.FC<ViewProcessModalProps> = ({
    isOpen,
    onClose,
    processData,
    onEdit
}) => {
    const [selectedTab, setSelectedTab] = useState<'info' | 'candidates'>('info');

    const {
        applications,
        stats,
        isLoading: loadingApplications,
        isError: hasError,
        error: errorApplications,
        isRefetching,
        refetch: refreshApplications,
        invalidateCache,
    } = useProcessApplicationsModal(
        processData?.id,
        processData?.slug,
        isOpen
    );

    type Bout = 'M' | 'T' | 'E' | string;

    const getBoutLabel = (bout?: Bout | null) => {
        if (!bout) return 'Não informado';
        if (bout === 'M') return 'Matutino';
        if (bout === 'T') return 'Vespertino';
        if (bout === 'E') return 'Escala';
        return String(bout);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getRequirementsList = (requirements: string) => {
        return requirements.split(';').filter(req => req.trim() !== '');
    };

    const getBenefitsList = (benefits: string) => {
        return benefits.split(';').filter(benefit => benefit.trim() !== '');
    };

    const getApplicationStatusInfo = (status: string) => {
        switch (status) {
            case 'pending':
                return {
                    label: 'Pendente',
                    color: 'bg-warning-soft text-warning border-warning/30',
                    icon: ClockIcon
                };
            case 'approved':
                return {
                    label: 'Aprovado',
                    color: 'bg-success-soft text-success border-success/30',
                    icon: Check
                };
            case 'rejected':
                return {
                    label: 'Reprovado',
                    color: 'bg-destructive-soft text-destructive border-destructive/30',
                    icon: X
                };
            default:
                return {
                    label: 'Desconhecido',
                    color: 'bg-muted text-foreground border-border',
                    icon: XCircle
                };
        }
    };

    const handleViewCandidate = (candidateId: number) => {
        window.open(`/painel-admin/candidatos/${candidateId}`, '_blank');
    };

    const handleRefresh = async () => {
        try {
            invalidateCache();
            await refreshApplications();
        } catch (error) {
            console.error('Erro ao atualizar:', error);
        }
    };

    if (!processData) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={processData.title}
            subtitle={processData.subtitle}
            size="xl"
            footer={
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-muted text-foreground/80 font-medium rounded-xl hover:bg-border transition-colors"
                    >
                        Fechar
                    </button>
                    <button
                        onClick={onEdit}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                    >
                        <FileCheck className="w-4 h-4" />
                        Editar Processo
                    </button>
                </div>
            }
            backdropClass="bg-black/30"
        >
            <div className="p-6">
                {/* Abas de navegação */}
                <div className="flex border-b border-border mb-6">
                    <button
                        onClick={() => setSelectedTab('info')}
                        className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all duration-200 ${selectedTab === 'info'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground/80'
                            }`}
                    >
                        <Briefcase className="w-4 h-4" />
                        Informações do Processo
                    </button>
                    <button
                        onClick={() => setSelectedTab('candidates')}
                        className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-all duration-200 ${selectedTab === 'candidates'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground/80'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Candidatos
                        <span className={`px-2 py-0.5 text-xs rounded-full ${selectedTab === 'candidates'
                            ? 'bg-primary-soft text-primary'
                            : 'bg-muted text-muted-foreground'
                            }`}>
                            {applications.length}
                        </span>
                    </button>
                </div>

                {selectedTab === 'info' ? (
                    <>
                        {/* Banner */}
                        <div className="relative h-72 rounded-xl overflow-hidden mb-6">
                            <img
                                src={processData.process_banner || '/fallback-banner.png'}
                                alt={processData.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/fallback-banner.png';
                                }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute bottom-6 left-6 text-white">
                                <h2 className="text-2xl font-bold mb-2">{processData.title}</h2>
                                <p className="text-white/90">{processData.subtitle}</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            {/* Status e Informações Principais */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-primary-soft rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-primary-soft flex items-center justify-center">
                                            <Briefcase className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-primary font-medium">Curso</p>
                                            <p className="text-lg font-bold text-foreground">{processData.course}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-success-soft rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-success-soft flex items-center justify-center">
                                            <MapPin className="w-6 h-6 text-success" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-success font-medium">Local</p>
                                            <p className="text-lg font-bold text-foreground">{processData.local}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-warning-soft rounded-2xl p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-warning-soft flex items-center justify-center">
                                            <DollarSign className="w-6 h-6 text-warning" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-warning font-medium">Bolsa</p>
                                            <p className="text-lg font-bold text-foreground">R$ {processData.salary}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Outras Informações */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                            Informações do Processo
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between py-3 border-b border-border">
                                                <span className="text-muted-foreground">Vagas Disponíveis</span>
                                                <span className="font-bold text-foreground">{processData.number_vacancies}</span>
                                            </div>

                                            <div className="flex items-center justify-between py-3 border-b border-border">
                                                <span className="text-muted-foreground">Carga Horária</span>
                                                <span className="font-bold text-foreground">{processData.weekly_workload}</span>
                                            </div>

                                            <div className="flex items-center justify-between py-3 border-b border-border">
                                                <span className="text-muted-foreground">Período Aceito</span>
                                                <span className="font-bold text-foreground">{processData.period_accepted}</span>
                                            </div>

                                            <div className="flex items-center justify-between py-3 border-b border-border">
                                                <span className="text-muted-foreground">Turno</span>
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-warning-soft text-warning">
                                                    {getBoutLabel((processData as any).bout)}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between py-3 border-b border-border">
                                                <span className="text-muted-foreground">Status</span>
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-bold ${processData.is_active ? 'bg-success-soft text-success' : 'bg-destructive-soft text-destructive'
                                                        }`}
                                                >
                                                    {processData.is_active ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                            Período
                                        </h3>
                                        <div className="bg-background rounded-2xl p-5">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Início</p>
                                                    <p className="font-bold text-foreground">{formatDate(processData.beginning_date)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground mb-1">Término</p>
                                                    <p className="font-bold text-foreground">{formatDate(processData.ending_date)}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-border">
                                                <p className="text-xs text-muted-foreground mb-1">Título do Processo</p>
                                                <p className="text-sm font-medium text-foreground">{processData.slug}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Descrição */}
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                    Descrição
                                </h3>
                                <div className="prose prose-gray max-w-none">
                                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                                        {processData.description}
                                    </p>
                                </div>
                            </div>

                            {/* Requisitos e Benefícios lado a lado */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Requisitos */}
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                        Pré-requisitos
                                    </h3>
                                    <ul className="space-y-3">
                                        {getRequirementsList(processData.requirements).map((req, index) => (
                                            <li key={index} className="flex items-start gap-3 p-3 bg-warning-soft rounded-xl">
                                                <div className="w-6 h-6 rounded-lg bg-warning-soft flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle className="w-3.5 h-3.5 text-warning" />
                                                </div>
                                                <span className="text-foreground">{req.trim()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Benefícios */}
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                        Benefícios
                                    </h3>
                                    <ul className="space-y-3">
                                        {getBenefitsList(processData.benefits).map((benefit, index) => (
                                            <li key={index} className="flex items-start gap-3 p-3 bg-success-soft rounded-xl">
                                                <div className="w-6 h-6 rounded-lg bg-success-soft flex items-center justify-center flex-shrink-0">
                                                    <Award className="w-3.5 h-3.5 text-success" />
                                                </div>
                                                <span className="text-foreground">{benefit.trim()}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* ✅ DOCUMENTOS DO EDITAL - MÚLTIPLOS */}
                            {processData.notice_documents && processData.notice_documents.length > 0 ? (
                                <div>
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                                        Documentos do Edital
                                    </h3>
                                    <div className="space-y-3">
                                        {processData.notice_documents.map((doc) => (
                                            <a
                                                key={doc.id}
                                                href={doc.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                                className="flex items-center gap-3 p-4 bg-primary-soft rounded-xl border border-primary/30 hover:shadow-md transition-all duration-200"
                                            >
                                                <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-foreground truncate">
                                                        {doc.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Clique para baixar
                                                    </p>
                                                </div>
                                                <Download className="w-5 h-5 text-primary flex-shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground italic">
                                    Nenhum documento do edital anexado.
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* ------- ABA DE CANDIDATOS (ORIGINAL, INALTERADA) ------- */
                    <div>
                        {/* Header da seção de candidatos */}
                        <div className="mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-2">
                                        Candidatos Inscritos
                                    </h3>
                                    <p className="text-muted-foreground">
                                        Lista de candidatos que realizaram inscrição neste processo seletivo
                                    </p>
                                </div>

                                {/* Botões de ação */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefetching}
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-soft text-primary rounded-lg hover:bg-primary-soft transition-colors disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                                        {isRefetching ? 'Atualizando...' : 'Atualizar'}
                                    </button>
                                </div>
                            </div>

                            {/* Estatísticas */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-primary-soft rounded-xl p-4">
                                    <p className="text-sm text-primary font-medium">Total</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                                </div>
                                <div className="bg-warning-soft rounded-xl p-4">
                                    <p className="text-sm text-warning font-medium">Pendentes</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.pending}</p>
                                </div>
                                <div className="bg-success-soft rounded-xl p-4">
                                    <p className="text-sm text-success font-medium">Aprovados</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.approved}</p>
                                </div>
                                <div className="bg-destructive-soft rounded-xl p-4">
                                    <p className="text-sm text-destructive font-medium">Reprovados</p>
                                    <p className="text-2xl font-bold text-foreground">{stats.rejected}</p>
                                </div>
                            </div>
                        </div>

                        {loadingApplications ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                                <p className="text-muted-foreground">Carregando candidatos...</p>
                            </div>
                        ) : hasError ? (
                            <div className="bg-destructive-soft border border-destructive/30 rounded-xl p-6 text-center">
                                <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
                                <p className="text-destructive font-medium mb-2">Erro ao carregar candidatos</p>
                                <p className="text-destructive text-sm mb-4">{errorApplications || 'Erro desconhecido'}</p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefetching}
                                        className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive transition-colors disabled:opacity-50"
                                    >
                                        Tentar novamente
                                    </button>
                                </div>
                            </div>
                        ) : applications.length === 0 ? (
                            <div className="bg-background border border-border rounded-xl p-12 text-center">
                                <Users className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" />
                                <h4 className="text-foreground font-semibold text-lg mb-2">
                                    Nenhum candidato inscrito
                                </h4>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    Este processo seletivo ainda não recebeu inscrições de candidatos.
                                </p>
                                <button
                                    onClick={handleRefresh}
                                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                                >
                                    Verificar novamente
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-border">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-border">
                                        <thead className="bg-background">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Candidato
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Status da Inscrição
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Data de Inscrição
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-card divide-y divide-border">
                                            {applications.map((application) => {
                                                const StatusIcon = getApplicationStatusInfo(application.status).icon;
                                                return (
                                                    <tr key={application.id} className="hover:bg-background transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-10 h-10 rounded-full bg-primary-soft flex items-center justify-center mr-3">
                                                                    <User className="w-5 h-5 text-primary" />
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-foreground">
                                                                        {application.candidate?.name || 'Nome não disponível'}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                                        <Mail className="w-3 h-3" />
                                                                        {application.candidate?.email || 'Email não disponível'}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${getApplicationStatusInfo(application.status).color}`}>
                                                                <StatusIcon className="w-3 h-3" />
                                                                {getApplicationStatusInfo(application.status).label}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                            {formatDateTime(application.application_date)}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                            <button
                                                                onClick={() => handleViewCandidate(application.candidate?.id)}
                                                                disabled={!application.candidate?.id}
                                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-soft text-primary rounded-lg hover:bg-primary-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Eye className="w-3.5 h-3.5" />
                                                                Ver Candidato
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Resumo */}
                                <div className="bg-background px-6 py-4 border-t border-border">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="text-sm text-muted-foreground">
                                            <span className="font-bold">{applications.length}</span> candidato(s) carregado(s) do cache
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="text-sm">
                                                <span className="inline-flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-warning"></div>
                                                    Pendentes: {stats.pending}
                                                </span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="inline-flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-success"></div>
                                                    Aprovados: {stats.approved}
                                                </span>
                                            </div>
                                            <div className="text-sm">
                                                <span className="inline-flex items-center gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-destructive"></div>
                                                    Reprovados: {stats.rejected}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default ViewProcessModal;