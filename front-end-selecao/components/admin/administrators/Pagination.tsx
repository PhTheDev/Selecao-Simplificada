// components/admin/administrators/Pagination.tsx

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onNextPage: () => void;
    onPrevPage: () => void;
}

export function Pagination({
    currentPage,
    totalPages,
    totalCount,
    pageSize,
    onPageChange,
    onNextPage,
    onPrevPage,
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalCount);

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 p-6 bg-card rounded-2xl shadow-sm border border-border">
            <div className="text-sm text-muted-foreground">
                Mostrando {startItem} a {endItem} de {totalCount} usuários
            </div>

            <div className="flex items-center gap-2">
                {/* Previous Button */}
                <button
                    onClick={onPrevPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/80 bg-card border border-input rounded-xl hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Anterior
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                                    currentPage === pageNum
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-foreground/80 bg-card border border-input hover:bg-background'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                {/* Next Button */}
                <button
                    onClick={onNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/80 bg-card border border-input rounded-xl hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    Próximo
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

