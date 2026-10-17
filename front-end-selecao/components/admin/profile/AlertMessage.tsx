// components/admin/profile/AlertMessage.tsx
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface AlertMessageProps {
    type: 'error' | 'success';
    message: string;
}

export function AlertMessage({ type, message }: AlertMessageProps) {
    const isError = type === 'error';
    
    return (
        <div className={`mb-4 p-6 border rounded-2xl flex items-start gap-4 animate-in fade-in duration-300 ${
            isError
                ? 'bg-destructive-soft border-destructive/30'
                : 'bg-success-soft border-success/30'
        }`}>
            <div className="flex-shrink-0">
                {isError ? (
                    <AlertCircle className="w-6 h-6 text-destructive mt-0.5" />
                ) : (
                    <CheckCircle2 className="w-6 h-6 text-success mt-0.5" />
                )}
            </div>
            <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${
                    isError ? 'text-destructive' : 'text-success'
                }`}>
                    {isError ? 'Erro' : 'Sucesso!'}
                </h4>
                <p className={isError ? 'text-destructive' : 'text-success'}>
                    {message}
                </p>
            </div>
        </div>
    );
}

