// components/admin/administrators/EmptyState.tsx
import { Users, UserPlus } from 'lucide-react';

interface EmptyStateProps {
    searchTerm: string;
    roleFilter: string;
    statusFilter: string;
    onCreateUser: () => void;
}

export function EmptyState({
    searchTerm,
    roleFilter,
    statusFilter,
    onCreateUser,
}: EmptyStateProps) {
    const hasFilters = searchTerm || roleFilter !== 'all' || statusFilter !== 'all';

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-semibold text-xl mb-2">
                Nenhum usuário encontrado
            </h3>
            <p className="text-gray-600 mb-6">
                {hasFilters
                    ? 'Tente ajustar os filtros ou termos de busca.'
                    : 'Comece criando o primeiro usuário administrativo.'
                }
            </p>
            {!hasFilters && (
                <button
                    onClick={onCreateUser}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <UserPlus className="w-5 h-5" />
                    Criar Primeiro Usuário
                </button>
            )}
        </div>
    );
}

