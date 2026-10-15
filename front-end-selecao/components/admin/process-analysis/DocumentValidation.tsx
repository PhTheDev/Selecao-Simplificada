'use client';

import { CheckCircle, ExternalLink, FileText, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Application } from './types';

interface DocumentValidationProps {
    application: Application;
    validation: {
        identity_document_valid: boolean;
        school_records_valid: boolean;
        frequency_statement_valid: boolean;
        vitae_curriculum_valid: boolean;
        course_certificates_valid: boolean;
    };
    onValidationChange: (validation: any) => void;
    rejectionReasons?: {
        identity_document: string;
        school_records: string;
        frequency_statement: string;
        vitae_curriculum: string;
        course_certificates: string;
    };
    onRejectionReasonChange?: (docKey: string, reason: string) => void;
}

export default function DocumentValidation({
    application,
    validation,
    onValidationChange,
    rejectionReasons,
    onRejectionReasonChange,
}: DocumentValidationProps) {
    const documents = [
        {
            key: 'identity_document',
            label: 'Documento de Identidade',
            url: application.identity_document,
            required: true,
            description: 'Documento oficial com foto',
        },
        {
            key: 'school_records',
            label: 'Histórico Escolar',
            url: application.school_records,
            required: true,
            description: 'Histórico acadêmico da faculdade',
        },
        {
            key: 'frequency_statement',
            label: 'Declaração de Frequência',
            url: application.frequency_statement,
            required: false,
            description: 'Declaração de matrícula e frequência',
        },
        {
            key: 'vitae_curriculum',
            label: 'Currículo',
            url: application.vitae_curriculum,
            required: true,
            description: 'Currículo profissional',
        },
        {
            key: 'course_certificates',
            label: 'Certificados de Cursos',
            url: application.course_certificates,
            required: false,
            description: 'Certificados de cursos complementares',
        },
    ];

    const handleDownload = async (url: string, filename: string) => {
        try {
            const accessToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('admin-access-token='))
                ?.split('=')[1];

            if (!accessToken) {
                toast.error('Token de acesso não encontrado');
                return;
            }

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${accessToken}` },
            });

            if (response.ok) {
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
            } else {
                toast.error('Erro ao baixar documento');
            }
        } catch (error) {
            console.error('Erro ao baixar documento:', error);
            toast.error('Erro ao baixar documento');
        }
    };

    const getFileName = (url: string) => {
        try {
            return url.split('/').pop() || 'documento.pdf';
        } catch {
            return 'documento.pdf';
        }
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Validação de Documentos
            </h4>

            <div className="space-y-4">
                {documents
                    .filter(doc => doc.url || doc.required)
                    .map((doc) => {
                        const isValid = validation[`${doc.key}_valid` as keyof typeof validation];
                        const rejectionReason = rejectionReasons?.[doc.key as keyof typeof rejectionReasons] || '';

                        return (
                            <div
                                key={doc.key}
                                className={`p-4 rounded-lg border ${isValid
                                    ? 'border-green-200 bg-green-50'
                                    : 'border-red-200 bg-red-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4 mb-3">
                                            <button
                                                onClick={() => {
                                                    const newValidation = {
                                                        ...validation,
                                                        [`${doc.key}_valid`]: !isValid,
                                                    };
                                                    onValidationChange(newValidation);
                                                }}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isValid
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-red-100 text-red-600'
                                                    }`}
                                            >
                                                {isValid ? (
                                                    <CheckCircle className="w-6 h-6" />
                                                ) : (
                                                    <XCircle className="w-6 h-6" />
                                                )}
                                            </button>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h5 className="font-medium text-gray-900">{doc.label}</h5>
                                                    {doc.required && (
                                                        <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded-full">
                                                            Obrigatório
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                                            </div>
                                        </div>

                                        {!isValid && onRejectionReasonChange && (
                                            <div className="ml-14 mt-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Motivo da rejeição:
                                                </label>
                                                <textarea
                                                    value={rejectionReason}
                                                    onChange={(e) => onRejectionReasonChange(doc.key, e.target.value)}
                                                    placeholder="Descreva o motivo pelo qual o documento foi rejeitado..."
                                                    className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                                                    rows={3}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {doc.url && (
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="ml-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Abrir
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                {application.portfolio_link && (
                    <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                                    <ExternalLink className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h5 className="font-medium text-gray-900">Portfólio (Link)</h5>
                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                            Opcional
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1">Link para portfólio online</p>
                                </div>
                            </div>
                            <a
                                href={
                                    application.portfolio_link?.startsWith('http://') ||
                                    application.portfolio_link?.startsWith('https://')
                                        ? application.portfolio_link
                                        : undefined
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                                onClick={(e) => {
                                    if (
                                        !application.portfolio_link?.startsWith('http://') &&
                                        !application.portfolio_link?.startsWith('https://')
                                    ) {
                                        e.preventDefault();
                                    }
                                }}
                            >
                                <ExternalLink className="w-4 h-4" />
                                Acessar
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}