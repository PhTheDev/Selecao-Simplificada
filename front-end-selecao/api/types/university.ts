// Interface para universidades
export interface University {
    name: string;
    acronym?: string;
    city: string;
    state: string;
    type: 'public' | 'private';
}