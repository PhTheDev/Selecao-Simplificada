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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="font-semibold text-xl text-gray-800 flex items-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                    Pré-requisitos
                </h2>

                <button
                    type="button"
                    onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Pré-requisito
                </button>
            </div>

            <div className="space-y-4">
                {prerequisites.map((prerequisite, index) => (
                    <div
                        key={prerequisite.id}
                        className="p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium text-gray-700">
                                Pré-requisito {index + 1}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onAdd}
                                    className="p-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                    title="Adicionar pré-requisito"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                {prerequisites.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => onRemove(prerequisite.id)}
                                        className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
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

