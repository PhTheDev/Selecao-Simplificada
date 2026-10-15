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
                <div className="text-sm font-medium text-gray-600">Etapa {currentStep} de 3</div>
                <div className="text-sm font-semibold text-[#005f73]">
                    {stepTitles[currentStep - 1]}
                </div>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-[#005f73] to-[#0a9396]"
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
                            currentStep >= step ? 'text-[#005f73]' : 'text-gray-400'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                                currentStep >= step
                                    ? 'bg-[#e6f7f9] border-2 border-[#005f73]'
                                    : 'bg-gray-100 border-2 border-gray-300'
                            }`}
                        >
                            {currentStep > step ? (
                                <CheckCircle className="w-4 h-4 text-[#0a9396]" />
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

