// components/admin/profile/ProfileForm.tsx
import { AdminData, UpdateAdminData } from '@/api/hooks/useAdminProfile';
import { Building, Edit3, Loader2, Mail, Save, User } from 'lucide-react';

interface ProfileFormProps {
    adminData: AdminData | null;
    formData: UpdateAdminData & { username: string };
    isEditing: boolean;
    isSaving: boolean;
    onEdit: () => void;
    onCancel: () => void;
    onSubmit: (e: React.FormEvent) => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function ProfileForm({
    adminData,
    formData,
    isEditing,
    isSaving,
    onEdit,
    onCancel,
    onSubmit,
    onInputChange,
}: ProfileFormProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full flex flex-col">
            {/* Header do Formulário */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Informações Pessoais
                    </h3>
                    <p className="text-gray-600">
                        Atualize suas informações de contato e perfil
                    </p>
                </div>
                {!isEditing ? (
                    <button
                        onClick={onEdit}
                        className="mt-4 sm:mt-0 flex items-center gap-3 px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
                    >
                        <Edit3 className="w-5 h-5" />
                        Editar Perfil
                    </button>
                ) : (
                    <button
                        onClick={onCancel}
                        className="mt-4 sm:mt-0 flex items-center gap-3 px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
            </div>

            <form onSubmit={onSubmit} className="space-y-6 flex-1 overflow-auto">
                {/* Seção de Informações Básicas */}
                <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                        Informações Básicas
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Email */}
                        <div className="md:col-span-2">
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Mail className="w-5 h-5" />
                                Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={onInputChange}
                                    disabled={!isEditing}
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        {/* Primeiro Nome e Sobrenome */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Primeiro Nome
                            </label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.user?.first_name || ''}
                                onChange={onInputChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Sobrenome
                            </label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.user?.last_name || ''}
                                onChange={onInputChange}
                                disabled={!isEditing}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Seção de Informações Profissionais */}
                <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
                        Informações Profissionais
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Departamento */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <Building className="w-5 h-5" />
                                Departamento *
                            </label>
                            <input
                                type="text"
                                name="department"
                                value={formData.department}
                                onChange={onInputChange}
                                disabled={!isEditing}
                                placeholder="Digite seu departamento"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                                required
                            />
                        </div>

                        {/* Username */}
                        <div>
                            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Username
                            </label>
                            <input
                                type="text"
                                value={formData.username}
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                Username não pode ser alterado
                            </p>
                        </div>
                    </div>
                </div>

                {/* Botão de Salvar */}
                {isEditing && (
                    <div className="flex justify-end pt-6 border-t border-gray-200 mt-6">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Salvando Alterações...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

