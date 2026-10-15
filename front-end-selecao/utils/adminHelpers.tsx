// utils/adminHelpers.tsx
'use client';

import { ShieldAlert, User } from 'lucide-react';
import { Administrator } from '@/api/hooks/useAdministrators';

export const getRoleIcon = (role: string) => {
    switch (role) {
        case 'super_admin':
            return <ShieldAlert className="w-4 h-4" />;
        default:
            return <User className="w-4 h-4" />;
    }
};

export const getRoleColor = (role: string): string => {
    switch (role) {
        case 'super_admin':
            return 'bg-purple-100 text-purple-800 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

export const translateRole = (role: string): string => {
    switch (role) {
        case 'super_admin':
            return 'Super Admin';
        default:
            return role;
    }
};

export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR');
};

export const filterAdministrators = (
    administrators: Administrator[],
    searchTerm: string,
    roleFilter: string,
    statusFilter: 'all' | 'active' | 'inactive'
): Administrator[] => {
    return administrators.filter(admin => {
        const fullName = admin?.full_name || '';
        const email = admin?.email || '';
        const username = admin?.user?.username || '';
        const department = admin?.department || '';
        const role = admin?.role || '';
        const isActive = admin?.is_active ?? true;

        const matchesSearch =
            fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (department && department.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = roleFilter === 'all' || role === roleFilter;
        const matchesStatus = statusFilter === 'all' ||
            (statusFilter === 'active' && isActive) ||
            (statusFilter === 'inactive' && !isActive);

        return matchesSearch && matchesRole && matchesStatus;
    });
};

