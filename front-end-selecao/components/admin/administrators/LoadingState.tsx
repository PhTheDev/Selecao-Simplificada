// components/admin/administrators/LoadingState.tsx

export function LoadingState() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando configurações...</p>
            </div>
        </div>
    );
}

