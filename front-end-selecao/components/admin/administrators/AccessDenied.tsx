// components/admin/administrators/AccessDenied.tsx
import { Shield } from 'lucide-react';

export function AccessDenied() {
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-12 text-center">
            <Shield className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" />
            <h3 className="text-foreground font-semibold text-xl mb-2">
                Acesso Restrito
            </h3>
            <p className="text-muted-foreground">
                Você não tem permissão para gerenciar usuários do sistema.
            </p>
        </div>
    );
}

