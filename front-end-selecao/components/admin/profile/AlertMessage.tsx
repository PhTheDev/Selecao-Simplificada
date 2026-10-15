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
                ? 'bg-red-50 border-red-200'
                : 'bg-green-50 border-green-200'
        }`}>
            <div className="flex-shrink-0">
                {isError ? (
                    <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                ) : (
                    <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                )}
            </div>
            <div className="flex-1">
                <h4 className={`font-semibold mb-1 ${
                    isError ? 'text-red-800' : 'text-green-800'
                }`}>
                    {isError ? 'Erro' : 'Sucesso!'}
                </h4>
                <p className={isError ? 'text-red-700' : 'text-green-700'}>
                    {message}
                </p>
            </div>
        </div>
    );
}

