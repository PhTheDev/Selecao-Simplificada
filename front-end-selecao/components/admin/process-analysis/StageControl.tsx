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
        return `flex items-center gap-2 ${isActive ? activeColor : 'text-gray-400'}`;
    };

    const getStageIndicatorClassName = (stage: string, activeBg: string, activeBorder: string) => {
        const isActive = getStageStatus(stage);
        return `w-8 h-8 rounded-full flex items-center justify-center ${
            isActive ? `${activeBg} border-2 ${activeBorder}` : 'bg-gray-100 border-2 border-gray-300'
        }`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Controle de Etapas do Processo</h3>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            {/* Etapa 1 */}
                            <div className={getStageClassName(PROCESS_STAGES.STAGE1_DOCUMENTS, 'text-blue-600')}>
                                <div className={getStageIndicatorClassName(
                                    PROCESS_STAGES.STAGE1_DOCUMENTS,
                                    'bg-blue-100',
                                    'border-blue-600'
                                )}>
                                    1
                                </div>
                                <span className="font-medium">{STAGE_LABELS[PROCESS_STAGES.STAGE1_DOCUMENTS]}</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                            
                            {/* Etapa 2 */}
                            <div className={getStageClassName(PROCESS_STAGES.STAGE2_INTERVIEW, 'text-purple-600')}>
                                <div className={getStageIndicatorClassName(
                                    PROCESS_STAGES.STAGE2_INTERVIEW,
                                    'bg-purple-100',
                                    'border-purple-600'
                                )}>
                                    2
                                </div>
                                <span className="font-medium">{STAGE_LABELS[PROCESS_STAGES.STAGE2_INTERVIEW]}</span>
                            </div>
                            <div className="w-8 h-0.5 bg-gray-300"></div>
                            
                            {/* Análise Concluída */}
                            <div className={getStageClassName(PROCESS_STAGES.ANALYSIS_COMPLETED, 'text-green-600')}>
                                <div className={getStageIndicatorClassName(
                                    PROCESS_STAGES.ANALYSIS_COMPLETED,
                                    'bg-green-100',
                                    'border-green-600'
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
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-lg'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:shadow-lg'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Finalizar Processo
                        </button>
                    )}
                </div>
            </div>

            {/* Status da Etapa Atual */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="text-sm text-gray-600">
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
                            <span className="text-green-600 font-medium">
                                Análise concluída - Pronto para finalizar o processo
                            </span>
                        )}
                        {selectionProcess.status === 'finished' && (
                            <span className="text-blue-600 font-medium">Processo finalizado</span>
                        )}
                    </div>
                    <div className="text-sm text-gray-500">
                        Total de candidatos: {applications.length}
                    </div>
                </div>
            </div>
        </div>
    );
}

