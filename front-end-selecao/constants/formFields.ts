// constants/formFields.ts

export const REQUIRED_FIELDS = [
    'title',
    'subtitle',
    'course',
    'local',
    'beginning_date',
    'ending_date',
    'salary',
    'weekly_workload',
    'period_accepted',
    'description',
    'slug'
] as const;

export const FIELD_LABELS: Record<string, string> = {
    title: 'título',
    subtitle: 'subtítulo',
    course: 'curso',
    local: 'local',
    beginning_date: 'data de início',
    ending_date: 'data de término',
    salary: 'salário',
    weekly_workload: 'carga horária semanal',
    period_accepted: 'período aceito',
    description: 'descrição',
    slug: 'slug',
};

export const FILE_LIMITS = {
    BANNER_MAX_SIZE: 5 * 1024 * 1024, // 5MB
    DOCUMENT_MAX_SIZE: 10 * 1024 * 1024, // 10MB
} as const;

export const DRAFT_STORAGE_KEY = 'novo-processo-seletivo-draft';
export const DRAFT_EXPIRY_HOURS = 24;

