'use client';

import { CheckCircle, ChevronRight, ExternalLink, Eye, FileText, Lock, Minus, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { openApplicationDocumentUrl } from '@/utils/openApplicationDocument';
import {
  Application,
  Stage1Evaluation as Stage1Eval,
  Stage1SaveMode,
  Stage1SaveOptions,
  Stage1ScoreField,
} from './types';

interface ProcessConfig {
  include_curriculum_in_score?: boolean;
  include_portfolio_in_score?: boolean;
  include_certificates_in_score?: boolean;
  weight_curriculum?: number;
  weight_school_records?: number;
  weight_certificates?: number;
  weight_portfolio?: number;
}

const SCORE_FIELD_TO_API: Record<Stage1ScoreField, keyof Stage1Eval> = {
  curriculum: 'curriculum_score',
  school_records: 'school_records_score',
  course_certificates: 'course_certificates_score',
  portfolio: 'portfolio_score',
};

interface Stage1EvaluationProps {
  application: Application;
  onSubmit: (data: Partial<Stage1Eval>, options?: Stage1SaveOptions) => Promise<void>;
  isSubmitting: boolean;
  existingEvaluation?: Stage1Eval;
  processConfig?: ProcessConfig;
  readOnly?: boolean;
}

type DocumentStatus = 'pending' | 'accepted' | 'rejected';

type DocumentListItem = {
  key: string;
  label: string;
  url: string | null | undefined;
  required: boolean;
  description: string;
  isExternal?: boolean;
  missing?: boolean;
  requiredForScore?: boolean;
};

export default function Stage1EvaluationComponent({
  application,
  onSubmit,
  isSubmitting,
  existingEvaluation,
  processConfig,
  readOnly = false,
}: Stage1EvaluationProps) {
  const [currentStep, setCurrentStep] = useState<'validation' | 'scoring'>('validation');

  // --- Estado para travar após reprovação ---
  const [isRejected, setIsRejected] = useState(false);

  useEffect(() => {
    setIsRejected(application.status === 'rejected');
  }, [application.status]);

  const isLocked = readOnly === true || isRejected === true;

  const scoreDocumentRules = useMemo(
    () => ({
      portfolioRequiredForScore: processConfig?.include_portfolio_in_score !== false,
      certificatesRequiredForScore: processConfig?.include_certificates_in_score !== false,
      portfolioMissing: !application.portfolio_link,
      certificatesMissing: !application.course_certificates,
    }),
    [
      processConfig?.include_portfolio_in_score,
      processConfig?.include_certificates_in_score,
      application.portfolio_link,
      application.course_certificates,
    ]
  );

  const [documentStatus, setDocumentStatus] = useState<Record<string, DocumentStatus>>({});
  const [rejectionReasons, setRejectionReasons] = useState({
    identity_document: '',
    school_records: '',
    frequency_statement: '',
    vitae_curriculum: '',
    course_certificates: '',
    portfolio_link: '',
  });

  const [scores, setScores] = useState<{
    curriculum: string | number | undefined;
    school_records: string | number | undefined;
    course_certificates: string | number | undefined;
    portfolio: string | number | undefined;
  }>({
    curriculum: '',
    school_records: '',
    course_certificates: '',
    portfolio: '',
  });

  const [notes, setNotes] = useState('');
  const [touchedScores, setTouchedScores] = useState<Set<Stage1ScoreField>>(new Set());

  // --- Sync com existingEvaluation ---
  useEffect(() => {
    setDocumentStatus({
      identity_document:
        existingEvaluation?.identity_document_valid === true
          ? 'accepted'
          : existingEvaluation?.identity_document_valid === false
            ? 'rejected'
            : 'pending',
      school_records:
        existingEvaluation?.school_records_valid === true
          ? 'accepted'
          : existingEvaluation?.school_records_valid === false
            ? 'rejected'
            : 'pending',
      frequency_statement:
        existingEvaluation?.frequency_statement_valid === true
          ? 'accepted'
          : existingEvaluation?.frequency_statement_valid === false
            ? 'rejected'
            : 'pending',
      vitae_curriculum:
        existingEvaluation?.vitae_curriculum_valid === true
          ? 'accepted'
          : existingEvaluation?.vitae_curriculum_valid === false
            ? 'rejected'
            : 'pending',
      course_certificates:
        existingEvaluation?.course_certificates_valid === true
          ? 'accepted'
          : existingEvaluation?.course_certificates_valid === false
            ? 'rejected'
            : 'pending',
      portfolio_link:
        existingEvaluation?.portfolio_link_valid === true
          ? 'accepted'
          : existingEvaluation?.portfolio_link_valid === false
            ? 'rejected'
            : 'pending',
    });

    setRejectionReasons({
      identity_document: existingEvaluation?.identity_document_rejection_reason ?? '',
      school_records: existingEvaluation?.school_records_rejection_reason ?? '',
      frequency_statement: existingEvaluation?.frequency_statement_rejection_reason ?? '',
      vitae_curriculum: existingEvaluation?.vitae_curriculum_rejection_reason ?? '',
      course_certificates: existingEvaluation?.course_certificates_rejection_reason ?? '',
      portfolio_link: existingEvaluation?.portfolio_link_rejection_reason ?? '',
    });

    setScores({
      curriculum: existingEvaluation?.curriculum_score ?? '',
      school_records: existingEvaluation?.school_records_score ?? '',
      course_certificates: existingEvaluation?.course_certificates_score ?? '',
      portfolio: existingEvaluation?.portfolio_score ?? '',
    });

    setNotes(existingEvaluation?.notes ?? '');
  }, [existingEvaluation]);

  // --- Document handlers ---
  const handleDocumentAction = useCallback(
    (docKey: string, action: 'accept' | 'reject', docMissing?: boolean) => {
      if (isLocked) return;
      if (action === 'accept' && docMissing) {
        toast.error('Não é possível aceitar um documento que o candidato não enviou.');
        return;
      }
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';
      setDocumentStatus((prev) => ({ ...prev, [docKey]: newStatus }));
      if (action === 'accept' && rejectionReasons[docKey as keyof typeof rejectionReasons]) {
        setRejectionReasons((prev) => ({ ...prev, [docKey]: '' }));
      }
    },
    [isLocked, rejectionReasons]
  );

  const handleResetDocument = useCallback(
    (docKey: string) => {
      if (isLocked) return;
      setDocumentStatus((prev) => ({ ...prev, [docKey]: 'pending' }));
      if (rejectionReasons[docKey as keyof typeof rejectionReasons]) {
        setRejectionReasons((prev) => ({ ...prev, [docKey]: '' }));
      }
    },
    [isLocked, rejectionReasons]
  );

  const handleRejectionReasonChange = useCallback(
    (docKey: string, reason: string) => {
      if (isLocked) return;
      setRejectionReasons((prev) => ({ ...prev, [docKey]: reason }));
    },
    [isLocked]
  );

  // --- Score handlers ---
  const handleScoreChange = useCallback(
    (field: keyof typeof scores, value: string) => {
      if (isLocked) return;
      const validRegex = /^[0-9]*[.,]?[0-9]*$/;
      if (validRegex.test(value)) {
        setScores((prev) => ({ ...prev, [field]: value }));
        setTouchedScores((prev) => new Set(prev).add(field as Stage1ScoreField));
      }
    },
    [isLocked]
  );

  const handleScoreBlur = useCallback(
    (field: keyof typeof scores, value: string) => {
      if (isLocked) return;
      const normalizedValue = value.replace(',', '.');
      const numValue = parseFloat(normalizedValue);
      if (!isNaN(numValue)) {
        const clampedValue = Math.min(10, Math.max(0, numValue));
        setScores((prev) => ({ ...prev, [field]: clampedValue.toFixed(1) }));
      } else {
        setScores((prev) => ({ ...prev, [field]: 0 }));
      }
    },
    [isLocked]
  );

  const getScoreDisplayValue = useCallback((score: string | number | undefined) => {
    if (typeof score === 'string') return score;
    if (score === undefined || score === null) return '';
    return score.toString();
  }, []);

  // --- Total score ---
  const totalScore = useMemo(() => {
    const weights = {
      curriculum: processConfig?.weight_curriculum ?? 40,
      school_records: processConfig?.weight_school_records ?? 40,
      certificates: processConfig?.weight_certificates ?? 10,
      portfolio: processConfig?.weight_portfolio ?? 10,
    };

    const includeCurriculum = processConfig?.include_curriculum_in_score !== false;
    const includeCertificates =
      processConfig?.include_certificates_in_score !== false && !!application.course_certificates;
    const includePortfolio =
      processConfig?.include_portfolio_in_score !== false && !!application.portfolio_link;

    let totalWeight = 0;
    if (includeCurriculum) totalWeight += weights.curriculum;
    totalWeight += weights.school_records;
    if (includeCertificates) totalWeight += weights.certificates;
    if (includePortfolio) totalWeight += weights.portfolio;

    const toNumber = (v: unknown) => {
      if (typeof v === 'number') return v;
      const n = parseFloat(String(v));
      return Number.isFinite(n) ? n : 0;
    };

    let total = 0;
    if (includeCurriculum) total += toNumber(scores.curriculum) * weights.curriculum;
    total += toNumber(scores.school_records) * weights.school_records;
    if (includeCertificates) total += toNumber(scores.course_certificates) * weights.certificates;
    if (includePortfolio) total += toNumber(scores.portfolio) * weights.portfolio;

    if (totalWeight === 0) return 0;
    return parseFloat((total / totalWeight).toFixed(2));
  }, [
    scores,
    application.course_certificates,
    application.portfolio_link,
    processConfig?.weight_curriculum,
    processConfig?.weight_school_records,
    processConfig?.weight_certificates,
    processConfig?.weight_portfolio,
    processConfig?.include_curriculum_in_score,
    processConfig?.include_certificates_in_score,
    processConfig?.include_portfolio_in_score,
  ]);

  const toTri = useCallback((status?: DocumentStatus): boolean | null => {
    if (status === 'accepted') return true;
    if (status === 'rejected') return false;
    return null;
  }, []);

  const isScoreFieldApplicable = useCallback(
    (field: Stage1ScoreField): boolean => {
      if (field === 'curriculum') return processConfig?.include_curriculum_in_score !== false;
      if (field === 'school_records') return true;
      if (field === 'course_certificates') {
        return processConfig?.include_certificates_in_score !== false && !!application.course_certificates;
      }
      if (field === 'portfolio') {
        return processConfig?.include_portfolio_in_score !== false && !!application.portfolio_link;
      }
      return false;
    },
    [
      processConfig?.include_curriculum_in_score,
      processConfig?.include_certificates_in_score,
      processConfig?.include_portfolio_in_score,
      application.course_certificates,
      application.portfolio_link,
    ]
  );

  const getApplicableScoreFields = useCallback((): Stage1ScoreField[] => {
    const fields: Stage1ScoreField[] = [];
    if (isScoreFieldApplicable('curriculum')) fields.push('curriculum');
    if (isScoreFieldApplicable('school_records')) fields.push('school_records');
    if (isScoreFieldApplicable('course_certificates')) fields.push('course_certificates');
    if (isScoreFieldApplicable('portfolio')) fields.push('portfolio');
    return fields;
  }, [isScoreFieldApplicable]);

  const parseScoreValue = useCallback((field: Stage1ScoreField): number | null => {
    const raw = scores[field];
    if (raw === '' || raw === undefined || raw === null) return null;
    const num = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
    if (!Number.isFinite(num)) return null;
    return Math.min(10, Math.max(0, num));
  }, [scores]);

  const buildDocumentsPayload = useCallback((): Partial<Stage1Eval> => {
    return {
      application: application.id,
      identity_document_valid: toTri(documentStatus.identity_document),
      school_records_valid: toTri(documentStatus.school_records),
      frequency_statement_valid: application.frequency_statement
        ? toTri(documentStatus.frequency_statement)
        : null,
      vitae_curriculum_valid: toTri(documentStatus.vitae_curriculum),
      course_certificates_valid:
        application.course_certificates || scoreDocumentRules.certificatesRequiredForScore
          ? toTri(documentStatus.course_certificates)
          : null,
      portfolio_link_valid:
        application.portfolio_link || scoreDocumentRules.portfolioRequiredForScore
          ? toTri(documentStatus.portfolio_link)
          : null,
      identity_document_rejection_reason: rejectionReasons.identity_document || null,
      school_records_rejection_reason: rejectionReasons.school_records || null,
      frequency_statement_rejection_reason: rejectionReasons.frequency_statement || null,
      vitae_curriculum_rejection_reason: rejectionReasons.vitae_curriculum || null,
      course_certificates_rejection_reason: rejectionReasons.course_certificates || null,
      portfolio_link_rejection_reason: rejectionReasons.portfolio_link || null,
    };
  }, [application, documentStatus, rejectionReasons, scoreDocumentRules, toTri]);

  const buildScoresPayload = useCallback(
    (fields: Stage1ScoreField[]): Partial<Stage1Eval> => {
      const payload: Partial<Stage1Eval> = { application: application.id };
      for (const field of fields) {
        const value = parseScoreValue(field);
        if (value === null) continue;
        const apiKey = SCORE_FIELD_TO_API[field];
        (payload as Record<string, unknown>)[apiKey] = value;
      }
      return payload;
    },
    [application.id, parseScoreValue]
  );

  const validateDocumentsBeforeSave = useCallback((): boolean => {
    const requiredDocuments = ['identity_document', 'school_records', 'vitae_curriculum'];
    const allRequiredEvaluatedLocal = requiredDocuments.every(
      (docKey) => documentStatus[docKey] === 'accepted' || documentStatus[docKey] === 'rejected'
    );
    if (!allRequiredEvaluatedLocal) {
      toast.error('Todos os documentos obrigatórios devem ser avaliados (Aceitar ou Rejeitar)!');
      return false;
    }

    const rejectedWithoutReason = Object.entries(documentStatus)
      .filter(
        ([docKey, status]) =>
          status === 'rejected' && !rejectionReasons[docKey as keyof typeof rejectionReasons]?.trim()
      )
      .map(([docKey]) => docKey);

    if (rejectedWithoutReason.length > 0) {
      toast.error(
        `Os seguintes documentos rejeitados precisam de motivo: ${rejectedWithoutReason.join(', ')}`
      );
      return false;
    }
    return true;
  }, [documentStatus, rejectionReasons]);

  const persist = useCallback(
    async (
      mode: Stage1SaveMode,
      opts?: { silent?: boolean; scoreFields?: Stage1ScoreField[] }
    ) => {
      if (isLocked) return;

      if (mode === 'documents') {
        if (!validateDocumentsBeforeSave()) return;
        await onSubmit(buildDocumentsPayload(), { silent: opts?.silent ?? false, mode: 'documents' });
        return;
      }

      if (mode === 'draft_scores') {
        const fields = opts?.scoreFields?.length
          ? opts.scoreFields
          : Array.from(touchedScores).filter(isScoreFieldApplicable);
        if (fields.length === 0) {
          toast.info('Preencha e salve pelo menos uma nota, ou use o botão ao lado do campo.');
          return;
        }
        const missing = fields.filter((f) => parseScoreValue(f) === null);
        if (missing.length > 0) {
          toast.error('Informe uma nota válida (0 a 10) antes de salvar.');
          return;
        }
        const payload = buildScoresPayload(fields);
        if (notes.trim()) payload.notes = notes;
        await onSubmit(payload, { silent: opts?.silent ?? false, mode: 'draft_scores' });
        return;
      }

      // complete
      if (!validateDocumentsBeforeSave()) return;

      const applicable = getApplicableScoreFields();
      const missingScores = applicable.filter((f) => parseScoreValue(f) === null);
      if (missingScores.length > 0) {
        toast.error('Preencha todas as notas da etapa antes de concluir a avaliação.');
        return;
      }

      const data: Partial<Stage1Eval> = {
        ...buildDocumentsPayload(),
        ...buildScoresPayload(applicable),
        notes: notes || null,
        total_score: totalScore,
      };
      await onSubmit(data, { silent: opts?.silent ?? false, mode: 'complete' });
    },
    [
      isLocked,
      validateDocumentsBeforeSave,
      buildDocumentsPayload,
      buildScoresPayload,
      touchedScores,
      isScoreFieldApplicable,
      parseScoreValue,
      notes,
      totalScore,
      getApplicableScoreFields,
      onSubmit,
    ]
  );

  const saveSingleScore = useCallback(
    async (field: Stage1ScoreField) => {
      if (isLocked) return;
      const value = parseScoreValue(field);
      if (value === null) {
        toast.error('Informe uma nota válida (0 a 10) antes de salvar.');
        return;
      }
      setTouchedScores((prev) => new Set(prev).add(field));
      await persist('draft_scores', { silent: false, scoreFields: [field] });
    },
    [isLocked, parseScoreValue, persist]
  );

  const handleSubmit = useCallback(
    async (silent: boolean = false) => {
      await persist('complete', { silent });
    },
    [persist]
  );

  const hasRejectedRequired = useMemo(() => {
    const requiredDocs = ['identity_document', 'school_records', 'vitae_curriculum'];
    const coreRejected = requiredDocs.some((doc) => documentStatus[doc] === 'rejected');
    const portfolioRejectedForAbsence =
      scoreDocumentRules.portfolioRequiredForScore &&
      scoreDocumentRules.portfolioMissing &&
      documentStatus.portfolio_link === 'rejected';
    const certificatesRejectedForAbsence =
      scoreDocumentRules.certificatesRequiredForScore &&
      scoreDocumentRules.certificatesMissing &&
      documentStatus.course_certificates === 'rejected';
    return coreRejected || portfolioRejectedForAbsence || certificatesRejectedForAbsence;
  }, [documentStatus, scoreDocumentRules]);

  const allRequiredEvaluated = useMemo(
    () =>
      ['identity_document', 'school_records', 'vitae_curriculum'].every(
        (docKey) => documentStatus[docKey] === 'accepted' || documentStatus[docKey] === 'rejected'
      ),
    [documentStatus]
  );

  const documentsList = useMemo((): DocumentListItem[] => {
    const {
      portfolioRequiredForScore,
      certificatesRequiredForScore,
      portfolioMissing,
      certificatesMissing,
    } = scoreDocumentRules;

    const items: DocumentListItem[] = [
      {
        key: 'identity_document',
        label: 'Documento de Identidade',
        url: application.identity_document,
        required: true,
        description: 'Documento oficial com foto (RG, CNH ou Passaporte)',
      },
      {
        key: 'school_records',
        label: 'Histórico Escolar',
        url: application.school_records,
        required: true,
        description: 'Histórico acadêmico da faculdade atualizado',
      },
      {
        key: 'frequency_statement',
        label: 'Declaração de Frequência',
        url: application.frequency_statement,
        required: false,
        description: 'Declaração de matrícula e frequência vigente',
      },
      {
        key: 'vitae_curriculum',
        label: 'Currículo',
        url: application.vitae_curriculum,
        required: true,
        description: 'Currículo profissional atualizado',
      },
    ];

    if (application.course_certificates || (certificatesRequiredForScore && certificatesMissing)) {
      items.push({
        key: 'course_certificates',
        label: 'Certificados de Cursos',
        url: application.course_certificates,
        required: certificatesRequiredForScore && certificatesMissing,
        requiredForScore: certificatesRequiredForScore && certificatesMissing,
        missing: certificatesMissing,
        description:
          certificatesMissing && certificatesRequiredForScore
            ? 'Certificados obrigatórios para composição da nota — não enviados pelo candidato'
            : 'Certificados de cursos complementares',
      });
    }

    if (application.portfolio_link || (portfolioRequiredForScore && portfolioMissing)) {
      items.push({
        key: 'portfolio_link',
        label: 'Portfólio',
        url: application.portfolio_link,
        required: portfolioRequiredForScore && portfolioMissing,
        requiredForScore: portfolioRequiredForScore && portfolioMissing,
        missing: portfolioMissing,
        description:
          portfolioMissing && portfolioRequiredForScore
            ? 'Portfólio obrigatório para composição da nota — não enviado pelo candidato'
            : 'Link para portfólio online enviado pelo candidato',
        isExternal: true,
      });
    }

    return items.filter((doc) => doc.url || doc.required || doc.missing);
  }, [application, scoreDocumentRules]);

  const allListEvaluated = useMemo(
    () =>
      documentsList.every(
        (doc) =>
          documentStatus[doc.key] === 'accepted' || documentStatus[doc.key] === 'rejected'
      ),
    [documentsList, documentStatus]
  );

  const allRejectionReasonsFilled = useMemo(() => {
    const rejectedDocs = Object.entries(documentStatus)
      .filter(([, status]) => status === 'rejected')
      .map(([docKey]) => docKey);

    return rejectedDocs.every(
      (docKey) => rejectionReasons[docKey as keyof typeof rejectionReasons]?.trim() !== ''
    );
  }, [documentStatus, rejectionReasons]);

  const handleNextStep = async () => {
    if (!allRequiredEvaluated) {
      toast.error('Avalie todos os documentos obrigatórios antes de prosseguir.');
      return;
    }

    if (!allListEvaluated) {
      toast.error('Avalie todos os documentos listados (incluindo opcionais) antes de prosseguir.');
      return;
    }

    if (!allRejectionReasonsFilled) {
      toast.error('Preencha o motivo de rejeição para todos os documentos rejeitados.');
      return;
    }

    // Salva só validação de documentos — não envia notas (evita zerar trabalho de outro avaliador)
    await persist('documents', { silent: true });

    if (hasRejectedRequired) {
      toast.info('Candidato reprovado automaticamente devido a documentos rejeitados.');
      return;
    }

    setCurrentStep('scoring');
  };

  // --- UI: Validation step ---
  const ValidationStep = useMemo(
    () => (
      <div className="space-y-6">
        <div className="bg-primary-soft rounded-xl p-6 border border-primary/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Etapa 1 - Avaliação de Documentos</h3>
              <p className="text-muted-foreground mt-1">Revise cada documento e escolha "Aceitar" ou "Rejeitar"</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary-soft text-primary rounded-full text-sm font-medium">Step 1 de 2</span>
            </div>
          </div>

          {readOnly && !isRejected && (
            <div className="flex items-center gap-2 text-foreground/80 bg-background border border-border p-3 rounded-lg">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <span>Etapa 1 bloqueada — somente leitura</span>
            </div>
          )}

          {isRejected && (
            <div className="flex items-center gap-2 text-white bg-destructive border border-destructive p-3 rounded-lg">
              <Lock className="w-5 h-5 shrink-0" />
              <span className="font-medium">
                Candidato reprovado. A edição está bloqueada, mas você pode consultar a etapa de Notas
                pelo indicador acima.
              </span>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h4 className="font-bold text-foreground mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Avaliação de Documentos
          </h4>

          <div className="space-y-6">
            {documentsList.map((doc) => {
              const status = documentStatus[doc.key];
              const rejectionReason = rejectionReasons[doc.key as keyof typeof rejectionReasons];

              return (
                <div
                  key={doc.key}
                  className={`p-5 rounded-lg border ${
                    status === 'accepted'
                      ? 'border-success/30 bg-success-soft'
                      : status === 'rejected'
                        ? 'border-destructive/30 bg-destructive-soft'
                        : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-3">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            status === 'accepted'
                              ? 'bg-success-soft text-success'
                              : status === 'rejected'
                                ? 'bg-destructive-soft text-destructive'
                                : 'bg-muted text-muted-foreground/70'
                          }`}
                        >
                          {status === 'accepted' ? (
                            <CheckCircle className="w-6 h-6" />
                          ) : status === 'rejected' ? (
                            <XCircle className="w-6 h-6" />
                          ) : (
                            <Minus className="w-6 h-6" />
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-medium text-foreground">{doc.label}</h5>
                            {doc.requiredForScore && (
                              <span className="text-xs px-2 py-1 bg-warning-soft text-warning rounded-full">
                                Obrigatório para nota
                              </span>
                            )}
                            {doc.required && !doc.requiredForScore && (
                              <span className="text-xs px-2 py-1 bg-destructive-soft text-destructive rounded-full">Obrigatório</span>
                            )}
                            {!doc.required && !doc.requiredForScore && (
                              <span className="text-xs px-2 py-1 bg-primary-soft text-primary rounded-full">Opcional</span>
                            )}
                            {status === 'accepted' && (
                              <span className="text-xs px-2 py-1 bg-success-soft text-success rounded-full">Aceito</span>
                            )}
                            {status === 'rejected' && (
                              <span className="text-xs px-2 py-1 bg-destructive-soft text-destructive rounded-full">Rejeitado</span>
                            )}
                          </div>

                          <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>

                          {doc.missing && (
                            <p className="text-sm text-warning bg-warning-soft border border-warning/30 rounded-lg px-3 py-2 mt-2">
                              Documento não enviado pelo candidato. Rejeite para registrar a ausência.
                            </p>
                          )}

                          <div className="flex gap-3 mt-3">
                            <button
                              type="button"
                              onClick={() => handleDocumentAction(doc.key, 'accept', doc.missing)}
                              disabled={isLocked || doc.missing}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                status === 'accepted'
                                  ? 'bg-success text-white'
                                  : 'bg-success-soft text-success hover:bg-success-soft'
                              } ${isLocked || doc.missing ? 'opacity-50 cursor-not-allowed hover:bg-success-soft' : ''}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Aceitar
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDocumentAction(doc.key, 'reject', doc.missing)}
                              disabled={isLocked}
                              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                                status === 'rejected'
                                  ? 'bg-destructive text-white'
                                  : 'bg-destructive-soft text-destructive hover:bg-destructive-soft'
                              } ${isLocked ? 'opacity-50 cursor-not-allowed hover:bg-destructive-soft' : ''}`}
                            >
                              <XCircle className="w-4 h-4" />
                              Rejeitar
                            </button>

                            {status !== 'pending' && !isLocked && (
                              <button
                                type="button"
                                onClick={() => handleResetDocument(doc.key)}
                                disabled={isLocked}
                                className={`px-4 py-2 rounded-lg bg-muted text-foreground/80 hover:bg-border ${
                                  isLocked ? 'opacity-50 cursor-not-allowed hover:bg-muted' : ''
                                }`}
                              >
                                Resetar
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {status === 'rejected' && (
                        <div className="ml-14 mt-3">
                          <label className="block text-sm font-medium text-foreground/80 mb-1">
                            Motivo da rejeição (obrigatório):
                          </label>
                          <textarea
                            value={rejectionReason ?? ''}
                            onChange={(e) => handleRejectionReasonChange(doc.key, e.target.value)}
                            placeholder="Descreva detalhadamente o motivo pelo qual o documento foi rejeitado..."
                            className={`w-full h-24 px-3 py-2 border border-destructive/30 rounded-lg focus:ring-2 focus:ring-destructive focus:border-transparent text-sm ${
                              isLocked ? 'bg-muted cursor-not-allowed focus:ring-0' : ''
                            }`}
                            rows={3}
                            readOnly={isLocked}
                            required={!isLocked}
                          />
                          {!isLocked && (
                            <p className="text-xs text-destructive mt-1">
                              Este campo é obrigatório para documentos rejeitados
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {doc.url && (
                      <button
                        type="button"
                        onClick={() =>
                          openApplicationDocumentUrl(
                            doc.url,
                            doc.isExternal ? 'external' : 'authenticated-file'
                          )
                        }
                        className="ml-4 px-4 py-2 bg-primary-soft text-primary rounded-lg hover:bg-primary-soft transition-colors flex items-center gap-2 shrink-0"
                      >
                        {doc.isExternal ? (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            Acessar
                          </>
                        ) : (
                          <>
                            <FileText className="w-4 h-4" />
                            Abrir
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {!allRequiredEvaluated ? (
                <span className="text-warning">⚠ Avalie todos os documentos obrigatórios</span>
              ) : !allListEvaluated ? (
                <span className="text-warning">
                  ⚠ Avalie todos os documentos listados (incluindo itens obrigatórios para nota não enviados)
                </span>
              ) : hasRejectedRequired ? (
                <span className="text-destructive">⚠ Documento(s) obrigatório(s) rejeitado(s) - candidato reprovado</span>
              ) : (
                <span className="text-success">✓ Todos os documentos listados foram avaliados</span>
              )}
            </div>

            {!isRejected && (
              <button
                type="button"
                onClick={handleNextStep}
                disabled={
                  !allListEvaluated || !allRejectionReasonsFilled || isLocked || isSubmitting
                }
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  allListEvaluated && allRejectionReasonsFilled && !isLocked
                    ? 'bg-primary text-primary-foreground hover:shadow-md hover:scale-[1.02]'
                    : 'bg-muted text-muted-foreground/70 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  'Salvando...'
                ) : (
                  <>
                    {hasRejectedRequired ? 'Salvar e Reprovar' : 'Próxima Etapa'}
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    ),
    [
      documentsList,
      documentStatus,
      rejectionReasons,
      allRequiredEvaluated,
      allListEvaluated,
      allRejectionReasonsFilled,
      hasRejectedRequired,
      isLocked,
      isRejected,
      readOnly,
      isSubmitting,
      handleDocumentAction,
      handleResetDocument,
      handleRejectionReasonChange,
      handleNextStep,
    ]
  );

  // --- UI: Scoring step ---
  const ScoringStep = useMemo(
    () => (
      <div className="space-y-6">
        <div className="bg-success-soft rounded-xl p-6 border border-success/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-foreground">Etapa 1 - Atribuição de Notas</h3>
              <p className="text-muted-foreground mt-1">Atribua notas decimais (ex: 6.7, 8.5) para os componentes avaliáveis</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-success-soft text-success rounded-full text-sm font-medium">Step 2 de 2</span>
              <div className="text-right">
                <div className="text-2xl font-bold text-success">{totalScore.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Pontuação Total</div>
              </div>
            </div>
          </div>

          {isLocked && (
            <div className="flex items-center gap-2 text-foreground/80 bg-background border border-border p-3 rounded-lg">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <span>Avaliação bloqueada — somente leitura</span>
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h4 className="font-bold text-foreground mb-2">Pontuações da Etapa 1</h4>
          <p className="text-sm text-primary bg-primary-soft border border-primary/30 rounded-lg px-3 py-2 mb-4">
            <strong>Avaliação em equipe:</strong> salve cada nota com &quot;Salvar nota&quot; (só esse campo é
            gravado). No outro computador, use <strong>Atualizar lista</strong>. Use{' '}
            <strong>Concluir avaliação</strong> apenas quando todas as notas estiverem preenchidas.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Currículo (opcional dependendo do processo) */}
            {processConfig?.include_curriculum_in_score !== false && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-sm font-medium text-foreground/80">
                    Currículo (0-10)
                  </label>
                  {application.vitae_curriculum && (
                    <button
                      type="button"
                      onClick={() =>
                        openApplicationDocumentUrl(
                          application.vitae_curriculum,
                          'authenticated-file'
                        )
                      }
                      className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary-soft rounded-lg hover:bg-primary-soft"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver documento
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={getScoreDisplayValue(scores.curriculum)}
                  onChange={(e) => handleScoreChange("curriculum", e.target.value)}
                  onBlur={(e) => handleScoreBlur("curriculum", e.target.value)}
                  placeholder="0.0"
                  disabled={isLocked}
                  className={`w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent ${
                    isLocked ? "bg-muted cursor-not-allowed focus:ring-0" : ""
                  }`}
                />
                {!isLocked && (
                  <button
                    type="button"
                    onClick={() => saveSingleScore('curriculum')}
                    disabled={isSubmitting}
                    className="text-sm font-medium text-success hover:text-success disabled:opacity-50"
                  >
                    Salvar nota (currículo)
                  </button>
                )}
              </div>
            )}

            {/* Histórico Escolar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-sm font-medium text-foreground/80">
                  Histórico Escolar (0-10)
                </label>
                {application.school_records && (
                  <button
                    type="button"
                    onClick={() =>
                      openApplicationDocumentUrl(
                        application.school_records,
                        'authenticated-file'
                      )
                    }
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary-soft rounded-lg hover:bg-primary-soft"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver documento
                  </button>
                )}
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={getScoreDisplayValue(scores.school_records)}
                onChange={(e) => handleScoreChange("school_records", e.target.value)}
                onBlur={(e) => handleScoreBlur("school_records", e.target.value)}
                placeholder="0.0"
                disabled={isLocked}
                className={`w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent ${
                  isLocked ? "bg-muted cursor-not-allowed focus:ring-0" : ""
                }`}
              />
              {!isLocked && (
                <button
                  type="button"
                  onClick={() => saveSingleScore('school_records')}
                  disabled={isSubmitting}
                  className="text-sm font-medium text-success hover:text-success disabled:opacity-50"
                >
                  Salvar nota (histórico)
                </button>
              )}
            </div>

            {/* Certificados (opcional) */}
            {processConfig?.include_certificates_in_score !== false &&
              !!application.course_certificates && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-sm font-medium text-foreground/80">
                      Certificados de Cursos (0-10)
                    </label>
                    {application.course_certificates && (
                      <button
                        type="button"
                        onClick={() =>
                          openApplicationDocumentUrl(
                            application.course_certificates,
                            'authenticated-file'
                          )
                        }
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-primary bg-primary-soft rounded-lg hover:bg-primary-soft"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver documento
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={getScoreDisplayValue(scores.course_certificates)}
                    onChange={(e) =>
                      handleScoreChange("course_certificates", e.target.value)
                    }
                    onBlur={(e) =>
                      handleScoreBlur("course_certificates", e.target.value)
                    }
                    placeholder="0.0"
                    disabled={isLocked}
                    className={`w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent ${
                      isLocked ? "bg-muted cursor-not-allowed focus:ring-0" : ""
                    }`}
                  />
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => saveSingleScore('course_certificates')}
                      disabled={isSubmitting}
                      className="text-sm font-medium text-success hover:text-success disabled:opacity-50"
                    >
                      Salvar nota (certificados)
                    </button>
                  )}
                </div>
              )}

            {/* Portfólio */}
            {processConfig?.include_portfolio_in_score !== false &&
              !!application.portfolio_link && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <label className="block text-sm font-medium text-foreground/80">
                      Portfólio (0-10)
                    </label>
                    {application.portfolio_link && (
                      <button
                        type="button"
                        onClick={() =>
                          openApplicationDocumentUrl(
                            application.portfolio_link,
                            'external'
                          )
                        }
                        className="shrink-0 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-success bg-success-soft rounded-lg hover:bg-success-soft"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver portfólio
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={getScoreDisplayValue(scores.portfolio)}
                    onChange={(e) => handleScoreChange("portfolio", e.target.value)}
                    onBlur={(e) => handleScoreBlur("portfolio", e.target.value)}
                    placeholder="0.0"
                    disabled={isLocked}
                    className={`w-full px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent ${
                      isLocked ? "bg-muted cursor-not-allowed focus:ring-0" : ""
                    }`}
                  />
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={() => saveSingleScore('portfolio')}
                      disabled={isSubmitting}
                      className="text-sm font-medium text-success hover:text-success disabled:opacity-50"
                    >
                      Salvar nota (portfólio)
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <h4 className="font-bold text-foreground mb-4">Observações Gerais</h4>
          <textarea
            value={notes}
            onChange={(e) => {
              if (!isLocked) setNotes(e.target.value);
            }}
            placeholder="Adicione observações sobre a avaliação (opcional)..."
            readOnly={isLocked}
            className={`w-full h-32 px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent ${
              isLocked ? 'bg-muted cursor-not-allowed focus:ring-0' : ''
            }`}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Use este espaço para adicionar comentários adicionais sobre a avaliação.
          </p>
        </div>

        {isLocked ? (
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep('validation')}
              className="flex items-center gap-2 px-6 py-3 border border-input text-foreground/80 rounded-xl hover:bg-background transition-colors"
            >
              ← Voltar para Validação
            </button>
            <div className="text-right">
              <div className="text-sm text-muted-foreground mb-1">Pontuação Final</div>
              <div className="text-3xl font-bold text-success">{totalScore.toFixed(2)}</div>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => setCurrentStep('validation')}
              className="flex items-center gap-2 px-6 py-3 border border-input text-foreground/80 rounded-xl hover:bg-background transition-colors"
            >
              ← Voltar para Validação
            </button>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <div className="text-right">
                <div className="text-sm text-muted-foreground mb-1">Pontuação Final</div>
                <div className="text-3xl font-bold text-success">{totalScore.toFixed(2)}</div>
              </div>

              <button
                type="button"
                onClick={() => persist('draft_scores')}
                disabled={isSubmitting || isLocked}
                className="px-5 py-3 rounded-xl border border-success/30 text-success bg-success-soft hover:bg-success-soft font-medium disabled:opacity-50"
              >
                Salvar rascunho
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || isLocked}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  isSubmitting || isLocked
                    ? 'bg-muted text-muted-foreground/70 cursor-not-allowed'
                    : 'bg-success text-white hover:shadow-md hover:scale-[1.02]'
                }`}
              >
                {isSubmitting ? (
                  'Salvando...'
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Concluir avaliação
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    ),
    [
      isLocked,
      isSubmitting,
      notes,
      totalScore,
      existingEvaluation,
      handleSubmit,
      saveSingleScore,
      persist,
      scores,
      processConfig?.include_curriculum_in_score,
      processConfig?.include_certificates_in_score,
      processConfig?.include_portfolio_in_score,
      application.course_certificates,
      application.portfolio_link,
      application.vitae_curriculum,
      application.school_records,
      handleScoreChange,
      handleScoreBlur,
    ]
  );

  const canGoToScoring =
    isLocked ||
    (allRequiredEvaluated &&
      allListEvaluated &&
      allRejectionReasonsFilled &&
      !hasRejectedRequired);

  const handleStepChange = (step: 'validation' | 'scoring') => {
    if (step === 'scoring' && !canGoToScoring) {
      toast.info('Conclua a validação dos documentos antes de acessar as notas.');
      return;
    }
    setCurrentStep(step);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => handleStepChange('validation')}
            className={`flex flex-col items-center ${
              currentStep === 'validation' ? 'text-primary' : isLocked ? 'text-success' : 'text-muted-foreground'
            } ${isLocked ? 'cursor-pointer hover:opacity-80' : 'cursor-pointer'}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === 'validation'
                  ? 'bg-primary-soft border-2 border-primary'
                  : isLocked
                    ? 'bg-success-soft border-2 border-success'
                    : 'bg-muted border-2 border-input'
              }`}
            >
              1
            </div>
            <span className="mt-2 text-sm font-medium">Validação</span>
          </button>

          <div className="w-24 h-1 bg-border mx-2"></div>

          <button
            type="button"
            onClick={() => handleStepChange('scoring')}
            disabled={!isLocked && !canGoToScoring}
            className={`flex flex-col items-center ${
              currentStep === 'scoring' ? 'text-success' : 'text-muted-foreground/70'
            } ${isLocked || canGoToScoring ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-60'}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep === 'scoring'
                  ? 'bg-success-soft border-2 border-success'
                  : 'bg-muted border-2 border-input'
              }`}
            >
              2
            </div>
            <span className="mt-2 text-sm font-medium">Notas</span>
          </button>
        </div>
      </div>

      {currentStep === 'validation' ? ValidationStep : ScoringStep}
    </div>
  );
}

