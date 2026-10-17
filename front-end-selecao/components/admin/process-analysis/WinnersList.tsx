'use client';

import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowDownUp,
  CheckCircle2,
  ClipboardList,
  Mail,
  Medal,
  Phone,
  RefreshCw,
  Star,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useReplaceWinner, useWinnerDecision } from '@/api/hooks/useProcessAnalysis';
import type { Application } from '@/components/admin/process-analysis/types';
import Modal from '@/components/ui/Modal';

// ----------------------------------------------------------------------
//  Tipos e helpers
// ----------------------------------------------------------------------
type WinnerStatus = 'pending' | 'accepted' | 'declined' | 'replaced';
type PendingDecision = {
    application: Application;
    decision: 'accepted' | 'declined';
} | null;

function formatScore(v: unknown): string {
    if (v === null || v === undefined) return 'N/A';
    const n = typeof v === 'number' ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n.toFixed(2) : 'N/A';
}

function normalizeWinnerStatus(status: unknown): WinnerStatus {
    if (!status) return 'pending';
    const s = String(status).toLowerCase();
    if (s === 'accepted') return 'accepted';
    if (s === 'declined') return 'declined';
    if (s === 'replaced') return 'replaced';
    return 'pending'; // default
}

function statusBadge(status: WinnerStatus) {
    switch (status) {
        case 'accepted':
            return { label: 'ACEITOU', cls: 'bg-success-soft text-success border-success/30' };
        case 'declined':
            return { label: 'DESISTIU', cls: 'bg-destructive-soft text-destructive border-destructive/30' };
        case 'replaced':
            return { label: 'SUBSTITUÍDO', cls: 'bg-muted text-foreground/80 border-border' };
        default:
            return { label: 'PENDENTE', cls: 'bg-warning-soft text-warning border-warning/30' };
    }
}

// ----------------------------------------------------------------------
//  Props
// ----------------------------------------------------------------------
interface WinnersListProps {
    processId: number;
    processSlug: string;
    processTitle: string;
    numberVacancies: number;
    winners: Application[];      // endpoint /winners/
    applications: Application[]; // lista completa para ranking
    isLocked?: boolean;
}

// ----------------------------------------------------------------------
//  Componente principal
// ----------------------------------------------------------------------
export default function WinnersList({
    processId,
    processSlug,
    processTitle,
    numberVacancies,
    winners,
    applications,
    isLocked = false,
}: WinnersListProps) {
    const queryClient = useQueryClient();
    const winnerDecision = useWinnerDecision();
    const replaceWinner = useReplaceWinner();

    const [notesMap, setNotesMap] = useState<Record<number, string>>({});
    const [pendingDecision, setPendingDecision] = useState<PendingDecision>(null);

    // --------------------------------------------------------------
    //  Vencedores ordenados por rank_position
    // --------------------------------------------------------------
    const winnersSorted = useMemo(() => {
        return [...(winners ?? [])].sort((a, b) => {
            const ra = a.rank_position ?? 999999;
            const rb = b.rank_position ?? 999999;
            return ra - rb;
        });
    }, [winners]);

    // --------------------------------------------------------------
    //  Lista de espera: candidatos com rank, não vencedores e que NÃO desistiram/substituídos
    // --------------------------------------------------------------
    const waitlist = useMemo(() => {
        const all = [...(applications ?? [])]
            .filter((app) => {
                // Tem posição no ranking?
                if (app.rank_position == null) return false;

                // Não é vencedor atual
                if (app.is_winner === true) return false;

                // Não está com status "declined" ou "replaced" (não devem constar na espera)
                const status = normalizeWinnerStatus(app.winner_status);
                return status !== 'declined' && status !== 'replaced';
            })
            .sort((a, b) => {
                const ra = a.rank_position ?? 999999;
                const rb = b.rank_position ?? 999999;
                return ra - rb;
            });

        return all;
    }, [applications]);

    // --------------------------------------------------------------
    //  Atualizar queries após qualquer mutação
    // --------------------------------------------------------------
    const refreshAll = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['process-winners', processId] }),
            queryClient.invalidateQueries({ queryKey: ['process-applications', processSlug] }),
            queryClient.invalidateQueries({ queryKey: ['process-analysis', processSlug] }),
        ]);
    };

    // --------------------------------------------------------------
    //  Marcar decisão (aceitou / desistiu)
    // --------------------------------------------------------------
    const validateDecision = (app: Application): boolean => {
        if (isLocked) return false;
        const winnerStatus = normalizeWinnerStatus(app.winner_status);
        const canChangeBeforeFinalize =
            app.is_winner === true ||
            winnerStatus === 'pending' ||
            winnerStatus === 'accepted' ||
            winnerStatus === 'declined';

        if (!canChangeBeforeFinalize) {
            toast.error('Somente candidatos vencedores podem receber decisão de aceite/desistência.');
            return false;
        }
        return true;
    };

    const requestDecision = (app: Application, decision: 'accepted' | 'declined') => {
        if (!validateDecision(app)) return;
        setPendingDecision({ application: app, decision });
    };

    const handleDecision = async (app: Application, decision: 'accepted' | 'declined') => {
        if (!validateDecision(app)) return;

        try {
            await winnerDecision.mutateAsync({
                applicationId: app.id,
                decision: decision === 'accepted' ? 'accepted' : 'declined',
                notes: notesMap[app.id] ?? null,
            });

            toast.success(
                decision === 'accepted'
                    ? '✅ Vencedor marcado como ACEITOU'
                    : '⏹️ Vencedor marcado como DESISTIU'
            );
            await refreshAll();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao registrar decisão');
        }
    };

    const confirmDecision = async () => {
        if (!pendingDecision) return;
        await handleDecision(pendingDecision.application, pendingDecision.decision);
        setPendingDecision(null);
    };

    // --------------------------------------------------------------
    //  Substituir vencedor atual pelo próximo da lista
    // --------------------------------------------------------------
    const handleReplace = async (currentWinner: Application) => {
        if (isLocked) return;

        const status = normalizeWinnerStatus(currentWinner.winner_status);
        if (status !== 'pending') {
            toast.error('Somente o vencedor com status PENDENTE pode ser substituído.');
            return;
        }

        if (waitlist.length === 0) {
            toast.error('Não há candidatos na lista de espera.');
            return;
        }

        const next = waitlist[0];
        try {
            await replaceWinner.mutateAsync({
                processSlug,
                declined_application_id: currentWinner.id,
                new_winner_application_id: next.id,
                notes:
                    notesMap[currentWinner.id] ??
                    `Substituição automática pelo próximo da lista (rank #${next.rank_position})`,
            });

            toast.success('🔄 Substituição realizada com sucesso!');
            await refreshAll();
        } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Erro ao substituir vencedor');
        }
    };

    const isMutating = winnerDecision.isPending || replaceWinner.isPending;

    // --------------------------------------------------------------
    //  Renderização
    // --------------------------------------------------------------
    if (winnersSorted.length === 0) {
        return (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8 text-center">
                <Trophy className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-foreground/80 mb-2">
                    Nenhum ganhador selecionado ainda
                </h3>
                <p className="text-muted-foreground">Aguardando seleção automática.</p>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="bg-warning p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-8 h-8 text-white" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Resultados</h2>
                            <p className="text-warning text-sm">
                                {winnersSorted.length} de {numberVacancies} vaga(s) preenchida(s)
                            </p>
                        </div>
                    </div>

                    <div className="bg-white/20 rounded-lg px-4 py-2">
                        <span className="text-white font-bold text-lg">{processTitle}</span>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-8">
                {!isLocked && (
                    <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-warning">
                        As decisões de <strong>aceitou/desistiu</strong> são provisórias e podem ser alteradas até a finalização do processo.
                    </div>
                )}

                {/* ---------- VENCEDORES ---------- */}
                <section>
                    <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-5 h-5 text-warning" />
                            <h3 className="text-lg font-bold text-foreground">Vencedores</h3>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <RefreshCw className={`w-4 h-4 ${isMutating ? 'animate-spin' : ''}`} />
                            {isMutating ? 'Atualizando...' : 'Atualizado'}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {winnersSorted.map((winner, index) => {
                            const status = normalizeWinnerStatus(winner.winner_status);
                            const badge = statusBadge(status);
                            const isCurrentWinner = status === 'pending';
                            const canChangeDecision =
                                winner.is_winner === true ||
                                status === 'pending' ||
                                status === 'accepted' ||
                                status === 'declined';
                            const score = winner.average_score ?? winner.final_score ?? null;

                            return (
                                <div
                                    key={winner.id}
                                    className="bg-warning-soft rounded-xl border-2 border-warning/30 p-6 hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        {/* Coluna da esquerda: posição + dados do candidato */}
                                        <div className="flex items-start gap-4 flex-1 min-w-[260px]">
                                            <div className="flex-shrink-0">
                                                {index === 0 ? (
                                                    <div className="w-16 h-16 rounded-full bg-warning flex items-center justify-center shadow-sm">
                                                        <Medal className="w-8 h-8 text-white" />
                                                    </div>
                                                ) : index === 1 ? (
                                                    <div className="w-16 h-16 rounded-full bg-input flex items-center justify-center shadow-sm">
                                                        <Medal className="w-8 h-8 text-white" />
                                                    </div>
                                                ) : index === 2 ? (
                                                    <div className="w-16 h-16 rounded-full bg-warning flex items-center justify-center shadow-sm">
                                                        <Medal className="w-8 h-8 text-white" />
                                                    </div>
                                                ) : (
                                                    <div className="w-16 h-16 rounded-full bg-primary-soft flex items-center justify-center">
                                                        <span className="text-2xl font-bold text-primary">
                                                            {index + 1}º
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <h4 className="text-xl font-bold text-foreground">
                                                        {winner.candidate?.name}
                                                    </h4>
                                                    <span className={`text-xs px-2 py-1 rounded-full font-bold border ${badge.cls}`}>
                                                        {badge.label}
                                                    </span>
                                                    {winner.rank_position != null && (
                                                        <span className="text-xs px-2 py-1 rounded-full bg-primary-soft text-primary font-bold">
                                                            Rank #{winner.rank_position}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Mail className="w-4 h-4" />
                                                        <span className="text-sm">{winner.candidate?.email}</span>
                                                    </div>
                                                    {winner.candidate?.phone && (
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Phone className="w-4 h-4" />
                                                            <span className="text-sm">{winner.candidate?.phone}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-4">
                                                    <label className="text-xs text-muted-foreground font-medium block mb-1">
                                                        Observação (opcional)
                                                    </label>
                                                    <input
                                                        value={notesMap[winner.id] ?? ''}
                                                        onChange={(e) =>
                                                            setNotesMap((prev) => ({
                                                                ...prev,
                                                                [winner.id]: e.target.value,
                                                            }))
                                                        }
                                                        placeholder="Ex: candidato confirmou por telefone..."
                                                        className="w-full max-w-xl px-3 py-2 border border-input rounded-lg text-sm focus:ring-2 focus:ring-warning focus:border-transparent"
                                                        disabled={isLocked || isMutating || !canChangeDecision}
                                                    />
                                                    {!canChangeDecision && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Este candidato não está elegível para alteração de decisão.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Coluna da direita: pontuação e botões */}
                                        <div className="flex-shrink-0 text-right min-w-[220px]">
                                            <div className="flex items-center gap-2 justify-end mb-2">
                                                <Star className="w-5 h-5 text-warning fill-warning" />
                                                <span className="text-2xl font-bold text-foreground">
                                                    {formatScore(score)}
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">Nota Final Global</div>

                                            <div className="mt-4 flex flex-col gap-2 items-end">
                                                <button
                                                    onClick={() => requestDecision(winner, 'accepted')}
                                                    disabled={isLocked || isMutating || !canChangeDecision}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-success text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <CheckCircle2 className="w-4 h-4" />
                                                    Aceitou
                                                </button>

                                                <button
                                                    onClick={() => requestDecision(winner, 'declined')}
                                                    disabled={isLocked || isMutating || !canChangeDecision}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive text-white hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Desistiu
                                                </button>

                                                <button
                                                    onClick={() => handleReplace(winner)}
                                                    disabled={
                                                        isLocked ||
                                                        isMutating ||
                                                        !isCurrentWinner ||
                                                        waitlist.length === 0
                                                    }
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title={
                                                        !isCurrentWinner
                                                            ? 'Somente vencedor pendente pode ser substituído'
                                                            : waitlist.length === 0
                                                            ? 'Não há candidatos na lista de espera'
                                                            : `Substituir pelo próximo: ${waitlist[0].candidate?.name}`
                                                    }
                                                >
                                                    <ArrowDownUp className="w-4 h-4" />
                                                    Substituir pelo próximo
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ---------- LISTA DE ESPERA ---------- */}
                <section>
                    <div className="flex items-center gap-2 mb-4">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-bold text-foreground">Lista de Espera</h3>
                        <span className="text-sm text-muted-foreground">({waitlist.length})</span>
                    </div>

                    {waitlist.length === 0 ? (
                        <div className="bg-primary-soft border border-primary/30 rounded-xl p-6 text-center text-primary">
                            Nenhum candidato na lista de espera.
                        </div>
                    ) : (
                        <div className="divide-y divide-border border border-border rounded-xl overflow-hidden">
                            {waitlist.map((app) => (
                                <div
                                    key={app.id}
                                    className="p-4 bg-card flex items-center justify-between gap-4 flex-wrap"
                                >
                                    <div className="min-w-[240px]">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary-soft text-primary font-bold">
                                                #{app.rank_position}
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                {app.candidate?.name}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {app.candidate?.email}
                                        </div>
                                    </div>

                                    <div className="text-right min-w-[140px]">
                                        <div className="text-sm text-muted-foreground">Score</div>
                                        <div className="font-bold text-foreground">
                                            {formatScore(app.average_score ?? app.final_score)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>

            <Modal
                isOpen={pendingDecision !== null}
                onClose={() => setPendingDecision(null)}
                title={pendingDecision?.decision === 'accepted' ? 'Confirmar aceite' : 'Confirmar desistência'}
                subtitle="Esta ação altera o status do candidato vencedor."
                size="sm"
                footer={
                    <>
                        <button
                            onClick={() => setPendingDecision(null)}
                            disabled={isMutating}
                            className="px-4 py-2 rounded-lg border border-input text-foreground/80 hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={confirmDecision}
                            disabled={isMutating}
                            className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                                pendingDecision?.decision === 'accepted'
                                    ? 'bg-success hover:bg-success'
                                    : 'bg-destructive hover:bg-destructive'
                            }`}
                        >
                            {isMutating ? 'Confirmando...' : 'Confirmar'}
                        </button>
                    </>
                }
            >
                <div className="p-6 text-sm text-foreground/80">
                    {pendingDecision?.decision === 'accepted' ? (
                        <p>
                            Deseja confirmar que <strong>{pendingDecision.application.candidate?.name}</strong> aceitou a vaga?
                        </p>
                    ) : (
                        <p>
                            Deseja confirmar que <strong>{pendingDecision?.application.candidate?.name}</strong> desistiu da vaga?
                        </p>
                    )}
                </div>
            </Modal>
        </div>
    );
}