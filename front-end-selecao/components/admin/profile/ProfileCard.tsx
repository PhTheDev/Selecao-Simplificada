// components/admin/profile/ProfileCard.tsx
import { Crown, User } from 'lucide-react';
import { AdminData } from '@/api/hooks/useAdminProfile';

interface ProfileCardProps {
    adminData: AdminData | null;
}

export function ProfileCard({ adminData }: ProfileCardProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 h-full">
            <div className="flex flex-col items-center text-center h-full justify-between">
                <div className="w-full">
                    <div className="relative mb-6">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-600 to-indigo-700 rounded-full flex items-center justify-center shadow-2xl mx-auto">
                            <User className="w-14 h-14 text-white" />
                        </div>
                        {adminData?.role === 'super_admin' && (
                            <div className="absolute top-0 right-1/2 transform translate-x-12 bg-amber-500 rounded-full p-2 shadow-lg">
                                <Crown className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {adminData?.full_name || "Administrador"}
                    </h2>
                    <p className="text-gray-600 mb-1 capitalize">
                        {adminData?.role?.replace('_', ' ') || 'Administrador'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        {adminData?.department}
                    </p>
                </div>

                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    adminData?.is_active
                        ? 'bg-green-100 text-green-800 border border-green-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${adminData?.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                    {adminData?.is_active ? 'Ativo' : 'Inativo'}
                </div>
            </div>
        </div>
    );
}

