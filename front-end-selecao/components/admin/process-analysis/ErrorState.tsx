// components/admin/process-analysis/ErrorState.tsx
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
    error: string;
    onBack: () => void;
}

export function ErrorState({ error, onBack }: ErrorStateProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg border border-red-200 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-red-800 font-semibold text-xl mb-2">Erro ao carregar processo</h3>
                    <p className="text-red-700 mb-6">{error || 'Processo não encontrado'}</p>
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
                        Voltar para Processos
                    </button>
                </div>
            </div>
        </div>
    );
}

