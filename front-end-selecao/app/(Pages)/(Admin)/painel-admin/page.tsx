'use client';

import { ApiResponse, SelectionProcess } from '@/api/types/selection';
import { Title } from '@/components/ui/Title';
import {
    AlertTriangle,
    ArrowRight,
    Calendar,
    CheckCircle,
    Clock,
    Eye,
    Flag,
    ListChecks,
    Loader2,
    Plus,
    Users,
    XCircle
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
 */
function parseProcessDates(processo: SelectionProcess) {
  const beginning = new Date(`${processo.beginning_date}T00:00:00`);
  const ending = new Date(`${processo.ending_date}T23:59:59`);
  const today = new Date();
  return { beginning, ending, today };
}

/**
 * Estado dos botões:
 * - primary: “analisar inscrições” (só quando acabou inscrição e não finalizou)
 * - secondary: “Abrir Análise” (somente quando status finished)
 */
function getAnalyzeButtonState(processo: SelectionProcess): AnalyzeButtonState {
  if (!processo.is_active) {
    return {
      primary: { label: 'Inativo', icon: XCircle, enabled: false, variant: 'disabled' },
    };
  }

  const { beginning, ending, today } = parseProcessDates(processo);

  const secondary =
    processo.status === 'finished'
      ? { label: 'Abrir Análise', icon: Eye, enabled: true, variant: 'enabled' as const }
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
      secondary,
    };
  }

  if (today >= beginning && today <= ending) {
    return {
      primary: { label: 'Inscrições abertas', icon: Clock, enabled: false, variant: 'disabled' },
      secondary,
    };
  }

  return {
    primary: { label: 'Analisar inscrições', icon: ListChecks, enabled: true, variant: 'enabled' },
    secondary,
  };
}

/**
 * Status badge da UI (datas + finished + inactive)
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

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

function byNewest(a: SelectionProcess, b: SelectionProcess) {
  // fallback por created_at se existir, senão por id
  const da = (a as any).created_at ? new Date((a as any).created_at).getTime() : a.id;
  const db = (b as any).created_at ? new Date((b as any).created_at).getTime() : b.id;
  return db - da;
}

export default function PainelAdmin() {
  const [processos, setProcessos] = useState<SelectionProcess[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filtros locais do dashboard
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const fetchAllFirstPage = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = getCookieValue('admin-access-token');
      if (!accessToken) {
        setError('Token de acesso não encontrado');
        return;
      }

      // Dashboard precisa só de “visão geral”: primeira página já ajuda.
      // Se quiser visão 100% global, você pode iterar páginas depois.
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/selection-processes/?page=1`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
          },
        }
      );

      if (!response.ok) {
        setError('Erro ao carregar dashboard');
        return;
      }

      const data: ApiResponse<SelectionProcess> = await response.json();
      setProcessos(Array.isArray(data?.results) ? data.results : []);
    } catch {
      setError('Erro na requisição');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProcessos = useMemo(() => {
    return processos.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.subtitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.slug.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && p.is_active) ||
        (statusFilter === 'inactive' && !p.is_active);

      return matchesSearch && matchesStatus;
    });
  }, [processos, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = processos.length;
    const inactive = processos.filter((p) => !p.is_active).length;
    const active = processos.filter((p) => p.is_active).length;

    const inApplication = processos.filter((p) => getStatusBadgeInfo(p).status === 'in_application').length;
    const expiring = processos.filter((p) => getStatusBadgeInfo(p).status === 'expiring').length;
    const inAnalysis = processos.filter((p) => getStatusBadgeInfo(p).status === 'in_analysis').length;
    const finished = processos.filter((p) => getStatusBadgeInfo(p).status === 'finished').length;
    const created = processos.filter((p) => getStatusBadgeInfo(p).status === 'created').length;

    return { total, active, inactive, inApplication, expiring, inAnalysis, finished, created };
  }, [processos]);

  // ações rápidas
  const quickActions = useMemo(() => {
    const expiringList = processos
      .filter((p) => getStatusBadgeInfo(p).status === 'expiring')
      .sort(byNewest)
      .slice(0, 4);

    const analyzeNow = processos
      .filter((p) => getAnalyzeButtonState(p).primary.enabled)
      .sort(byNewest)
      .slice(0, 4);

    const openAnalysis = processos
      .filter((p) => getAnalyzeButtonState(p).secondary?.enabled)
      .sort(byNewest)
      .slice(0, 4);

    const latest = processos.slice().sort(byNewest).slice(0, 6);

    return { expiringList, analyzeNow, openAnalysis, latest };
  }, [processos]);

  const goToNewProcess = () => {
    window.location.href = '/painel-admin/processos/novo';
  };

  const goToProcessList = () => {
    window.location.href = '/painel-admin/processos';
  };

  const openAnalysisPage = (slug: string) => {
    window.location.href = `/painel-admin/processos/analise/${slug}`;
  };

  const analyzeProcess = (p: SelectionProcess) => {
    const state = getAnalyzeButtonState(p);
    if (!state.primary.enabled) {
      toast.info(state.primary.label);
      return;
    }
    window.location.href = `/painel-admin/processos/analise/${p.slug}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent" />
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-600/30" />
        </div>
        <p className="mt-6 text-gray-600 font-medium text-lg">Carregando dashboard...</p>
        <p className="text-gray-400 text-sm mt-2">Isso pode levar alguns instantes</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Title
        title="Painel do Administrador"
        icon={Users}
      />

      {/* Erro */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-2xl p-8 text-center shadow-sm mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-red-800 font-semibold text-lg mb-2">Erro ao carregar</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchAllFirstPage}
            className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Tentar Novamente
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Total" value={stats.total} icon={Users} tone="blue" />
        <KpiCard label="Ativos" value={stats.active} icon={CheckCircle} tone="green" />
        <KpiCard label="Em Inscrição" value={stats.inApplication} icon={Clock} tone="emerald" />
        <KpiCard label="Expirando" value={stats.expiring} icon={AlertTriangle} tone="amber" />
        <KpiCard label="Em Análise" value={stats.inAnalysis} icon={ListChecks} tone="orange" />
        <KpiCard label="Finalizados" value={stats.finished} icon={Flag} tone="gray" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <QuickList
          title="⚠️ Expirando em breve"
          subtitle="Processos com inscrições encerrando em até 7 dias"
          emptyText="Nenhum processo expirando no momento."
          items={quickActions.expiringList}
          actionLabel="Abrir"
          onAction={() => (window.location.href = '/painel-admin/processos')}
        />

        <QuickList
          title="🧾 Prontos para analisar"
          subtitle="Inscrições encerradas — liberar análise"
          emptyText="Nenhum processo pronto para análise."
          items={quickActions.analyzeNow}
          actionLabel="Analisar"
          onAction={(p) => analyzeProcess(p)}
        />

        <QuickList
          title="🏁 Finalizados"
          subtitle="Acesso rápido à página de análise"
          emptyText="Nenhum processo finalizado."
          items={quickActions.openAnalysis}
          actionLabel="Abrir análise"
          onAction={(p) => openAnalysisPage(p.slug)}
        />
      </div>

      {/* Últimos processos (mini cards) */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Visão rápida</h2>
            <p className="text-sm text-gray-600">
              Mostrando {filteredProcessos.length} de {processos.length} processos (na página atual).
            </p>
          </div>

          <button
            onClick={goToNewProcess}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <Plus className="w-5 h-5" />
            Criar processo
          </button>
        </div>

        {filteredProcessos.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center">
            <h3 className="text-gray-900 font-semibold text-lg mb-2">Nenhum processo encontrado</h3>
            <p className="text-gray-600 mb-4">Tente ajustar a busca/filtros.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow transition-all"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {quickActions.latest.map((p) => {
              const statusInfo = getStatusBadgeInfo(p);
              const StatusIcon = statusInfo.icon;
              const analyzeState = getAnalyzeButtonState(p);
              const PrimaryIcon = analyzeState.primary.icon;

              return (
                <div key={p.id} className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all bg-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-gray-900 line-clamp-2">{p.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{p.course}</p>
                    </div>

                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.color} ${statusInfo.textColor}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusInfo.label}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {formatDate(p.beginning_date)} → {formatDate(p.ending_date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{p.number_vacancies} vaga(s)</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => window.location.href = `/painel-admin/processos`}
                      className="flex-1 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow transition-all"
                    >
                      Ver lista
                    </button>

                    <button
                      onClick={() => {
                        if (analyzeState.secondary?.enabled) return openAnalysisPage(p.slug);
                        return analyzeProcess(p);
                      }}
                      disabled={!analyzeState.primary.enabled && !analyzeState.secondary?.enabled}
                      className={`flex-1 px-4 py-2 rounded-xl font-medium transition-all ${
                        analyzeState.secondary?.enabled || analyzeState.primary.enabled
                          ? 'bg-gradient-to-r from-purple-600 to-violet-700 text-white hover:shadow hover:scale-[1.01]'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span className="inline-flex items-center justify-center gap-2">
                        {analyzeState.secondary?.enabled ? <Eye className="w-4 h-4" /> : <PrimaryIcon className="w-4 h-4" />}
                        {analyzeState.secondary?.enabled ? 'Abrir' : 'Analisar'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={goToProcessList}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-medium bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow transition-all"
          >
            Ver todos os processos
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------ UI components ------------------ */

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: any;
  tone: 'blue' | 'green' | 'emerald' | 'amber' | 'orange' | 'gray';
}) {
  const toneMap: Record<string, { bg: string; iconBg: string; icon: string }> = {
    blue: { bg: 'from-blue-50 to-indigo-50', iconBg: 'bg-blue-100', icon: 'text-blue-700' },
    green: { bg: 'from-emerald-50 to-green-50', iconBg: 'bg-emerald-100', icon: 'text-emerald-700' },
    emerald: { bg: 'from-emerald-50 to-teal-50', iconBg: 'bg-emerald-100', icon: 'text-emerald-700' },
    amber: { bg: 'from-amber-50 to-orange-50', iconBg: 'bg-amber-100', icon: 'text-amber-700' },
    orange: { bg: 'from-orange-50 to-amber-50', iconBg: 'bg-orange-100', icon: 'text-orange-700' },
    gray: { bg: 'from-gray-50 to-slate-50', iconBg: 'bg-gray-100', icon: 'text-gray-700' },
  };

  const t = toneMap[tone];

  return (
    <div className={`bg-gradient-to-br ${t.bg} rounded-2xl border border-gray-200 shadow-sm p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-gray-600 font-medium">{label}</div>
          <div className="text-3xl font-bold text-gray-900 mt-1">{value}</div>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${t.iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${t.icon}`} />
        </div>
      </div>
    </div>
  );
}

function QuickList({
  title,
  subtitle,
  items,
  emptyText,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  items: SelectionProcess[];
  emptyText: string;
  actionLabel: string;
  onAction: (p: SelectionProcess) => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm text-gray-600 text-center">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((p) => {
            const statusInfo = getStatusBadgeInfo(p);
            const StatusIcon = statusInfo.icon;

            return (
              <div key={p.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-900 line-clamp-1">{p.title}</div>
                    <div className="text-sm text-gray-600 line-clamp-1">{p.course}</div>
                    <div className="text-xs text-gray-500 mt-1">Até {formatDate(p.ending_date)}</div>
                  </div>

                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${statusInfo.color} ${statusInfo.textColor}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statusInfo.label}
                  </span>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={() => onAction(p)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:shadow transition-all"
                  >
                    {actionLabel}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
