// components/admin/process-form/RestoreDialog.tsx

interface RestoreDialogProps {
    isOpen: boolean;
    onRestore: () => void;
    onDiscard: () => void;
}

export function RestoreDialog({ isOpen, onRestore, onDiscard }: RestoreDialogProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Rascunho Encontrado
                    </h3>
                </div>

                <p className="text-gray-600 mb-6">
                    Encontramos um rascunho não finalizado. Deseja restaurar os dados ou começar do zero?
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={onRestore}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                    >
                        Restaurar
                    </button>
                    <button
                        onClick={onDiscard}
                        className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-xl hover:bg-gray-400 transition-colors font-medium"
                    >
                        Começar Novo
                    </button>
                </div>
            </div>
        </div>
    );
}

