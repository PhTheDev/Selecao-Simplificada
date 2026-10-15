'use client';

import {
  useAdvanceToStage2,
  useCompleteAnalysis,
  useFinishProcess,
  useReopenProcess,
  useProcessAnalysis,
  useProcessApplications,
  useProcessWinners,
  useSelectWinners,
} from '@/api/hooks/useProcessAnalysis';

import CandidateList from '@/components/admin/process-analysis/CandidateList';
import { ErrorState } from '@/components/admin/process-analysis/ErrorState';
import Header from '@/components/admin/process-analysis/Header';
import { LoadingState } from '@/components/admin/process-analysis/LoadingState';
import { StageControl } from '@/components/admin/process-analysis/StageControl';
import WinnersList from '@/components/admin/process-analysis/WinnersList';
import Modal from '@/components/ui/Modal';
import { Application } from '@/components/admin/process-analysis/types';

import { useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function ProcessAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();

  const processSlug = params.slug as string;

  const { data: selectionProcess, isLoading: loadingProcess, error: processError } =
    useProcessAnalysis(processSlug);

  const {
    data: applications = [],
    isLoading: loadingApplications,
    refetch: refetchApplications,
    isFetching: isFetchingApplications,
  } = useProcessApplications(processSlug);

  const advanceToStage2Mutation = useAdvanceToStage2();
  const completeAnalysisMutation = useCompleteAnalysis();
  const finishProcessMutation = useFinishProcess();
  const reopenProcessMutation = useReopenProcess();
  const selectWinnersMutation = useSelectWinners();

  const processId = selectionProcess?.id || 0;

  const { data: winners = [], isLoading: loadingWinners } =
    useProcessWinners(processSlug);

  const [confirmAction, setConfirmAction] = useState<null | 'advance' | 'complete' | 'finish'>(null);

  const autoSelectTriggeredRef = useRef(false);

  const handleAdvanceToStage2 = async () => {
    if (!selectionProcess) return;
    try {
      await advanceToStage2Mutation.mutateAsync(selectionProcess.id);
      toast.success('Etapa 2 liberada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['process-analysis', processSlug] });
      queryClient.invalidateQueries({ queryKey: ['process-applications', processSlug] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao avançar para etapa 2');
    }
  };

  const handleCompleteAnalysis = async () => {
    if (!selectionProcess) return;
    try {
      await completeAnalysisMutation.mutateAsync(selectionProcess.id);
      toast.success('Análise concluída com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['process-analysis', processSlug] });
      // winners será resolvido pelo auto-select no useEffect
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao concluir análise');
    }
  };

  const handleFinishProcess = async () => {
    if (!selectionProcess) return;
    try {
      await finishProcessMutation.mutateAsync(selectionProcess.id);
      toast.success('Processo finalizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['process-analysis', processSlug] });
      queryClient.invalidateQueries({ queryKey: ['process-applications', processSlug] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao finalizar processo');
    }
  };

  const handleSelectWinners = async () => {
    if (!selectionProcess) return;
    try {
      const result = await selectWinnersMutation.mutateAsync(processSlug);
      toast.success(result.message || 'Ganhadores selecionados automaticamente!');

      queryClient.invalidateQueries({ queryKey: ['process-winners', processSlug] });
      queryClient.invalidateQueries({ queryKey: ['process-applications', processSlug] });
      queryClient.invalidateQueries({ queryKey: ['process-analysis', processSlug] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao selecionar ganhadores');
    }
  };

  const handleReopenProcess = async () => {
    if (!selectionProcess) return;
    try {
      await reopenProcessMutation.mutateAsync(selectionProcess.id);
      toast.success('Processo reaberto com sucesso para ajustes de resultado.');
      queryClient.invalidateQueries({ queryKey: ['process-analysis', processSlug] });
      queryClient.invalidateQueries({ queryKey: ['process-applications', processSlug] });
      queryClient.invalidateQueries({ queryKey: ['process-winners', processSlug] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao reabrir processo');
    }
  };

  // ✅ AUTO-SELEÇÃO: sem clique
  useEffect(() => {
    if (!selectionProcess) return;

    const stageOk = selectionProcess.analysis_stage === 'analysis_completed';
    const noWinnersYet = (winners?.length ?? 0) === 0;

    if (stageOk && noWinnersYet && !autoSelectTriggeredRef.current && !selectWinnersMutation.isPending) {
      autoSelectTriggeredRef.current = true;
      handleSelectWinners();
    }

    if ((winners?.length ?? 0) > 0) {
      autoSelectTriggeredRef.current = true;
    }
  }, [selectionProcess?.analysis_stage, selectionProcess?.id, winners?.length]);

  const handleApplicationUpdate = (updated: Application) => {
    queryClient.setQueryData(['process-applications', processSlug], (old: Application[] = []) =>
      old.map((app) => (app.id === updated.id ? updated : app))
    );
  };

  const requestAdvanceToStage2 = () => setConfirmAction('advance');
  const requestCompleteAnalysis = () => setConfirmAction('complete');

  const winnerDecisionSummary = useMemo(() => {
    const summary = { accepted: 0, declined: 0, pending: 0 };
    for (const w of winners) {
      const status = String(w.winner_status || 'pending').toLowerCase();
      if (status === 'accepted') summary.accepted += 1;
      else if (status === 'declined') summary.declined += 1;
      else summary.pending += 1;
    }
    return summary;
  }, [winners]);

  const requestFinishProcess = () => {
    if (winnerDecisionSummary.pending > 0) {
      toast.warning(
        `Existem ${winnerDecisionSummary.pending} vencedor(es) com decisão pendente. Revise no modal antes de confirmar a finalização.`
      );
    }
    setConfirmAction('finish');
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;

    if (confirmAction === 'advance') await handleAdvanceToStage2();
    if (confirmAction === 'complete') await handleCompleteAnalysis();
    if (confirmAction === 'finish') await handleFinishProcess();

    setConfirmAction(null);
  };

  const isLoading = loadingProcess || loadingApplications || loadingWinners;
  const isMutating =
    advanceToStage2Mutation.isPending ||
    completeAnalysisMutation.isPending ||
    finishProcessMutation.isPending ||
    reopenProcessMutation.isPending ||
    selectWinnersMutation.isPending;

  if (isLoading) return <LoadingState />;

  if (processError || !selectionProcess) {
    return (
      <ErrorState
        error={processError?.message || 'Processo não encontrado'}
        onBack={() => router.push('/painel-admin/processos')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <Header process={selectionProcess} onBack={() => router.push('/painel-admin/processos')} />

      <StageControl
        selectionProcess={selectionProcess}
        applications={applications}
        onAdvanceToStage2={requestAdvanceToStage2}
        onCompleteAnalysis={requestCompleteAnalysis}
        onFinishProcess={requestFinishProcess}
        isLoading={isMutating}
      />

      {selectionProcess.analysis_stage === 'analysis_completed' && (
        <div className="mb-6">
          {selectionProcess.status === 'finished' && (
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleReopenProcess}
                disabled={reopenProcessMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reopenProcessMutation.isPending
                  ? 'Reabrindo...'
                  : 'Reabrir processo para substituir vencedor'}
              </button>
            </div>
          )}

          <WinnersList
            processId={selectionProcess.id}
            processSlug={processSlug}
            winners={winners}
            applications={applications}
            processTitle={selectionProcess.title}
            numberVacancies={selectionProcess.number_vacancies || 1}
            isLocked={selectionProcess.status === 'finished'}
          />

          {/* fallback manual se quiser */}
          {winners.length === 0 && (
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSelectWinners}
                disabled={selectWinnersMutation.isPending}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectWinnersMutation.isPending ? 'Selecionando...' : '🏆 Selecionar Ganhadores (Manual)'}
              </button>
            </div>
          )}
        </div>
      )}

      <CandidateList
        applications={applications}
        onUpdate={handleApplicationUpdate}
        processId={selectionProcess.id}
        currentStage={selectionProcess.analysis_stage}
        processConfig={{
        has_interview: selectionProcess.has_interview,          // ainda útil?
        has_essay: selectionProcess.has_essay,
        include_curriculum_in_score: selectionProcess.include_curriculum_in_score, // ✅
        include_portfolio_in_score: selectionProcess.include_portfolio_in_score,
        include_certificates_in_score: selectionProcess.include_certificates_in_score,
        // ✅ pesos da etapa 1
        weight_curriculum: selectionProcess.weight_curriculum,
        weight_school_records: selectionProcess.weight_school_records,
        weight_certificates: selectionProcess.weight_certificates,
        weight_portfolio: selectionProcess.weight_portfolio,
        // ✅ pesos da etapa 2
        weight_interview: selectionProcess.weight_interview,
        weight_essay: selectionProcess.weight_essay,
        }}
        onRefreshList={() => refetchApplications()}
        isRefreshingList={isFetchingApplications}
      />

      <Modal
        isOpen={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title="Confirmar mudança de etapa"
        subtitle="Após confirmar, esta etapa não poderá ser alterada."
        size="sm"
        footer={
          <>
            <button
              onClick={() => setConfirmAction(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={executeConfirmedAction}
              disabled={isMutating}
              className="px-4 py-2 rounded-lg bg-[#005f73] text-white hover:bg-[#0a9396] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isMutating ? 'Confirmando...' : 'Confirmar'}
            </button>
          </>
        }
      >
        <div className="p-6 text-sm text-gray-700">
          {confirmAction === 'advance' && (
            <p>
              Deseja realmente alterar para a proxima etapa (Etapa 2)? Esta acao nao podera ser desfeita.
            </p>
          )}
          {confirmAction === 'complete' && (
            <p>
              Deseja realmente concluir a analise? Depois disso, esta etapa nao podera ser alterada.
            </p>
          )}
          {confirmAction === 'finish' && (
            <div className="space-y-3">
              <p>Deseja realmente finalizar o processo? Apos isso, o processo nao podera ser alterado.</p>
              {winnerDecisionSummary.pending > 0 && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-amber-800">
                  Atenção: há vencedor(es) com decisão pendente. Ao finalizar, essas decisões também serão congeladas.
                </p>
              )}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs">
                <p className="font-semibold text-gray-700">Resumo das decisoes:</p>
                <p>Aceitou: {winnerDecisionSummary.accepted}</p>
                <p>Desistiu: {winnerDecisionSummary.declined}</p>
                <p>Pendente: {winnerDecisionSummary.pending}</p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
