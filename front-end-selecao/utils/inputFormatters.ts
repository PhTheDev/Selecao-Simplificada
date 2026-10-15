/**
 * Input formatting utilities for form fields
 */

export const formatCPF = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const truncated = cleaned.substring(0, 11);
    
    return truncated
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
};

export const formatPhone = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const truncated = cleaned.substring(0, 11);
    
    if (truncated.length <= 10) {
        return truncated
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
        return truncated
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2');
    }
};

export const formatCEP = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const truncated = cleaned.substring(0, 8);
    
    return truncated.replace(/(\d{5})(\d)/, '$1-$2');
};

export const cleanCPF = (value: string): string => value.replace(/\D/g, '');
export const cleanPhone = (value: string): string => value.replace(/\D/g, '');
export const cleanCEP = (value: string): string => value.replace(/\D/g, '');

