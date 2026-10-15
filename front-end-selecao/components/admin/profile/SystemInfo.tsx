// components/admin/profile/SystemInfo.tsx
import { Shield } from 'lucide-react';
import { AdminData } from '@/api/hooks/useAdminProfile';

interface SystemInfoProps {
    adminData: AdminData | null;
}

export function SystemInfo({ adminData }: SystemInfoProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Informações do Sistema
            </h3>
            <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-sm text-blue-700 font-medium mb-1">ID do Administrador</div>
                    <div className="text-lg font-bold text-blue-900">{adminData?.id}</div>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-sm text-purple-700 font-medium mb-1">ID do Usuário</div>
                    <div className="text-lg font-bold text-purple-900">{adminData?.user?.id}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="text-sm text-gray-700 font-medium mb-1">Status da Conta</div>
                    <div className={`text-lg font-bold ${adminData?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {adminData?.is_active ? 'Ativa' : 'Inativa'}
                    </div>
                </div>
            </div>
        </div>
    );
}

