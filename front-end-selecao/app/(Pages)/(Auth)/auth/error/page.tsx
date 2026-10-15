'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Componente que realmente usa useSearchParams
function ErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error');

    const getErrorMessage = (error: string | null) => {
        switch (error) {
            case 'AccessDenied':
                return 'Acesso negado. Por favor, use uma conta Google autorizada.';
            case 'Configuration':
                return 'Erro de configuração do servidor.';
            case 'Verification':
                return 'Erro de verificação do token.';
            default:
                return 'Ocorreu um erro durante a autenticação.';
        }
    };

    return (
        <>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                Erro de Autenticação
            </h2>
            <p className="mt-2 text-center text-sm text-red-600">
                {getErrorMessage(error)}
            </p>
            <div className="mt-8 space-y-4">
                <button
                    onClick={() => window.location.href = '/'}
                    className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    Voltar para a página inicial
                </button>
            </div>
        </>
    );
}

// Página principal com Suspense
export default function AuthError() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8">
                <Suspense fallback={<div className="text-center">Carregando...</div>}>
                    <ErrorContent />
                </Suspense>
            </div>
        </div>
    );
}