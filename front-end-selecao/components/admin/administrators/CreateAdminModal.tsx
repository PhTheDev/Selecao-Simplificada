// components/admin/administrators/CreateAdminModal.tsx
import { CreateAdminData } from '@/api/hooks/useAdministrators';
import { Alert } from '@/components/ui/Alert';
import Modal from '@/components/ui/Modal';
import {
    Building2,
    Eye,
    EyeOff,
    Hash,
    KeyRound,
    Loader2,
    Mail,
    ShieldPlus,
    User,
    UserPlus
} from 'lucide-react';
import { useState } from 'react';

interface CreateAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    formData: CreateAdminData;
    error: string | null;
    isCreating: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

export function CreateAdminModal({
    isOpen,
    onClose,
    formData,
    error,
    isCreating,
    onSubmit,
    onInputChange,
}: CreateAdminModalProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Criar Novo Usuário"
            subtitle="Adicione um novo usuário administrativo ao sistema"
            size="lg"
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={isCreating}
                        className="px-6 py-3 bg-muted text-foreground/80 font-medium rounded-xl hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSubmit}
                        disabled={isCreating}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Criando...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4" />
                                Criar Usuário
                            </>
                        )}
                    </button>
                </>
            }
            backdropClass="bg-black/20"
        >
            <form onSubmit={onSubmit} className="p-6 space-y-6">
                {error && <Alert type="error" message={error} />}

                <div className="rounded-2xl border border-primary/30 bg-primary-soft/60 p-4">
                    <p className="text-sm text-primary flex items-center gap-2 font-medium">
                        <ShieldPlus className="w-4 h-4" />
                        Novo usuário administrativo (Super Admin)
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            Nome *
                        </label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={onInputChange}
                            className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            Sobrenome *
                        </label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={onInputChange}
                            className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                            <UserPlus className="w-4 h-4 text-muted-foreground" />
                            Nome de Usuário *
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={onInputChange}
                            className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                            required
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            Email *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={onInputChange}
                            className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                            required
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                            <KeyRound className="w-4 h-4 text-muted-foreground" />
                            Senha *
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={onInputChange}
                                className="w-full px-4 py-3 pr-11 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                                minLength={8}
                                required
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
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                            <KeyRound className="w-4 h-4 text-muted-foreground" />
                            Confirmar Senha *
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswordConfirm ? 'text' : 'password'}
                                name="password_confirm"
                                value={formData.password_confirm}
                                onChange={onInputChange}
                                className="w-full px-4 py-3 pr-11 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                                minLength={8}
                                required
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground/80 mb-2">
                            <Hash className="w-4 h-4 text-muted-foreground" />
                            Matrícula *
                        </label>
                        <input
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
            </form>
        </Modal>
    );
}

