'use client';

import Footer from '@/components/Footer';
import { SEMESTER_OPTIONS, TURNO_OPTIONS } from '@/constants/applicationForm';
import { AnimatePresence, motion } from 'framer-motion';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle,
    Loader2,
    MapPin,
    Search,
    Upload,
    XCircle,
} from 'lucide-react';
import { isPastInscriptionEnd, parseLocalCalendarDate } from '@/utils/selectionProcessDates';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

// -----------------------------
// Configurações
// -----------------------------
const UF_OPTIONS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// -----------------------------
// Animações
// -----------------------------
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
} as const;

const stepVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
} as const;

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: 0.2 },
  },
} as const;

// -----------------------------
// Tipos & Helpers
// -----------------------------
type FormDataState = {
  name: string;
  cpf: string;
  phone: string;
  college: string;
  period: string;
  semester: string;

  cep: string;
  address: string;
  neighborhood: string; // ✅ BAIRRO
  complement: string;
  city: string;
  uf: string;

  identity_document: File | null;
  school_records: File | null;
  frequency_statement: File | null;
  vitae_curriculum: File | null;
  course_certificates: File | null;

  portfolio_link: string;
};

type ExistingDocumentsState = {
  identity_document: string;
  school_records: string;
  vitae_curriculum: string;
  frequency_statement: string;
  course_certificates: string;
};

type InputFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  children?: React.ReactNode;
};

function InputField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  children,
  error,
  required = false,
}: InputFieldProps) {
  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <label className="block text-sm font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      {children || (
        <motion.input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#ccff00]/50 ${
            error
              ? 'border-destructive/30 focus:ring-destructive bg-destructive-soft'
              : 'border-input focus:ring-primary-hover focus:border-primary-hover hover:border-input'
          }`}
          whileFocus={{ scale: 1.01 }}
        />
      )}

      {error && (
        <motion.p
          className="text-sm text-destructive flex items-center gap-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-4 h-4" /> {error}
        </motion.p>
      )}
    </motion.div>
  );
}

type SelectFieldProps = {
  label: string;
  name: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  error?: string;
  required?: boolean;
};

function SelectField({
  label,
  name,
  value,
  options,
  onChange,
  error,
  required = false,
}: SelectFieldProps) {
  return (
    <motion.div
      className="space-y-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <label className="block text-sm font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </label>

      <select
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full px-4 py-2.5 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#ccff00]/50 ${
          error
            ? 'border-destructive/30 focus:ring-destructive bg-destructive-soft'
            : 'border-input focus:ring-primary-hover focus:border-primary-hover hover:border-input'
        }`}
      >
        <option value="">Selecione...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <motion.p
          className="text-sm text-destructive flex items-center gap-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-4 h-4" /> {error}
        </motion.p>
      )}
    </motion.div>
  );
}

type FileUploadFieldProps = {
  label: string;
  name: keyof FormDataState;
  description: string;
  required?: boolean;
  existingUrl?: string;
  file: File | null;
  preview?: string;
  error?: string;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormDataState) => void;
  onClear: (field: keyof FormDataState) => void;
};

function FileUploadField({
  label,
  name,
  description,
  required = false,
  existingUrl = '',
  file,
  preview,
  error,
  onFileChange,
  onClear,
}: FileUploadFieldProps) {
  return (
    <motion.div
      className="space-y-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <label className="block text-sm font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <p className="text-sm text-muted-foreground">{description}</p>

      {existingUrl && (
        <div className="mb-3 p-3 bg-success-soft border border-success/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">
                Documento já enviado anteriormente
              </span>
            </div>
            <a
              href={existingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-hover hover:underline"
            >
              Visualizar
            </a>
          </div>
        </div>
      )}

      <motion.div
        className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
          error
            ? 'border-destructive/30 bg-destructive-soft'
            : file
            ? 'border-primary-hover bg-primary-soft'
            : 'border-input hover:border-input'
        }`}
        whileHover={{ scale: 1.005 }}
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="file"
              onChange={(e) => onFileChange(e, name)}
              accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
              className="hidden"
              id={`file-${String(name)}`}
            />
            <motion.label
              htmlFor={`file-${String(name)}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-input rounded-lg hover:bg-background cursor-pointer transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Upload className="w-4 h-4" />
              <span className="text-sm font-medium">
                {existingUrl ? 'Substituir arquivo' : 'Selecionar arquivo'}
              </span>
            </motion.label>
            <p className="text-xs text-muted-foreground mt-2">Deixe em branco para manter o arquivo atual</p>
          </div>

          {preview && (
            <motion.div
              className="w-16 h-16 rounded-lg overflow-hidden border"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            </motion.div>
          )}
        </div>

        {file && (
          <motion.div
            className="mt-3 flex items-center justify-between"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-primary-hover" />
              <span className="text-sm font-medium text-foreground/80">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            <motion.button
              type="button"
              onClick={() => onClear(name)}
              className="text-destructive hover:text-destructive"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <XCircle className="w-4 h-4" />
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {error && (
        <motion.p
          className="text-sm text-destructive flex items-center gap-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AlertCircle className="w-4 h-4" /> {error}
        </motion.p>
      )}
    </motion.div>
  );
}

// -----------------------------
// Página
// -----------------------------
export default function EditarInscricaoPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [processData, setProcessData] = useState<any>(null);
  const [candidateData, setCandidateData] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    cpf: '',
    phone: '',
    college: '',
    period: '',
    semester: '',

    cep: '',
    address: '',
    neighborhood: '', // ✅ bairro
    complement: '',
    city: '',
    uf: '',

    identity_document: null,
    school_records: null,
    frequency_statement: null,
    vitae_curriculum: null,
    course_certificates: null,

    portfolio_link: '',
  });

  const [existingDocuments, setExistingDocuments] = useState<ExistingDocumentsState>({
    identity_document: '',
    school_records: '',
    vitae_curriculum: '',
    frequency_statement: '',
    course_certificates: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [filePreviews, setFilePreviews] = useState<Record<string, string>>({});
  const [cepLoading, setCepLoading] = useState(false);
  const [addressFetched, setAddressFetched] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // -----------------------------
  // Formatadores
  // -----------------------------
  const formatCPF = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cleaned.substring(0, 14);
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      if (cleaned.length <= 10) {
        return cleaned.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
      }
      return cleaned.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    }
    return cleaned.substring(0, 15);
  };

  const formatCEP = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 8) {
      return cleaned.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return cleaned.substring(0, 9);
  };

  // -----------------------------
  // Carregar dados
  // -----------------------------
  useEffect(() => {
    const token = document.cookie
      .split('; ')
      .find((row) => row.startsWith('access-token='))
      ?.split('=')[1];

    if (!token) {
      router.push('/auth/login-candidato');
      return;
    }

    setAccessToken(token);
    fetchApplicationData(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  const fetchApplicationData = async (token: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar candidaturas');
      }

      const data = await response.json();
      const apps = data.results || data || [];
      const application = apps.find((app: any) => app.id === parseInt(applicationId, 10));

      if (!application) throw new Error('Candidatura não encontrada');

      setApplicationData(application);

      if (application.selection_process) {
        setProcessData(application.selection_process);

        if (isPastInscriptionEnd(application.selection_process.ending_date)) {
          setError('O prazo para edição desta candidatura já expirou');
        }
      }

      if (application.candidate) {
        setCandidateData(application.candidate);

        setFormData((prev) => ({
          ...prev,
          name: application.candidate.name || '',
          cpf: formatCPF(application.candidate.cpf || ''),
          phone: formatPhone(application.candidate.phone || ''),
          college: application.candidate.college || '',
          period: application.candidate.period || '',
          semester: application.candidate.semester || '',

          cep: formatCEP(application.candidate.cep || ''),
          address: application.candidate.address || '',
          neighborhood: application.candidate.neighborhood || '', 
          complement: application.candidate.complement || '',
          city: application.candidate.city || '',
          uf: application.candidate.uf || '',

          portfolio_link: application.portfolio_link || '',
        }));
      }

      setExistingDocuments({
        identity_document: application.identity_document || '',
        school_records: application.school_records || '',
        vitae_curriculum: application.vitae_curriculum || '',
        frequency_statement: application.frequency_statement || '',
        course_certificates: application.course_certificates || '',
      });
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar os dados da candidatura');
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Handlers
  // -----------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = formatCPF(value);
    if (name === 'phone') formattedValue = formatPhone(value);
    if (name === 'cep') formattedValue = formatCEP(value);

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));

    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormDataState) => {
    const file = e.target.files?.[0] || null;

    if (file) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFormErrors((prev) => ({ ...prev, [String(field)]: 'Formato inválido. Use PDF, JPG, PNG, WEBP ou DOC' }));
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setFormErrors((prev) => ({ ...prev, [String(field)]: 'Arquivo muito grande (máx. 5MB)' }));
        return;
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreviews((prev) => ({ ...prev, [String(field)]: reader.result as string }));
        };
        reader.readAsDataURL(file);
      } else {
        // se não for imagem, limpa preview anterior
        setFilePreviews((prev) => ({ ...prev, [String(field)]: '' }));
      }
    }

    setFormData((prev) => ({ ...prev, [field]: file }));
    if (formErrors[String(field)]) setFormErrors((prev) => ({ ...prev, [String(field)]: '' }));
  };

  const handleClearFile = (field: keyof FormDataState) => {
    setFormData((prev) => ({ ...prev, [field]: null }));
    setFilePreviews((prev) => ({ ...prev, [String(field)]: '' }));
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) setCurrentStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const fetchAddressByCEP = async (cep: string) => {
    try {
      setCepLoading(true);
      const cleanCEP = cep.replace(/\D/g, '');

      if (cleanCEP.length === 8) {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            address: data.logradouro || '',
            neighborhood: data.bairro || '', // ✅ BAIRRO
            city: data.localidade || '',
            uf: data.uf || '',
          }));
          setAddressFetched(true);
          setFormErrors((prev) => ({ ...prev, address: '', neighborhood: '', city: '', uf: '' }));
        } else {
          setFormErrors((prev) => ({ ...prev, cep: 'CEP não encontrado' }));
        }
      }
    } catch {
      setFormErrors((prev) => ({ ...prev, cep: 'Erro ao buscar CEP' }));
    } finally {
      setCepLoading(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatCEP(e.target.value);
    setFormData((prev) => ({ ...prev, cep: value }));
    setAddressFetched(false);

    if (formErrors.cep) setFormErrors((prev) => ({ ...prev, cep: '' }));

    const cleanCEP = value.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setTimeout(() => fetchAddressByCEP(value), 800);
    }
  };

  const handleCepSearchClick = () => {
    const cleanCEP = formData.cep.replace(/\D/g, '');
    if (cleanCEP.length === 8) fetchAddressByCEP(formData.cep);
    else setFormErrors((prev) => ({ ...prev, cep: 'CEP inválido. Digite 8 números.' }));
  };

  // -----------------------------
  // Validação
  // -----------------------------
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Nome completo é obrigatório';
      if (!formData.cpf.replace(/\D/g, '')) newErrors.cpf = 'CPF é obrigatório';
      if (!formData.phone.replace(/\D/g, '')) newErrors.phone = 'Telefone é obrigatório';
      if (!formData.college.trim()) newErrors.college = 'Instituição de ensino é obrigatória';
      if (!formData.period.trim()) newErrors.period = 'Turno é obrigatório';
      if (!formData.semester.trim()) newErrors.semester = 'Semestre/Período acadêmico é obrigatório';

      if (!formData.cep.replace(/\D/g, '')) newErrors.cep = 'CEP é obrigatório';
      if (!formData.address.trim()) newErrors.address = 'Endereço é obrigatório';
      if (!formData.neighborhood.trim()) newErrors.neighborhood = 'Bairro é obrigatório'; // ✅
      if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';
      if (!formData.uf.trim()) newErrors.uf = 'UF é obrigatória';
    }

    if (step === 2) {
      if (!formData.identity_document && !existingDocuments.identity_document) {
        newErrors.identity_document = 'Documento de identidade é obrigatório';
      }
      if (!formData.school_records && !existingDocuments.school_records) {
        newErrors.school_records = 'Histórico escolar é obrigatório';
      }
      if (!formData.vitae_curriculum && !existingDocuments.vitae_curriculum) {
        newErrors.vitae_curriculum = 'Currículo é obrigatório';
      }
    }

    if (step === 3) {
      if (formData.portfolio_link && !isValidUrl(formData.portfolio_link)) {
        newErrors.portfolio_link = 'URL inválida';
      }
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -----------------------------
  // Submit
  // -----------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // valida etapa atual
    if (!validateStep(currentStep)) return;
    if (!accessToken || !candidateData || !applicationData) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      // 1) Atualizar candidato
      const cleanCPF = formData.cpf.replace(/\D/g, '');
      const cleanPhone = formData.phone.replace(/\D/g, '');
      const cleanCEP = formData.cep.replace(/\D/g, '');

      const updateData: any = {
        cpf: cleanCPF,
        phone: cleanPhone,
        college: formData.college,
        period: formData.period,
        semester: formData.semester,
        cep: cleanCEP,
        address: formData.address,
        neighborhood: formData.neighborhood, // ✅ BAIRRO
        complement: formData.complement,
        city: formData.city,
        uf: formData.uf,
      };

      const candidateId = candidateData.id;
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/${candidateId}/`,
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
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error('Erro ao atualizar dados do candidato: ' + JSON.stringify(errorData));
      }

      // 2) Atualizar aplicação (arquivos)
      const applicationFormData = new FormData();

      if (formData.identity_document) applicationFormData.append('identity_document', formData.identity_document);
      if (formData.school_records) applicationFormData.append('school_records', formData.school_records);
      if (formData.vitae_curriculum) applicationFormData.append('vitae_curriculum', formData.vitae_curriculum);
      if (formData.frequency_statement) applicationFormData.append('frequency_statement', formData.frequency_statement);
      if (formData.course_certificates) applicationFormData.append('course_certificates', formData.course_certificates);

      if (formData.portfolio_link) applicationFormData.append('portfolio_link', formData.portfolio_link);

      const applicationResponse = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/${applicationId}/`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${accessToken}` },
          body: applicationFormData,
        }
      );

      if (!applicationResponse.ok) {
        const errorText = await applicationResponse.text();
        throw new Error(`Erro ao atualizar candidatura (${applicationResponse.status}): ${errorText}`);
      }

      await applicationResponse.json();

      setSuccess('Candidatura atualizada com sucesso!');
      setShowSuccessModal(true);
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar atualização');
    } finally {
      setSubmitting(false);
    }
  };

  // -----------------------------
  // Render helpers
  // -----------------------------
  const renderStepIndicator = () => (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-muted-foreground">Etapa {currentStep} de 3</div>
        <div className="text-sm font-semibold text-primary">
          {currentStep === 1 && '📝 Dados Pessoais'}
          {currentStep === 2 && '📎 Documentos'}
          {currentStep === 3 && '✨ Informações Adicionais'}
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
            className={`flex flex-col items-center ${currentStep >= step ? 'text-primary' : 'text-muted-foreground/70'}`}
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
            <span className="text-xs">{['Dados', 'Documentos', 'Extras'][step - 1]}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderStep1 = () => (
    <motion.div
      className="space-y-6"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      key="step-1"
    >
      <motion.div className="bg-primary-soft border border-primary-hover rounded-xl p-5 mb-6" variants={cardVariants}>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Dados Pessoais
        </h3>
        <p className="text-sm text-muted-foreground">Atualize suas informações pessoais para esta candidatura.</p>
      </motion.div>

      {/* Informações Básicas */}
      <motion.div className="space-y-6" variants={cardVariants}>
        <h4 className="text-base font-semibold text-foreground border-b pb-2">Informações Básicas</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InputField
            label="Nome Completo"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Seu nome completo"
            error={formErrors.name}
            required
          />

          {/* Email readonly */}
          <motion.div className="space-y-1" variants={cardVariants}>
            <label className="block text-sm font-medium text-foreground/80">Email</label>
            <div className="px-4 py-2.5 bg-background border border-input rounded-lg text-muted-foreground flex items-center">
              <span className="flex-1">{candidateData?.email}</span>
              <span className="text-xs bg-border text-muted-foreground px-2 py-1 rounded ml-2">Fixo</span>
            </div>
            <p className="text-xs text-muted-foreground">O email não pode ser alterado</p>
          </motion.div>

          <InputField
            label="CPF"
            name="cpf"
            value={formData.cpf}
            onChange={handleInputChange}
            placeholder="000.000.000-00"
            error={formErrors.cpf}
            required
          />

          <InputField
            label="Telefone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            type="tel"
            placeholder="(62) 99999-9999"
            error={formErrors.phone}
            required
          />
        </div>
      </motion.div>

      {/* Informações Acadêmicas */}
      <motion.div className="space-y-6" variants={cardVariants}>
        <h4 className="text-base font-semibold text-foreground border-b pb-2">Informações Acadêmicas</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <InputField
              label="Instituição de Ensino"
              name="college"
              value={formData.college}
              onChange={handleInputChange}
              placeholder="Nome completo da sua faculdade/universidade"
              error={formErrors.college}
              required
            />
          </div>

          <SelectField
            label="Turno"
            name="period"
            value={formData.period}
            onChange={handleInputChange}
            options={TURNO_OPTIONS}
            error={formErrors.period}
            required
          />

          <SelectField
            label="Período Acadêmico"
            name="semester"
            value={formData.semester}
            onChange={handleInputChange}
            options={SEMESTER_OPTIONS}
            error={formErrors.semester}
            required
          />
        </div>
      </motion.div>

      {/* Endereço */}
      <motion.div className="space-y-6" variants={cardVariants}>
        <h4 className="text-base font-semibold text-foreground border-b pb-2">Endereço</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* CEP */}
          <motion.div className="md:col-span-2 space-y-1" variants={cardVariants}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-foreground/80">
                CEP <span className="text-primary text-xs">(Busca automática)</span>
              </label>
              {addressFetched && (
                <motion.span
                  className="text-xs text-primary-hover flex items-center gap-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <CheckCircle className="w-3 h-3" /> Endereço encontrado
                </motion.span>
              )}
            </div>

            <div className="relative">
              <input
                type="text"
                name="cep"
                value={formData.cep}
                onChange={handleCepChange}
                placeholder="00000-000"
                className={`w-full px-4 py-2.5 pl-10 pr-32 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:border-[#ccff00]/50 ${
                  formErrors.cep
                    ? 'border-destructive/30 focus:ring-destructive bg-destructive-soft'
                    : addressFetched
                    ? 'border-primary-hover focus:ring-primary-hover bg-primary-soft'
                    : 'border-input focus:ring-primary-hover hover:border-input'
                }`}
              />

              <div className="absolute left-3 top-1/2 -translate-y-1/2">
                {cepLoading ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4 text-muted-foreground/70" />
                )}
              </div>

              <motion.button
                type="button"
                onClick={handleCepSearchClick}
                disabled={cepLoading || formData.cep.replace(/\D/g, '').length < 8}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground text-sm rounded-md hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {cepLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-3 h-3" />
                    Buscar CEP
                  </>
                )}
              </motion.button>
            </div>

            {formErrors.cep && (
              <motion.p className="text-sm text-destructive flex items-center gap-1 mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <AlertCircle className="w-4 h-4" /> {formErrors.cep}
              </motion.p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Digite o CEP para preencher automaticamente o endereço
            </p>
          </motion.div>

          {/* Logradouro */}
          <div className="md:col-span-2">
            <InputField
              label="Endereço"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Rua, número, bairro"
              error={formErrors.address}
              required
            />
          </div>

          {/* ✅ Bairro */}
          <InputField
            label="Bairro"
            name="neighborhood"
            value={formData.neighborhood}
            onChange={handleInputChange}
            placeholder="Seu bairro"
            error={formErrors.neighborhood}
            required
          />

          {/* Complemento */}
          <InputField
            label="Complemento"
            name="complement"
            value={formData.complement}
            onChange={handleInputChange}
            placeholder="Apartamento, bloco, referência (opcional)"
            error={formErrors.complement}
            required={false}
          />

          {/* Cidade/UF */}
          <InputField
            label="Cidade"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            placeholder="Cidade"
            error={formErrors.city}
            required
          />

          <SelectField
            label="UF"
            name="uf"
            value={formData.uf}
            onChange={handleInputChange}
            options={UF_OPTIONS}
            error={formErrors.uf}
            required
          />
        </div>
      </motion.div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      className="space-y-6"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      key="step-2"
    >
      <motion.div className="bg-primary-soft border border-primary-hover rounded-lg p-4" variants={cardVariants}>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          Documentos Necessários
        </h3>
        <p className="text-sm text-muted-foreground">
          Atualize os documentos da sua candidatura. Deixe em branco para manter os documentos atuais.
          <span className="text-destructive font-medium">
            {' '}Obrigatórios: Identidade, Histórico e Currículo. Declaração de Frequência e Certificados são opcionais.
          </span>
          <br />
          Formatos aceitos: PDF, JPG, PNG, DOC, DOCX, WEBP (Máximo: 5MB cada)
        </p>
      </motion.div>

      <div className="space-y-4">
        <FileUploadField
          label="Documento de Identidade (RG/CNH)"
          name="identity_document"
          description="Documento oficial com foto. Deve ser frente e verso."
          required
          existingUrl={existingDocuments.identity_document}
          file={formData.identity_document}
          preview={filePreviews.identity_document}
          error={formErrors.identity_document}
          onFileChange={handleFileChange}
          onClear={handleClearFile}
        />

        <FileUploadField
          label="Histórico Escolar"
          name="school_records"
          description="Histórico escolar da instituição de ensino atual."
          required
          existingUrl={existingDocuments.school_records}
          file={formData.school_records}
          preview={filePreviews.school_records}
          error={formErrors.school_records}
          onFileChange={handleFileChange}
          onClear={handleClearFile}
        />

        <FileUploadField
          label="Currículo (Lattes ou similar)"
          name="vitae_curriculum"
          description="Currículo atualizado com experiências e formações."
          required
          existingUrl={existingDocuments.vitae_curriculum}
          file={formData.vitae_curriculum}
          preview={filePreviews.vitae_curriculum}
          error={formErrors.vitae_curriculum}
          onFileChange={handleFileChange}
          onClear={handleClearFile}
        />

        <FileUploadField
          label="Declaração de Frequência (Opcional)"
          name="frequency_statement"
          description="Declaração de matrícula e frequência atual."
          required={false}
          existingUrl={existingDocuments.frequency_statement}
          file={formData.frequency_statement}
          preview={filePreviews.frequency_statement}
          error={formErrors.frequency_statement}
          onFileChange={handleFileChange}
          onClear={handleClearFile}
        />

        <FileUploadField
          label="Certificados de Cursos (Opcional)"
          name="course_certificates"
          description="Certificados de cursos complementares realizados."
          required={false}
          existingUrl={existingDocuments.course_certificates}
          file={formData.course_certificates}
          preview={filePreviews.course_certificates}
          error={formErrors.course_certificates}
          onFileChange={handleFileChange}
          onClear={handleClearFile}
        />
      </div>
    </motion.div>
  );

  const statusLabel = useMemo(() => {
    const s = applicationData?.status;
    if (s === 'pending') return { text: 'Pendente', cls: 'text-warning' };
    if (s === 'approved') return { text: 'Aprovado', cls: 'text-success' };
    if (s === 'rejected') return { text: 'Rejeitado', cls: 'text-destructive' };
    return { text: 'Em análise', cls: 'text-primary' };
  }, [applicationData?.status]);

  const renderStep3 = () => (
    <motion.div
      className="space-y-6"
      variants={stepVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      key="step-3"
    >
      <motion.div className="bg-primary-soft border border-primary-hover rounded-lg p-4" variants={cardVariants}>
        <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-primary" />
          Informações Adicionais
        </h3>
        <p className="text-sm text-muted-foreground">
          Adicione ou atualize informações que possam enriquecer sua candidatura (opcionais).
        </p>
      </motion.div>

      <div className="space-y-4">
        <InputField
          label="Link do Portfólio (Opcional)"
          name="portfolio_link"
          value={formData.portfolio_link}
          onChange={handleInputChange}
          type="url"
          placeholder="https://seusite.com ou https://linkedin.com/in/seuperfil"
          error={formErrors.portfolio_link}
        />

        <motion.div
          className="bg-primary-soft border border-primary-hover rounded-lg p-4"
          variants={cardVariants}
          whileHover={{ scale: 1.01 }}
        >
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            Resumo da Candidatura
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">
                Processo: <span className="font-semibold">{processData?.title}</span>
              </p>
              <p className="text-muted-foreground">
                Curso: <span className="font-semibold">{processData?.course}</span>
              </p>
              <p className="text-muted-foreground">
                Prazo:{' '}
                <span className="font-semibold">
                  {processData?.ending_date ? parseLocalCalendarDate(processData.ending_date).toLocaleDateString('pt-BR') : '-'}
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground">
                Candidato: <span className="font-semibold">{candidateData?.name}</span>
              </p>
              <p className="text-muted-foreground">
                Email: <span className="font-semibold">{candidateData?.email}</span>
              </p>
              <p className="text-muted-foreground">
                Status atual:{' '}
                <span className={`font-semibold ${statusLabel.cls}`}>{statusLabel.text}</span>
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-primary-hover">
            <p className="text-sm text-muted-foreground">
              Documentos obrigatórios:{' '}
              <span className="font-semibold">
                {[
                  formData.identity_document || existingDocuments.identity_document ? 1 : 0,
                  formData.school_records || existingDocuments.school_records ? 1 : 0,
                  formData.vitae_curriculum || existingDocuments.vitae_curriculum ? 1 : 0,
                  formData.frequency_statement || existingDocuments.frequency_statement ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}{' '}
                de 4
              </span>
            </p>

            {existingDocuments.course_certificates && (
              <p className="text-sm text-primary-hover mt-1">• Certificados de cursos já enviados anteriormente</p>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // -----------------------------
  // States
  // -----------------------------
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <motion.div
              className="rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <h3 className="text-lg font-semibold text-foreground/80">Carregando dados da candidatura...</h3>
          </div>
        </div>
        <Footer compact />
      </div>
    );
  }

  if (error && !showSuccessModal) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            className="bg-card rounded-xl shadow-sm border border-border p-8 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center">
              <div className="mx-auto w-20 h-20 bg-destructive-soft rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Erro ao carregar</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => router.push('/candidato/meus-processos')}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary font-medium transition-colors"
                >
                  Voltar para Minhas Candidaturas
                </button>
              </div>
            </div>
          </motion.div>
        </div>
        <Footer compact />
      </div>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <motion.div className="min-h-screen bg-background" variants={pageVariants} initial="hidden" animate="visible">
      <div className="container mx-auto px-4 py-8">
        {/* Cabeçalho */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => router.push('/candidato/meus-processos')}
            className="flex items-center gap-2 text-primary-hover hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Minhas Candidaturas
          </button>

          <div className="bg-primary rounded-xl p-6 text-primary-foreground">
            <h1 className="text-2xl font-bold mb-2">Editar Candidatura</h1>
            <p className="text-white">
              {processData?.title} • {processData?.course}
            </p>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <p className="text-sm font-medium">
                  Prazo:{' '}
                  {processData?.ending_date ? parseLocalCalendarDate(processData.ending_date).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
              <div className="bg-white/20 rounded-lg px-4 py-2">
                <p className="text-sm font-medium">
                  Status atual:{' '}
                  <span className="ml-2 text-white font-semibold">
                    {statusLabel.text}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Formulário */}
        <motion.div
          className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="p-8">
            {error && !success && (
              <motion.div
                className="mb-6 bg-destructive-soft/90 border border-destructive/30 rounded-lg p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <p className="text-destructive">{error}</p>
                </div>
              </motion.div>
            )}

            {success && (
              <motion.div
                className="mb-6 bg-success-soft/90 border border-success/30 rounded-lg p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
                  <p className="text-success">{success}</p>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit}>
              {renderStepIndicator()}

              <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                  {currentStep === 1 && renderStep1()}
                  {currentStep === 2 && renderStep2()}
                  {currentStep === 3 && renderStep3()}
                </AnimatePresence>
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 border-t border-border mt-8">
                <div>
                  {currentStep > 1 && (
                    <motion.button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={submitting}
                      className="px-6 py-3 border border-input text-foreground/80 rounded-lg hover:bg-background font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                      className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary font-medium transition-colors flex items-center gap-2"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Próximo →
                    </motion.button>
                  ) : (
                    <>
                      <motion.button
                        type="button"
                        onClick={() => router.push('/candidato/meus-processos')}
                        disabled={submitting}
                        className="px-6 py-3 border border-input text-foreground/80 rounded-lg hover:bg-background font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Cancelar
                      </motion.button>

                      <motion.button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-3 bg-primary-hover text-primary-foreground rounded-lg hover:bg-primary-hover font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Atualizando...
                          </>
                        ) : (
                          '💾 Salvar Alterações'
                        )}
                      </motion.button>
                    </>
                  )}
                </div>
              </div>

              {/* Important Notes */}
              <motion.div
                className="mt-8 bg-warning-soft/90 border border-warning/30 rounded-lg p-6"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-warning mb-2">Informações importantes</h4>
                    <ul className="text-sm text-warning space-y-1">
                      <li>• Campos marcados com * são obrigatórios</li>
                      <li>• Para documentos, deixe em branco para manter o arquivo atual</li>
                      <li>• Após a atualização, seu status voltará a "Em análise"</li>
                      <li>• Você só pode editar a candidatura enquanto o processo estiver aberto</li>
                    </ul>
                  </div>
                </div>
              </motion.div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-card rounded-2xl shadow-sm max-w-md w-full"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="p-8 text-center">
                <motion.div
                  className="mx-auto w-24 h-24 bg-primary-hover rounded-full flex items-center justify-center mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring' }}
                >
                  <CheckCircle className="w-12 h-12 text-white" />
                </motion.div>

                <motion.h3
                  className="text-2xl font-bold text-foreground mb-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  ✅ Candidatura Atualizada!
                </motion.h3>

                <motion.p
                  className="text-muted-foreground mb-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  Sua candidatura para <span className="font-semibold text-foreground">{processData?.title}</span> foi atualizada com sucesso.
                </motion.p>

                <motion.p
                  className="text-sm text-muted-foreground mb-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Seu status voltou para "Em análise" e a comissão avaliadora será notificada das alterações.
                </motion.p>

                <motion.div
                  className="flex flex-col gap-3"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <button
                    onClick={() => router.push('/candidato/meus-processos')}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary font-medium transition-colors"
                  >
                    Voltar para Minhas Candidaturas
                  </button>
                  <button
                    onClick={() => router.push('/processos-seletivos')}
                    className="px-6 py-3 border border-input text-foreground/80 rounded-lg hover:bg-background font-medium transition-colors"
                  >
                    Ver Outros Processos
                  </button>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer compact />
    </motion.div>
  );
}
