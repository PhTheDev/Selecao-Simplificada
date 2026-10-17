// components/admin/process-analysis/LoadingState.tsx
export function LoadingState() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background">
            <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
                <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-primary/30"></div>
            </div>
            <p className="mt-6 text-muted-foreground font-medium text-lg">Carregando análise do processo...</p>
        </div>
    );
}

