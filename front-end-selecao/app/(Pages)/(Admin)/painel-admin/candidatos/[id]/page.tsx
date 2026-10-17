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
            'bg-warning/10 text-warning border border-warning/30',
          icon: Clock,
        };
      case 'approved':
        return {
          label: 'Aprovado',
          color:
            'bg-success/10 text-success border border-success/30',
          icon: CheckCircle,
        };
      case 'rejected':
        return {
          label: 'Reprovado',
          color:
            'bg-destructive/10 text-destructive border border-destructive/30',
          icon: XCircle,
        };
      case 'waiting':
        return {
          label: 'Em Espera',
          color:
            'bg-primary/10 text-primary border border-primary/30',
          icon: Clock,
        };
      default:
        return {
          label: 'Desconhecido',
          color:
            'bg-muted-foreground/10 text-foreground/80 border border-border',
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2.5 bg-card text-foreground/80 rounded-lg hover:bg-background transition-all duration-200 shadow-sm border border-border hover:border-input hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            <div className="h-6 w-px bg-border"></div>
            <div className="h-4 w-32 bg-border rounded-full animate-pulse"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 animate-pulse">
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-border mb-4"></div>
                  <div className="h-6 w-40 bg-border rounded mb-2"></div>
                  <div className="h-4 w-32 bg-muted rounded mb-4"></div>
                  <div className="flex gap-2 mb-6">
                    <div className="h-6 w-16 bg-muted rounded-full"></div>
                    <div className="h-6 w-20 bg-muted rounded-full"></div>
                  </div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-card rounded-xl shadow-sm border border-border p-6 animate-pulse">
                  <div className="h-6 w-48 bg-border rounded mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 w-full bg-muted rounded"></div>
                    <div className="h-4 w-3/4 bg-muted rounded"></div>
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
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2.5 bg-card text-foreground/80 rounded-lg hover:bg-background transition-all duration-200 shadow-sm border border-border hover:border-input hover:shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
          </div>

          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="bg-destructive p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-white font-semibold text-xl mb-2">Erro ao carregar candidato</h3>
              <p className="text-white/90 mb-6 max-w-md mx-auto">{error || 'Candidato não encontrado'}</p>
            </div>
            <div className="p-8 bg-card">
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-muted text-foreground/80 font-medium rounded-lg hover:bg-border transition-all duration-200 shadow-sm"
                >
                  Voltar
                </button>
                <button
                  onClick={fetchCandidateDetails}
                  className="px-6 py-3 bg-destructive text-white font-medium rounded-lg hover:bg-destructive transition-all duration-200 shadow-md shadow-destructive/20"
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
    <div className="min-h-screen bg-background p-6">
      <Title title="Detalhes do Candidato" icon={User} />

      {/* Abas de navegação */}
      <div className="bg-card rounded-xl shadow-sm border border-border mb-6 overflow-hidden">
        <div className="flex flex-wrap">
          <button
            onClick={() => setSelectedTab('info')}
            className={`flex items-center gap-3 px-8 py-4 font-medium transition-all duration-200 relative ${
              selectedTab === 'info'
                ? 'text-primary bg-primary-soft'
                : 'text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTab === 'info' ? 'bg-card shadow-sm' : 'bg-muted'}`}>
              <User className="w-5 h-5" />
            </div>
            Informações Pessoais
            {selectedTab === 'info' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>

          <button
            onClick={() => setSelectedTab('applications')}
            className={`flex items-center gap-3 px-8 py-4 font-medium transition-all duration-200 relative ${
              selectedTab === 'applications'
                ? 'text-success bg-success-soft'
                : 'text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTab === 'applications' ? 'bg-card shadow-sm' : 'bg-muted'}`}>
              <FileCheck className="w-5 h-5" />
            </div>
            Inscrições
            <span
              className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                selectedTab === 'applications' ? 'bg-card text-success' : 'bg-border text-muted-foreground'
              }`}
            >
              {applications.length}
            </span>
            {selectedTab === 'applications' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-success"></div>
            )}
          </button>

          <button
            onClick={() => setSelectedTab('documents')}
            className={`flex items-center gap-3 px-8 py-4 font-medium transition-all duration-200 relative ${
              selectedTab === 'documents'
                ? 'text-primary bg-primary-soft'
                : 'text-muted-foreground hover:text-foreground hover:bg-background'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTab === 'documents' ? 'bg-card shadow-sm' : 'bg-muted'}`}>
              <FileText className="w-5 h-5" />
            </div>
            Documentos
            {selectedTab === 'documents' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna lateral */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
            <div className="bg-foreground p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center mb-4 shadow-sm ring-4 ring-white/20">
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
                <p className="text-muted-foreground/70 mb-4">{candidate.email}</p>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-wrap gap-2 justify-center mb-6">
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
                    candidate.is_active
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-destructive/10 text-destructive border border-destructive/30'
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
                      ? 'bg-success/10 text-success border border-success/30'
                      : 'bg-warning/10 text-warning border border-warning/30'
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
                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Total de Inscrições</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{applications.length}</p>
                    </div>
                    <FileCheck className="w-8 h-8 text-primary" />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Média de Pontuação</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{calculateAverageScore()}</p>
                    </div>
                    <Percent className="w-8 h-8 text-success" />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Data de Cadastro</p>
                      <p className="text-lg font-bold text-foreground mt-1">{formatDate(candidate.created_at)}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-warning" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full"></div>
                  Contato
                </h3>

                {candidate.phone && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                    <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
                      <PhoneIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium text-foreground">{formatPhone(candidate.phone)}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                  <div className="w-10 h-10 rounded-lg bg-success-soft flex items-center justify-center">
                    <Mail className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{candidate.email}</p>
                    <p className={`text-xs mt-1 ${candidate.email_verified ? 'text-success' : 'text-destructive'}`}>
                      {candidate.email_verified ? '✓ Email verificado' : '✗ Email não verificado'}
                    </p>
                  </div>
                </div>

                {candidate.cpf && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                    <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">CPF</p>
                      <p className="font-medium text-foreground">{formatCPF(candidate.cpf)}</p>
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
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="bg-primary-soft p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Informações Acadêmicas</h3>
                      <p className="text-muted-foreground">Dados da formação acadêmica do candidato</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Faculdade</p>
                        <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                          {candidate.college || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Período</p>
                        <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                          {getPeriodLabel(candidate.period)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Semestre</p>
                        <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                          {candidate.semester || 'Não informado'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Status do Cadastro</p>
                        <div
                          className={`font-medium p-3 rounded-lg border ${
                            candidate.is_active
                              ? 'bg-success-soft text-success border-success/30'
                              : 'bg-destructive-soft text-destructive border-destructive/30'
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
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="bg-success-soft p-6 border-b border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center shadow-sm">
                        <MapPin className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground">Informações de Endereço</h3>
                        <p className="text-muted-foreground">Endereço residencial do candidato</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {fullAddress && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-muted-foreground mb-1">Endereço completo</p>
                          <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                            {fullAddress}
                          </p>
                        </div>
                      )}

                      {candidate.cep && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">CEP</p>
                          <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                            {candidate.cep}
                          </p>
                        </div>
                      )}

                      {candidate.address && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Endereço</p>
                          <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                            {candidate.address}
                          </p>
                        </div>
                      )}

                      {(candidate.neighborhood || candidate.neiblehood) && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Bairro</p>
                          <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                            {candidate.neighborhood || candidate.neiblehood}
                          </p>
                        </div>
                      )}

                      {candidate.complement && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Complemento</p>
                          <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                            {candidate.complement}
                          </p>
                        </div>
                      )}

                      {candidate.city && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Cidade</p>
                          <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                            {candidate.city}
                          </p>
                        </div>
                      )}

                      {candidate.uf && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">UF</p>
                          <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                            {candidate.uf}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Informações do Sistema */}
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="bg-primary-soft p-6 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Informações do Sistema</h3>
                      <p className="text-muted-foreground">Dados de registro e status no sistema</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">ID do Candidato</p>
                        <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border font-mono">
                          {candidate.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Data de Criação</p>
                        <p className="font-medium text-foreground bg-background p-3 rounded-lg border border-border">
                          {formatDateTime(candidate.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Status do Email</p>
                        <div
                          className={`font-medium p-3 rounded-lg border ${
                            candidate.email_verified
                              ? 'bg-success-soft text-success border-success/30'
                              : 'bg-destructive-soft text-destructive border-destructive/30'
                          }`}
                        >
                          {candidate.email_verified ? 'Verificado' : 'Não verificado'}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Status da Conta</p>
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg ${
                            candidate.is_active
                              ? 'bg-success-soft text-success border border-success/30'
                              : 'bg-destructive-soft text-destructive border border-destructive/30'
                          }`}
                        >
                          <div
                            className={`w-3 h-3 rounded-full ${
                              candidate.is_active ? 'bg-success' : 'bg-destructive'
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
                <div className="bg-foreground rounded-xl p-5 text-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground/70">Total</p>
                      <p className="text-3xl font-bold mt-1">{applications.length}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-success rounded-xl p-5 text-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-success">Aprovadas</p>
                      <p className="text-3xl font-bold mt-1">{statusCount.approved}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-warning rounded-xl p-5 text-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-warning">Pendentes</p>
                      <p className="text-3xl font-bold mt-1">{statusCount.pending}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                <div className="bg-destructive rounded-xl p-5 text-white shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-destructive">Reprovadas</p>
                      <p className="text-3xl font-bold mt-1">{statusCount.rejected}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <XCircle className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-background">
                  <h3 className="text-lg font-bold text-foreground">Histórico de Inscrições</h3>
                  <p className="text-muted-foreground">Lista completa de processos seletivos inscritos</p>
                </div>

                {applications.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                      <FileCheck className="w-8 h-8 text-muted-foreground/70" />
                    </div>
                    <h4 className="text-foreground font-semibold text-lg mb-2">Nenhuma inscrição encontrada</h4>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Este candidato ainda não se inscreveu em nenhum processo seletivo.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-background">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Processo Seletivo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Data
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Pontuação
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                          {applications.map((application) => {
                            const StatusIcon = getStatusInfo(application.status).icon;
                            return (
                              <tr key={application.id} className="hover:bg-background transition-colors">
                                <td className="px-6 py-4">
                                  <div>
                                    <div className="font-medium text-foreground">
                                      {application.selection_process?.title || 'Processo não encontrado'}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
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

                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                  {formatDateTime(application.application_date)}
                                </td>

                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center justify-center">
                                    <span
                                      className={`inline-flex items-center justify-center w-12 h-12 rounded-xl font-bold shadow-sm ${
                                        application.average_score !== null && application.average_score >= 7
                                          ? 'bg-success/10 text-success border border-success/30'
                                          : application.average_score !== null && application.average_score >= 5
                                          ? 'bg-warning/10 text-warning border border-warning/30'
                                          : application.average_score !== null
                                          ? 'bg-destructive/10 text-destructive border border-destructive/30'
                                          : 'bg-muted-foreground/10 text-foreground/80 border border-border'
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
                                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-all duration-200 text-sm border border-primary/30"
                                    >
                                      <Eye className="w-4 h-4" />
                                      Documentos
                                    </button>

                                    {application.selection_process && (
                                      <button
                                        onClick={() => handleViewProcess(application.selection_process.id)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted-foreground/10 text-foreground/80 rounded-lg hover:bg-muted-foreground/20 transition-all duration-200 text-sm border border-border"
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
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-primary-soft">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Documentos do Candidato</h3>
                      <p className="text-muted-foreground">Documentos enviados para inscrições nos processos seletivos</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Total de Processos</p>
                          <p className="text-2xl font-bold text-foreground">{applications.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
                          <FileCheck className="w-5 h-5 text-primary" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {applications.length > 0
                          ? `Documentos disponíveis em ${applications.length} processo(s)`
                          : 'Nenhum documento enviado'}
                      </p>
                    </div>

                    <div className="p-5 rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">Portfólio Online</p>
                          <p className="text-lg font-bold text-foreground">
                            {applications.some((app) => app.portfolio_link) ? 'Disponível' : 'Não disponível'}
                          </p>
                        </div>
                        <div className="w-10 h-10 rounded-lg bg-success-soft flex items-center justify-center">
                          <ExternalLink className="w-5 h-5 text-success" />
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {applications.find((app) => app.portfolio_link)?.portfolio_link || 'Nenhum link de portfólio'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {applications.length === 0 ? (
                <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <FileText className="w-8 h-8 text-muted-foreground/70" />
                  </div>
                  <h4 className="text-foreground font-semibold text-lg mb-2">Nenhum documento encontrado</h4>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Este candidato ainda não enviou documentos para nenhum processo seletivo.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground px-2">Processos Seletivos com Documentos</h3>

                  {applications.map((application) => (
                    <div key={application.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div>
                            <h4 className="font-bold text-foreground text-lg mb-1">
                              {application.selection_process?.title || 'Processo não encontrado'}
                            </h4>
                            <p className="text-muted-foreground">
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
                              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-all duration-200 shadow-sm"
                            >
                              Ver Documentos
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {application.identity_document && (
                            <div className="p-4 rounded-lg border border-border bg-card">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">Documento de Identidade</p>
                                  <p className="text-xs text-muted-foreground">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.school_records && (
                            <div className="p-4 rounded-lg border border-border bg-card">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-success-soft flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-success" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">Histórico Escolar</p>
                                  <p className="text-xs text-muted-foreground">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.vitae_curriculum && (
                            <div className="p-4 rounded-lg border border-border bg-card">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">Currículo</p>
                                  <p className="text-xs text-muted-foreground">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.frequency_statement && (
                            <div className="p-4 rounded-lg border border-border bg-card">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-warning-soft flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-warning" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">Declaração de Frequência</p>
                                  <p className="text-xs text-muted-foreground">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.course_certificates && (
                            <div className="p-4 rounded-lg border border-border bg-card">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-destructive-soft flex items-center justify-center">
                                  <FileText className="w-5 h-5 text-destructive" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">Certificados de Cursos</p>
                                  <p className="text-xs text-muted-foreground">Enviado</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {application.portfolio_link && (
                            <div className="p-4 rounded-lg border border-border bg-card">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-primary-soft flex items-center justify-center">
                                  <ExternalLink className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-foreground truncate">Portfólio Online</p>
                                  <p className="text-xs text-muted-foreground truncate">{application.portfolio_link}</p>
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
              className="px-6 py-3 bg-muted text-foreground/80 font-medium rounded-lg hover:bg-border transition-all duration-200 border border-input"
            >
              Fechar
            </button>
          </div>
        }
        backdropClass="bg-black/40"
      >
        {selectedApplication && (
          <div className="p-6 space-y-6">
            <div className="bg-primary-soft rounded-xl p-5 border border-primary/30">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-primary font-medium mb-1">Processo Seletivo</p>
                  <p className="font-bold text-foreground">
                    {selectedApplication.selection_process?.title || 'Processo não encontrado'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-primary font-medium mb-1">Data de Inscrição</p>
                  <p className="font-bold text-foreground">{formatDateTime(selectedApplication.application_date)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-foreground text-lg">Documentos Enviados</h3>

              {selectedApplication.identity_document && (
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Documento de Identidade</p>
                      <p className="text-sm text-muted-foreground">Documento oficial com foto</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.identity_document)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.school_records && (
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-success-soft flex items-center justify-center">
                      <FileText className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Histórico Escolar</p>
                      <p className="text-sm text-muted-foreground">Documento acadêmico oficial</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.school_records)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-lg hover:bg-success transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.vitae_curriculum && (
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Currículo</p>
                      <p className="text-sm text-muted-foreground">Currículo profissional</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.vitae_curriculum)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.frequency_statement && (
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-warning-soft flex items-center justify-center">
                      <FileText className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Declaração de Frequência</p>
                      <p className="text-sm text-muted-foreground">Documento de frequência acadêmica</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.frequency_statement)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-warning text-white rounded-lg hover:bg-warning transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.course_certificates && (
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-destructive-soft flex items-center justify-center">
                      <FileText className="w-6 h-6 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Certificados de Cursos</p>
                      <p className="text-sm text-muted-foreground">Certificados de cursos complementares</p>
                    </div>
                  </div>
                  <a
                    href={getDocumentUrl(selectedApplication.course_certificates)}
                    download
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2.5 bg-destructive text-white rounded-lg hover:bg-destructive transition-all duration-200 shadow-sm"
                    rel="noreferrer"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </a>
                </div>
              )}

              {selectedApplication.portfolio_link && (
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary-soft flex items-center justify-center">
                      <ExternalLink className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Portfólio Online</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">{selectedApplication.portfolio_link}</p>
                    </div>
                  </div>
                  {isSafeHttpUrl(selectedApplication.portfolio_link) ? (
                    <a
                      href={selectedApplication.portfolio_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary transition-all duration-200 shadow-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Acessar
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Link indisponível</span>
                  )}
                </div>
              )}

              {selectedApplication.average_score !== null && selectedApplication.average_score !== undefined && (
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Pontuação Média</p>
                      <p className="text-sm text-muted-foreground">Avaliação do candidato neste processo</p>
                    </div>
                    <div
                      className={`text-3xl font-bold bg-gradient-to-r ${
                        selectedApplication.average_score >= 7
                          ? 'from-success to-success'
                          : selectedApplication.average_score >= 5
                          ? 'from-warning to-warning'
                          : 'from-destructive to-destructive'
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
