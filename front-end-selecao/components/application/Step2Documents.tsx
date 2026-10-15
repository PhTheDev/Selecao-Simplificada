'use client';

import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { FileUploadField } from './FormFields';
import { stepVariants, cardVariants } from './animations';
import { ApplicationFormData } from '@/utils/applicationValidation';

interface Step2DocumentsProps {
    formData: ApplicationFormData;
    formErrors: Record<string, string>;
    filePreviews: Record<string, string>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: string) => void;
    onFileRemove: (field: string) => void;
}

export const Step2Documents = ({
    formData,
    formErrors,
    filePreviews,
    onFileChange,
    onFileRemove,
}: Step2DocumentsProps) => {
    return (
        <motion.div
            className="space-y-6"
            variants={stepVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            key="step-2"
        >
            <motion.div
                className="bg-[#e6f7f9] border border-[#0a9396] rounded-lg p-4"
                variants={cardVariants}
            >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#005f73]" />
                    Documentos Necessários
                </h3>
                <p className="text-sm text-gray-600">
                    Envie os documentos obrigatórios para sua candidatura. Formatos aceitos: PDF,
                    JPG, PNG, DOC, DOCX, WEBP (Máximo: 5MB cada)
                </p>
            </motion.div>

            <div className="space-y-4">
                <FileUploadField
                    label="Documento de Identidade (RG/CNH)"
                    name="identity_document"
                    description="Documento oficial com foto. Deve ser frente e verso."
                    file={formData.identity_document}
                    preview={filePreviews.identity_document}
                    error={formErrors.identity_document}
                    onChange={(e) => onFileChange(e, 'identity_document')}
                    onRemove={() => onFileRemove('identity_document')}
                    required
                />

                <FileUploadField
                    label="Histórico Escolar"
                    name="school_records"
                    description="Histórico escolar da instituição de ensino atual."
                    file={formData.school_records}
                    preview={filePreviews.school_records}
                    error={formErrors.school_records}
                    onChange={(e) => onFileChange(e, 'school_records')}
                    onRemove={() => onFileRemove('school_records')}
                    required
                />

                <FileUploadField
                    label="Currículo (Lattes ou similar)"
                    name="vitae_curriculum"
                    description="Currículo atualizado com experiências e formações."
                    file={formData.vitae_curriculum}
                    preview={filePreviews.vitae_curriculum}
                    error={formErrors.vitae_curriculum}
                    onChange={(e) => onFileChange(e, 'vitae_curriculum')}
                    onRemove={() => onFileRemove('vitae_curriculum')}
                    required
                />

                <FileUploadField
                    label="Declaração de Frequência"
                    name="frequency_statement"
                    description="Declaração de matrícula e frequência atual."
                    file={formData.frequency_statement}
                    preview={filePreviews.frequency_statement}
                    error={formErrors.frequency_statement}
                    onChange={(e) => onFileChange(e, 'frequency_statement')}
                    onRemove={() => onFileRemove('frequency_statement')}
                    required={false}
                />

                <FileUploadField
                    label="Certificados de Cursos"
                    name="course_certificates"
                    description="Certificados de cursos complementares realizados."
                    file={formData.course_certificates}
                    preview={filePreviews.course_certificates}
                    error={formErrors.course_certificates}
                    onChange={(e) => onFileChange(e, 'course_certificates')}
                    onRemove={() => onFileRemove('course_certificates')}
                />
            </div>
        </motion.div>
    );
};

