'use client';

import { useCreateProcess } from '@/api/hooks/useCreateProcess';
import { useDraftManager } from '@/api/hooks/useDraftManager';
import { useDynamicArray } from '@/api/hooks/useDynamicArray';
import { BenefitsSection } from '@/components/admin/process-form/BenefitsSection';
import { FileUploadSection } from '@/components/admin/process-form/FileUploadSection';
import { PrerequisitesSection } from '@/components/admin/process-form/PrerequisitesSection';
import { RestoreDialog } from '@/components/admin/process-form/RestoreDialog';
import { Alert } from '@/components/ui/Alert';
import { Input } from '@/components/ui/Input';
import { Title } from '@/components/ui/Title';
import { formatArrayToString, generateSlug } from '@/utils/formHelpers';
import { validateProcessForm } from '@/utils/formValidation';
import { calculateGlobalWeightSum } from '@/utils/processWeightValidation';
import {
    BookOpen,
    Calendar,
    CalendarRange,
    CheckSquare,
    Clock,
    DollarSign,
    FileText,
    Link,
    Loader2,
    MapPin,
    Save,
    Settings,
    Subtitles,
    Trash2,
    Type,
    Users,
    X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import React from 'react';
import { toast } from 'sonner';

type Bout = 'M' | 'T' | 'E' | '';
const MAX_SUBTITLE_LENGTH = 140;
const MAX_DESCRIPTION_LENGTH = 500;

interface FormData {
    title: string;
    subtitle: string;
    course: string;
    local: string;
    beginning_date: string;
    ending_date: string;
    salary: string;
    number_vacancies: number;
    is_active: boolean;
    description: string;
    weekly_workload: string;
    period_accepted: string;
    requirements: string;
    benefits: string;
    slug: string;
    bout: Bout;
    // ✅ Etapa 2 obrigatória → has_interview removido do estado
    has_essay: boolean;
    include_curriculum_in_score: boolean;
    include_portfolio_in_score: boolean;
    include_certificates_in_score: boolean;
    // Pesos (armazenados como string)
    weight_curriculum: string;
    weight_school_records: string;
    weight_certificates: string;
    weight_portfolio: string;
    weight_interview: string;
    weight_essay: string;
}

export default function NovoProcessoSeletivo() {
    const router = useRouter();

    // Estado do formulário
    const [formData, setFormData] = useState<FormData>({
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
        has_essay: true,
        include_curriculum_in_score: true,
        include_portfolio_in_score: false,
        include_certificates_in_score: false,
        weight_curriculum: '0',
        weight_school_records: '0',
        weight_certificates: '0',
        weight_portfolio: '0',
        weight_interview: '0',
        weight_essay: '0',
    });

    // Arquivos
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [noticeDocFiles, setNoticeDocFiles] = useState<File[]>([]);

    // Erro / sucesso
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Arrays dinâmicos
    const benefits = useDynamicArray();
    const prerequisites = useDynamicArray();

    // Gerenciamento de rascunho
    const {
        showRestoreDialog,
        setShowRestoreDialog,
        hasUnsavedChanges,
        setHasUnsavedChanges,
        saveDraft,
        loadDraft,
        clearDraft,
    } = useDraftManager({
        formData,
        benefits: benefits.items,
        prerequisites: prerequisites.items,
        bannerPreview,
        noticeDocFiles,
    });

    // Mutation
    const createProcessMutation = useCreateProcess();

    // ---------- REGRAS AUTOMÁTICAS DE PESOS ----------
    // Quando has_essay é desmarcado, a redação deixa de compor a nota global.
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
        return calculateGlobalWeightSum(formData);
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

    // ---------- RESTAURAR RASCUNHO ----------
    const restoreSavedData = useCallback(() => {
        const draft = loadDraft();
        if (draft) {
            setFormData((prev) => ({
                ...prev,
                ...draft.formData,
                include_curriculum_in_score: draft.formData.include_curriculum_in_score ?? true,
                weight_curriculum: draft.formData.weight_curriculum ?? '0',
                weight_school_records: draft.formData.weight_school_records ?? '0',
                weight_certificates: draft.formData.weight_certificates ?? '0',
                weight_portfolio: draft.formData.weight_portfolio ?? '0',
                weight_interview: draft.formData.weight_interview ?? '0',
                weight_essay: draft.formData.weight_essay ?? '0',
                has_essay: draft.formData.has_essay ?? true,
                include_portfolio_in_score: draft.formData.include_portfolio_in_score ?? false,
                include_certificates_in_score: draft.formData.include_certificates_in_score ?? false,
                is_active: draft.formData.is_active ?? true,
            }));
            benefits.setItems(draft.benefits || []);
            prerequisites.setItems(draft.prerequisites || []);
            setBannerPreview(draft.bannerPreview || null);
            setNoticeDocFiles([]);
            setHasUnsavedChanges(true);
            toast.success('Dados restaurados com sucesso! (Documentos do edital precisam ser reenviados)');
        }
        setShowRestoreDialog(false);
    }, [loadDraft, benefits, prerequisites, setHasUnsavedChanges]);

    // Descartar rascunho
    const discardSavedData = useCallback(() => {
        clearDraft();
        resetForm();
        setShowRestoreDialog(false);
        toast.info('Dados anteriores descartados.');
    }, [clearDraft]);

    // Auto-save (debounce)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (hasUnsavedChanges) {
                saveDraft({
                    formData,
                    benefits: benefits.items,
                    prerequisites: prerequisites.items,
                    bannerPreview,
                    noticeDocFiles,
                });
            }
        }, 1000);
        return () => clearTimeout(timer);
    }, [formData, benefits.items, prerequisites.items, bannerPreview, noticeDocFiles, hasUnsavedChanges, saveDraft]);

    // ---------- HANDLERS ----------
    const handleTitleChange = useCallback((value: string) => {
        setFormData(prev => ({
            ...prev,
            title: value,
            slug: generateSlug(value)
        }));
        setHasUnsavedChanges(true);
    }, [setHasUnsavedChanges]);

    const handleFieldChange = useCallback((name: keyof FormData, value: string | number | boolean) => {
        const normalizedValue =
            name === 'subtitle' && typeof value === 'string'
                ? value.slice(0, MAX_SUBTITLE_LENGTH)
                : value;
        setFormData(prev => ({ ...prev, [name]: normalizedValue }));
        setHasUnsavedChanges(true);
    }, [setHasUnsavedChanges]);

    const handleSlugChange = useCallback((value: string) => {
        setFormData(prev => ({ ...prev, slug: value }));
        setHasUnsavedChanges(true);
    }, [setHasUnsavedChanges]);

    const handleBannerChange = useCallback((file: File | null, preview: string | null) => {
        setBannerFile(file);
        setBannerPreview(preview);
        setHasUnsavedChanges(true);
    }, [setHasUnsavedChanges]);

    const handleNoticeDocChange = useCallback((files: File[]) => {
        setNoticeDocFiles(files);
        setHasUnsavedChanges(true);
    }, [setHasUnsavedChanges]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const normalizedValue =
            name === 'description'
                ? value.slice(0, MAX_DESCRIPTION_LENGTH)
                : value;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked :
                type === 'number' ? value :
                    normalizedValue
        }));
        setHasUnsavedChanges(true);
    }, [setHasUnsavedChanges]);

    const showSubmitError = useCallback((message: string) => {
        setError(message);
        toast.error(message);
    }, []);

    // ---------- SUBMISSÃO ----------
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validação base
        const validation = validateProcessForm(formData, benefits.items, prerequisites.items);
        if (!validation.valid) {
            showSubmitError(validation.error!);
            return;
        }

        // Validação: pelo menos um documento do edital
        if (noticeDocFiles.length === 0) {
            showSubmitError('É necessário enviar ao menos um documento do edital.');
            return;
        }

        // Validação dos pesos
        if (!isGlobalWeightValid) {
            showSubmitError(`A soma global dos pesos ativos deve ser 100% (atualmente ${globalWeightSum}%).`);
            return;
        }

        try {
            // Tratamento do salário: "R$ 1.000,00" -> "1000.00"
            let parsedSalary = formData.salary;
            if (parsedSalary) {
                parsedSalary = parsedSalary.replace(/[^\d,.-]/g, '');
                if (parsedSalary.includes(',')) {
                    parsedSalary = parsedSalary.replace(/\./g, '').replace(',', '.');
                }
            }

            // Converte pesos para número no envio
            const formattedData = {
                ...formData,
                salary: parsedSalary,
                has_interview: true, // ✅ Etapa 2 obrigatória
                weight_curriculum: Number(formData.weight_curriculum) || 0,
                weight_school_records: Number(formData.weight_school_records) || 0,
                weight_certificates: Number(formData.weight_certificates) || 0,
                weight_portfolio: Number(formData.weight_portfolio) || 0,
                weight_interview: Number(formData.weight_interview) || 0,
                weight_essay: Number(formData.weight_essay) || 0,
                benefits: formatArrayToString(benefits.items),
                requirements: formatArrayToString(prerequisites.items),
                number_vacancies: formData.number_vacancies || 0,
                is_active: formData.is_active !== undefined ? formData.is_active : true,
            };

            await createProcessMutation.mutateAsync({
                formData: formattedData,
                bannerFile,
                noticeDocFiles,
            });

            clearDraft();
            setSuccess('Processo seletivo criado com sucesso!');
            toast.success('Processo seletivo criado com sucesso!');

            setTimeout(() => {
                resetForm();
                router.push('/painel-admin/processos');
            }, 2000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Erro ao criar processo seletivo';
            showSubmitError(errorMessage);
        }
    };

    // Reset total
    const resetForm = useCallback(() => {
        setFormData({
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
            has_essay: true,
            include_curriculum_in_score: true,
            include_portfolio_in_score: false,
            include_certificates_in_score: false,
            weight_curriculum: '0',
            weight_school_records: '0',
            weight_certificates: '0',
            weight_portfolio: '0',
            weight_interview: '0',
            weight_essay: '0',
        });
        benefits.reset();
        prerequisites.reset();
        setBannerPreview(null);
        setBannerFile(null);
        setNoticeDocFiles([]);
        setError(null);
        setSuccess(null);
        setHasUnsavedChanges(false);
    }, [benefits, prerequisites, setHasUnsavedChanges]);

    // ---------- JSX ----------
    return (
        <>
            <RestoreDialog
                isOpen={showRestoreDialog}
                onRestore={restoreSavedData}
                onDiscard={discardSavedData}
            />

            <div className="min-h-screen bg-background p-4 md:p-6">
                <Title
                    title="Novo Processo Seletivo"
                    icon={FileText}
                    titleButton='Voltar'
                    buttonUrl='/painel-admin/processos'
                    iconButton={X}
                />

                {hasUnsavedChanges && (
                    <div className="mb-4">
                        <button
                            type="button"
                            onClick={clearDraft}
                            className="flex items-center gap-2 px-4 py-2 text-muted-foreground bg-card border border-input rounded-xl hover:bg-background transition-colors font-medium"
                        >
                            <Trash2 className="w-4 h-4" />
                            Limpar Rascunho
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <Alert type="error" message={error} />}
                    {success && <Alert type="success" message={success} />}

                    {/* Upload de arquivos */}
                    <FileUploadSection
                        bannerPreview={bannerPreview}
                        bannerFile={bannerFile}
                        noticeDocFiles={noticeDocFiles}
                        onBannerChange={handleBannerChange}
                        onNoticeDocChange={handleNoticeDocChange}
                        onError={setError}
                    />

                    {/* Informações Básicas */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                        <h2 className="font-semibold text-xl text-foreground mb-6 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-muted-foreground" />
                            Informações Básicas
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Input
                                    type="text"
                                    id="title"
                                    name="title"
                                    label="Título do Processo"
                                    icon={<Type className="w-5 h-5" />}
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    required
                                    placeholder="Ex: Processo Seletivo TI 2025"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="subtitle" className="block text-sm font-semibold mb-1 text-foreground/80">
                                    Texto Complementar
                                    <span className="text-destructive ml-1">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-3 pointer-events-none text-muted-foreground/70">
                                        <Subtitles className="w-5 h-5" />
                                    </div>
                                    <textarea
                                        id="subtitle"
                                        name="subtitle"
                                        value={formData.subtitle}
                                        onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                                        maxLength={MAX_SUBTITLE_LENGTH}
                                        required
                                        rows={3}
                                        placeholder="Ex: Vagas abertas para processo ..."
                                        className="w-full pl-11 pr-4 py-3 border rounded-lg text-foreground placeholder:text-muted-foreground/70 transition-all duration-200 ease-in-out border-input focus:border-primary focus:ring-2 focus:ring-ring/50 bg-card hover:border-input"
                                    />
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground text-right">
                                    {formData.subtitle.length}/{MAX_SUBTITLE_LENGTH}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <Input
                                    type="text"
                                    id="slug"
                                    name="slug"
                                    label="Slug"
                                    icon={<Link className="w-5 h-5" />}
                                    value={formData.slug}
                                    onChange={handleSlugChange}
                                    required
                                    placeholder="ex: processo-ti-2025"
                                    helpText="Identificador único para URLs. Use apenas letras minúsculas, números e hífens."
                                />
                            </div>
                            <div>
                                <Input
                                    type="text"
                                    id="course"
                                    name="course"
                                    label="Curso"
                                    icon={<BookOpen className="w-5 h-5" />}
                                    value={formData.course}
                                    onChange={(value: string) => handleFieldChange('course', value)}
                                    required
                                    placeholder="Ex: Análise e Desenvolvimento de Sistemas"
                                    helpText="Cursos contemplados pelo processo seletivo"
                                />
                            </div>
                            <div>
                                <Input
                                    type="text"
                                    id="local"
                                    name="local"
                                    label="Local"
                                    icon={<MapPin className="w-5 h-5" />}
                                    value={formData.local}
                                    onChange={(value: string) => handleFieldChange('local', value)}
                                    required
                                    placeholder="Ex: Seção de TI"
                                    helpText="Local de trabalho"
                                />
                            </div>
                            <div>
                                <Input
                                    type="date"
                                    id="beginning_date"
                                    name="beginning_date"
                                    label="Data de Início das Inscrições"
                                    icon={<Calendar className="w-5 h-5" />}
                                    value={formData.beginning_date}
                                    onChange={(value: string) => handleFieldChange('beginning_date', value)}
                                    required
                                    helpText="As inscrições passam a valer a partir das 00:00 (início do dia) na data informada."
                                />
                            </div>
                            <div>
                                <Input
                                    type="date"
                                    id="ending_date"
                                    name="ending_date"
                                    label="Data de Término das Inscrições"
                                    icon={<Calendar className="w-5 h-5" />}
                                    value={formData.ending_date}
                                    onChange={(value: string) => handleFieldChange('ending_date', value)}
                                    required
                                    helpText="Encerramento às 23:59 (fim do dia) na data informada."
                                />
                            </div>
                            <div>
                                <Input
                                    type="text"
                                    id="salary"
                                    name="salary"
                                    label="Bolsa Auxílio"
                                    icon={<DollarSign className="w-5 h-5" />}
                                    value={formData.salary}
                                    onChange={(value: string) => handleFieldChange('salary', value)}
                                    required
                                    placeholder="Ex: R$ 1.000,00"
                                />
                            </div>
                            <div>
                                <Input
                                    type="number"
                                    id="number_vacancies"
                                    name="number_vacancies"
                                    label="Número de Vagas"
                                    icon={<Users className="w-5 h-5" />}
                                    value={formData.number_vacancies.toString()}
                                    onChange={(value: string) => handleFieldChange('number_vacancies', value)}
                                    min="0"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <Input
                                    type="text"
                                    id="weekly_workload"
                                    name="weekly_workload"
                                    label="Carga Horária Semanal"
                                    icon={<Clock className="w-5 h-5" />}
                                    value={formData.weekly_workload}
                                    onChange={(value: string) => handleFieldChange('weekly_workload', value)}
                                    required
                                    maxLength={8}
                                    placeholder="Ex: 30 horas"
                                />
                            </div>
                            <div>
                                <Input
                                    type="text"
                                    id="period_accepted"
                                    name="period_accepted"
                                    label="Período Aceito"
                                    icon={<CalendarRange className="w-5 h-5" />}
                                    value={formData.period_accepted}
                                    onChange={(value: string) => handleFieldChange('period_accepted', value)}
                                    required
                                    placeholder="Ex: 5º ao 8º período"
                                />
                            </div>
                        </div>

                        {/* Turno */}
                        <div className="md:col-span-2 mt-6">
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Turno <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <select
                                    id="bout"
                                    name="bout"
                                    value={formData.bout}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-3 border border-input rounded-xl bg-card focus:ring-2 focus:ring-ring focus:border-primary transition-colors appearance-none"
                                >
                                    <option value="" disabled>
                                        Selecione o turno
                                    </option>
                                    <option value="M">Matutino</option>
                                    <option value="T">Vespertino</option>
                                    <option value="E">Escala</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                                    <Clock className="w-5 h-5 text-muted-foreground" />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Defina o turno do estágio (Matutino, Vespertino ou Escala).
                            </p>
                        </div>

                        {/* Descrição */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-foreground/80 mb-2">
                                Descrição do Processo <span className="text-destructive">*</span>
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                maxLength={MAX_DESCRIPTION_LENGTH}
                                rows={6}
                                className="w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-primary transition-colors"
                                placeholder="Descreva detalhadamente o processo seletivo..."
                                required
                            />
                            <p className="mt-1 text-xs text-muted-foreground text-right">
                                {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                            </p>
                        </div>
                    </div>

                    {/* Benefícios e Pré‑requisitos */}
                    <BenefitsSection
                        benefits={benefits.items}
                        onAdd={() => { benefits.addItem(); setHasUnsavedChanges(true); }}
                        onRemove={(id) => benefits.removeItem(id)}
                        onUpdate={(id, value) => { benefits.updateItem(id, value); setHasUnsavedChanges(true); }}
                    />

                    <PrerequisitesSection
                        prerequisites={prerequisites.items}
                        onAdd={() => { prerequisites.addItem(); setHasUnsavedChanges(true); }}
                        onRemove={(id) => { prerequisites.removeItem(id); setHasUnsavedChanges(true); }}
                        onUpdate={(id, value) => { prerequisites.updateItem(id, value); setHasUnsavedChanges(true); }}
                    />

                    {/* ------------------------------- */}
                    {/*   CONFIGURAÇÕES DE AVALIAÇÃO    */}
                    {/* ------------------------------- */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Settings className="w-6 h-6 text-primary" />
                            <h3 className="text-xl font-bold text-foreground">Configurações de Avaliação</h3>
                        </div>

                        {/* Checkboxes – SEM o de entrevista (etapa 2 obrigatória) */}
                        <div className="space-y-4">
                            {/* Currículo */}
                            <label className="flex items-start gap-3 cursor-pointer p-4 rounded-lg border border-border hover:bg-background transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.include_curriculum_in_score}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, include_curriculum_in_score: e.target.checked }));
                                        setHasUnsavedChanges(true);
                                    }}
                                    className="mt-1 text-primary focus:ring-ring w-5 h-5"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-foreground/80 font-medium">Incluir currículo na nota da Etapa 1</span>
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
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, include_portfolio_in_score: e.target.checked }));
                                        setHasUnsavedChanges(true);
                                    }}
                                    className="mt-1 text-primary focus:ring-ring w-5 h-5"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-foreground/80 font-medium">Incluir portfólio na nota da Etapa 1</span>
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
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, include_certificates_in_score: e.target.checked }));
                                        setHasUnsavedChanges(true);
                                    }}
                                    className="mt-1 text-primary focus:ring-ring w-5 h-5"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <FileText className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-foreground/80 font-medium">Incluir certificados na nota da Etapa 1</span>
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
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, has_essay: e.target.checked }));
                                        setHasUnsavedChanges(true);
                                    }}
                                    className="mt-1 text-primary focus:ring-ring w-5 h-5"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckSquare className="w-5 h-5 text-muted-foreground" />
                                        <span className="text-foreground/80 font-medium">Processo terá avaliação de redação</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground ml-7">
                                        Se marcado, a etapa 2 incluirá avaliação de redação além da entrevista (obrigatória).
                                    </p>
                                </div>
                            </label>
                        </div>

                        {/* ---------- SEÇÃO: PESOS DA AVALIAÇÃO ---------- */}
                        <div className="mt-8 pt-6 border-t border-border">
                            <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                                <Settings className="w-5 h-5 text-muted-foreground" />
                                Pesos da Avaliação (percentuais)
                            </h4>
                            <p className="text-sm text-muted-foreground mb-6">
                                Defina o peso global de cada métrica na nota final. A soma global dos pesos ativos deve ser exatamente 100%.
                            </p>

                            {/* ETAPA 1 */}
                            <div className="mb-8">
                                <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    Etapa 1 – Documentos
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.include_curriculum_in_score && (
                                        <Input
                                            type="number"
                                            id="weight_curriculum"
                                            name="weight_curriculum"
                                            label="Currículo (%)"
                                            value={formData.weight_curriculum}
                                            onChange={(value: string) => handleFieldChange('weight_curriculum', value)}
                                            min={0}
                                            max={100}
                                            required
                                            helpText="Peso da avaliação do currículo"
                                        />
                                    )}
                                    {/* Histórico Escolar – desabilitado quando é o único ativo */}
                                    <Input
                                        type="number"
                                        id="weight_school_records"
                                        name="weight_school_records"
                                        label="Histórico Escolar (%)"
                                        value={formData.weight_school_records}
                                        onChange={(value: string) => handleFieldChange('weight_school_records', value)}
                                        min={0}
                                        max={100}
                                        required
                                        helpText="Peso global do histórico escolar na nota final"
                                    />
                                    {formData.include_certificates_in_score && (
                                        <Input
                                            type="number"
                                            id="weight_certificates"
                                            name="weight_certificates"
                                            label="Certificados (%)"
                                            value={formData.weight_certificates}
                                            onChange={(value: string) => handleFieldChange('weight_certificates', value)}
                                            min={0}
                                            max={100}
                                            required
                                            helpText="Peso dos certificados de cursos"
                                        />
                                    )}
                                    {formData.include_portfolio_in_score && (
                                        <Input
                                            type="number"
                                            id="weight_portfolio"
                                            name="weight_portfolio"
                                            label="Portfólio (%)"
                                            value={formData.weight_portfolio}
                                            onChange={(value: string) => handleFieldChange('weight_portfolio', value)}
                                            min={0}
                                            max={100}
                                            required
                                            helpText="Peso do portfólio"
                                        />
                                    )}
                                </div>
                                {!isGlobalWeightValid && (
                                    <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                                        <span className="font-medium">Atenção:</span> A soma global dos pesos ativos deve ser 100% (atualmente {globalWeightSum}%).
                                    </p>
                                )}
                                {isGlobalWeightValid && (
                                    <p className="text-sm text-success mt-2 flex items-center gap-1">
                                        ✓ Soma global dos pesos: {globalWeightSum}% (OK)
                                    </p>
                                )}
                            </div>

                            {/* ETAPA 2 – sempre visível (obrigatória) */}
                            <div>
                                <h5 className="font-medium text-foreground mb-3 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-muted-foreground" />
                                    Etapa 2 – Entrevista {formData.has_essay && 'e Redação'}
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Entrevista – desabilitada quando redação está desmarcada */}
                                    <Input
                                        type="number"
                                        id="weight_interview"
                                        name="weight_interview"
                                        label="Entrevista (%)"
                                        value={formData.weight_interview}
                                        onChange={(value: string) => handleFieldChange('weight_interview', value)}
                                        min={0}
                                        max={100}
                                        required
                                        helpText="Peso global da entrevista na nota final"
                                    />
                                    {formData.has_essay && (
                                        <Input
                                            type="number"
                                            id="weight_essay"
                                            name="weight_essay"
                                            label="Redação (%)"
                                            value={formData.weight_essay}
                                            onChange={(value: string) => handleFieldChange('weight_essay', value)}
                                            min={0}
                                            max={100}
                                            required
                                            helpText="Peso da redação"
                                        />
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    O peso desta etapa participa da composição da nota final global.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Status e Botão de Envio */}
                    <div className="bg-card rounded-2xl shadow-sm border border-border p-6">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-foreground/80 mb-3">
                                    Status do Processo
                                </label>
                                <div className="flex gap-6">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={() => {
                                                setFormData(prev => ({ ...prev, is_active: true }));
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="text-primary focus:ring-ring w-5 h-5"
                                        />
                                        <div>
                                            <span className="text-foreground/80 font-medium">Ativo</span>
                                            <p className="text-sm text-muted-foreground">O processo será visível publicamente</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="is_active"
                                            checked={!formData.is_active}
                                            onChange={() => {
                                                setFormData(prev => ({ ...prev, is_active: false }));
                                                setHasUnsavedChanges(true);
                                            }}
                                            className="text-primary focus:ring-ring w-5 h-5"
                                        />
                                        <div>
                                            <span className="text-foreground/80 font-medium">Inativo</span>
                                            <p className="text-sm text-muted-foreground">O processo ficará oculto</p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={createProcessMutation.isPending}
                                className="w-full lg:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-hover transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-sm shadow-primary/30"
                            >
                                {createProcessMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span>Criando Processo...</span>
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        <span>Criar Processo Seletivo</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </>
    );
}