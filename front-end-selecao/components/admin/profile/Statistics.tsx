// components/admin/profile/Statistics.tsx
import { Clock } from 'lucide-react';
import { AdminData } from '@/api/hooks/useAdminProfile';
import { formatDate, getTimeSinceCreation } from '@/utils/dateHelpers';

interface StatisticsProps {
    adminData: AdminData | null;
}

export function Statistics({ adminData }: StatisticsProps) {
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Estatísticas do Perfil
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-primary-soft rounded-xl border border-primary/30">
                    <div className="text-2xl font-bold text-primary mb-2">
                        {adminData?.created_at ? formatDate(adminData.created_at) : 'N/A'}
                    </div>
                    <div className="text-sm text-primary font-medium">Membro Desde</div>
                </div>

                <div className="text-center p-4 bg-success-soft rounded-xl border border-success/30">
                    <div className="text-2xl font-bold text-success mb-2">
                        {adminData?.created_at ? getTimeSinceCreation(adminData.created_at) || 'N/A' : 'N/A'}
                    </div>
                    <div className="text-sm text-success font-medium">Tempo na Plataforma</div>
                </div>

                <div className="text-center p-4 bg-primary-soft rounded-xl border border-primary/30">
                    <div className="text-2xl font-bold text-primary mb-2">
                        {adminData?.updated_at ? formatDate(adminData.updated_at) : 'N/A'}
                    </div>
                    <div className="text-sm text-primary font-medium">Última Atualização</div>
                </div>
            </div>
        </div>
    );
}

