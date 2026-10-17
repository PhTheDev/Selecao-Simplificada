'use client';

import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { InputField } from './FormFields';
import { stepVariants, cardVariants } from './animations';
import { ApplicationFormData } from '@/utils/applicationValidation';
import { SelectionProcess } from '@/api/types/selection';
import { Candidate } from '@/api/types/candidate';

interface Step3AdditionalProps {
    formData: ApplicationFormData;
    formErrors: Record<string, string>;
    processData: SelectionProcess | null;
    candidateData: Candidate | null;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Step3Additional = ({
    formData,
    formErrors,
    processData,
    candidateData,
    onInputChange,
}: Step3AdditionalProps) => {
    const requiredDocumentsCount = [
        formData.identity_document,
        formData.school_records,
        formData.vitae_curriculum,
    ].filter(Boolean).length;

    return (
        <motion.div
            className="space-y-6"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            key="step-3"
        >
            <motion.div
                className="bg-primary-soft border border-primary-hover rounded-lg p-4"
                variants={cardVariants}
            >
                <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Informações Adicionais
                </h3>
                <p className="text-sm text-muted-foreground">
                    Adicione informações que possam enriquecer sua candidatura (opcionais).
                </p>
            </motion.div>

            <div className="space-y-4">
                <InputField
                    label="Link do Portfólio (Opcional)"
                    name="portfolio_link"
                    type="url"
                    value={formData.portfolio_link}
                    onChange={onInputChange}
                    placeholder="https://seusite.com ou https://linkedin.com/in/seuperfil"
                    error={formErrors.portfolio_link}
                />

                <motion.div
                    className="bg-primary-soft border border-primary-hover rounded-lg p-4"
                    variants={cardVariants}
                    whileHover={{ scale: 1.01 }}
                >
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-primary" />
                        Resumo da Candidatura
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-1">
                            <p className="text-muted-foreground">
                                Processo:{' '}
                                <span className="font-semibold">{processData?.title}</span>
                            </p>
                            <p className="text-muted-foreground">
                                Curso: <span className="font-semibold">{processData?.course}</span>
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-muted-foreground">
                                Candidato:{' '}
                                <span className="font-semibold">{candidateData?.name}</span>
                            </p>
                            <p className="text-muted-foreground">
                                Email: <span className="font-semibold">{candidateData?.email}</span>
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-primary-hover">
                        <p className="text-sm text-muted-foreground">
                            Documentos enviados:{' '}
                            <span className="font-semibold">
                                {requiredDocumentsCount} de 3 obrigatórios
                            </span>
                        </p>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

