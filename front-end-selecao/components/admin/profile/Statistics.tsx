// components/admin/profile/Statistics.tsx
import { Clock } from 'lucide-react';
import { AdminData } from '@/api/hooks/useAdminProfile';
import { formatDate, getTimeSinceCreation } from '@/utils/dateHelpers';

interface StatisticsProps {
    adminData: AdminData | null;
}

export function Statistics({ adminData }: StatisticsProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Estatísticas do Perfil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900 mb-2">
                        {adminData?.created_at ? formatDate(adminData.created_at) : 'N/A'}
                    </div>
                    <div className="text-sm text-blue-700 font-medium">Membro Desde</div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="text-2xl font-bold text-green-900 mb-2">
                        {adminData?.created_at ? getTimeSinceCreation(adminData.created_at) || 'N/A' : 'N/A'}
                    </div>
                    <div className="text-sm text-green-700 font-medium">Tempo na Plataforma</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900 mb-2">
                        {adminData?.updated_at ? formatDate(adminData.updated_at) : 'N/A'}
                    </div>
                    <div className="text-sm text-purple-700 font-medium">Última Atualização</div>
                </div>
            </div>
        </div>
    );
}

