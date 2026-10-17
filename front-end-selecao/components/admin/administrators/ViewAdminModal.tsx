// components/admin/administrators/ViewAdminModal.tsx
import { Administrator } from '@/api/hooks/useAdministrators';
import Modal from '@/components/ui/Modal';
import { formatDate, getRoleColor, getRoleIcon } from '@/utils/adminHelpers';
import { Edit } from 'lucide-react';

interface ViewAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    admin: Administrator | null;
    currentUserId?: number;
    onEdit: (admin: Administrator) => void;
}

export function ViewAdminModal({
    isOpen,
    onClose,
    admin,
    currentUserId,
    onEdit,
}: ViewAdminModalProps) {
    if (!admin) return null;

    const canEdit = admin.role !== 'super_admin' || admin.id === currentUserId;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalhes do Usuário"
            subtitle={admin.full_name}
            size="md"
            footer={
                <button
                    onClick={() => onEdit(admin)}
                    disabled={!canEdit}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Edit className="w-4 h-4" />
                    Editar Usuário
                </button>
            }
            backdropClass="bg-black/20"
        >
            <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${getRoleColor(admin.role)}`}>
                        {getRoleIcon(admin.role)}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            {admin.full_name}
                        </h3>
                        <p className="text-muted-foreground">{admin.email}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Nome de Usuário
                        </label>
                        <p className="text-foreground">{admin.user?.username || 'N/A'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Matrícula
                        </label>
                        <p className="text-foreground">{admin.matricula || 'Não informada'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Departamento
                        </label>
                        <p className="text-foreground">{admin.department || 'Não informado'}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Status
                        </label>
                        <p className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${admin.is_active
                                ? 'bg-success-soft text-success'
                                : 'bg-destructive-soft text-destructive'
                            }`}>
                            {admin.is_active ? 'Ativo' : 'Inativo'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Criado em
                        </label>
                        <p className="text-foreground">{formatDate(admin.created_at)}</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground/80 mb-2">
                            Última atualização
                        </label>
                        <p className="text-foreground">{formatDate(admin.updated_at)}</p>
                    </div>
                </div>
            </div>
        </Modal>
    );
}

