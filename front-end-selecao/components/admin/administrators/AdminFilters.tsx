// components/admin/administrators/AdminFilters.tsx
import { Search } from 'lucide-react';

interface AdminFiltersProps {
    searchTerm: string;
    roleFilter: string;
    statusFilter: 'all' | 'active' | 'inactive';
    onSearchChange: (value: string) => void;
    onRoleFilterChange: (value: string) => void;
    onStatusFilterChange: (value: 'all' | 'active' | 'inactive') => void;
}

export function AdminFilters({
    searchTerm,
    roleFilter,
    statusFilter,
    onSearchChange,
    onRoleFilterChange,
    onStatusFilterChange,
}: AdminFiltersProps) {
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou departamento..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Role Filter */}
                <div className="flex gap-2">
                    <select
                        value={roleFilter}
                        onChange={(e) => onRoleFilterChange(e.target.value)}
                        className="px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                    >
                        <option value="all">Todos</option>
                        <option value="super_admin">Super Admin</option>
                    </select>
                </div>

                {/* Status Filter */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onStatusFilterChange('all')}
                        className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                            statusFilter === 'all'
                                ? 'bg-primary-soft text-primary border border-primary/30'
                                : 'bg-muted text-foreground/80 hover:bg-border'
                        }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => onStatusFilterChange('active')}
                        className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                            statusFilter === 'active'
                                ? 'bg-success-soft text-success border border-success/30'
                                : 'bg-muted text-foreground/80 hover:bg-border'
                        }`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => onStatusFilterChange('inactive')}
                        className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                            statusFilter === 'inactive'
                                ? 'bg-destructive-soft text-destructive border border-destructive/30'
                                : 'bg-muted text-foreground/80 hover:bg-border'
                        }`}
                    >
                        Inativos
                    </button>
                </div>
            </div>
        </div>
    );
}

