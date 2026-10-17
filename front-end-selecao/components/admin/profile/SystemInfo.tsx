// components/admin/profile/SystemInfo.tsx
import { Shield } from 'lucide-react';
import { AdminData } from '@/api/hooks/useAdminProfile';

interface SystemInfoProps {
    adminData: AdminData | null;
}

export function SystemInfo({ adminData }: SystemInfoProps) {
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 h-full">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Informações do Sistema
            </h3>
            <div className="space-y-4">
                <div className="p-4 bg-primary-soft rounded-xl border border-primary/30">
                    <div className="text-sm text-primary font-medium mb-1">ID do Administrador</div>
                    <div className="text-lg font-bold text-primary">{adminData?.id}</div>
                </div>

                <div className="p-4 bg-primary-soft rounded-xl border border-primary/30">
                    <div className="text-sm text-primary font-medium mb-1">ID do Usuário</div>
                    <div className="text-lg font-bold text-primary">{adminData?.user?.id}</div>
                </div>

                <div className="p-4 bg-background rounded-xl border border-border">
                    <div className="text-sm text-foreground/80 font-medium mb-1">Status da Conta</div>
                    <div className={`text-lg font-bold ${adminData?.is_active ? 'text-success' : 'text-destructive'}`}>
                        {adminData?.is_active ? 'Ativa' : 'Inativa'}
                    </div>
                </div>
            </div>
        </div>
    );
}

