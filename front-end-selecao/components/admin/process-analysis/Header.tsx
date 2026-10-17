import { ChevronLeft, Download } from 'lucide-react';
import { SelectionProcess } from './types';

interface HeaderProps {
    process: SelectionProcess;
    onBack: () => void;
}

export default function Header({ process, onBack }: HeaderProps) {
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <button
                            onClick={onBack}
                            className="p-2 bg-muted text-foreground/80 rounded-xl hover:bg-border transition-colors"
                            title="Voltar para processos"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Análise: {process.title}
                            </h1>
                            <p className="text-muted-foreground mt-1">{process.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">Curso:</span>
                            <span className="text-foreground/80">{process.course}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">Slug:</span>
                            <span className="font-mono text-foreground/80 bg-muted px-2 py-1 rounded">
                                {process.slug}
                            </span>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${process.is_active
                                ? 'bg-success text-white'
                                : 'bg-destructive text-white'
                            }`}>
                            {process.is_active ? 'Ativo' : 'Inativo'}
                        </div>
                    </div>
                </div>
                {process.notice_documents && process.notice_documents.length > 0 && (
                    <a
                        href={process.notice_documents[0].file}
                        download
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                    >
                        <Download className="w-4 h-4" />
                        Baixar Edital
                    </a>
                )}
            </div>
        </div>
    );
}