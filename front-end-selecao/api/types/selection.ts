// Tipos base da API
export interface SelectionProcess {
    id: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    title: string;
    subtitle: string;
    description: string;
    course: string;
    slug: string;
    beginning_date: string;
    ending_date: string;
    period_accepted: string;
    bout: string;
    weekly_workload: string;
    salary: string;
    notice_doc: string;
    number_vacancies: number;
    local: string;
    requirements: string;
    benefits: string;
    process_banner: string;
    status: 'created' | 'in_application' | 'in_analysis' | 'finished';
    /** Total de inscrições (candidatos) no processo — preenchido pela API na listagem/detalhe */
    enrollments_count?: number;
    analysis_start_date?: string | null;
    has_interview?: boolean;
    has_essay?: boolean;
    include_portfolio_in_score?: boolean;
    include_certificates_in_score?: boolean;
    notice_documents: NoticeDocument[];

    include_curriculum_in_score?: boolean;
    weight_curriculum?: number;
    weight_school_records?: number;
    weight_certificates?: number;
    weight_portfolio?: number;
    weight_interview?: number;
    weight_essay?: number;
}

export interface ApiResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface Benefit {
    id: number;
    value: string;
}

export interface Prerequisite {
    id: number;
    value: string;
}

type Bout = 'M' | 'T' | 'E' | '';

const BOUT_OPTIONS: Array<{ value: Exclude<Bout, ''>; label: string }> = [
    { value: 'M', label: 'Matutino' },
    { value: 'T', label: 'Vespertino' },
    { value: 'E', label: 'Escala' },
];

export interface NoticeDocument {
    id: number;
    file: string;        // URL do arquivo
    name: string;
    order?: number;
    uploaded_at: string;
}

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
    bout: Bout;
    has_interview?: boolean;
    has_essay?: boolean;
    include_portfolio_in_score?: boolean;
    include_certificates_in_score?: boolean;
    notice_documents?: NoticeDocument[];
}