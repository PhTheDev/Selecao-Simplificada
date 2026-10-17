'use client';

import { useDeleteNoticeDocument } from '@/api/hooks/useDeleteNoticeDocumet';
import {
    Benefit,
    NoticeDocument,
    Prerequisite,
    SelectionProcess,
    SelectionProcessFormData,
} from '@/api/types/selection';
import Modal from '@/components/ui/Modal';
import {
    AlertTriangle,
    Award,
    CheckCircle,
    CheckSquare,
    Clock as ClockIcon,
    Download,
    FileText,
    Link,
    Loader2,
    Plus,
    Settings,
    Trash2,
    Upload,
    X,
    XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

type Bout = 'M' | 'T' | 'E' | '';
const MAX_SUBTITLE_LENGTH = 140;
const MAX_DESCRIPTION_LENGTH = 500;

const BOUT_OPTIONS: Array<{ value: Exclude<Bout, ''>; label: string }> = [
    { value: 'M', label: 'Matutino' },
    { value: 'T', label: 'Vespertino' },
    { value: 'E', label: 'Escala' },
];

// ✅ Estendendo o tipo para incluir todos os campos de peso e flags
interface ExtendedFormData extends SelectionProcessFormData {
    // Flags de inclusão
    include_curriculum_in_score: boolean;
    // Pesos (armazenados como string no frontend para melhor UX)
    weight_curriculum: string;
    weight_school_records: string;
    weight_certificates: string;
    weight_portfolio: string;
    weight_interview: string;
    weight_essay: string;
}

interface EditProcessModalProps {
    isOpen: boolean;
    onClose: () => void;
    process: SelectionProcess | null;
    onSave: (data: {
        formData: SelectionProcessFormData & {
            include_curriculum_in_score: boolean;
            weight_curriculum: number;
            weight_school_records: number;
            weight_certificates: number;
            weight_portfolio: number;
            weight_interview: number;
            weight_essay: number;
        };
        benefits: Benefit[];
        prerequisites: Prerequisite[];
        bannerPreview: string | null;
        noticeDocFiles: File[];
        deletedDocumentIds: number[];
    }) => Promise<void>;
}

const EditProcessModal: React.FC<EditProcessModalProps> = ({
    isOpen,
    onClose,
    process,
    onSave,
}) => {
    const [formData, setFormData] = useState<ExtendedFormData>({
        title: '',
        subtitle: '',
        course: '',
        local: '',
        beginning_date: '',
        ending_date: '',
        salary: '',
        number_vacancies: 0,
        is_active: true,
        description: '',
        weekly_workload: '',
        period_accepted: '',
        requirements: '',
        benefits: '',
        slug: '',
        bout: '',
        has_interview: true,
        has_essay: true,
        include_portfolio_in_score: false,
        include_certificates_in_score: false,
        // ✅ NOVOS CAMPOS
        include_curriculum_in_score: true,
        weight_curriculum: '40',
        weight_school_records: '40',
        weight_certificates: '10',
        weight_portfolio: '10',
        weight_interview: '70',
        weight_essay: '30',
    });

    const [benefits, setBenefits] = useState<Benefit[]>([{ id: 1, value: '' }]);
    const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([{ id: 1, value: '' }]);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // 📁 Documentos do edital
    const [currentDocuments, setCurrentDocuments] = useState<NoticeDocument[]>([]);
    const [noticeDocFiles, setNoticeDocFiles] = useState<File[]>([]);
    const [deletedDocumentIds, setDeletedDocumentIds] = useState<number[]>([]);

    const deleteDocumentMutation = useDeleteNoticeDocument();

    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

    // ---------- PARSERS ----------
    const parseBenefitsFromString = (benefitsString: string): Benefit[] => {
        if (!benefitsString) return [{ id: 1, value: '' }];
        const arr = benefitsString.split(';').map((s) => s.trim()).filter(Boolean);
        if (arr.length === 0) return [{ id: 1, value: '' }];
        return arr.map((item, index) => ({ id: index + 1, value: item }));
    };

    const parsePrerequisitesFromString = (prereqString: string): Prerequisite[] => {
        if (!prereqString) return [{ id: 1, value: '' }];
        const arr = prereqString.split(';').map((s) => s.trim()).filter(Boolean);
        if (arr.length === 0) return [{ id: 1, value: '' }];
        return arr.map((item, index) => ({ id: index + 1, value: item }));
    };

    const formatBenefitsToString = (items: Benefit[]): string =>
        items.map((b) => b.value.trim()).filter(Boolean).join(';');

    const formatPrerequisitesToString = (items: Prerequisite[]): string =>
        items.map((p) => p.value.trim()).filter(Boolean).join(';');

    // ---------- REGRAS AUTOMÁTICAS DE PESOS ----------
    useEffect(() => {
        if (!formData.has_essay) {
            setFormData(prev => ({
                ...prev,
                weight_essay: '0'
            }));
        }
    }, [formData.has_essay]);

    // ---------- VALIDAÇÃO GLOBAL DE PESOS ----------
    const globalWeightSum = useMemo(() => {
        let sum = 0;
        if (formData.include_curriculum_in_score) {
            sum += Number(formData.weight_curriculum) || 0;
        }
        sum += Number(formData.weight_school_records) || 0;
        if (formData.include_certificates_in_score) {
            sum += Number(formData.weight_certificates) || 0;
        }
        if (formData.include_portfolio_in_score) {
            sum += Number(formData.weight_portfolio) || 0;
        }
        sum += Number(formData.weight_interview) || 0;
        if (formData.has_essay) {
            sum += Number(formData.weight_essay) || 0;
        }
        return sum;
    }, [
        formData.include_curriculum_in_score,
        formData.weight_curriculum,
        formData.weight_school_records,
        formData.include_certificates_in_score,
        formData.weight_certificates,
        formData.include_portfolio_in_score,
        formData.weight_portfolio,
        formData.weight_interview,
        formData.has_essay,
        formData.weight_essay,
    ]);

    const isGlobalWeightValid = globalWeightSum === 100;

    // ---------- CARREGAR DADOS DO PROCESSO ----------
    useEffect(() => {
        if (process && isOpen) {
            setFormData({
                title: process.title ?? '',
                subtitle: process.subtitle ?? '',
                course: process.course ?? '',
                local: process.local ?? '',
                beginning_date: process.beginning_date ?? '',
                ending_date: process.ending_date ?? '',
                salary: process.salary ?? '',
                number_vacancies: process.number_vacancies ?? 0,
                is_active: !!process.is_active,
                description: process.description ?? '',
                weekly_workload: process.weekly_workload ?? '',
                period_accepted: process.period_accepted ?? '',
                requirements: process.requirements ?? '',
                benefits: process.benefits ?? '',
                slug: process.slug ?? '',
                bout: (process.bout as Bout) ?? '',
                has_interview: process.has_interview ?? true,
                has_essay: process.has_essay ?? true,
                include_portfolio_in_score: process.include_portfolio_in_score ?? false,
                include_certificates_in_score: process.include_certificates_in_score ?? false,
                // ✅ NOVOS CAMPOS – carregar do processo ou usar padrão
                include_curriculum_in_score: process.include_curriculum_in_score ?? true,
                weight_curriculum: process.weight_curriculum?.toString() ?? '40',
                weight_school_records: process.weight_school_records?.toString() ?? '40',
                weight_certificates: process.weight_certificates?.toString() ?? '10',
                weight_portfolio: process.weight_portfolio?.toString() ?? '10',
                weight_interview: process.weight_interview?.toString() ?? '70',
                weight_essay: process.weight_essay?.toString() ?? '30',
            });

            setBannerPreview(process.process_banner || null);
            setCurrentDocuments(process.notice_documents || []);
            setNoticeDocFiles([]);
            setDeletedDocumentIds([]);

            setBenefits(parseBenefitsFromString(process.benefits));
            setPrerequisites(parsePrerequisitesFromString(process.requirements));

            setSaveError(null);
            setSaveSuccess(null);
        }
    }, [process, isOpen]);

    // ---------- HANDLERS DE UPLOAD ----------
    const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setSaveError('Por favor, selecione um arquivo de imagem.');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => setBannerPreview(ev.target?.result as string);
        reader.readAsDataURL(file);
    };

    const handleNoticeDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        const validFiles = files.filter((file) => {
            const isValid =
                file.type.includes('pdf') ||
                file.type.includes('doc') ||
                file.type.includes('docx');
            if (!isValid) {
                toast.error(`Formato inválido: ${file.name}. Use PDF ou DOC.`);
                return false;
            }
            return true;
        });

        setNoticeDocFiles((prev) => [...prev, ...validFiles]);
        e.target.value = '';
    };

    const handleRemoveNewFile = (index: number) => {
        setNoticeDocFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRemoveExistingDocument = async (doc: NoticeDocument) => {
        if (!confirm(`Tem certeza que deseja remover o documento "${doc.name}"?`)) return;

        setDeletedDocumentIds((prev) => [...prev, doc.id]);
        setCurrentDocuments((prev) => prev.filter((d) => d.id !== doc.id));
        toast.info(`Documento "${doc.name}" será removido ao salvar.`);
    };

    // ---------- HANDLERS DE CAMPOS DO FORMULÁRIO ----------
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const normalizedValue =
            name === 'subtitle'
                ? value.slice(0, MAX_SUBTITLE_LENGTH)
                : name === 'description'
                ? value.slice(0, MAX_DESCRIPTION_LENGTH)
                : value;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'number'
                    ? Number(normalizedValue || 0)
                    : type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : normalizedValue,
        }));
    };

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({
            ...prev,
            is_active: e.target.value === 'active',
        }));
    };

    // ✅ Handler específico para campos de peso (recebem string)
    const handleWeightChange = (name: keyof Pick<ExtendedFormData, 
        'weight_curriculum' | 'weight_school_records' | 'weight_certificates' | 
        'weight_portfolio' | 'weight_interview' | 'weight_essay'
    >, value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Benefícios
    const addBenefit = () =>
        setBenefits((prev) => [...prev, { id: Date.now(), value: '' }]);

    const removeBenefit = (id: number) =>
        setBenefits((prev) => (prev.length > 1 ? prev.filter((b) => b.id !== id) : prev));

    const updateBenefit = (id: number, value: string) =>
        setBenefits((prev) => prev.map((b) => (b.id === id ? { ...b, value } : b)));

    // Pré-requisitos
    const addPrerequisite = () =>
        setPrerequisites((prev) => [...prev, { id: Date.now(), value: '' }]);

    const removePrerequisite = (id: number) =>
        setPrerequisites((prev) =>
            prev.length > 1 ? prev.filter((p) => p.id !== id) : prev
        );

    const updatePrerequisite = (id: number, value: string) =>
        setPrerequisites((prev) => prev.map((p) => (p.id === id ? { ...p, value } : p)));

    // ---------- SALVAR ----------
    const handleSave = async () => {
        if (!process) return;

        // Validações básicas
        if (!formData.slug.trim()) {
            setSaveError('O campo slug é obrigatório');
            return;
        }
        const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
        if (!slugRegex.test(formData.slug)) {
            setSaveError('O slug deve conter apenas letras minúsculas, números e hífens');
            return;
        }
        if (!formData.bout) {
            setSaveError('Selecione o turno do processo (Matutino, Vespertino ou Escala).');
            return;
        }
        if (!benefits.some((b) => b.value.trim() !== '')) {
            setSaveError('É necessário adicionar pelo menos um benefício.');
            return;
        }
        if (!prerequisites.some((p) => p.value.trim() !== '')) {
            setSaveError('É necessário adicionar pelo menos um pré-requisito.');
            return;
        }

        // ✅ VALIDAÇÃO DOS PESOS
        if (!isGlobalWeightValid) {
            setSaveError(`A soma global dos pesos ativos deve ser 100% (atualmente ${globalWeightSum}%).`);
            return;
        }

        setIsSaving(true);
        setSaveError(null);
        setSaveSuccess(null);

        try {
            await onSave({
                formData: {
                    ...formData,
                    // Converte pesos para número no envio
                    weight_curriculum: Number(formData.weight_curriculum) || 0,
                    weight_school_records: Number(formData.weight_school_records) || 0,
                    weight_certificates: Number(formData.weight_certificates) || 0,
                    weight_portfolio: Number(formData.weight_portfolio) || 0,
                    weight_interview: Number(formData.weight_interview) || 0,
                    weight_essay: Number(formData.weight_essay) || 0,
                    benefits: formatBenefitsToString(benefits),
                    requirements: formatPrerequisitesToString(prerequisites),
                    bout: formData.bout,
                },
                benefits,
                prerequisites,
                bannerPreview,
                noticeDocFiles,
                deletedDocumentIds,
            });

            setSaveSuccess('Processo atualizado com sucesso!');
            setTimeout(() => onClose(), 1500);
        } catch (error: any) {
            setSaveError(error?.message || 'Erro ao salvar alterações');
        } finally {
            setIsSaving(false);
        }
    };

    if (!process) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Editar Processo Seletivo"
            subtitle="Atualize as informações do processo seletivo"
            size="xl"
            footer={
                <>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-3 bg-muted text-foreground/80 font-medium rounded-xl hover:bg-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="w-4 h-4" />
                                Salvar Alterações
                            </>
                        )}
                    </button>
                </>
            }
            backdropClass="bg-black/30"
        >
            <div className="p-6 space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Upload do Banner */}
                <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-3">
                        Banner do Processo
                    </label>
                    <div className="space-y-4">
                        {(bannerPreview || process.process_banner) && (
                            <div className="relative rounded-xl overflow-hidden border border-input">
                                <img
                                    src={bannerPreview || process.process_banner}
                                    alt="Preview do banner"
                                    className="w-full h-64 object-cover"
                                />
                            </div>
                        )}
                        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-input rounded-2xl cursor-pointer hover:border-primary hover:bg-primary-soft transition-all duration-300">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 text-muted-foreground/70 mb-3" />
                                <p className="text-sm text-muted-foreground font-medium">
                                    <span className="text-primary">Clique para upload</span> ou arraste e solte
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG, JPEG (Recomendado: 1920x1080px)
                                </p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleBannerUpload}
                            />
                        </label>
                    </div>
                </div>

                {/* Documentos do Edital - Múltiplos */}
                <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-3">
                        Documentos do Edital
                        <span className="text-xs text-muted-foreground ml-2 font-normal">
                            (PDF ou Word, máx. 10MB cada)
                        </span>
                    </label>

                    <div className="space-y-4">
                        {/* Documentos atuais */}
                        {currentDocuments.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Documentos atuais
                                </p>
                                {currentDocuments.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="flex items-center gap-3 p-3 bg-primary-soft rounded-xl border border-primary/30"
                                    >
                                        <FileText className="w-6 h-6 text-primary flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {doc.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {doc.file.split('/').pop()}
                                            </p>
                                        </div>
                                        <a
                                            href={doc.file}
                                            target="_blank"
                                            download
                                            className="p-2 text-primary hover:bg-primary-soft rounded-lg transition-colors"
                                            title="Baixar"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveExistingDocument(doc)}
                                            className="p-2 text-destructive hover:bg-destructive-soft rounded-lg transition-colors"
                                            title="Remover"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Novos arquivos selecionados */}
                        {noticeDocFiles.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Novos documentos
                                </p>
                                {noticeDocFiles.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center gap-3 p-3 bg-success-soft rounded-xl border border-success/30"
                                    >
                                        <FileText className="w-6 h-6 text-success flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-success">
                                                {(file.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveNewFile(index)}
                                            className="p-2 text-destructive hover:bg-destructive-soft rounded-lg transition-colors"
                                            title="Remover"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Input para novos documentos */}
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-input rounded-2xl cursor-pointer hover:border-primary hover:bg-primary-soft transition-all duration-300">
                            <div className="flex flex-col items-center justify-center">
                                <Upload className="w-8 h-8 text-muted-foreground/70 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">Clique para adicionar</span> novos documentos
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX (múltiplos)</p>
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

                {/* Grid de 2 colunas para campos principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Coluna 1 */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Título *
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                placeholder="Ex: Processo Seletivo TI 2025"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Curso *
                            </label>
                            <input
                                type="text"
                                name="course"
                                value={formData.course}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Data de Início *
                            </label>
                            <input
                                type="date"
                                name="beginning_date"
                                value={formData.beginning_date}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Bolsa *
                            </label>
                            <input
                                type="text"
                                name="salary"
                                value={formData.salary}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                placeholder="Ex: 3.500,00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Carga Horária *
                            </label>
                            <input
                                type="text"
                                name="weekly_workload"
                                value={formData.weekly_workload}
                                onChange={handleInputChange}
                                maxLength={8}
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                placeholder="Ex: 30 horas"
                            />
                        </div>
                    </div>

                    {/* Coluna 2 */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Subtítulo *
                            </label>
                            <textarea
                                name="subtitle"
                                value={formData.subtitle}
                                onChange={handleInputChange}
                                maxLength={MAX_SUBTITLE_LENGTH}
                                rows={3}
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                placeholder="Ex: Vagas para Desenvolvedores Full Stack"
                            />
                            <p className="mt-1 text-xs text-muted-foreground text-right">
                                {formData.subtitle.length}/{MAX_SUBTITLE_LENGTH}
                            </p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Local *
                            </label>
                            <input
                                type="text"
                                name="local"
                                value={formData.local}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                placeholder="Ex: Cidade - UF"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Data de Término *
                            </label>
                            <input
                                type="date"
                                name="ending_date"
                                value={formData.ending_date}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Número de Vagas *
                            </label>
                            <input
                                type="number"
                                name="number_vacancies"
                                value={formData.number_vacancies}
                                onChange={handleInputChange}
                                min="1"
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                placeholder="Ex: 10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Período Aceito *
                            </label>
                            <input
                                type="text"
                                name="period_accepted"
                                value={formData.period_accepted}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                placeholder="Ex: 5º ao 8º período"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-foreground/80 mb-2">
                                Turno *
                            </label>
                            <div className="relative">
                                <ClockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                                <select
                                    name="bout"
                                    value={formData.bout}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-4 py-3.5 border border-input rounded-xl bg-card focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                                    required
                                >
                                    <option value="" disabled>
                                        Selecione o turno
                                    </option>
                                    {BOUT_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Matutino, Vespertino ou Escala.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">
                        Slug *
                        <span className="text-xs text-muted-foreground ml-2 font-normal">
                            (Identificador único para URLs)
                        </span>
                    </label>
                    <div className="relative">
                        <Link className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                        <input
                            type="text"
                            name="slug"
                            value={formData.slug}
                            onChange={handleInputChange}
                            className="w-full pl-12 pr-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200"
                            placeholder="ex: processo-ti-2025"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Use apenas letras minúsculas, números e hífens.
                    </p>
                </div>

                {/* Configurações de Avaliação - Checkboxes */}
                <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Settings className="w-6 h-6 text-primary" />
                        <h3 className="text-xl font-bold text-foreground">Configurações de Avaliação</h3>
                    </div>
                    <div className="space-y-4">
                        {/* Currículo */}
                        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-border hover:bg-background transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.include_curriculum_in_score}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        include_curriculum_in_score: e.target.checked,
                                    }))
                                }
                                className="mt-1 text-primary focus:ring-ring w-5 h-5"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-foreground/80 font-medium">
                                        Incluir currículo na nota da Etapa 1
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground ml-7">
                                    Se marcado, o currículo do candidato será considerado no cálculo da nota da etapa 1
                                </p>
                            </div>
                        </label>

                        {/* Portfólio */}
                        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-border hover:bg-background transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.include_portfolio_in_score}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        include_portfolio_in_score: e.target.checked,
                                    }))
                                }
                                className="mt-1 text-primary focus:ring-ring w-5 h-5"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-foreground/80 font-medium">
                                        Incluir portfólio na nota da Etapa 1
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground ml-7">
                                    Se marcado, o portfólio do candidato será considerado no cálculo da nota da etapa 1
                                </p>
                            </div>
                        </label>

                        {/* Certificados */}
                        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-border hover:bg-background transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.include_certificates_in_score}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        include_certificates_in_score: e.target.checked,
                                    }))
                                }
                                className="mt-1 text-primary focus:ring-ring w-5 h-5"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-foreground/80 font-medium">
                                        Incluir certificados na nota da Etapa 1
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground ml-7">
                                    Se marcado, os certificados de cursos do candidato serão considerados no cálculo da nota da etapa 1
                                </p>
                            </div>
                        </label>

                        {/* Redação */}
                        <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-border hover:bg-background transition-colors">
                            <input
                                type="checkbox"
                                checked={formData.has_essay}
                                onChange={(e) =>
                                    setFormData((prev) => ({ ...prev, has_essay: e.target.checked }))
                                }
                                className="mt-1 text-primary focus:ring-ring w-5 h-5"
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckSquare className="w-5 h-5 text-muted-foreground" />
                                    <span className="text-foreground/80 font-medium">
                                        Processo terá avaliação de redação
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground ml-7">
                                    Se marcado, a etapa 2 incluirá avaliação de redação além da entrevista.
                                </p>
                            </div>
                        </label>
                    </div>
                </div>

                {/* ---------- SEÇÃO: PESOS DA AVALIAÇÃO ---------- */}
                <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Settings className="w-6 h-6 text-primary" />
                        <h3 className="text-xl font-bold text-foreground">Pesos da Avaliação</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-6">
                        Defina o peso global de cada métrica na nota final. A soma global dos pesos ativos deve ser exatamente 100%.
                    </p>

                    {/* ETAPA 1 */}
                    <div className="mb-8">
                        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            Etapa 1 – Documentos
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {formData.include_curriculum_in_score && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                                        Currículo (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.weight_curriculum}
                                        onChange={(e) => handleWeightChange('weight_curriculum', e.target.value)}
                                        min={0}
                                        max={100}
                                        className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Peso do currículo</p>
                                </div>
                            )}

                            {/* Histórico Escolar */}
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1">
                                    Histórico Escolar (%)
                                </label>
                                <input
                                    type="number"
                                    value={formData.weight_school_records}
                                    onChange={(e) => handleWeightChange('weight_school_records', e.target.value)}
                                    min={0}
                                    max={100}
                                    className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Peso do histórico escolar</p>
                            </div>

                            {formData.include_certificates_in_score && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                                        Certificados (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.weight_certificates}
                                        onChange={(e) => handleWeightChange('weight_certificates', e.target.value)}
                                        min={0}
                                        max={100}
                                        className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Peso dos certificados</p>
                                </div>
                            )}

                            {formData.include_portfolio_in_score && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                                        Portfólio (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.weight_portfolio}
                                        onChange={(e) => handleWeightChange('weight_portfolio', e.target.value)}
                                        min={0}
                                        max={100}
                                        className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Peso do portfólio</p>
                                </div>
                            )}
                        </div>

                        {!isGlobalWeightValid ? (
                            <p className="text-sm text-destructive mt-3 flex items-center gap-1">
                                <span className="font-medium">Atenção:</span> A soma global dos pesos ativos deve ser 100% (atualmente {globalWeightSum}%).
                            </p>
                        ) : (
                            <p className="text-sm text-success mt-3 flex items-center gap-1">
                                ✓ Soma global dos pesos: {globalWeightSum}% (OK)
                            </p>
                        )}
                    </div>

                    {/* ETAPA 2 – sempre visível */}
                    <div>
                        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            Etapa 2 – Entrevista {formData.has_essay && 'e Redação'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Entrevista */}
                            <div>
                                <label className="block text-sm font-medium text-foreground/80 mb-1">
                                    Entrevista (%)
                                </label>
                                <input
                                    type="number"
                                    value={formData.weight_interview}
                                    onChange={(e) => handleWeightChange('weight_interview', e.target.value)}
                                    min={0}
                                    max={100}
                                    className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent"
                                />
                                <p className="text-xs text-muted-foreground mt-1">Peso da entrevista</p>
                            </div>

                            {formData.has_essay && (
                                <div>
                                    <label className="block text-sm font-medium text-foreground/80 mb-1">
                                        Redação (%)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.weight_essay}
                                        onChange={(e) => handleWeightChange('weight_essay', e.target.value)}
                                        min={0}
                                        max={100}
                                        className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent"
                                    />
                                    <p className="text-xs text-muted-foreground mt-1">Peso da redação</p>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-muted-foreground mt-3">
                            O peso desta etapa compõe a nota final global junto com as métricas da Etapa 1.
                        </p>
                    </div>
                </div>

                {/* Status Ativo/Inativo */}
                <div className="bg-background rounded-2xl p-6">
                    <label className="block text-sm font-semibold text-foreground/80 mb-4">
                        Status do Processo
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-border hover:bg-card transition-all duration-200">
                            <div className="relative">
                                <input
                                    type="radio"
                                    name="is_active"
                                    value="active"
                                    checked={formData.is_active}
                                    onChange={handleRadioChange}
                                    className="sr-only"
                                />
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                        formData.is_active ? 'border-primary' : 'border-input'
                                    }`}
                                >
                                    {formData.is_active && (
                                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <span className="font-medium text-foreground">Ativo</span>
                                <p className="text-xs text-muted-foreground">
                                    O processo está ativo e visível para candidatura
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-primary" />
                            </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl border border-border hover:bg-card transition-all duration-200">
                            <div className="relative">
                                <input
                                    type="radio"
                                    name="is_active"
                                    value="inactive"
                                    checked={!formData.is_active}
                                    onChange={handleRadioChange}
                                    className="sr-only"
                                />
                                <div
                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                        !formData.is_active ? 'border-destructive' : 'border-input'
                                    }`}
                                >
                                    {!formData.is_active && (
                                        <div className="w-3 h-3 rounded-full bg-destructive"></div>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1">
                                <span className="font-medium text-foreground">Inativo</span>
                                <p className="text-xs text-muted-foreground">O processo ficará oculto</p>
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-destructive-soft flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-destructive" />
                            </div>
                        </label>
                    </div>
                </div>

                {/* Descrição */}
                <div>
                    <label className="block text-sm font-semibold text-foreground/80 mb-2">
                        Descrição *
                    </label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        maxLength={MAX_DESCRIPTION_LENGTH}
                        rows={5}
                        className="w-full px-4 py-3.5 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 resize-none"
                        placeholder="Descreva detalhadamente o processo seletivo..."
                    />
                    <p className="mt-1 text-xs text-muted-foreground text-right">
                        {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                    </p>
                </div>

                {/* Benefícios e Pré-requisitos lado a lado */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Benefícios */}
                    <div className="bg-success-soft rounded-2xl border border-success/30 p-6">
                        <div className="flex flex-col justify-between items-start mb-6 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-success-soft flex items-center justify-center">
                                    <Award className="w-5 h-5 text-success" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-foreground text-lg">Benefícios</h2>
                                    <p className="text-sm text-success">Adicione os benefícios oferecidos</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addBenefit}
                                className="flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200 font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={benefit.id}
                                    className="bg-card rounded-xl border border-success/30 p-4 hover:shadow-sm transition-all duration-200"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-success-soft flex items-center justify-center">
                                                <span className="text-success font-bold text-xs">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-foreground/80 text-sm">
                                                Benefício {index + 1}
                                            </h3>
                                        </div>
                                        {benefits.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeBenefit(benefit.id)}
                                                className="p-1.5 bg-destructive-soft text-destructive rounded-lg hover:bg-destructive-soft transition-colors"
                                                title="Remover benefício"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={benefit.value}
                                        onChange={(e) => updateBenefit(benefit.id, e.target.value)}
                                        className="w-full px-3 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-success focus:border-transparent transition-all duration-200 text-sm"
                                        placeholder="Ex: Vale alimentação, Plano de saúde..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Pré-requisitos */}
                    <div className="bg-warning-soft rounded-2xl border border-warning/30 p-6">
                        <div className="flex flex-col justify-between items-start mb-6 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-warning-soft flex items-center justify-center">
                                    <AlertTriangle className="w-5 h-5 text-warning" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-foreground text-lg">Pré-requisitos</h2>
                                    <p className="text-sm text-warning">Adicione os requisitos necessários</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={addPrerequisite}
                                className="flex items-center gap-2 px-4 py-2.5 bg-warning text-white rounded-xl hover:shadow-md hover:scale-[1.02] transition-all duration-200 font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Adicionar
                            </button>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                            {prerequisites.map((prerequisite, index) => (
                                <div
                                    key={prerequisite.id}
                                    className="bg-card rounded-xl border border-warning/30 p-4 hover:shadow-sm transition-all duration-200"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-warning-soft flex items-center justify-center">
                                                <span className="text-warning font-bold text-xs">
                                                    {index + 1}
                                                </span>
                                            </div>
                                            <h3 className="font-medium text-foreground/80 text-sm">
                                                Pré-requisito {index + 1}
                                            </h3>
                                        </div>
                                        {prerequisites.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removePrerequisite(prerequisite.id)}
                                                className="p-1.5 bg-destructive-soft text-destructive rounded-lg hover:bg-destructive-soft transition-colors"
                                                title="Remover pré-requisito"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={prerequisite.value}
                                        onChange={(e) => updatePrerequisite(prerequisite.id, e.target.value)}
                                        className="w-full px-3 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-warning focus:border-transparent transition-all duration-200 text-sm"
                                        placeholder="Ex: Experiência com React..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Feedback */}
                {saveError && (
                    <div className="flex items-start gap-3 p-4 bg-destructive-soft border border-destructive/30 rounded-xl">
                        <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-destructive">Erro</p>
                            <p className="text-sm text-destructive">{saveError}</p>
                        </div>
                    </div>
                )}

                {saveSuccess && (
                    <div className="flex items-start gap-3 p-4 bg-success-soft border border-success/30 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-success">Sucesso</p>
                            <p className="text-sm text-success">{saveSuccess}</p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default EditProcessModal;