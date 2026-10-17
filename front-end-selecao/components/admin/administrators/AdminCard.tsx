// components/admin/administrators/AdminCard.tsx
import { Administrator } from '@/api/hooks/useAdministrators';
import { formatDate, getRoleColor, getRoleIcon } from '@/utils/adminHelpers';
import { CheckCircle, Edit, Eye, Trash2, X } from 'lucide-react';

interface AdminCardProps {
  admin: Administrator;
  /** ✅ IMPORTANTE: aqui precisa ser o ID do User (admin.user.id), não do AdministratorProfile */
  currentUserId?: number;
  onView: (admin: Administrator) => void;
  onEdit: (admin: Administrator) => void;
  onDelete: (admin: Administrator) => void;
  onReactivate: (admin: Administrator) => void;
}

export function AdminCard({
  admin,
  currentUserId,
  onView,
  onEdit,
  onDelete,
  onReactivate,
}: AdminCardProps) {
  if (!admin || !admin.user) {
    return null;
  }

  // ✅ compare com o ID do USER (não do AdministratorProfile)
  const isSelf = admin.user?.id === currentUserId;

  /**
   * ✅ REGRA NOVA:
   * - Todo super_admin pode editar qualquer super_admin (e qualquer outro role)
   * Como essa tela já é restrita a super_admin, aqui o canEdit pode ser sempre true.
   */
  const canEdit = true;

  /**
   * ✅ Recomendado:
   * - Evitar desativar a si mesmo (pra não se trancar fora)
   * (Se você quiser permitir, troque por `true`)
   */
  const canDelete = !isSelf;

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-all duration-300 group">
      {/* Header com Status */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getRoleColor(admin.role)}`}>
              {getRoleIcon(admin.role)}
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {admin.full_name || 'Nome não disponível'}
              </h3>
              <p className="text-sm text-muted-foreground">{admin.email || 'Email não disponível'}</p>
            </div>
          </div>

          <div
            className={[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
              admin.is_active
                ? 'bg-success-soft text-success border border-success/30'
                : 'bg-destructive-soft text-destructive border border-destructive/30',
            ].join(' ')}
          >
            {admin.is_active ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Ativo
              </>
            ) : (
              <>
                <X className="w-3 h-3" />
                Inativo
              </>
            )}
          </div>
        </div>

        {/* Informações do Role */}
        <div className="flex justify-between items-center text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(admin.role)}`}>
            {admin.department || 'Sem departamento'}
          </span>
        </div>
      </div>

      {/* Informações Adicionais */}
      <div className="p-6">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Matrícula:</span>
            <span className="font-medium text-foreground">{admin.matricula || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Usuário:</span>
            <span className="font-medium text-foreground">{admin.user?.username || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Criado em:</span>
            <span className="font-medium text-foreground">
              {admin.created_at ? formatDate(admin.created_at) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 mt-4 border-t border-border">
          <button
            onClick={() => onView(admin)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-primary-soft text-primary rounded-lg hover:bg-primary-soft transition-colors text-xs font-medium"
          >
            <Eye className="w-3 h-3" />
            Detalhes
          </button>

          <button
            onClick={() => onEdit(admin)}
            disabled={!canEdit}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-background text-foreground/80 rounded-lg hover:bg-muted transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit className="w-3 h-3" />
            Editar
          </button>

          {/* Botão condicional: Desativar ou Reativar */}
          {admin.is_active ? (
            <button
              onClick={() => onDelete(admin)}
              disabled={!canDelete}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-destructive-soft text-destructive rounded-lg hover:bg-destructive-soft transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSelf ? 'Você não pode desativar a si mesmo' : 'Desativar usuário'}
            >
              <Trash2 className="w-3 h-3" />
              Desativar
            </button>
          ) : (
            <button
              onClick={() => onReactivate(admin)}
              disabled={!canEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-success-soft text-success rounded-lg hover:bg-success-soft transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle className="w-3 h-3" />
              Reativar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
