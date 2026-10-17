// components/admin/administrators/ReactivateAdminModal.tsx
import Modal from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Administrator } from '@/api/hooks/useAdministrators';

interface ReactivateAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    admin: Administrator | null;
    error: string | null;
    isReactivating: boolean;
    onConfirm: () => void;
}

export function ReactivateAdminModal({
    isOpen,
    onClose,
    admin,
    error,
    isReactivating,
    onConfirm,
}: ReactivateAdminModalProps) {
    if (!admin) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Reativar Usuário"
            subtitle="Tem certeza que deseja reativar este usuário?"
            size="sm"
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={isReactivating}
                        className="px-6 py-3 bg-muted text-foreground/80 font-medium rounded-xl hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isReactivating}
                        className="flex items-center gap-2 px-6 py-3 bg-success text-white font-medium rounded-xl hover:bg-success transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isReactivating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Reativando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Reativar Usuário
                            </>
                        )}
                    </button>
                </>
            }
            backdropClass="bg-black/20"
        >
            <div className="p-6">
                <div className="text-center">
                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-success-soft mb-4">
                        <CheckCircle className="h-6 w-6 text-success" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">
                        Reativar {admin.full_name}
                    </h3>
                    <p className="text-muted-foreground mb-4">
                        O usuário será reativado e poderá acessar o sistema novamente.
                    </p>
                    {error && <Alert type="error" message={error} />}
                </div>
            </div>
        </Modal>
    );
}

