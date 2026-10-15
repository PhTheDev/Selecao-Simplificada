export type SelectionProcessAnalysisStage =
    | 'stage1_documents'
    | 'stage2_interview'
    | 'analysis_completed';

export type WinnerStatus = 'none' | 'pending' | 'accepted' | 'declined' | 'replaced';

export interface Candidate {
    id: number;
    name: string;
    email: string;
    phone?: string | null;
    cpf?: string | null;
}

/** Campos de nota editáveis na etapa 1 (salvamento parcial / colaborativo). */
export type Stage1ScoreField = 'curriculum' | 'school_records' | 'course_certificates' | 'portfolio';

export type Stage1SaveMode = 'documents' | 'draft_scores' | 'complete';

export interface Stage1SaveOptions {
  silent?: boolean;
  mode?: Stage1SaveMode;
}

export interface Stage1Evaluation {
  id?: number;
  application: number;

  identity_document_valid: boolean | null;
  school_records_valid: boolean | null;
  frequency_statement_valid: boolean | null;
  vitae_curriculum_valid: boolean | null;
  course_certificates_valid: boolean | null;
  portfolio_link_valid?: boolean | null;

  identity_document_rejection_reason?: string | null;
  school_records_rejection_reason?: string | null;
  frequency_statement_rejection_reason?: string | null;
  vitae_curriculum_rejection_reason?: string | null;
  course_certificates_rejection_reason?: string | null;
  portfolio_link_rejection_reason?: string | null;

  curriculum_score: number;
  school_records_score: number;
  course_certificates_score?: number | null;
  portfolio_score?: number | null;

  notes?: string | null;
  total_score: number;
}


export interface Stage2Evaluation {
    id?: number;
    application: number;

    interview_score: number;
    essay_score?: number | null;

    interview_notes?: string | null;
    essay_notes?: string | null;

    total_score: number;
}

export interface Application {
    id: number;
    status: 'pending' | 'approved' | 'rejected';
    application_date: string;

    identity_document: string;
    school_records: string;
    frequency_statement?: string | null;
    vitae_curriculum: string;
    course_certificates?: string | null;
    portfolio_link?: string | null;

    // ✅ Nota final (usada no ranking)
    average_score?: number | string | null;
    final_score?: number | string | null; // fallback

    // ✅ Ranking e resultado
    rank_position?: number | null;
    is_winner?: boolean;
    winner_status?: WinnerStatus | null;
    winner_notes?: string | null;
    winner_updated_at?: string | null;

    candidate: Candidate;

    stage1_evaluation?: Stage1Evaluation | null;
    stage2_evaluation?: Stage2Evaluation | null;
}

export interface SelectionProcess {
    id: number;
    slug: string;
    title: string;
    subtitle: string;
    course: string;

    status: 'created' | 'in_application' | 'in_analysis' | 'finished';
    analysis_stage: SelectionProcessAnalysisStage;

    is_active: boolean;
    number_vacancies?: number | null;

    // ✅ Configurações de avaliação (todas opcionais para compatibilidade)
    has_interview?: boolean;
    has_essay?: boolean;
    include_curriculum_in_score?: boolean;
    include_portfolio_in_score?: boolean;
    include_certificates_in_score?: boolean;

    // ✅ Pesos (opcionais, fallback para valores padrão)
    weight_curriculum?: number;
    weight_school_records?: number;
    weight_certificates?: number;
    weight_portfolio?: number;
    weight_interview?: number;
    weight_essay?: number;

    // ✅ Documentos do edital
    notice_documents?: NoticeDocument[];
    process_banner?: string | null;
}

export interface NoticeDocument {
    id: number;
    file: string;
    name: string;
    order: number;
    uploaded_at: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface SelectWinnersResponse {
    message?: string;
    winners: Application[];
}

export type WinnerDecisionValue = 'accepted' | 'declined' | 'pending';

// ✅ Configuração completa do processo (usada nos componentes de avaliação)
export interface ProcessConfig {
    has_interview?: boolean;
    has_essay?: boolean;
    include_curriculum_in_score?: boolean;
    include_portfolio_in_score?: boolean;
    include_certificates_in_score?: boolean;
    weight_curriculum?: number;
    weight_school_records?: number;
    weight_certificates?: number;
    weight_portfolio?: number;
    weight_interview?: number;
    weight_essay?: number;
}

// ✅ Dados do formulário de criação/edição (pesos como string)
export interface SelectionProcessFormData {
    title: string;
    subtitle: string;
    course: string;
    local: string;
    beginning_date: string;
    ending_date: string;
    salary: string;
    number_vacancies: number;
    is_active: boolean;
    description: string;
    weekly_workload: string;
    period_accepted: string;
    requirements: string;
    benefits: string;
    slug: string;
    bout: string;
    has_interview: boolean;
    has_essay: boolean;
    include_curriculum_in_score: boolean;
    include_portfolio_in_score: boolean;
    include_certificates_in_score: boolean;
    weight_curriculum: string;
    weight_school_records: string;
    weight_certificates: string;
    weight_portfolio: string;
    weight_interview: string;
    weight_essay: string;
}

// ✅ Arrays dinâmicos
export interface Benefit {
    id: number;
    value: string;
}

export interface Prerequisite {
    id: number;
    value: string;
}