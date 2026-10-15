export const PROCESS_STAGES = {
    STAGE1_DOCUMENTS: 'stage1_documents',
    STAGE2_INTERVIEW: 'stage2_interview',
    ANALYSIS_COMPLETED: 'analysis_completed',
} as const;

export const STAGE_LABELS: Record<string, string> = {
    [PROCESS_STAGES.STAGE1_DOCUMENTS]: 'Etapa 1 - Documentos',
    [PROCESS_STAGES.STAGE2_INTERVIEW]: 'Etapa 2 - Entrevista',
    [PROCESS_STAGES.ANALYSIS_COMPLETED]: 'Análise Concluída',
};
