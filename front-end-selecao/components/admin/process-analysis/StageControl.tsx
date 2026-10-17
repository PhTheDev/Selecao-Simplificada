// components/admin/process-analysis/StageControl.tsx
import { CheckCircle, Lock, Unlock, Users } from 'lucide-react';
import { SelectionProcess, Application } from './types';
import { PROCESS_STAGES, STAGE_LABELS } from '@/constants/processStages';
import { allCandidatesCompletedStage, getStageProgress } from '@/utils/processAnalysis';

interface StageControlProps {
    selectionProcess: SelectionProcess;
    applications: Application[];
    onAdvanceToStage2: () => void;
    onCompleteAnalysis: () => void;
    onFinishProcess: () => void;
    isLoading?: boolean;
}

export function StageControl({
    selectionProcess,
    applications,
    onAdvanceToStage2,
    onCompleteAnalysis,
    onFinishProcess,
    isLoading = false,
}: StageControlProps) {
    const allCompletedStage1 = allCandidatesCompletedStage(applications, 'stage1');
    const allCompletedStage2 = allCandidatesCompletedStage(applications, 'stage2');
    const stage1Progress = getStageProgress(applications, 'stage1');
    const stage2Progress = getStageProgress(applications, 'stage2');

    const getStageStatus = (stage: string) => {
        return selectionProcess.analysis_stage === stage;
    };

    const getStageClassName = (stage: string, activeColor: string) => {
        const isActive = getStageStatus(stage);
        return `flex items-center gap-2 ${isActive ? activeColor : 'text-muted-foreground/70'}`;
    };

    const getStageIndicatorClassName = (stage: string, activeBg: string, activeBorder: string) => {
        const isActive = getStageStatus(stage);
        return `w-8 h-8 rounded-full flex items-center justify-center ${
            isActive ? `${activeBg} border-2 ${activeBorder}` : 'bg-muted border-2 border-input'
        }`;
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground mb-2">Controle de Etapas do Processo</h3>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            {/* Etapa 1 */}
                            <div className={getStageClassName(PROCESS_STAGES.STAGE1_DOCUMENTS, 'text-primary')}>
                                <div className={getStageIndicatorClassName(
                                    PROCESS_STAGES.STAGE1_DOCUMENTS,
                                    'bg-primary-soft',
                                    'border-primary'
                                )}>
                                    1
                                </div>
                                <span className="font-medium">{STAGE_LABELS[PROCESS_STAGES.STAGE1_DOCUMENTS]}</span>
                            </div>
                            <div className="w-8 h-0.5 bg-input"></div>
                            
                            {/* Etapa 2 */}
                            <div className={getStageClassName(PROCESS_STAGES.STAGE2_INTERVIEW, 'text-primary')}>
                                <div className={getStageIndicatorClassName(
                                    PROCESS_STAGES.STAGE2_INTERVIEW,
                                    'bg-primary-soft',
                                    'border-primary'
                                )}>
                                    2
                                </div>
                                <span className="font-medium">{STAGE_LABELS[PROCESS_STAGES.STAGE2_INTERVIEW]}</span>
                            </div>
                            <div className="w-8 h-0.5 bg-input"></div>
                            
                            {/* Análise Concluída */}
                            <div className={getStageClassName(PROCESS_STAGES.ANALYSIS_COMPLETED, 'text-success')}>
                                <div className={getStageIndicatorClassName(
                                    PROCESS_STAGES.ANALYSIS_COMPLETED,
                                    'bg-success-soft',
                                    'border-success'
                                )}>
                                    <CheckCircle className="w-4 h-4" />
                                </div>
                                <span className="font-medium">{STAGE_LABELS[PROCESS_STAGES.ANALYSIS_COMPLETED]}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {selectionProcess.analysis_stage === PROCESS_STAGES.STAGE1_DOCUMENTS && (
                        <button
                            onClick={onAdvanceToStage2}
                            disabled={!allCompletedStage1 || isLoading}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                                allCompletedStage1 && !isLoading
                                    ? 'bg-primary text-primary-foreground hover:shadow-md'
                                    : 'bg-muted text-muted-foreground/70 cursor-not-allowed'
                            }`}
                        >
                            {allCompletedStage1 ? (
                                <>
                                    <Unlock className="w-4 h-4" />
                                    Liberar Etapa 2
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4" />
                                    Aguardando etapa 1
                                </>
                            )}
                        </button>
                    )}

                    {selectionProcess.analysis_stage === PROCESS_STAGES.STAGE2_INTERVIEW && (
                        <button
                            onClick={onCompleteAnalysis}
                            disabled={!allCompletedStage2 || isLoading}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
                                allCompletedStage2 && !isLoading
                                    ? 'bg-success text-white hover:shadow-md'
                                    : 'bg-muted text-muted-foreground/70 cursor-not-allowed'
                            }`}
                        >
                            {allCompletedStage2 ? (
                                <>
                                    <CheckCircle className="w-4 h-4" />
                                    Concluir Análise
                                </>
                            ) : (
                                <>
                                    <Users className="w-4 h-4" />
                                    Aguardando etapa 2
                                </>
                            )}
                        </button>
                    )}

                    {selectionProcess.analysis_stage === PROCESS_STAGES.ANALYSIS_COMPLETED && 
                     selectionProcess.status !== 'finished' && (
                        <button
                            onClick={onFinishProcess}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Finalizar Processo
                        </button>
                    )}
                </div>
            </div>

            {/* Status da Etapa Atual */}
            <div className="mt-4 p-3 bg-background rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="text-sm text-muted-foreground">
                        {selectionProcess.analysis_stage === PROCESS_STAGES.STAGE1_DOCUMENTS && (
                            <span>
                                Etapa 1 em andamento - {stage1Progress.completed} de {stage1Progress.total} candidatos avaliados
                            </span>
                        )}
                        {selectionProcess.analysis_stage === PROCESS_STAGES.STAGE2_INTERVIEW && (
                            <span>
                                Etapa 2 em andamento - {stage2Progress.completed} de {stage2Progress.total} candidatos avaliados
                            </span>
                        )}
                        {selectionProcess.analysis_stage === PROCESS_STAGES.ANALYSIS_COMPLETED && 
                         selectionProcess.status !== 'finished' && (
                            <span className="text-success font-medium">
                                Análise concluída - Pronto para finalizar o processo
                            </span>
                        )}
                        {selectionProcess.status === 'finished' && (
                            <span className="text-primary font-medium">Processo finalizado</span>
                        )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Total de candidatos: {applications.length}
                    </div>
                </div>
            </div>
        </div>
    );
}

