// components/Alert.tsx
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    className?: string;
}

export function Alert({ type, message, className = '' }: AlertProps) {
    const styles = {
        success: 'bg-green-50 border border-green-200 text-green-700',
        error: 'bg-red-50 border border-red-200 text-red-700',
        warning: 'bg-yellow-50 border border-yellow-200 text-yellow-700',
        info: 'bg-blue-50 border border-blue-200 text-blue-700'
    };

    const icons = {
        success: CheckCircle,
        error: XCircle,
        warning: AlertTriangle,
        info: Info
    };

    const Icon = icons[type];

    return (
        <div className={`p-4 rounded-xl ${styles[type]} ${className}`}>
            <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 flex-shrink-0" />
                <p>{message}</p>
            </div>
        </div>
    );
}