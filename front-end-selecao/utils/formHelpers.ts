// utils/formHelpers.ts

// Generate slug from title
export const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

// Validate slug format
export const validateSlug = (slug: string): boolean => {
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    return slugRegex.test(slug);
};

// Format array items to semicolon-separated string
export const formatArrayToString = (items: Array<{ value: string }>): string => {
    return items
        .map(item => item.value.trim())
        .filter(value => value !== '')
        .join(';');
};

// Validate file type
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    if (!file.type.startsWith('image/')) {
        return { valid: false, error: 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, JPEG).' };
    }
    
    if (file.size > 5 * 1024 * 1024) {
        return { valid: false, error: 'A imagem deve ter no máximo 5MB.' };
    }
    
    return { valid: true };
};

// Validate document file
export const validateDocumentFile = (file: File): { valid: boolean; error?: string } => {
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    const isValidType = allowedTypes.includes(file.type) || file.name.match(/\.(pdf|doc|docx)$/i);
    
    if (!isValidType) {
        return { valid: false, error: 'Por favor, selecione um arquivo PDF ou Word válido.' };
    }

    if (file.size > 10 * 1024 * 1024) {
        return { valid: false, error: 'O arquivo do edital deve ter no máximo 10MB.' };
    }

    return { valid: true };
};

// Create file preview
export const createFilePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

