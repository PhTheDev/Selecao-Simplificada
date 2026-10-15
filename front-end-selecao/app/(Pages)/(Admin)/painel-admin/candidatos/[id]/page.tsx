'use client';

import type { Application } from '@/api/types/application';
import type { Candidate } from '@/api/types/candidate';
import Modal from '@/components/ui/Modal';
import { Title } from '@/components/ui/Title';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    ExternalLink,
    Eye,
    FileCheck,
    FileText,
    GraduationCap,
    Mail,
    MailCheck,
    MapPin,
    Percent,
    Phone as PhoneIcon,
    Shield,
    User,
    XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { resolveApplicationDocumentUrl } from '@/utils/openApplicationDocument';
import { isSafeHttpUrl } from '@/utils/safeNavigation';
import { toast } from 'sonner';

interface CandidateDetails extends Omit<Candidate, 'complement' | 'neighborhood'> {
  enrollments?: Application[];
  // ✅ novos campos (garante mesmo se o type Candidate ainda não foi atualizado)
  complement?: string | null;
  neighborhood?: string | null;

  // ✅ fallback de typo/legado (caso ainda exista no backend antigo)
  neiblehood?: string | null;
}

export default function CandidateDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const [candidate, setCandidate] = useState<CandidateDetails | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState<'info' | 'applications' | 'documents'>('info');

  useEffect(() => {
    if (candidateId) {
      fetchCandidateDetails();
      fetchApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidateId]);

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('admin-access-token='))
        ?.split('=')[1];

      if (!accessToken) {
        setError('Token de acesso não encontrado');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/${candidateId}/`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data: CandidateDetails = await response.json();
        setCandidate(data);
      } else {
        setError('Erro ao carregar dados do candidato');
      }
    } catch (err) {
      setError('Erro na requisição');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const accessToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('admin-access-token='))
        ?.split('=')[1];

      if (!accessToken) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/by_candidate/?candidate_id=${candidateId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setApplications(data);
        } else if (data.results && Array.isArray(data.results)) {
          setApplications(data.results);
        } else {
          setApplications([]);
        }
      } else if (response.status === 404) {
        await fetchApplicationsStandard();
      } else {
        console.error('Erro ao buscar inscrições:', response.status);
        setApplications([]);
      }
    } catch (err) {
      console.error('Erro ao buscar inscrições:', err);
      await fetchApplicationsStandard();
    }
  };

  const fetchApplicationsStandard = async () => {
    try {
      const accessToken = document.cookie
        .split('; ')
        .find((row) => row.startsWith('admin-access-token='))
        ?.split('=')[1];

      if (!accessToken) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/?candidate=${candidateId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setApplications(data);
        } else if (data.results && Array.isArray(data.results)) {
          setApplications(data.results);
        } else {
          setApplications([]);
        }
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Erro no endpoint padrão:', err);
      setApplications([]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    return cleaned.substring(0, 14);
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{1})(\d{4})(\d{4})/, '($1) $2 $3-$4');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length < 10) {
      if (cleaned.length <= 2) {
        return `(${cleaned}`;
      } else if (cleaned.length <= 7) {
        return cleaned.replace(/(\d{2})(\d)/, '($1) $2');
      } else if (cleaned.length <= 11) {
        return cleaned
          .replace(/(\d{2})(\d{1})(\d)/, '($1) $2 $3')
          .replace(/(\d{5})(\d)/, '$1-$2');
      }
    }

    return cleaned.substring(0, 15);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente',
          color:
            'bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-700 border border-amber-200',
          icon: Clock,
        };
      case 'approved':
        return {
          label: 'Aprovado',
          color:
            'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 border border-emerald-200',
          icon: CheckCircle,
        };
      case 'rejected':
        return {
          label: 'Reprovado',
          color:
            'bg-gradient-to-r from-rose-500/10 to-rose-600/10 text-rose-700 border border-rose-200',
          icon: XCircle,
        };
      case 'waiting':
        return {
          label: 'Em Espera',
          color:
            'bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 border border-blue-200',
          icon: Clock,
        };
      default:
        return {
          label: 'Desconhecido',
          color:
            'bg-gradient-to-r from-gray-500/10 to-gray-600/10 text-gray-700 border border-gray-200',
          icon: AlertTriangle,
        };
    }
  };

  const handleViewDocuments = (application: Application) => {
    setSelectedApplication(application);
    setShowDocumentsModal(true);
  };

  const handleViewProcess = (processId: number) => {
    window.open(`/painel-admin/processos?view=${processId}`, '_blank');
  };

  const calculateAverageScore = () => {
    if (!applications.length) return 0;

    const scores = applications
      .filter((app) => app.average_score !== null && app.average_score !== undefined)
      .map((app) => Number(app.average_score));

    if (scores.length === 0) return 0;

    const sum = scores.reduce((acc, score) => acc + score, 0);
    return (sum / scores.length).toFixed(1);
  };

  const getStatusCount = () => {
    const pending = applications.filter((a) => a.status === 'pending').length;
    const approved = applications.filter((a) => a.status === 'approved').length;
    const rejected = applications.filter((a) => a.status === 'rejected').length;
    const waiting = applications.filter((a) => a.status === 'waiting').length;

    return { pending, approved, rejected, waiting };
  };

  const getDocumentUrl = (url: string) => {
    if (!url) return '#';
    return resolveApplicationDocumentUrl(url) || '#';
  };

  const getPeriodLabel = (period: string | null) => {
    switch (period) {
      case 'M':
        return 'Matutino';
      case 'T':
        return 'Vespertino';
      case 'I':
        return 'Integral';
      case 'N':
        return 'Noturno';
      default:
        return 'Desconhecido';
    }
  };

  // ✅ endereço completo (opcional, mas ajuda muito no admin)
  const fullAddress = useMemo(() => {
    if (!candidate) return '';
    const bairro = candidate.neighborhood || candidate.neiblehood || '';
    const cidadeUf =
      candidate.city && candidate.uf ? `${candidate.city}-${candidate.uf}` : candidate.city || candidate.uf || '';
    return [candidate.address, bairro, candidate.complement ? `(${candidate.complement})` : null, cidadeUf, candidate.cep ? `CEP: ${candidate.cep}` : null]
      .filter(Boolean)
      .join(' • ');
  }, [candidate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="h-4 w-32 bg-gradient-to-r from-slate-200 to-slate-100 rounded-full animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-slate-200 mb-4"></div>
                  <div className="h-6 w-40 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 w-32 bg-slate-100 rounded mb-4"></div>
                  <div className="flex gap-2 mb-6">
                    <div className="h-6 w-16 bg-slate-100 rounded-full"></div>
                    <div className="h-6 w-20 bg-slate-100 rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                  <div className="h-6 w-48 bg-slate-200 rounded mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-slate-100 rounded"></div>
                    <div className="h-4 w-3/4 bg-slate-100 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-2">Erro ao carregar candidato</h3>
              <p className="text-white/90 mb-6 max-w-md mx-auto">{error || 'Candidato não encontrado'}</p>
            </div>
            <div className="p-8 bg-gradient-to-b from-white to-slate-50">
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-all duration-200 shadow-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={fetchCandidateDetails}
                  className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white font-medium rounded-lg hover:from-rose-600 hover:to-pink-700 transition-all duration-200 shadow-md shadow-rose-500/20"
                >
                  Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusCount = getStatusCount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-50 p-6">
      <Title title="Detalhes do Candidato" icon={User} />

      {/* Abas de navegação */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-6 overflow-hidden">
        <div className="flex flex-wrap">
          <button
            onClick={() => setSelectedTab('info')}
            className={`flex items-center gap-3 px-8 py-4 font-medium transition-all duration-200 relative ${
              selectedTab === 'info'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTab === 'info' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
              <User className="w-5 h-5" />
            </div>
            Informações Pessoais
            {selectedTab === 'info' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            )}
          </button>

          <button
            onClick={() => setSelectedTab('applications')}
            className={`flex items-center gap-3 px-8 py-4 font-medium transition-all duration-200 relative ${
              selectedTab === 'applications'
                ? 'text-emerald-600 bg-emerald-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTab === 'applications' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
              <FileCheck className="w-5 h-5" />
            </div>
            Inscrições
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                selectedTab === 'applications' ? 'bg-white text-emerald-600' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {applications.length}
            </span>
            {selectedTab === 'applications' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-green-500"></div>
            )}
          </button>

          <button
            onClick={() => setSelectedTab('documents')}
            className={`flex items-center gap-3 px-8 py-4 font-medium transition-all duration-200 relative ${
              selectedTab === 'documents'
                ? 'text-purple-600 bg-purple-50'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTab === 'documents' ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
              <FileText className="w-5 h-5" />
            </div>
            Documentos
            {selectedTab === 'documents' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-violet-500"></div>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna lateral */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg ring-4 ring-white/20">
                  {candidate.profile_image_url ? (
                    <img
                      src={candidate.profile_image_url}
                      alt={candidate.name}
                      className="w-full h-full rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/fallback-avatar.png';
                      }}
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-white mb-1">{candidate.name}</h2>
                <p className="text-slate-300 mb-4">{candidate.email}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    candidate.is_active
                      ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 border border-emerald-200'
                      : 'bg-gradient-to-r from-rose-500/10 to-rose-600/10 text-rose-700 border border-rose-200'
                  }`}
                >
                  {candidate.is_active ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4" />
                      Inativo
                    </>
                  )}
                </div>

                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    candidate.email_verified
                      ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 border border-emerald-200'
                      : 'bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-700 border border-amber-200'
                  }`}
                >
                  {candidate.email_verified ? (
                    <>
                      <MailCheck className="w-4 h-4" />
                      Email Verificado
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      Email Não Verificado
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Total de Inscrições</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{applications.length}</p>
                    </div>
                    <FileCheck className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Média de Pontuação</p>
                      <p className="text-2xl font-bold text-slate-900 mt-1">{calculateAverageScore()}</p>
                    </div>
                    <Percent className="w-8 h-8 text-emerald-500" />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Data de Cadastro</p>
                      <p className="text-lg font-bold text-slate-900 mt-1">{formatDate(candidate.created_at)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-amber-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
                  Contato
                </h3>

                {candidate.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                      <PhoneIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Telefone</p>
                      <p className="font-medium text-slate-900">{formatPhone(candidate.phone)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-100 to-emerald-200 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Email</p>
                    <p className="font-medium text-slate-900">{candidate.email}</p>
                    <p className={`text-xs mt-1 ${candidate.email_verified ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {candidate.email_verified ? '✓ Email verificado' : '✗ Email não verificado'}
                    </p>
                  </div>
                </div>

                {candidate.cpf && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">CPF</p>
                      <p className="font-medium text-slate-900">{formatCPF(candidate.cpf)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTab === 'info' ? (
            <div className="space-y-6">
              {/* Informações Acadêmicas */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Informações Acadêmicas</h3>
                      <p className="text-slate-600">Dados da formação acadêmica do candidato</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Faculdade</p>
                        <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          {candidate.college || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Período</p>
                        <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          {getPeriodLabel(candidate.period)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Semestre</p>
                        <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          {candidate.semester || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Status do Cadastro</p>
                        <div
                          className={`font-medium p-3 rounded-lg border ${
                            candidate.is_active
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {candidate.is_active ? 'Cadastro ativo' : 'Cadastro inativo'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ✅ Informações de Endereço (agora com Bairro + Complemento) */}
              {(candidate.address ||
                candidate.city ||
                candidate.uf ||
                candidate.cep ||
                candidate.neighborhood ||
                candidate.neiblehood ||
                candidate.complement) && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Informações de Endereço</h3>
                        <p className="text-slate-600">Endereço residencial do candidato</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {fullAddress && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-slate-500 mb-1">Endereço completo</p>
                          <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            {fullAddress}
                          </p>
                        </div>
                      )}

                      {candidate.cep && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">CEP</p>
                          <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            {candidate.cep}
                          </p>
                        </div>
                      )}

                      {candidate.address && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Endereço</p>
                          <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            {candidate.address}
                          </p>
                        </div>
                      )}

                      {(candidate.neighborhood || candidate.neiblehood) && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Bairro</p>
                          <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            {candidate.neighborhood || candidate.neiblehood}
                          </p>
                        </div>
                      )}

                      {candidate.complement && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Complemento</p>
                          <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            {candidate.complement}
                          </p>
                        </div>
                      )}

                      {candidate.city && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">Cidade</p>
                          <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            {candidate.city}
                          </p>
                        </div>
                      )}

                      {candidate.uf && (
                        <div>
                          <p className="text-sm text-slate-500 mb-1">UF</p>
                          <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                            {candidate.uf}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Informações do Sistema */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Informações do Sistema</h3>
                      <p className="text-slate-600">Dados de registro e status no sistema</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">ID do Candidato</p>
                        <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
                          {candidate.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Data de Criação</p>
                        <p className="font-medium text-slate-900 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          {formatDateTime(candidate.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Status do Email</p>
                        <div
                          className={`font-medium p-3 rounded-lg border ${
                            candidate.email_verified
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {candidate.email_verified ? 'Verificado' : 'Não verificado'}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500 mb-1">Status da Conta</p>
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                            candidate.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${
                              candidate.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          ></div>
                          <span className="font-medium">{candidate.is_active ? 'Ativa' : 'Inativa'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedTab === 'applications' ? (
            /* ===================== applications TAB ===================== */
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-300">Total</p>
                      <p className="text-3xl font-bold mt-1">{applications.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-emerald-100">Aprovadas</p>
                      <p className="text-3xl font-bold mt-1">{statusCount.approved}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-amber-100">Pendentes</p>
                      <p className="text-3xl font-bold mt-1">{statusCount.pending}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-rose-100">Reprovadas</p>
                      <p className="text-3xl font-bold mt-1">{statusCount.rejected}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
                  <h3 className="text-lg font-bold text-slate-900">Histórico de Inscrições</h3>
                  <p className="text-slate-600">Lista completa de processos seletivos inscritos</p>
                </div>

                {applications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center">
                      <FileCheck className="w-8 h-8 text-slate-400" />
                    </div>
                    <h4 className="text-slate-900 font-semibold text-lg mb-2">Nenhuma inscrição encontrada</h4>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Este candidato ainda não se inscreveu em nenhum processo seletivo.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                              Processo Seletivo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                              Data
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                              Pontuação
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                          {applications.map((application) => {
                            const StatusIcon = getStatusInfo(application.status).icon;
                            return (
                              <tr key={application.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="font-medium text-slate-900">
                                      {application.selection_process?.title || 'Processo não encontrado'}
                                    </div>
                                    <div className="text-sm text-slate-500">
                                      {application.selection_process?.course || 'Curso não especificado'}
                                    </div>
                                  </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div
                                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusInfo(
                                      application.status
                                    ).color}`}
                                  >
                                    <StatusIcon className="w-3 h-3" />
                                    {getStatusInfo(application.status).label}
                                  </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                  {formatDateTime(application.application_date)}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center justify-center">
                                    <span
                                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold shadow-sm ${
                                        application.average_score !== null && application.average_score >= 7
                                          ? 'bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 text-emerald-700 border border-emerald-200'
                                          : application.average_score !== null && application.average_score >= 5
                                          ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/10 text-amber-700 border border-amber-200'
                                          : application.average_score !== null
                                          ? 'bg-gradient-to-r from-rose-500/10 to-rose-600/10 text-rose-700 border border-rose-200'
                                          : 'bg-gradient-to-r from-slate-500/10 to-slate-600/10 text-slate-700 border border-slate-200'
                                      }`}
                                    >
                                      {application.average_score !== null && application.average_score !== undefined
                                        ? application.average_score
                                        : 'N/A'}
                                    </span>
                                  </div>
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      onClick={() => handleViewDocuments(application)}
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-600 rounded-lg hover:from-blue-600/20 hover:to-blue-700/20 transition-all duration-200 text-sm border border-blue-200"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Documentos
                                    </button>

                                    {application.selection_process && (
                                      <button
                                        onClick={() => handleViewProcess(application.selection_process.id)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-slate-500/10 to-slate-600/10 text-slate-700 rounded-lg hover:from-slate-600/20 hover:to-slate-700/20 transition-all duration-200 text-sm border border-slate-200"
                                      >
                                        <ExternalLink className="w-4 h-4" />
                                        Processo
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ===================== documents TAB ===================== */
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-purple-50 to-purple-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Documentos do Candidato</h3>
                      <p className="text-slate-600">Documentos enviados para inscrições nos processos seletivos</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Total de Processos</p>
                          <p className="text-2xl font-bold text-slate-900">{applications.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                          <FileCheck className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-500">
                        {applications.length > 0
                          ? `Documentos disponíveis em ${applications.length} processo(s)`
                          : 'Nenhum documento enviado'}
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-slate-600 font-medium">Portfólio Online</p>
                          <p className="text-lg font-bold text-slate-900">
                            {applications.some((app) => app.portfolio_link) ? 'Disponível' : 'Não disponível'}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-100 to-emerald-200 flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-emerald-600" />
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {applications.find((app) => app.portfolio_link)?.portfolio_link || 'Nenhum link de portfólio'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-slate-100 to-slate-200 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-slate-900 font-semibold text-lg mb-2">Nenhum documento encontrado</h4>
                  <p className="text-slate-600 max-w-md mx-auto">
                    Este candidato ainda não enviou documentos para nenhum processo seletivo.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 px-2">Processos Seletivos com Documentos</h3>

                  {applications.map((application) => (
                    <div key={application.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div>
                            <h4 className="font-bold text-slate-900 text-lg mb-1">
                              {application.selection_process?.title || 'Processo não encontrado'}
                            </h4>
                            <p className="text-slate-600">
                              {application.selection_process?.subtitle ||
                                application.selection_process?.course ||
                                'Sem descrição'}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <div
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusInfo(
                                application.status
                              ).color}`}
                            >
                              <Clock className="w-3 h-3" />
                              {getStatusInfo(application.status).label}
                            </div>

                            <button
                              onClick={() => handleViewDocuments(application)}
                              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                            >
                              Ver Documentos
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {application.identity_document && (
                            <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">Documento de Identidade</p>
                                  <p className="text-xs text-slate-500">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.school_records && (
                            <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-emerald-100 to-emerald-200 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">Histórico Escolar</p>
                                  <p className="text-xs text-slate-500">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.vitae_curriculum && (
                            <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">Currículo</p>
                                  <p className="text-xs text-slate-500">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.frequency_statement && (
                            <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-100 to-amber-200 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-amber-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">Declaração de Frequência</p>
                                  <p className="text-xs text-slate-500">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.course_certificates && (
                            <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-rose-100 to-rose-200 flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-rose-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">Certificados de Cursos</p>
                                  <p className="text-xs text-slate-500">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.portfolio_link && (
                            <div className="p-4 rounded-lg border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-100 to-indigo-200 flex items-center justify-center">
                                  <ExternalLink className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 truncate">Portfólio Online</p>
                                  <p className="text-xs text-slate-500 truncate">{application.portfolio_link}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Documentos */}
      <Modal
        isOpen={showDocumentsModal}
        onClose={() => setShowDocumentsModal(false)}
        title="Documentos da Inscrição"
        subtitle={selectedApplication?.selection_process?.title}
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setShowDocumentsModal(false)}
              className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-medium rounded-lg hover:from-slate-200 hover:to-slate-300 transition-all duration-200 border border-slate-300"
            >
              Fechar
            </button>
          </div>
        }
        backdropClass="bg-black/40 backdrop-blur-sm"
      >
        {selectedApplication && (
          <div className="p-6 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Processo Seletivo</p>
                  <p className="font-bold text-slate-900">
                    {selectedApplication.selection_process?.title || 'Processo não encontrado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700 font-medium mb-1">Data de Inscrição</p>
                  <p className="font-bold text-slate-900">{formatDateTime(selectedApplication.application_date)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900 text-lg">Documentos Enviados</h3>

              {selectedApplication.identity_document && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Documento de Identidade</p>
                      <p className="text-sm text-slate-500">Documento oficial com foto</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.identity_document)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.school_records && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-100 to-emerald-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Histórico Escolar</p>
                      <p className="text-sm text-slate-500">Documento acadêmico oficial</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.school_records)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.vitae_curriculum && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-100 to-purple-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Currículo</p>
                      <p className="text-sm text-slate-500">Currículo profissional</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.vitae_curriculum)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.frequency_statement && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-amber-100 to-amber-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Declaração de Frequência</p>
                      <p className="text-sm text-slate-500">Documento de frequência acadêmica</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.frequency_statement)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.course_certificates && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-rose-100 to-rose-200 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-rose-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Certificados de Cursos</p>
                      <p className="text-sm text-slate-500">Certificados de cursos complementares</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.course_certificates)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:from-rose-600 hover:to-rose-700 transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.portfolio_link && (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white to-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-indigo-100 to-indigo-200 flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">Portfólio Online</p>
                      <p className="text-sm text-slate-500 truncate max-w-xs">{selectedApplication.portfolio_link}</p>
                    </div>
                  </div>
                  {isSafeHttpUrl(selectedApplication.portfolio_link) ? (
                    <a
                      href={selectedApplication.portfolio_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Acessar
                    </a>
                  ) : (
                    <span className="text-sm text-slate-500">Link indisponível</span>
                  )}
                </div>
              )}

              {selectedApplication.average_score !== null && selectedApplication.average_score !== undefined && (
                <div className="mt-6 pt-6 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900">Pontuação Média</p>
                      <p className="text-sm text-slate-500">Avaliação do candidato neste processo</p>
                    </div>
                    <div
                      className={`text-3xl font-bold bg-gradient-to-r ${
                        selectedApplication.average_score >= 7
                          ? 'from-emerald-500 to-emerald-600'
                          : selectedApplication.average_score >= 5
                          ? 'from-amber-500 to-amber-600'
                          : 'from-rose-500 to-rose-600'
                      } bg-clip-text text-transparent`}
                    >
                      {selectedApplication.average_score}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
