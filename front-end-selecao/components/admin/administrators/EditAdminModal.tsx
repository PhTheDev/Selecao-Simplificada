import { Administrator, UpdateAdminData } from '@/api/hooks/useAdministrators';
import { Alert } from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import {
  Building2,
  CheckCircle,
  Eye,
  EyeOff,
  Hash,
  KeyRound,
  Loader2,
  Mail,
  User,
  UserCog,
  UserRound
} from 'lucide-react';
import React, { useState } from 'react';

interface EditAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: Administrator | null;
  formData: UpdateAdminData;
  error: string | null;
  isUpdating: boolean;
  currentUserId?: number;
  onSubmit: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function EditAdminModal({
  isOpen,
  onClose,
  admin,
  formData,
  error,
  isUpdating,
  currentUserId,
  onSubmit,
  onInputChange,
}: EditAdminModalProps) {
  if (!admin) return null;
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const canEditRole = admin.role !== 'super_admin' || admin.id === currentUserId;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Usuário"
      subtitle={admin.full_name}
      size="lg"
      footer={
        <>
          <button
            onClick={onClose}
            disabled={isUpdating}
            className="px-6 py-3 bg-muted text-foreground/80 font-medium rounded-xl hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={isUpdating}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Salvar Alterações
              </>
            )}
          </button>
        </>
      }
      backdropClass="bg-black/20"
    >
      <div className="p-6 space-y-6">
        {error && <Alert type="error" message={error} />}

        <div className="rounded-2xl border border-primary/30 bg-primary-soft/60 p-4">
          <p className="text-sm text-primary flex items-center gap-2 font-medium">
            <UserCog className="w-4 h-4" />
            Editando usuário administrativo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="edit-admin-username" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <UserRound className="w-4 h-4 text-muted-foreground" />
              Nome de usuário *
            </label>
            <input
              id="edit-admin-username"
              type="text"
              name="username"
              value={formData.username}
              onChange={onInputChange}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="edit-admin-first-name" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Nome *
            </label>
            <input
              id="edit-admin-first-name"
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={onInputChange}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              required
            />
          </div>
          <div>
            <label htmlFor="edit-admin-last-name" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Sobrenome *
            </label>
            <input
              id="edit-admin-last-name"
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={onInputChange}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="edit-admin-email" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            Email *
          </label>
          <input
            id="edit-admin-email"
            type="email"
            name="email"
            value={formData.email}
            onChange={onInputChange}
            className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="edit-admin-matricula" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <Hash className="w-4 h-4 text-muted-foreground" />
              Matrícula *
            </label>
            <input
              id="edit-admin-matricula"
              type="text"
              name="matricula"
              value={formData.matricula}
              onChange={onInputChange}
              inputMode="numeric"
              pattern="\d{4,10}"
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
              required
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              Departamento
            </label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={onInputChange}
              className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={onInputChange}
              className="text-primary focus:ring-ring"
            />
            <span className="text-foreground/80">Usuário ativo</span>
          </label>
        </div>

        {/* ✅ Alterar senha (opcional) */}
        <div className="border border-border rounded-2xl p-4 space-y-4">
          <div>
            <h4 className="font-semibold text-foreground">Alterar senha</h4>
            <p className="text-sm text-muted-foreground">
              Preencha apenas se quiser trocar a senha do usuário.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="edit-admin-password" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Nova senha
              </label>
              <div className="relative">
                <input
                  id="edit-admin-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password || ''}
                  onChange={onInputChange}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground/80"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="edit-admin-password-confirm" className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                <KeyRound className="w-4 h-4 text-muted-foreground" />
                Confirmar nova senha
              </label>
              <div className="relative">
                <input
                  id="edit-admin-password-confirm"
                  type={showPasswordConfirm ? 'text' : 'password'}
                  name="password_confirm"
                  value={formData.password_confirm || ''}
                  onChange={onInputChange}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-11 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                  placeholder="Repita a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm((prev) => !prev)}
                  className="absolute inset-y-0 right-3 text-muted-foreground hover:text-foreground/80"
                  aria-label={showPasswordConfirm ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'}
                >
                  {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
