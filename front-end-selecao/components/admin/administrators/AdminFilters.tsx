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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou departamento..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Role Filter */}
                <div className="flex gap-2">
                    <select
                        value={roleFilter}
                        onChange={(e) => onRoleFilterChange(e.target.value)}
                        className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => onStatusFilterChange('active')}
                        className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                            statusFilter === 'active'
                                ? 'bg-green-100 text-green-700 border border-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Ativos
                    </button>
                    <button
                        onClick={() => onStatusFilterChange('inactive')}
                        className={`px-4 py-3 rounded-xl font-medium transition-colors ${
                            statusFilter === 'inactive'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Inativos
                    </button>
                </div>
            </div>
        </div>
    );
}

