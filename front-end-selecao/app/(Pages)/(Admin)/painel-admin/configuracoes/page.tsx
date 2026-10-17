'use client';

import {
  Administrator,
  CreateAdminData,
  UpdateAdminData,
  useAdministrators,
  useCreateAdministrator,
  useDeleteAdministrator,
  useUpdateAdministrator,
} from '@/api/hooks/useAdministrators';
import { useAdminProfile } from '@/api/hooks/useAdminProfile';
import { AccessDenied } from '@/components/admin/administrators/AccessDenied';
import { AdminCard } from '@/components/admin/administrators/AdminCard';
import { AdminFilters } from '@/components/admin/administrators/AdminFilters';
import { CreateAdminModal } from '@/components/admin/administrators/CreateAdminModal';
import { DeleteAdminModal } from '@/components/admin/administrators/DeleteAdminModal';
import { EditAdminModal } from '@/components/admin/administrators/EditAdminModal';
import { EmptyState } from '@/components/admin/administrators/EmptyState';
import { LoadingState } from '@/components/admin/administrators/LoadingState';
import { Pagination } from '@/components/admin/administrators/Pagination';
import { ReactivateAdminModal } from '@/components/admin/administrators/ReactivateAdminModal';
import { ViewAdminModal } from '@/components/admin/administrators/ViewAdminModal';
import { Alert } from '@/components/ui/Alert';
import { Title } from '@/components/ui/Title';
import { filterAdministrators } from '@/utils/adminHelpers';
import { UserCog, UserPlus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

// ✅ regra do sistema: sempre super_admin e membro da equipe
const FORCED_ROLE = 'super_admin' as const;

export default function Configurações() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [selectedAdministrator, setSelectedAdministrator] = useState<Administrator | null>(null);

  // Form data
  const [createFormData, setCreateFormData] = useState<CreateAdminData>({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: FORCED_ROLE,     // ✅ travado
    is_staff: true,        // ✅ travado
    department: '',
    matricula: ''
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateAdminData>({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: FORCED_ROLE,     // ✅ travado
    department: '',
    matricula: '',
    is_active: true,
    password: '',
    password_confirm: '',
    // is_staff: true, // ✅ se existir no tipo e seu backend aceitar, pode manter aqui também
  });

  const pageSize = 10;

  // Hooks
  const { data: administratorsData, isLoading, refetch: refetchAdministrators } =
    useAdministrators(currentPage, pageSize);

  const { data: currentUser } = useAdminProfile();
  const createAdminMutation = useCreateAdministrator();
  const updateAdminMutation = useUpdateAdministrator();
  const deleteAdminMutation = useDeleteAdministrator();

  const isSuperAdmin = currentUser?.role === FORCED_ROLE;

  const administrators = administratorsData?.results || [];
  const totalCount = administratorsData?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // Filter administrators
  const filteredAdministrators = useMemo(() => {
    return filterAdministrators(administrators, searchTerm, roleFilter, statusFilter);
  }, [administrators, searchTerm, roleFilter, statusFilter]);

  // Pagination handlers
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  }, [currentPage]);

  const handlePageClick = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Modal handlers
  const handleCreateUser = useCallback(() => {
    setCreateFormData({
      username: '',
      email: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
      role: FORCED_ROLE,  // ✅ sempre
      is_staff: true,     // ✅ sempre
      department: '',
      matricula: ''
    });
    setShowCreateModal(true);
  }, []);

  const handleViewUser = useCallback((admin: Administrator) => {
    setSelectedAdministrator(admin);
    setShowViewModal(true);
  }, []);

  const handleEditUser = useCallback((admin: Administrator) => {
    setSelectedAdministrator(admin);

    // ✅ mesmo que venha diferente do backend, o formulário fica travado como super_admin
    setUpdateFormData({
      username: admin.user?.username || '',
      first_name: admin.user?.first_name || '',
      last_name: admin.user?.last_name || '',
      email: admin.user?.email || '',
      role: FORCED_ROLE,
      department: admin.department || '',
      matricula: admin.matricula || '',
      is_active: admin.is_active ?? true,
      password: '',
      password_confirm: '',
      // is_staff: true, // ✅ se você expuser/usar no modal e backend aceitar
    });

    setShowEditModal(true);
  }, []);

  const handleDeleteUser = useCallback((admin: Administrator) => {
    setSelectedAdministrator(admin);
    setShowDeleteModal(true);
  }, []);

  const handleReactivateUser = useCallback((admin: Administrator) => {
    setSelectedAdministrator(admin);
    setShowReactivateModal(true);
  }, []);

  const handleCloseModals = useCallback(() => {
    setShowCreateModal(false);
    setShowViewModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setShowReactivateModal(false);
    setSelectedAdministrator(null);
    setError(null);
  }, []);

  // Form handlers
  const handleCreateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;

      // ✅ não deixa editar role/is_staff por input (mesmo que exista no modal)
      if (name === 'role' || name === 'is_staff') return;

      setCreateFormData((prev) => ({
        ...prev,
        [name]: value,
        role: FORCED_ROLE,
        is_staff: true,
      }));
    },
    []
  );

  const handleUpdateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;

      // ✅ trava role sempre
      if (name === 'role') return;

      const nextValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setUpdateFormData((prev) => ({
        ...prev,
        [name]: nextValue as any,
        role: FORCED_ROLE,
      }));
    },
    []
  );

  // Create user
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // ✅ re-força antes de enviar
      const payload: CreateAdminData = {
        ...createFormData,
        role: FORCED_ROLE,
        is_staff: true,
      };

      await createAdminMutation.mutateAsync(payload);

      toast.success('Usuário criado com sucesso!');
      handleCloseModals();

      const { data: updatedData } = await refetchAdministrators();
      const newTotalCount = updatedData?.count || totalCount;
      const newTotalPages = Math.ceil(newTotalCount / pageSize);

      if (newTotalPages > 0) setCurrentPage(newTotalPages);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar usuário';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // ✅ Update user (com senha opcional) - SEMPRE super_admin
  const handleUpdateUser = async () => {
    if (!selectedAdministrator) return;
    setError(null);

    try {
      const normalizedUsername = (updateFormData.username || selectedAdministrator.user?.username || '').trim();
      const normalizedEmail = (updateFormData.email || selectedAdministrator.user?.email || '').trim();

      if (!normalizedUsername) {
        const msg = 'O nome de usuário não pode ficar vazio.';
        setError(msg);
        toast.error(msg);
        return;
      }
      if (!normalizedEmail) {
        const msg = 'O email não pode ficar vazio.';
        setError(msg);
        toast.error(msg);
        return;
      }

      const payload: UpdateAdminData = {
        username: normalizedUsername,
        first_name: updateFormData.first_name,
        last_name: updateFormData.last_name,
        email: normalizedEmail,
        role: FORCED_ROLE, // ✅ sempre
        department: updateFormData.department,
        matricula: (updateFormData.matricula || '').trim(),
        is_active: updateFormData.is_active,

        // ✅ se o backend aceitar e seu tipo tiver:
        // is_staff: true,
      };

      const p1 = (updateFormData.password || '').trim();
      const p2 = (updateFormData.password_confirm || '').trim();

      if (p1 || p2) {
        if (p1.length < 8) {
          const msg = 'A senha deve ter pelo menos 8 caracteres.';
          setError(msg);
          toast.error(msg);
          return;
        }
        if (p1 !== p2) {
          const msg = 'As senhas não coincidem.';
          setError(msg);
          toast.error(msg);
          return;
        }
        payload.password = p1;
        payload.password_confirm = p2;
      }

      await updateAdminMutation.mutateAsync({
        id: selectedAdministrator.id,
        data: payload,
      });

      const changedPassword = Boolean(payload.password);
      toast.success(
        changedPassword
          ? 'Usuário atualizado e senha alterada com sucesso!'
          : 'Usuário atualizado com sucesso!'
      );
      handleCloseModals();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar usuário';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Delete user (deactivate)
  const handleDeleteUserConfirm = async () => {
    if (!selectedAdministrator) return;
    setError(null);

    try {
      await deleteAdminMutation.mutateAsync(selectedAdministrator.id);
      toast.success('Usuário desativado com sucesso!');
      handleCloseModals();

      if (administrators.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao desativar usuário';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Reactivate user - SEMPRE super_admin
  const handleReactivateUserConfirm = async () => {
    if (!selectedAdministrator) return;
    setError(null);

    try {
      const reactivateData: UpdateAdminData = {
        username: selectedAdministrator.user?.username || '',
        first_name: selectedAdministrator.user?.first_name || '',
        last_name: selectedAdministrator.user?.last_name || '',
        email: selectedAdministrator.user?.email || '',
        role: FORCED_ROLE, // ✅ sempre
        department: selectedAdministrator.department || '',
        matricula: selectedAdministrator.matricula || '',
        is_active: true,

        // ✅ se o backend aceitar e seu tipo tiver:
        // is_staff: true,
      };

      await updateAdminMutation.mutateAsync({
        id: selectedAdministrator.id,
        data: reactivateData,
      });

      toast.success('Usuário reativado com sucesso!');
      handleCloseModals();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao reativar usuário';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (isLoading) return <LoadingState />;

  return (
    <div className="min-h-screen bg-background p-6">
      <Title
        title="Configurações do Sistema"
        icon={UserCog}
        titleButton={isSuperAdmin ? 'Novo Usuário' : undefined}
        buttonUrl={undefined}
        iconButton={isSuperAdmin ? UserPlus : undefined}
        onButtonClick={isSuperAdmin ? handleCreateUser : undefined}
      />

      {!isSuperAdmin && (
        <Alert
          type="warning"
          message="Apenas Super Administradores podem gerenciar usuários do sistema."
          className="mb-6"
        />
      )}

      {isSuperAdmin && (
        <AdminFilters
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchTerm}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {error ? (
        <div className="bg-destructive-soft border border-destructive/30 rounded-2xl p-6 text-center">
          <Alert type="error" message={error} />
        </div>
      ) : !isSuperAdmin ? (
        <AccessDenied />
      ) : filteredAdministrators.length === 0 ? (
        <EmptyState
          searchTerm={searchTerm}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onCreateUser={handleCreateUser}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAdministrators.map((admin) => (
              <AdminCard
                key={admin.id}
                admin={admin}
                currentUserId={currentUser?.id}
                onView={handleViewUser}
                onEdit={handleEditUser}
                onDelete={handleDeleteUser}
                onReactivate={handleReactivateUser}
              />
            ))}
          </div>

          {isSuperAdmin && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalCount={totalCount}
              pageSize={pageSize}
              onPageChange={handlePageClick}
              onNextPage={handleNextPage}
              onPrevPage={handlePrevPage}
            />
          )}
        </>
      )}

      <CreateAdminModal
        isOpen={showCreateModal}
        onClose={handleCloseModals}
        formData={createFormData}
        error={error}
        isCreating={createAdminMutation.isPending}
        onSubmit={handleCreateUserSubmit}
        onInputChange={handleCreateInputChange}
      />

      <ViewAdminModal
        isOpen={showViewModal}
        onClose={handleCloseModals}
        admin={selectedAdministrator}
        currentUserId={currentUser?.id}
        onEdit={handleEditUser}
      />

      <EditAdminModal
        isOpen={showEditModal}
        onClose={handleCloseModals}
        admin={selectedAdministrator}
        formData={updateFormData}
        error={error}
        isUpdating={updateAdminMutation.isPending}
        currentUserId={currentUser?.id}
        onSubmit={handleUpdateUser}
        onInputChange={handleUpdateInputChange}
      />

      <DeleteAdminModal
        isOpen={showDeleteModal}
        onClose={handleCloseModals}
        admin={selectedAdministrator}
        error={error}
        isDeleting={deleteAdminMutation.isPending}
        onConfirm={handleDeleteUserConfirm}
      />

      <ReactivateAdminModal
        isOpen={showReactivateModal}
        onClose={handleCloseModals}
        admin={selectedAdministrator}
        error={error}
        isReactivating={updateAdminMutation.isPending}
        onConfirm={handleReactivateUserConfirm}
      />
    </div>
  );
}
