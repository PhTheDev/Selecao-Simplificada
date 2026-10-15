'use client';

import { AlertCircle, CheckCircle, FileText, Lock, Mic } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import Modal from '@/components/ui/Modal';
import { Stage2Evaluation as Stage2Eval } from './types';

interface ProcessConfig {
    has_essay?: boolean;
    weight_interview?: number;
    weight_essay?: number;
}

interface Stage2EvaluationProps {
    application: { id: number };
    onSubmit: (data: Stage2Eval) => void;
    isSubmitting: boolean;
    existingEvaluation?: Stage2Eval;
    processConfig?: ProcessConfig;
    readOnly?: boolean;
}

export default function Stage2EvaluationComponent({
    application,
    onSubmit,
    isSubmitting,
    existingEvaluation,
    processConfig,
    readOnly,
}: Stage2EvaluationProps) {
    // ✅ Trava se já existir avaliação OU se readOnly for passado explicitamente
    const locked = useMemo(() => {
        if (readOnly === true) return true;
        return Boolean(existingEvaluation);
    }, [readOnly, existingEvaluation]);

    const [scores, setScores] = useState({
        interview_score: existingEvaluation?.interview_score
            ? parseFloat(String(existingEvaluation.interview_score)) || 0
            : 0,
        essay_score: existingEvaluation?.essay_score
            ? parseFloat(String(existingEvaluation.essay_score)) || 0
            : 0,
    });

    const [notes, setNotes] = useState({
        interview_notes: existingEvaluation?.interview_notes || '',
        essay_notes: existingEvaluation?.essay_notes || '',
    });
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    // --- Cálculo da nota total com pesos configuráveis ---
    const totalScore = useMemo(() => {
        const hasEssay = processConfig?.has_essay !== false;

        const interviewWeight = processConfig?.weight_interview ?? 70;
        const essayWeight = processConfig?.weight_essay ?? 30;

        const interviewScore =
            typeof scores.interview_score === 'number'
                ? scores.interview_score
                : parseFloat(String(scores.interview_score)) || 0;

        let total = interviewScore * interviewWeight;
        let totalWeight = interviewWeight;

        if (hasEssay) {
            const essayScore =
                typeof scores.essay_score === 'number'
                    ? scores.essay_score
                    : parseFloat(String(scores.essay_score)) || 0;
            total += essayScore * essayWeight;
            totalWeight += essayWeight;
        }

        if (totalWeight === 0) return 0;
        return parseFloat((total / totalWeight).toFixed(2));
    }, [scores, processConfig?.has_essay, processConfig?.weight_interview, processConfig?.weight_essay]);

    const buildPayload = useCallback((): Stage2Eval => {
        return {
            application: application.id,
            ...scores,
            ...notes,
            total_score: totalScore,
        };
    }, [application.id, scores, notes, totalScore]);

    const handleSubmit = useCallback(() => {
        if (locked) return;
        setIsConfirmOpen(true);
    }, [locked]);

    const handleConfirmSubmit = useCallback(() => {
        if (locked) return;
        const data = buildPayload();
        setIsConfirmOpen(false);
        onSubmit(data);
    }, [locked, buildPayload, onSubmit]);

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            Etapa 2 -{' '}
                            {processConfig?.has_essay !== false ? 'Entrevista & Redação' : 'Entrevista'}
                        </h3>
                        <p className="text-gray-600 mt-1">
                            {processConfig?.has_essay !== false
                                ? 'Avalie a entrevista e redação do candidato'
                                : 'Avalie a entrevista do candidato'}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-purple-700">
                            {totalScore.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">Pontuação Total</div>
                    </div>
                </div>

                {locked ? (
                    <div className="flex items-center gap-2 text-gray-700 bg-gray-50 border border-gray-200 p-3 rounded-lg">
                        <Lock className="w-5 h-5 text-gray-500" />
                        <span>Etapa 2 finalizada — somente leitura</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-purple-600 bg-purple-50 p-3 rounded-lg">
                        <AlertCircle className="w-5 h-5" />
                        <span>Esta etapa só fica disponível após conclusão da Etapa 1</span>
                    </div>
                )}
            </div>

            <div
                className={`grid grid-cols-1 ${
                    processConfig?.has_essay !== false ? 'md:grid-cols-2' : 'md:grid-cols-1'
                } gap-6`}
            >
                {/* Entrevista */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Mic className="w-5 h-5" />
                        Entrevista
                    </h4>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pontuação da Entrevista (0-10)
                            </label>

                            <input
                                type="range"
                                min="0"
                                max="10"
                                step="0.5"
                                value={
                                    typeof scores.interview_score === 'number'
                                        ? scores.interview_score
                                        : parseFloat(String(scores.interview_score)) || 0
                                }
                                onChange={(e) => {
                                    if (locked) return;
                                    setScores((prev) => ({
                                        ...prev,
                                        interview_score: parseFloat(e.target.value),
                                    }));
                                }}
                                disabled={locked}
                                className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${
                                    locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                }`}
                            />

                            <div className="flex justify-between text-sm text-gray-600 mt-2">
                                <span>0</span>
                                <span className="font-bold text-purple-600">
                                    {(
                                        (typeof scores.interview_score === 'number'
                                            ? scores.interview_score
                                            : parseFloat(String(scores.interview_score)) || 0) as number
                                    ).toFixed(1)}
                                </span>
                                <span>10</span>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Observações da Entrevista
                            </label>

                            <textarea
                                value={notes.interview_notes}
                                onChange={(e) => {
                                    if (locked) return;
                                    setNotes((prev) => ({ ...prev, interview_notes: e.target.value }));
                                }}
                                readOnly={locked}
                                placeholder="Anotações sobre a entrevista..."
                                className={`w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                    locked ? 'bg-gray-100 cursor-not-allowed focus:ring-0' : ''
                                }`}
                            />
                        </div>
                    </div>
                </div>

                {/* Redação - opcional, só aparece se has_essay for true */}
                {processConfig?.has_essay !== false && (
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Redação
                        </h4>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Pontuação da Redação (0-10)
                                </label>

                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    step="0.5"
                                    value={
                                        typeof scores.essay_score === 'number'
                                            ? scores.essay_score
                                            : parseFloat(String(scores.essay_score)) || 0
                                    }
                                    onChange={(e) => {
                                        if (locked) return;
                                        setScores((prev) => ({
                                            ...prev,
                                            essay_score: parseFloat(e.target.value),
                                        }));
                                    }}
                                    disabled={locked}
                                    className={`w-full h-2 bg-gray-200 rounded-lg appearance-none ${
                                        locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                                    }`}
                                />

                                <div className="flex justify-between text-sm text-gray-600 mt-2">
                                    <span>0</span>
                                    <span className="font-bold text-purple-600">
                                        {(
                                            (typeof scores.essay_score === 'number'
                                                ? scores.essay_score
                                                : parseFloat(String(scores.essay_score)) || 0) as number
                                        ).toFixed(1)}
                                    </span>
                                    <span>10</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Observações da Redação
                                </label>

                                <textarea
                                    value={notes.essay_notes}
                                    onChange={(e) => {
                                        if (locked) return;
                                        setNotes((prev) => ({ ...prev, essay_notes: e.target.value }));
                                    }}
                                    readOnly={locked}
                                    placeholder="Anotações sobre a redação..."
                                    className={`w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                                        locked ? 'bg-gray-100 cursor-not-allowed focus:ring-0' : ''
                                    }`}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || locked}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                        isSubmitting || locked
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:shadow-lg hover:scale-[1.02]'
                    }`}
                >
                    {isSubmitting ? (
                        <>Salvando...</>
                    ) : (
                        <>
                            <CheckCircle className="w-5 h-5" />
                            {existingEvaluation ? 'Avaliação Finalizada' : 'Salvar Avaliação'}
                        </>
                    )}
                </button>
            </div>

            <Modal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                title="Confirmar finalização da Etapa 2"
                subtitle="Após finalizar a avaliação desta pessoa, não será possível voltar atrás."
                size="sm"
                footer={
                    <>
                        <button
                            onClick={() => setIsConfirmOpen(false)}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirmSubmit}
                            disabled={isSubmitting}
                            className="px-4 py-2 rounded-lg bg-purple-700 text-white hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Finalizando...' : 'Sim, finalizar'}
                        </button>
                    </>
                }
            >
                <div className="p-6 text-sm text-gray-700">
                    Deseja realmente finalizar a avaliação desta pessoa na Etapa 2? Esta ação é definitiva.
                </div>
            </Modal>
        </div>
    );
}