// components/admin/profile/ProfileCard.tsx
import { Crown, User } from 'lucide-react';
import { AdminData } from '@/api/hooks/useAdminProfile';

interface ProfileCardProps {
    adminData: AdminData | null;
}

export function ProfileCard({ adminData }: ProfileCardProps) {
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 h-full">
            <div className="flex flex-col items-center text-center h-full justify-between">
                <div className="w-full">
                    <div className="relative mb-6">
                        <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center shadow-sm mx-auto">
                            <User className="w-14 h-14 text-white" />
                        </div>
                        {adminData?.role === 'super_admin' && (
                            <div className="absolute top-0 right-1/2 translate-x-12 bg-warning rounded-full p-2 shadow-sm">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        {adminData?.full_name || "Administrador"}
                    </h2>
                    <p className="text-muted-foreground mb-1 capitalize">
                        {adminData?.role?.replace('_', ' ') || 'Administrador'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-4">
                        {adminData?.department}
                    </p>
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    adminData?.is_active
                        ? 'bg-success-soft text-success border border-success/30'
                        : 'bg-destructive-soft text-destructive border border-destructive/30'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${adminData?.is_active ? 'bg-success' : 'bg-destructive'}`} />
                    {adminData?.is_active ? 'Ativo' : 'Inativo'}
                </div>
            </div>
        </div>
    );
}

