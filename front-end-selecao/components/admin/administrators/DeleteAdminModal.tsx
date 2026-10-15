// components/admin/administrators/DeleteAdminModal.tsx
import Modal from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { Loader2, Trash2 } from 'lucide-react';
import { Administrator } from '@/api/hooks/useAdministrators';

interface DeleteAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    admin: Administrator | null;
    error: string | null;
    isDeleting: boolean;
    onConfirm: () => void;
}

export function DeleteAdminModal({
    isOpen,
    onClose,
    admin,
    error,
    isDeleting,
    onConfirm,
}: DeleteAdminModalProps) {
    if (!admin) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Desativar Usuário"
            subtitle="Tem certeza que deseja desativar este usuário?"
            size="sm"
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Desativando...
                            </>
                        ) : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Desativar Usuário
                            </>
                        )}
                    </button>
                </>
            }
            backdropClass="bg-black/20 backdrop-blur-sm"
        >
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                        <Trash2 className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Desativar {admin.full_name}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        O usuário será desativado e não poderá mais acessar o sistema.
                        Esta ação pode ser revertida editando o usuário.
                    </p>
                    {error && <Alert type="error" message={error} />}
                </div>
            </div>
        </Modal>
    );
}

