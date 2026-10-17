'use client';

import { CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface StepIndicatorProps {
    currentStep: number;
}

export const StepIndicator = ({ currentStep }: StepIndicatorProps) => {
    const stepLabels = ['Dados', 'Documentos', 'Extras'];
    const stepTitles = ['📝 Dados Pessoais', '📎 Documentos', '✨ Informações Adicionais'];

    return (
        <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-muted-foreground">Etapa {currentStep} de 3</div>
                <div className="text-sm font-semibold text-primary">
                    {stepTitles[currentStep - 1]}
                </div>
            </div>
            <div className="h-2 bg-border rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / 3) * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                />
            </div>
            <div className="flex justify-between mt-2">
                {[1, 2, 3].map((step) => (
                    <motion.div
                        key={step}
                        className={`flex flex-col items-center ${
                            currentStep >= step ? 'text-primary' : 'text-muted-foreground/70'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                                currentStep >= step
                                    ? 'bg-primary-soft border-2 border-primary'
                                    : 'bg-muted border-2 border-input'
                            }`}
                        >
                            {currentStep > step ? (
                                <CheckCircle className="w-4 h-4 text-primary-hover" />
                            ) : (
                                <span className="text-sm font-semibold">{step}</span>
                            )}
                        </div>
                        <span className="text-xs">{stepLabels[step - 1]}</span>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
};

