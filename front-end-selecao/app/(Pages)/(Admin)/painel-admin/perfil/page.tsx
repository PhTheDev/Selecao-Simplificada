'use client';

import { UpdateAdminData, useAdminProfile, useUpdateAdminProfile } from '@/api/hooks/useAdminProfile';
import { AlertMessage } from '@/components/admin/profile/AlertMessage';
import { LoadingState } from '@/components/admin/profile/LoadingState';
import { ProfileCard } from '@/components/admin/profile/ProfileCard';
import { ProfileForm } from '@/components/admin/profile/ProfileForm';
import { Statistics } from '@/components/admin/profile/Statistics';
import { SystemInfo } from '@/components/admin/profile/SystemInfo';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function PerfilAdmin() {
    const { data: adminData, isLoading, error: fetchError } = useAdminProfile();
    const updateProfileMutation = useUpdateAdminProfile();

    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Form data
    const [formData, setFormData] = useState<UpdateAdminData & { username: string }>({
        full_name: "",
        email: "",
        department: "",
        user: {
            first_name: "",
            last_name: ""
        },
        username: ""
    });

    // Initialize form data when adminData loads
    useEffect(() => {
        if (adminData) {
            setFormData({
                full_name: adminData.full_name || "",
                email: adminData.email || "",
                department: adminData.department || "",
                user: {
                    first_name: adminData.user?.first_name || "",
                    last_name: adminData.user?.last_name || ""
                },
                username: adminData.user?.username || ""
            });
        }
    }, [adminData]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!adminData) return;

        // Use adminData.id instead of cookie (cookie 'admin-id' is never set during login)
        const adminId = adminData.id?.toString();

        if (!adminId) {
            setError('ID do administrador não encontrado');
            return;
        }

        try {
            const updateData: UpdateAdminData = {
                full_name: formData.full_name,
                email: formData.email,
                department: formData.department,
                user: {
                    first_name: formData.user.first_name,
                    last_name: formData.user.last_name
                }
            };

            await updateProfileMutation.mutateAsync({ adminId, data: updateData });

            setSuccess('Perfil atualizado com sucesso!');
            setIsEditing(false);
            toast.success('Perfil atualizado com sucesso!');

            // Reload page after 2 seconds to reflect changes
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar perfil';
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    // Handle input changes
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        if (name === 'first_name' || name === 'last_name') {
            setFormData(prev => ({
                ...prev,
                user: {
                    ...prev.user,
                    [name]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    }, []);

    // Handle cancel edit
    const handleCancelEdit = useCallback(() => {
        if (adminData) {
            setFormData({
                full_name: adminData.full_name || "",
                email: adminData.email || "",
                department: adminData.department || "",
                user: {
                    first_name: adminData.user?.first_name || "",
                    last_name: adminData.user?.last_name || ""
                },
                username: adminData.user?.username || ""
            });
        }
        setIsEditing(false);
        setError(null);
        setSuccess(null);
    }, [adminData]);

    // Show error from fetch if exists
    useEffect(() => {
        if (fetchError) { 
            setError(fetchError instanceof Error ? fetchError.message : 'Erro ao carregar perfil');
        }
    }, [fetchError]);

    if (isLoading) {
        return <LoadingState />;
    }

    return (
        <div className="min-h-screen bg-background p-4">
            <div className="h-full flex flex-col">
                {/* Alerts */}
                {error && <AlertMessage type="error" message={error} />}
                {success && <AlertMessage type="success" message={success} />}

                {/* Main Content */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 flex-1">
                    {/* Left Column - Profile Card */}
                    <div className="xl:col-span-1 h-full">
                        <ProfileCard adminData={adminData || null} />
                    </div>

                    {/* Center Column - Form */}
                    <div className="xl:col-span-2 h-full">
                        <ProfileForm
                            adminData={adminData || null}
                            formData={formData}
                            isEditing={isEditing}
                            isSaving={updateProfileMutation.isPending}
                            onEdit={() => setIsEditing(true)}
                            onCancel={handleCancelEdit}
                            onSubmit={handleSubmit}
                            onInputChange={handleInputChange}
                        />
                    </div>

                    {/* Right Column - System Info */}
                    <div className="xl:col-span-1 h-full">
                        <SystemInfo adminData={adminData || null} />
                    </div>
                </div>

                {/* Statistics Section */}
                <div className="mt-4">
                    <Statistics adminData={adminData || null} />
                </div>
            </div>
        </div>
    );
}