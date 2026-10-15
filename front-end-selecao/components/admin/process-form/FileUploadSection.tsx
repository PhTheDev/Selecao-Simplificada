// components/admin/process-form/FileUploadSection.tsx
import { createFilePreview, validateDocumentFile, validateImageFile } from '@/utils/formHelpers';
import { FileText, Image as ImageIcon, Upload, X } from 'lucide-react';

interface FileUploadSectionProps {
    bannerPreview: string | null;
    bannerFile: File | null;
    noticeDocFiles: File[];               // ✅ array de arquivos do edital
    onBannerChange: (file: File | null, preview: string | null) => void;
    onNoticeDocChange: (files: File[]) => void; // ✅ recebe o array completo
    onError: (error: string) => void;
}

export function FileUploadSection({
    bannerPreview,
    bannerFile,
    noticeDocFiles,
    onBannerChange,
    onNoticeDocChange,
    onError,
}: FileUploadSectionProps) {
    // ------------------------------------------------------------
    // Banner (inalterado)
    // ------------------------------------------------------------
    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateImageFile(file);
        if (!validation.valid) {
            onError(validation.error!);
            return;
        }

        try {
            const preview = await createFilePreview(file);
            onBannerChange(file, preview);
        } catch (error) {
            onError('Erro ao processar imagem.');
        }
    };

    // ------------------------------------------------------------
    // Múltiplos documentos do edital
    // ------------------------------------------------------------
    const handleNoticeDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Valida cada arquivo e mantém apenas os válidos
        const validFiles: File[] = [];
        files.forEach(file => {
            const validation = validateDocumentFile(file);
            if (validation.valid) {
                validFiles.push(file);
            } else {
                onError(`${file.name}: ${validation.error}`);
            }
        });

        // Adiciona os novos arquivos à lista existente
        onNoticeDocChange([...noticeDocFiles, ...validFiles]);

        // Limpa o input para permitir re-upload do mesmo arquivo se necessário
        e.target.value = '';
    };

    const handleRemoveDocument = (index: number) => {
        const updatedFiles = noticeDocFiles.filter((_, i) => i !== index);
        onNoticeDocChange(updatedFiles);
    };

    // ------------------------------------------------------------
    // Render
    // ------------------------------------------------------------
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="font-semibold text-xl text-gray-800 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-gray-600" />
                Documentos e Imagens
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Coluna: Banner */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Banner do Processo *
                        <span className="text-xs text-gray-500 ml-2">
                            (Recomendado: 1920x1080px, máx. 5MB)
                        </span>
                    </label>

                    <div className="space-y-4">
                        {bannerPreview && (
                            <div className="relative">
                                <img
                                    src={bannerPreview}
                                    alt="Preview do banner"
                                    className="w-full h-48 object-cover rounded-xl border border-gray-300"
                                />
                                <button
                                    type="button"
                                    onClick={() => onBannerChange(null, null)}
                                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <label
                            className={`flex flex-col items-center justify-center w-full border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                bannerPreview
                                    ? 'border-gray-300 hover:border-gray-400'
                                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                            }`}
                        >
                            <div className="flex flex-col items-center justify-center pt-8 pb-6 px-4">
                                <ImageIcon className="w-12 h-12 text-gray-400 mb-3" />
                                <p className="text-sm text-gray-600 text-center">
                                    <span className="font-medium">Clique para upload</span> ou arraste e solte
                                </p>
                                <p className="text-xs text-gray-500 mt-1 text-center">
                                    PNG, JPG, JPEG (Máx. 5MB)
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleBannerUpload}
                                required={!bannerPreview}
                            />
                        </label>
                    </div>
                </div>

                {/* Coluna: Documentos do Edital (múltiplos) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                        Documentos do Edital *
                        <span className="text-xs text-gray-500 ml-2">
                            (PDF ou Word, máx. 10MB cada)
                        </span>
                    </label>

                    <div className="space-y-4">
                        {/* Lista de documentos já selecionados */}
                        {noticeDocFiles.length > 0 && (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {noticeDocFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-200"
                                    >
                                        <FileText className="w-6 h-6 text-green-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-green-900 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-green-700">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveDocument(index)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Remover arquivo"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input de upload com suporte a múltiplos arquivos */}
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors hover:border-blue-500 hover:bg-blue-50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium">Clique para adicionar</span> ou arraste
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    PDF, DOC, DOCX (até 10MB cada)
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                multiple
                                onChange={handleNoticeDocUpload}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
}