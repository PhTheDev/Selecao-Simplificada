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
            const baseClasses = 'w-full px-4 py-3 border rounded-lg text-gray-800 placeholder-gray-400 transition-all duration-200 ease-in-out ';

            // Classes de foco e estado
            let stateClasses = 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 bg-white hover:border-gray-400';

            if (error) {
                stateClasses = 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/50 bg-red-50';
            } else if (success) {
                stateClasses = 'border-green-500 focus:border-green-600 focus:ring-2 focus:ring-green-500/50 bg-green-50';
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
                        className={`block text-sm font-semibold mb-1 ${error ? 'text-red-700' :
                            success ? 'text-green-700' :
                                'text-gray-700'
                            }`}
                    >
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}

                <div className="relative">
                    {/* Icone Esquerdo (Input Icon) */}
                    {icon && (
                        <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${error ? 'text-red-500' :
                            success ? 'text-green-500' :
                                'text-gray-400'
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
                            disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed
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
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            )}
                            {success && !error && (
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            )}
                        </div>
                    )}
                </div>

                {/* Help Text */}
                {helpText && !error && (
                    <p className="mt-1 text-xs text-gray-500">
                        {helpText}
                    </p>
                )}

                {/* Error Message */}
                {error && (
                    <p className="mt-1 text-xs text-red-600 font-medium flex items-center gap-1">
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