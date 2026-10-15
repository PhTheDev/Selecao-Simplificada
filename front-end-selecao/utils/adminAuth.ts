// utils/adminAuth.ts
export const getAdminAccessToken = (): string | null => {
    if (typeof document === 'undefined') return null;
    return document.cookie
        .split('; ')
        .find(row => row.startsWith('admin-access-token='))
        ?.split('=')[1] || null;
};

export const getAuthHeaders = (): HeadersInit => {
    const token = getAdminAccessToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const requireAdminAuth = (): string => {
    const token = getAdminAccessToken();
    if (!token) {
        throw new Error('Token de acesso não encontrado');
    }
    return token;
};

