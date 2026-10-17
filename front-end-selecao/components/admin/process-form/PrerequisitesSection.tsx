// components/admin/process-form/PrerequisitesSection.tsx
import { AlertTriangle, ListChecks, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface Prerequisite {
    id: number;
    value: string;
}

interface PrerequisitesSectionProps {
    prerequisites: Prerequisite[];
    onAdd: () => void;
    onRemove: (id: number) => void;
    onUpdate: (id: number, value: string) => void;
}

export function PrerequisitesSection({
    prerequisites,
    onAdd,
    onRemove,
    onUpdate,
}: PrerequisitesSectionProps) {
    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="font-semibold text-xl text-foreground flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-warning" />
                    Pré-requisitos
                </h2>

                <button
                    type="button"
                    onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary-hover transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Pré-requisito
                </button>
            </div>

            <div className="space-y-4">
                {prerequisites.map((prerequisite, index) => (
                    <div
                        key={prerequisite.id}
                        className="p-4 border border-border rounded-xl bg-background hover:bg-muted transition-colors"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium text-foreground/80">
                                Pré-requisito {index + 1}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onAdd}
                                    className="p-1 bg-primary-soft text-primary rounded-lg hover:bg-primary-soft transition-colors"
                                    title="Adicionar pré-requisito"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                {prerequisites.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => onRemove(prerequisite.id)}
                                        className="p-1 bg-destructive-soft text-destructive rounded-lg hover:bg-destructive-soft transition-colors"
                                        title="Remover pré-requisito"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <Input
                            type="text"
                            id={`prerequisite-${prerequisite.id}`}
                            value={prerequisite.value}
                            onChange={(value: string) => onUpdate(prerequisite.id, value)}
                            placeholder="Ex: Experiência com Pacote Office, Conhecimento em inglês..."
                            required={index === 0}
                            icon={<ListChecks className="w-5 h-5" />}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

