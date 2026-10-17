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
        <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" />
            <h3 className="text-foreground font-semibold text-xl mb-2">
                Nenhum usuário encontrado
            </h3>
            <p className="text-muted-foreground mb-6">
                {hasFilters
                    ? 'Tente ajustar os filtros ou termos de busca.'
                    : 'Comece criando o primeiro usuário administrativo.'
                }
            </p>
            {!hasFilters && (
                <button
                    onClick={onCreateUser}
                    className="inline-flex items-center gap-3 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary-hover transition-colors"
                >
                    <UserPlus className="w-5 h-5" />
                    Criar Primeiro Usuário
                </button>
            )}
        </div>
    );
}

