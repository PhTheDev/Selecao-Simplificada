// utils/formValidation.ts
import { FIELD_LABELS, REQUIRED_FIELDS } from '@/constants/formFields';
import { parseLocalCalendarDate } from '@/utils/selectionProcessDates';
import { validateSlug } from './formHelpers';

interface FormData {
    [key: string]: any;
}

interface Benefit {
    id: number;
    value: string;
}

interface Prerequisite {
    id: number;
    value: string;
}

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export const validateProcessForm = (
    formData: FormData,
    benefits: Benefit[],
    prerequisites: Prerequisite[]
): ValidationResult => {
    // Check required fields
    for (const field of REQUIRED_FIELDS) {
        if (!formData[field]) {
            return {
                valid: false,
                error: `O campo ${FIELD_LABELS[field] || field.replace('_', ' ')} é obrigatório.`
            };
        }
    }

    // Validate dates
    const beginningDate = parseLocalCalendarDate(formData.beginning_date);
    const endingDate = parseLocalCalendarDate(formData.ending_date);

    if (endingDate <= beginningDate) {
        return {
            valid: false,
            error: 'A data de término deve ser posterior à data de início.'
        };
    }

    // Validate slug
    if (!validateSlug(formData.slug)) {
        return {
            valid: false,
            error: 'O slug deve conter apenas letras minúsculas, números e hífens.'
        };
    }

    // Validate benefits
    const hasBenefits = benefits.some(benefit => benefit.value.trim() !== '');
    if (!hasBenefits) {
        return {
            valid: false,
            error: 'É necessário adicionar pelo menos um benefício.'
        };
    }

    // Validate prerequisites
    const hasPrerequisites = prerequisites.some(prerequisite => prerequisite.value.trim() !== '');
    if (!hasPrerequisites) {
        return {
            valid: false,
            error: 'É necessário adicionar pelo menos um pré-requisito.'
        };
    }

    // Validate bout selection
    if (!formData.bout) {
        return { valid: false, error: 'Selecione o turno do processo (Matutino, Vespertino ou Escala).' };
    }

    return { valid: true };
};

