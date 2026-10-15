import { Application } from '@/components/admin/process-analysis/types';
import { PROCESS_STAGES } from '@/constants/processStages';

type StageKey = 'stage1' | 'stage2';

export function allCandidatesCompletedStage(applications: Application[], stage: StageKey): boolean {
    if (!applications?.length) return false;

    if (stage === 'stage1') {
        return applications.every((a) => !!a.stage1_evaluation);
    }

    // stage2 só faz sentido se já tem stage1 concluído
    return applications.every((a) => !!a.stage1_evaluation && !!a.stage2_evaluation);
}

export function getStageProgress(applications: Application[], stage: StageKey) {
    const total = applications?.length || 0;
    if (!total) return { total: 0, completed: 0 };

    let completed = 0;

    if (stage === 'stage1') {
        completed = applications.filter((a) => !!a.stage1_evaluation).length;
    } else {
        completed = applications.filter((a) => !!a.stage1_evaluation && !!a.stage2_evaluation).length;
    }

    return { total, completed };
}

export function isStage2Available(currentStage: string) {
    return currentStage === PROCESS_STAGES.STAGE2_INTERVIEW || currentStage === PROCESS_STAGES.ANALYSIS_COMPLETED;
}
