// components/admin/process-form/BenefitsSection.tsx
import { CheckCircle, Gift, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface Benefit {
    id: number;
    value: string;
}

interface BenefitsSectionProps {
    benefits: Benefit[];
    onAdd: () => void;
    onRemove: (id: number) => void;
    onUpdate: (id: number, value: string) => void;
}

export function BenefitsSection({
    benefits,
    onAdd,
    onRemove,
    onUpdate,
}: BenefitsSectionProps) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="font-semibold text-xl text-gray-800 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    Benefícios
                </h2>

                <button
                    type="button"
                    onClick={onAdd}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Adicionar Benefício
                </button>
            </div>

            <div className="space-y-4">
                {benefits.map((benefit, index) => (
                    <div
                        key={benefit.id}
                        className="p-4 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium text-gray-700">
                                Benefício {index + 1}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={onAdd}
                                    className="p-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                                    title="Adicionar benefício"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                {benefits.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => onRemove(benefit.id)}
                                        className="p-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                                        title="Remover benefício"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <Input
                            type="text"
                            id={`benefit-${benefit.id}`}
                            value={benefit.value}
                            onChange={(value: string) => onUpdate(benefit.id, value)}
                            placeholder="Ex: Vale alimentação, Plano de saúde, Home office..."
                            required={index === 0}
                            icon={<Gift className="w-5 h-5" />}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

