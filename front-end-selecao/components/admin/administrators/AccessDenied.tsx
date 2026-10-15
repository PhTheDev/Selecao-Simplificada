// components/admin/administrators/AccessDenied.tsx
import { Shield } from 'lucide-react';

export function AccessDenied() {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-gray-900 font-semibold text-xl mb-2">
                Acesso Restrito
            </h3>
            <p className="text-gray-600">
                Você não tem permissão para gerenciar usuários do sistema.
            </p>
        </div>
    );
}

