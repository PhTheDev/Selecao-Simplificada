/**
 * Validation utilities for application form
 */

import { isSafeHttpUrl } from '@/utils/safeNavigation';

const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ApplicationFormData {
    name: string;
    cpf: string;
    phone: string;
    college: string;
    period: string;
    semester: string;
    cep: string;
    address: string;
    complement: string;
    neighborhood: string;
    city: string;
    uf: string;
    identity_document: File | null;
    school_records: File | null;
    frequency_statement: File | null;
    vitae_curriculum: File | null;
    course_certificates: File | null;
    portfolio_link: string;
}

export const isValidUrl = (url: string): boolean => {
    return isSafeHttpUrl(url);
};

export const validateStep = (step: number, formData: ApplicationFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (step === 1) {
        if (!formData.name.trim()) {
            errors.name = 'Nome completo é obrigatório';
        }

        const cpfDigits = formData.cpf.replace(/\D/g, '');
        if (!cpfDigits) {
            errors.cpf = 'CPF é obrigatório';
        } else if (cpfDigits.length !== 11) {
            errors.cpf = 'CPF deve conter 11 dígitos';
        }

        const phoneDigits = formData.phone.replace(/\D/g, '');
        if (!phoneDigits) {
            errors.phone = 'Telefone é obrigatório';
        } else if (phoneDigits.length < 10 || phoneDigits.length > 11) {
            errors.phone = 'Digite um telefone válido (10 ou 11 dígitos)';
        }

        if (!formData.college.trim()) {
            errors.college = 'Instituição de ensino é obrigatória';
        }
        if (!formData.period.trim()) {
            errors.period = 'Turno é obrigatório';
        }
        if (!formData.semester.trim()) {
            errors.semester = 'Semestre/Período acadêmico é obrigatório';
        }

        const cepDigits = formData.cep.replace(/\D/g, '');
        if (!cepDigits) {
            errors.cep = 'CEP é obrigatório';
        } else if (cepDigits.length !== 8) {
            errors.cep = 'CEP deve conter 8 dígitos';
        }

        if (!formData.address.trim()) {
            errors.address = 'Endereço é obrigatório';
        }
        if (!formData.city.trim()) {
            errors.city = 'Cidade é obrigatória';
        }
        if (!formData.uf.trim()) {
            errors.uf = 'UF é obrigatória';
        }
    }

    if (step === 2) {
        const requiredFiles = [
            { field: 'identity_document', label: 'Documento de identidade' },
            { field: 'school_records', label: 'Histórico escolar' },
            { field: 'vitae_curriculum', label: 'Currículo' },
        ];

        requiredFiles.forEach(({ field, label }) => {
            const file = formData[field as keyof ApplicationFormData] as File | null;
            if (!file) {
                errors[field] = `${label} é obrigatório`;
            } else {
                if (!ALLOWED_FILE_TYPES.includes(file.type)) {
                    errors[field] = 'Formato inválido. Use PDF, JPG, PNG, WEBP ou DOC';
                } else if (file.size > MAX_FILE_SIZE) {
                    errors[field] = 'Arquivo muito grande (máx. 5MB)';
                }
            }
        });
    }

    if (step === 3) {
        if (formData.portfolio_link && !isValidUrl(formData.portfolio_link)) {
            errors.portfolio_link = 'URL inválida';
        }
    }

    return errors;
};

export { ALLOWED_FILE_TYPES, MAX_FILE_SIZE };

