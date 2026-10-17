// components/admin/process-analysis/ErrorState.tsx
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
    error: string;
    onBack: () => void;
}

export function ErrorState({ error, onBack }: ErrorStateProps) {
    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                <div className="bg-card rounded-2xl shadow-sm border border-destructive/30 p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-destructive-soft rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-destructive font-semibold text-xl mb-2">Erro ao carregar processo</h3>
                    <p className="text-destructive mb-6">{error || 'Processo não encontrado'}</p>
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors"
                    >
                        Voltar para Processos
                    </button>
                </div>
            </div>
        </div>
    );
}

