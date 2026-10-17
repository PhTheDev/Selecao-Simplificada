'use client';

import { AlertTriangle, CheckCircle } from 'lucide-react';
import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';

// Omitindo 'icon' do InputProps original, pois agora usaremos ReactNode para o ícone
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'icon'> {
    label?: string;
    // 'icon' agora aceita um componente LucideIcon ou qualquer ReactNode
    icon?: ReactNode;
    error?: string;
    success?: boolean;
    helpText?: string;
    onChange?: (value: string) => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        {
            label,
            icon,
            error,
            success,
            helpText,
            type = 'text',
            className = '',
            onChange,
            required,
            ...props
        },
        ref
    ) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            onChange?.(e.target.value);
        };

        const getInputClasses = () => {
            // Classes base para um design mais moderno e limpo
            const baseClasses = 'w-full px-4 py-3 border rounded-lg text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 ease-in-out ';

            // Classes de foco e estado
            let stateClasses = 'border-input focus:border-primary focus:ring-2 focus:ring-ring/50 bg-card hover:border-input';

            if (error) {
                stateClasses = 'border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/50 bg-destructive-soft';
            } else if (success) {
                stateClasses = 'border-success focus:border-success focus:ring-2 focus:ring-success/50 bg-success-soft';
            }

            return baseClasses + stateClasses;
        };

        // Ajuste de padding baseado na presença do ícone
        const paddingLeft = icon ? 'pl-11' : 'pl-4';
        // Ajuste de padding à direita baseado na presença do ícone de status (erro/sucesso)
        const paddingRight = error || success ? 'pr-11' : 'pr-4';

        return (
            <div className="w-full">
                {/* Label */}
                {label && (
                    <label
                        htmlFor={props.id}
                        className={`block text-sm font-semibold mb-1 ${error ? 'text-destructive' :
                            success ? 'text-success' :
                                'text-foreground/80'
                            }`}
                    >
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    {/* Icone Esquerdo (Input Icon) */}
                    {icon && (
                        <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${error ? 'text-destructive' :
                            success ? 'text-success' :
                                'text-muted-foreground/70'
                            }`}>
                            {/* O ícone é renderizado diretamente como ReactNode */}
                            {icon}
                        </div>
                    )}

                    {/* Input */}
                    <input
                        ref={ref}
                        type={type}
                        className={`
                            ${getInputClasses()}
                            ${paddingLeft}
                            ${paddingRight}
                            disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed
                            ${className}
                        `}
                        onChange={handleChange}
                        required={required}
                        {...props}
                    />

                    {/* Icone de Status (Erro/Sucesso) */}
                    {(error || success) && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            {error && (
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                            )}
                            {success && !error && (
                                <CheckCircle className="w-5 h-5 text-success" />
                            )}
                        </div>
                    )}
                </div>

                {/* Help Text */}
                {helpText && !error && (
                    <p className="mt-1 text-xs text-muted-foreground">
                        {helpText}
                    </p>
                )}

                {/* Error Message */}
                {error && (
                    <p className="mt-1 text-xs text-destructive font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };