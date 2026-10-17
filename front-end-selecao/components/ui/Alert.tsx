// components/Alert.tsx
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    className?: string;
}

export function Alert({ type, message, className = '' }: AlertProps) {
    const styles = {
        success: 'bg-success-soft border border-success/30 text-success',
        error: 'bg-destructive-soft border border-destructive/30 text-destructive',
        warning: 'bg-warning-soft border border-warning/30 text-warning',
        info: 'bg-primary-soft border border-primary/30 text-primary'
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