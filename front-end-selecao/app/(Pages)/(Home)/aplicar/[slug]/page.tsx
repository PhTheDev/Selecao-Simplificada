'use client';

import { useApplicationForm } from '@/api//hooks/useApplicationForm';
import { useApplicationData } from '@/api/hooks/useApplicationData';
import { Step1PersonalData } from '@/components/application/Step1PersonalData';
import { Step2Documents } from '@/components/application/Step2Documents';
import { Step3Additional } from '@/components/application/Step3Additional';
import { StepIndicator } from '@/components/application/StepIndicator';
import { modalVariants, pageVariants } from '@/components/application/animations';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { parseLocalCalendarDate } from '@/utils/selectionProcessDates';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AplicarPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const {
        processData,
        candidateData,
        loading,
        error,
        accessToken,
        alreadyApplied,
        applicationStatus,
        setError,
    } = useApplicationData(slug);

    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const {
        formData,
        formErrors,
        currentStep,
        submitting,
        submitError,
        filePreviews,
        cepLoading,
        addressFetched,
        handleInputChange,
        handleFileChange,
        handleFileRemove,
        handleCepSearch,
        handleNextStep,
        handlePrevStep,
        handleSubmit,
        setFormData,
        canGoNext,
    } = useApplicationForm({
        initialData: candidateData
            ? {
                  name: candidateData.name || '',
                  cpf: candidateData.cpf || '',
                  phone: candidateData.phone || '',
                  college: candidateData.college || '',
                  period: candidateData.period || '',
                  semester: candidateData.semester || '',
                  cep: candidateData.cep || '',
                  address: candidateData.address || '',
                  complement: candidateData.complement || '',
                  neighborhood: candidateData.neighborhood || '',
                  city: candidateData.city || '',
                  uf: candidateData.uf || '',
              }
            : undefined,
        candidateData,
        processData,
        accessToken,
        alreadyApplied,
        onSubmitSuccess: () => setShowSuccessModal(true),
        onError: (errorMsg) => setError(errorMsg),
    });

    // Loading State
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <motion.div
                        className="rounded-full h-16 w-16 border-b-2 border-[#005f73] mx-auto mb-4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <h3 className="text-lg font-semibold text-gray-700">Carregando...</h3>
                    <p className="text-gray-500 mt-2">Preparando seu formulário de candidatura</p>
                </div>
            </div>
        );
    }

    // Error State
    if (error || !processData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
                <motion.div
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="text-center">
                        <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Ocorreu um erro</h1>
                        <p className="text-gray-600 mb-6">{error || 'Processo não encontrado'}</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <motion.button
                                onClick={() => router.back()}
                                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Voltar
                            </motion.button>
                            <motion.button
                                onClick={() => router.push('/processos-seletivos')}
                                className="px-6 py-3 bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white rounded-lg hover:from-[#006d84] hover:to-[#0ba5a8] font-medium transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Ver Processos
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    // Already Applied State
    if (alreadyApplied) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center px-4">
                <motion.div
                    className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md w-full"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="text-center">
                        <div className="mx-auto w-20 h-20 bg-[#e6f7f9] rounded-full flex items-center justify-center mb-6">
                            <CheckCircle className="w-10 h-10 text-[#0a9396]" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Inscrição Confirmada</h1>
                        <p className="text-gray-600 mb-4">Você já está inscrito no processo:</p>
                        <p className="font-medium text-gray-900 mb-4 bg-gray-50 p-3 rounded-lg">
                            {processData?.title}
                        </p>

                        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-800">
                                <strong>Status:</strong> Inscrição confirmada
                            </p>
                            <p className="text-sm text-blue-800 mt-1">
                                <strong>Data da inscrição:</strong> Aguardando confirmação
                            </p>
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                            Acompanhe o status da sua candidatura na seção "Meus Processos"
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <motion.button
                                onClick={() => router.push('/candidato/meus-processos')}
                                className="px-6 py-3 bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white rounded-lg hover:from-[#006d84] hover:to-[#0ba5a8] font-medium transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Ver Minhas Candidaturas
                            </motion.button>
                            <motion.button
                                onClick={() => router.push('/processos-seletivos')}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Ver Outros Processos
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <motion.div
            className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#f0fdff] via-[#e6f7f9] to-[#d4f2f4]" />

            <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
                {/* Header */}
                <motion.div
                    className="bg-gradient-to-r from-[#005f73] via-[#087e8b] to-[#0a9396] rounded-2xl shadow-xl overflow-hidden mb-8 relative"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                >
                    <motion.button
                        onClick={() => router.push('/')}
                        className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center bg-white/20 backdrop-blur-sm text-white rounded-full hover:bg-white/30 transition-all duration-200"
                        title="Voltar para página inicial"
                        aria-label="Voltar"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                    </motion.button>

                    <div className="p-8 text-white">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pt-8">
                            <motion.div
                                className="flex-1"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h1 className="text-3xl font-bold mb-3">Candidatura: {processData.title}</h1>
                                <p className="text-[#caf0f8] text-lg">{processData.subtitle}</p>
                                <div className="flex flex-wrap gap-4 mt-4">
                                    <motion.div
                                        className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <p className="text-sm font-medium">Curso: {processData.course}</p>
                                    </motion.div>
                                    <motion.div
                                        className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <p className="text-sm font-medium">Vagas: {processData.number_vacancies}</p>
                                    </motion.div>
                                    <motion.div
                                        className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
                                        whileHover={{ scale: 1.05 }}
                                    >
                                        <p className="text-sm font-medium">
                                            Prazo:{' '}
                                            {parseLocalCalendarDate(processData.ending_date).toLocaleDateString(
                                                'pt-BR'
                                            )}
                                        </p>
                                    </motion.div>
                                </div>
                            </motion.div>
                            <motion.div
                                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 min-w-[200px]"
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <p className="text-sm font-medium mb-2">Resumo do Processo</p>
                                <div className="space-y-2">
                                    <p className="text-sm">
                                        Bolsa: R$ {parseFloat(processData.salary || '0').toLocaleString('pt-BR')}
                                    </p>
                                    <p className="text-sm">Carga: {processData.weekly_workload}</p>
                                    <p className="text-sm">Local: {processData.local}</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="p-8">
                        {applicationStatus === 'can_apply' && (
                            <>
                                <StepIndicator currentStep={currentStep} />

                                {submitError && (
                                    <motion.div
                                        className="mb-6 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-lg p-4"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                            <p className="text-red-800">{submitError}</p>
                                        </div>
                                    </motion.div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="min-h-[500px]">
                                        <AnimatePresence mode="wait">
                                            {currentStep === 1 && (
                                                <Step1PersonalData
                                                    formData={formData}
                                                    formErrors={formErrors}
                                                    candidateEmail={candidateData?.email}
                                                    addressFetched={addressFetched}
                                                    cepLoading={cepLoading}
                                                    onInputChange={handleInputChange}
                                                    onCepSearch={handleCepSearch}
                                                />
                                            )}
                                            {currentStep === 2 && (
                                                <Step2Documents
                                                    formData={formData}
                                                    formErrors={formErrors}
                                                    filePreviews={filePreviews}
                                                    onFileChange={handleFileChange}
                                                    onFileRemove={handleFileRemove}
                                                />
                                            )}
                                            {currentStep === 3 && (
                                                <Step3Additional
                                                    formData={formData}
                                                    formErrors={formErrors}
                                                    processData={processData}
                                                    candidateData={candidateData}
                                                    onInputChange={handleInputChange}
                                                />
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Navigation Buttons */}
                                    <div className="flex justify-between pt-8 border-t border-gray-200 mt-8">
                                        <div>
                                            {currentStep > 1 && (
                                                <motion.button
                                                    type="button"
                                                    onClick={handlePrevStep}
                                                    disabled={submitting}
                                                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    ← Voltar
                                                </motion.button>
                                            )}
                                        </div>

                                        <div className="flex gap-3">
                                            {currentStep < 3 ? (
                                                <motion.button
                                                    type="button"
                                                    onClick={handleNextStep}
                                                    disabled={!canGoNext} 
                                                    className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                                    canGoNext
                                                        ? 'bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white hover:from-[#006d84] hover:to-[#0ba5a8]'
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    }`}
                                                    whileHover={canGoNext ? { scale: 1.05 } : undefined}
                                                    whileTap={canGoNext ? { scale: 0.95 } : undefined}
                                                >
                                                    Próximo →
                                                </motion.button>
                                            ) : (
                                                <>
                                                    <motion.button
                                                        type="button"
                                                        onClick={() => router.back()}
                                                        disabled={submitting}
                                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        Cancelar
                                                    </motion.button>
                                                    <motion.button
                                                        type="submit"
                                                        disabled={submitting}
                                                        className="px-6 py-3 bg-gradient-to-r from-[#0a9396] to-[#2a9d8f] text-white rounded-lg hover:from-[#0ba5a8] hover:to-[#38b2ac] font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                    >
                                                        {submitting ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                                Enviando...
                                                            </>
                                                        ) : (
                                                            '✅ Enviar Candidatura'
                                                        )}
                                                    </motion.button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Important Notes */}
                                    <motion.div
                                        className="mt-8 bg-yellow-50/90 backdrop-blur-sm border border-yellow-200 rounded-lg p-6"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-semibold text-yellow-900 mb-2">
                                                    Informações importantes
                                                </h4>
                                                <ul className="text-sm text-yellow-800 space-y-1">
                                                    <li>• Campos marcados com * são obrigatórios</li>
                                                    <li>• Verifique se todos os documentos estão legíveis</li>
                                                    <li>
                                                        • Após o envio, você poderá acompanhar o status em "Meus
                                                        Processos"
                                                    </li>
                                                    <li>
                                                        • Para alterações, atualize seus dados no perfil do candidato
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </motion.div>
                                </form>
                            </>
                        )}

                        {applicationStatus === 'checking' && (
                            <div className="text-center py-16">
                                <motion.div
                                    className="rounded-full h-16 w-16 border-b-2 border-[#005f73] mx-auto mb-6"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    Verificando sua situação...
                                </h3>
                                <p className="text-gray-500">
                                    Estamos verificando se você já possui uma candidatura para este processo.
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Success Modal */}
            <AnimatePresence>
                {showSuccessModal && (
                    <motion.div
                        className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
                            variants={modalVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="p-8 text-center">
                                <motion.div
                                    className="mx-auto w-24 h-24 bg-gradient-to-r from-[#0a9396] to-[#2a9d8f] rounded-full flex items-center justify-center mb-6"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring' }}
                                >
                                    <CheckCircle className="w-12 h-12 text-white" />
                                </motion.div>
                                <motion.h3
                                    className="text-2xl font-bold text-gray-900 mb-3"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    🎉 Candidatura Enviada!
                                </motion.h3>
                                <motion.p
                                    className="text-gray-600 mb-4"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    Sua candidatura para{' '}
                                    <span className="font-semibold text-gray-900">{processData.title}</span> foi
                                    enviada com sucesso.
                                </motion.p>
                                <motion.p
                                    className="text-sm text-gray-500 mb-6"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    Você será notificado sobre o andamento do processo por email. Acompanhe também pela
                                    seção "Meus Processos".
                                </motion.p>
                                <motion.div
                                    className="flex flex-col gap-3"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    <motion.button
                                        onClick={() => router.push('/candidato/meus-processos')}
                                        className="px-6 py-3 bg-gradient-to-r from-[#005f73] to-[#0a9396] text-white rounded-lg hover:from-[#006d84] hover:to-[#0ba5a8] font-medium transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Ver Minhas Candidaturas
                                    </motion.button>
                                    <motion.button
                                        onClick={() => router.push('/processos-seletivos')}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        Ver Outros Processos
                                    </motion.button>
                                </motion.div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
