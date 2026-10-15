'use client';

import { Candidate } from '@/api/types/candidate';
import { SelectionProcess } from '@/api/types/selection';
import { ApplicationFormData, validateStep } from '@/utils/applicationValidation';
import { cleanCEP, cleanCPF, cleanPhone, formatCEP, formatCPF, formatPhone } from '@/utils/inputFormatters';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface UseApplicationFormProps {
  initialData?: Partial<ApplicationFormData>;
  candidateData: Candidate | null;
  processData: SelectionProcess | null;
  accessToken: string | null;
  alreadyApplied: boolean;
  onSubmitSuccess: () => void;
  onError: (error: string) => void;
}

const buildPrefillFromCandidate = (candidateData: Candidate | null): Partial<ApplicationFormData> => {
  if (!candidateData) return {};
  return {
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
  };
};

const mergeOnlyEmpty = (current: ApplicationFormData, incoming: Partial<ApplicationFormData>): ApplicationFormData => {
  const next = { ...current };

  (Object.keys(incoming) as (keyof ApplicationFormData)[]).forEach((key) => {
    const incomingValue = incoming[key];
    if (incomingValue === undefined || incomingValue === null) return;

    const currentValue = next[key];

    const isEmptyString = typeof currentValue === 'string' && currentValue.trim() === '';
    const isNullFile = currentValue === null;

    if (incomingValue instanceof File) {
      if (isNullFile) (next as any)[key] = incomingValue;
      return;
    }

    if (isEmptyString || currentValue === undefined) {
      (next as any)[key] = incomingValue;
    }
  });

  return next;
};

const safeStringify = (obj: unknown) => {
  try {
    return JSON.stringify(obj ?? {});
  } catch {
    return '';
  }
};

const shallowEqual = (a: any, b: any) => {
  if (a === b) return true;
  if (!a || !b) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const k of aKeys) {
    if (a[k] !== b[k]) return false;
  }
  return true;
};

// ✅ Campos obrigatórios por etapa
const requiredFieldsByStep: Record<number, (keyof ApplicationFormData)[]> = {
  1: [
    'name',
    'cpf',
    'phone',
    'college',
    'period',
    'semester',
    'cep',
    'address',
    'complement',
    'neighborhood',
    'city',
    'uf',
  ],
  2: ['identity_document', 'school_records', 'vitae_curriculum', 'frequency_statement'],
  3: [],
};

const isValueFilled = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (value instanceof File) return true;
  return true;
};

const asNullable = (v: string | null | undefined) => {
  const s = (v ?? '').trim();
  return s.length ? s : null;
};

const parseErrorResponse = async (res: Response) => {
  const contentType = res.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data && typeof data === 'object') {
        // pega "detail" se existir
        if ((data as any).detail) return String((data as any).detail);

        // pega primeira mensagem de campo (DRF style)
        const entries = Object.entries(data as Record<string, any>);
        if (entries.length > 0) {
          const [field, val] = entries[0];
          if (Array.isArray(val) && val.length > 0) return `${field}: ${String(val[0])}`;
          if (typeof val === 'string') return `${field}: ${val}`;
          return JSON.stringify(data);
        }

        // JSON vazio
        return `${res.status} ${res.statusText}`;
      }
      return `${res.status} ${res.statusText}`;
    }

    const text = await res.text();
    return text?.trim() ? text : `${res.status} ${res.statusText}`;
  } catch {
    return `${res.status} ${res.statusText}`;
  }
};

export const useApplicationForm = ({
  initialData,
  candidateData,
  processData,
  accessToken,
  alreadyApplied,
  onSubmitSuccess,
  onError,
}: UseApplicationFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<ApplicationFormData>({
    name: initialData?.name || '',
    cpf: initialData?.cpf || '',
    phone: initialData?.phone || '',
    college: initialData?.college || '',
    period: initialData?.period || '',
    semester: initialData?.semester || '',
    cep: initialData?.cep || '',
    address: initialData?.address || '',
    complement: initialData?.complement || '',
    neighborhood: initialData?.neighborhood || '',
    city: initialData?.city || '',
    uf: initialData?.uf || '',
    identity_document: initialData?.identity_document || null,
    school_records: initialData?.school_records || null,
    frequency_statement: initialData?.frequency_statement || null,
    vitae_curriculum: initialData?.vitae_curriculum || null,
    course_certificates: initialData?.course_certificates || null,
    portfolio_link: initialData?.portfolio_link || '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [addressFetched, setAddressFetched] = useState(false);

  const inputRefs = useRef<Record<string, HTMLInputElement>>({});
  const cepTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ PRE-FILL SEM LOOP
  useEffect(() => {
    const incoming = {
      ...buildPrefillFromCandidate(candidateData),
      ...(initialData || {}),
    };

    const hasAny = Object.values(incoming).some((v) => {
      if (v === undefined || v === null) return false;
      if (typeof v === 'string') return v.trim() !== '';
      return true;
    });

    if (!hasAny) return;

    setFormData((prev) => {
      const next = mergeOnlyEmpty(prev, incoming);
      return shallowEqual(prev, next) ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeStringify(buildPrefillFromCandidate(candidateData)), safeStringify(initialData)]);

  const fetchAddressByCEP = async (cep: string) => {
    try {
      setCepLoading(true);
      const clean = cep.replace(/\D/g, '');

      if (clean.length === 8) {
        const response = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            address: data.logradouro || '',
            city: data.localidade || '',
            neighborhood: data.bairro || '',
            uf: data.uf || '',
          }));
          setAddressFetched(true);
          setFormErrors((prev) => ({ ...prev, address: '', city: '', neighborhood: '', uf: '' }));
        } else {
          setFormErrors((prev) => ({ ...prev, cep: 'CEP não encontrado' }));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      setFormErrors((prev) => ({ ...prev, cep: 'Erro ao buscar CEP' }));
    } finally {
      setCepLoading(false);
    }
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      const isMaskedField = name === 'cpf' || name === 'phone' || name === 'cep';
      let formattedValue = value;

      if (isMaskedField && e.target instanceof HTMLInputElement) {
        const input = e.target;
        const cursorPosition = input.selectionStart || 0;
        const originalLength = input.value.length;

        if (name === 'cpf') formattedValue = formatCPF(value);
        if (name === 'phone') formattedValue = formatPhone(value);
        if (name === 'cep') formattedValue = formatCEP(value);

        inputRefs.current[name] = input;

        const lengthDiff = formattedValue.length - originalLength;
        const newCursorPosition = Math.min(
          Math.max(0, cursorPosition + lengthDiff),
          formattedValue.length
        );

        setFormData((prev) => ({ ...prev, [name]: formattedValue }));

        setTimeout(() => {
          const inputElement = inputRefs.current[name];
          if (inputElement) inputElement.setSelectionRange(newCursorPosition, newCursorPosition);
        }, 0);

        if (name === 'cep') {
          setAddressFetched(false);
          const clean = formattedValue.replace(/\D/g, '');

          if (cepTimeoutRef.current) clearTimeout(cepTimeoutRef.current);

          if (clean.length === 8) {
            cepTimeoutRef.current = setTimeout(() => {
              fetchAddressByCEP(formattedValue);
            }, 1000);
          }
        }
      } else {
        setFormData((prev) => ({ ...prev, [name]: formattedValue }));
      }

      if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
    },
    [formErrors]
  );

  const handleCepSearch = useCallback(() => {
    const clean = formData.cep.replace(/\D/g, '');
    if (clean.length === 8) fetchAddressByCEP(formData.cep);
    else setFormErrors((prev) => ({ ...prev, cep: 'CEP inválido. Digite 8 números.' }));
  }, [formData.cep]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
      const file = e.target.files?.[0] || null;

      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews((prev) => ({ ...prev, [field]: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }

      setFormData((prev) => ({ ...prev, [field]: file }));

      if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
    },
    [formErrors]
  );

  const handleFileRemove = useCallback((field: string) => {
    setFormData((prev) => ({ ...prev, [field]: null }));
    setFilePreviews((prev) => ({ ...prev, [field]: '' }));
  }, []);

  const validateCurrentStep = useCallback((): boolean => {
    const errors = validateStep(currentStep, formData);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentStep, formData]);

  const isStepFilled = useMemo(() => {
    const required = requiredFieldsByStep[currentStep] ?? [];
    return required.every((field) => isValueFilled((formData as any)[field]));
  }, [currentStep, formData]);

  const stepHasErrors = useMemo(() => {
    const required = requiredFieldsByStep[currentStep] ?? [];
    return required.some((field) => !!formErrors[String(field)]);
  }, [currentStep, formErrors]);

  const canGoNext = useMemo(() => {
    if (currentStep >= 3) return false;
    if (submitting) return false;
    return isStepFilled && !stepHasErrors;
  }, [currentStep, submitting, isStepFilled, stepHasErrors]);

  const handleNextStep = useCallback(() => {
    const ok = validateCurrentStep();

    if (!ok || !isStepFilled) {
      if (!isStepFilled) {
        const required = requiredFieldsByStep[currentStep] ?? [];
        const missing = required.filter((f) => !isValueFilled((formData as any)[f]));
        if (missing.length > 0) {
          setFormErrors((prev) => {
            const next = { ...prev };
            missing.forEach((f) => {
              const key = String(f);
              if (!next[key]) next[key] = 'Campo obrigatório';
            });
            return next;
          });
        }
      }
      return;
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3));
  }, [currentStep, formData, isStepFilled, validateCurrentStep]);

  const handlePrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (alreadyApplied) {
        setSubmitError('Você já possui uma candidatura para este processo');
        return;
      }

      const step1Errors = validateStep(1, formData);
      const step2Errors = validateStep(2, formData);
      const mergedErrors = { ...step1Errors, ...step2Errors };
      if (Object.keys(mergedErrors).length > 0) {
        setFormErrors(mergedErrors);
        setSubmitError('Preencha todos os campos obrigatórios antes de enviar.');
        return;
      }

      if (!accessToken || !candidateData || !processData) return;

      try {
        setSubmitting(true);
        setSubmitError(null);

        // 1) Checagem final
        const finalCheckResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/?candidate=${candidateData.id}&selection_process=${processData.id}`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        if (finalCheckResponse.ok) {
          const checkData = await finalCheckResponse.json();
          const results = (checkData as any).results ?? checkData;
          if (Array.isArray(results) && results.length > 0) {
            setSubmitError('Uma candidatura já foi encontrada para você neste processo');
            onError('Uma candidatura já foi encontrada para você neste processo');
            return;
          }
        }

        // 2) Normalizações
        const cleanCPFValue = cleanCPF(formData.cpf);
        const cleanPhoneValue = cleanPhone(formData.phone);
        const cleanCEPValue = cleanCEP(formData.cep);

        // 3) PATCH candidato (alinhado ao schema: envia null em vazios)
        const updateData = {
          cpf: asNullable(cleanCPFValue) ? cleanCPFValue : null,
          phone: asNullable(cleanPhoneValue) ? cleanPhoneValue : null,

          college: asNullable(formData.college),
          period: asNullable(formData.period), // ✅ "M"|"T"|"I"
          semester: asNullable(formData.semester),

          cep: asNullable(cleanCEPValue) ? cleanCEPValue : null,
          address: asNullable(formData.address),
          complement: asNullable(formData.complement),
          neighborhood: asNullable(formData.neighborhood),
          city: asNullable(formData.city),
          uf: asNullable(formData.uf),
        };

        const updateResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/${candidateData.id}/`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          }
        );

        if (!updateResponse.ok) {
          const msg = await parseErrorResponse(updateResponse);
          console.error('Erro ao atualizar candidato:', msg);
          throw new Error(msg || 'Erro ao atualizar dados do candidato');
        }

        // 4) POST application (FormData)
        const applicationFormData = new FormData();
        applicationFormData.append('selection_process_id', processData.id.toString());

        if (formData.identity_document) applicationFormData.append('identity_document', formData.identity_document);
        if (formData.school_records) applicationFormData.append('school_records', formData.school_records);
        if (formData.vitae_curriculum) applicationFormData.append('vitae_curriculum', formData.vitae_curriculum);
        if (formData.frequency_statement) applicationFormData.append('frequency_statement', formData.frequency_statement);
        if (formData.course_certificates) applicationFormData.append('course_certificates', formData.course_certificates);
        if (formData.portfolio_link) applicationFormData.append('portfolio_link', formData.portfolio_link);

        const applicationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${accessToken}` },
            body: applicationFormData,
          }
        );

        if (!applicationResponse.ok) {
          const msg = await parseErrorResponse(applicationResponse);
          console.error('Erro do backend:', msg);
          throw new Error(msg || 'Erro ao enviar candidatura');
        }

        onSubmitSuccess();
      } catch (error: any) {
        console.error('Erro na candidatura:', error);

        if (error?.message?.includes('duplicate') || error?.message?.includes('já existe')) {
          setSubmitError('Você já possui uma candidatura para este processo');
          onError('Você já possui uma candidatura para este processo');
        } else {
          setSubmitError(error?.message || 'Erro ao processar candidatura');
          onError(error?.message || 'Erro ao processar candidatura');
        }
      } finally {
        setSubmitting(false);
      }
    },
    [alreadyApplied, accessToken, candidateData, processData, formData, onSubmitSuccess, onError]
  );

  return {
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
  };
};
