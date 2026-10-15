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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 group">
      {/* Header com Status */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getRoleColor(admin.role)}`}>
              {getRoleIcon(admin.role)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">
                {admin.full_name || 'Nome não disponível'}
              </h3>
              <p className="text-sm text-gray-600">{admin.email || 'Email não disponível'}</p>
            </div>
          </div>

          <div
            className={[
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
              admin.is_active
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200',
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
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Matrícula:</span>
            <span className="font-medium text-gray-900">{admin.matricula || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Usuário:</span>
            <span className="font-medium text-gray-900">{admin.user?.username || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span>Criado em:</span>
            <span className="font-medium text-gray-900">
              {admin.created_at ? formatDate(admin.created_at) : 'N/A'}
            </span>
          </div>
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-4 mt-4 border-t border-gray-100">
          <button
            onClick={() => onView(admin)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs font-medium"
          >
            <Eye className="w-3 h-3" />
            Detalhes
          </button>

          <button
            onClick={() => onEdit(admin)}
            disabled={!canEdit}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Edit className="w-3 h-3" />
            Editar
          </button>

          {/* Botão condicional: Desativar ou Reativar */}
          {admin.is_active ? (
            <button
              onClick={() => onDelete(admin)}
              disabled={!canDelete}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSelf ? 'Você não pode desativar a si mesmo' : 'Desativar usuário'}
            >
              <Trash2 className="w-3 h-3" />
              Desativar
            </button>
          ) : (
            <button
              onClick={() => onReactivate(admin)}
              disabled={!canEdit}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
