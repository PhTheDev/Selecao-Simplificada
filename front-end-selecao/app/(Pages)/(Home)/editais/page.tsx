'use client';

import { useSelectionProcesses } from '@/api/hooks/useSelectionProcess';
import { SelectionProcess } from '@/api/types/selection';
import Footer from '@/components/Footer';
import ApplicationWindow from '@/components/processos/ApplicationWindow';
import ProcessMedia from '@/components/processos/ProcessMedia';
import { useI18n } from '@/components/i18n/LanguageProvider';
import Header from '@/components/main-page/Header';
import SplitWords from '@/components/motion/SplitWords';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  ChevronDown,
  Clock,
  Download,
  FileText,
  Filter,
  MapPin,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import {
    formatShortWeekdayDatePtBr,
    getPublicProcessCardStatus,
    INSCRIPTION_OPEN_TIME_LABEL,
} from '@/utils/selectionProcessDates';

type ProcessStatus = 'active' | 'upcoming' | 'finished';

const LoadingSkeleton = () => (
  <div className="space-y-8">
    {[1, 2, 3].map((item) => (
      <div key={item} className="bg-card rounded-2xl shadow-sm overflow-hidden animate-pulse">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-2/5">
            <div className="aspect-video bg-input"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-input rounded w-3/4"></div>
              <div className="h-4 bg-input rounded w-1/2"></div>
            </div>
          </div>
          <div className="lg:w-3/5 p-6">
            <div className="h-6 bg-input rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-input rounded w-1/2 mb-4"></div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-input rounded w-full"></div>
              <div className="h-4 bg-input rounded w-5/6"></div>
            </div>
            <div className="flex gap-4 mt-6">
              <div className="h-10 bg-input rounded-xl flex-1"></div>
              <div className="h-10 bg-input rounded-xl w-32"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const FileIcon = ({ type }: { type: string }) => {
  if (type === 'pdf') return <FileText className="text-destructive" size={20} />;
  if (type === 'doc' || type === 'docx') return <FileText className="text-primary" size={20} />;
  return <FileText className="text-muted-foreground" size={20} />;
};

const getProcessStatus = (process: SelectionProcess): ProcessStatus => {
  return getPublicProcessCardStatus(process);
};

const formatDate = formatShortWeekdayDatePtBr;

const getDefaultImage = (course: string): string => {
  const courseImages: { [key: string]: string } = {
    tecnologia: '/images/hero-carousel/1.png',
    ti: '/images/hero-carousel/1.png',
    rh: '/images/hero-carousel/3.png',
    jurídico: '/images/hero-carousel/2.png',
    direito: '/images/hero-carousel/2.png',
    comunicação: '/images/hero-carousel/4.png',
    administrativo: '/images/hero-carousel/1.png',
  };
  const lowerCourse = (course || '').toLowerCase();
  for (const [key, image] of Object.entries(courseImages)) {
    if (lowerCourse.includes(key)) return image;
  }
  return '/images/hero-carousel/1.png';
};

// Transforma a URL para o domínio público, permitindo que o next/image baixe pelo Nginx
const getAbsoluteUrl = (url?: string | null): string | null => {
    if (!url) return null;
    const baseUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:3000';
    try {
        const urlObj = new URL(url);
        return `${baseUrl}${urlObj.pathname}${urlObj.search}`;
    } catch {
        if (url.startsWith('/')) return `${baseUrl}${url}`;
        return url;
    }
};

const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname.split('/').pop() || 'documento.pdf';
  } catch {
    return 'documento.pdf';
  }
};

const getFileTypeFromName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(extension || '')) return 'doc';
  return 'file';
};

const generateDocuments = (process: SelectionProcess) => {
  const documents: Array<{
    name: string;
    size: string;
    type: string;
    url: string;
    isMain?: boolean;
  }> = [];

  if (process.notice_documents && Array.isArray(process.notice_documents)) {
    process.notice_documents.forEach((doc, index) => {
      const fileName = doc.name || getFileNameFromUrl(doc.file);
      const fileType = getFileTypeFromName(fileName);
      documents.push({
        name: fileName,
        size: '—',
        type: fileType,
        url: doc.file,
        isMain: index === 0,
      });
    });
  } else if (process.notice_doc) {
    const fileName = getFileNameFromUrl(process.notice_doc);
    const fileType = getFileTypeFromName(fileName);
    documents.push({
      name: fileName,
      size: '—',
      type: fileType,
      url: process.notice_doc,
      isMain: true,
    });
  }

  return documents;
};

export default function EditaisProcessosSeletivos() {
  const { t } = useI18n();
  const [selectedStatus, setSelectedStatus] = useState<ProcessStatus | 'all'>('all');
  const [expandedProcess, setExpandedProcess] = useState<number | null>(null);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [failedBannerIds, setFailedBannerIds] = useState<number[]>([]);

  const { data: processesData, isLoading, error } = useSelectionProcesses();

  const statusFilters = [
    { value: 'all', label: 'Todos os Editais' },
    { value: 'active', label: 'Editais Vigentes' },
    { value: 'upcoming', label: 'Em Breve' },
    { value: 'finished', label: 'Editais Finalizados' },
  ];

  const processes =
    processesData?.map((process: SelectionProcess): any => {
      const status = getProcessStatus(process);
      const documents = generateDocuments(process);
      const mainDoc = documents.find((d) => d.isMain) || documents[0];

      return {
        id: process.id,
        title: process.title,
        subtitle: process.subtitle || `Edital para Estágio em ${process.course}`,
        location: process.local || 'Seleção Simplificada - Local a definir',
        date: formatDate(process.beginning_date),
        time: INSCRIPTION_OPEN_TIME_LABEL,
        startDate: process.beginning_date,
        endDate: process.ending_date,
        vacancies: process.number_vacancies,
        status,
        description:
          process.description ||
          `Edital completo para processo seletivo de estágio em ${process.course} na Seleção Simplificada.`,
        course: process.course,
        image: {
          src: getAbsoluteUrl(process.process_banner) || getDefaultImage(process.course),
          alt: `Edital para ${process.title}`,
        },
        requirements: process.requirements
          ? process.requirements.split(';').filter((req) => req.trim())
          : [
              'Cursando ensino superior na área relacionada',
              'Disponibilidade de horário conforme edital',
              'Documentação completa conforme especificado',
            ],
        benefits: process.benefits
          ? process.benefits.split(';').filter((benefit) => benefit.trim())
          : [
              'Bolsa auxílio compatível com o mercado',
              'Vale transporte',
              'Experiência em órgão público',
              'Ambiente de trabalho inclusivo',
            ],
        documents,
        mainDoc,
        notice_doc: process.notice_doc,
      };
    }) || [];

  const filteredProcesses = processes.filter(
    (process: any) => selectedStatus === 'all' || process.status === selectedStatus
  );

  const toggleExpand = (id: number) => {
    setExpandedProcess(expandedProcess === id ? null : id);
  };

  const getStatusText = (status: ProcessStatus) => {
    switch (status) {
      case 'active':
        return 'Edital Vigente';
      case 'upcoming':
        return 'Em Breve';
      case 'finished':
        return 'Edital Finalizado';
      default:
        return '';
    }
  };

  const getStatusPillClass = (status: ProcessStatus) => {
    switch (status) {
      case 'active':
        return 'bg-success-soft text-success border border-success/30';
      case 'upcoming':
        return 'bg-primary-soft text-primary border border-primary/30';
      case 'finished':
        return 'bg-muted text-foreground/80 border border-border';
      default:
        return 'bg-muted text-foreground/80 border border-border';
    }
  };

  const handleDownload = async (documentUrl: string, documentName: string, processId?: number) => {
    if (processId) setDownloading(processId);
    try {
      if (documentUrl && documentUrl.startsWith('http')) {
        const newWindow = window.open(documentUrl, '_blank');
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          const link = document.createElement('a');
          link.href = documentUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.download = documentName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        alert(`Iniciando download do arquivo: ${documentName}`);
      }
    } catch (err) {
      console.error('Erro ao baixar arquivo:', err);
      alert(`Erro ao baixar o arquivo: ${documentName}. Tente novamente mais tarde.`);
    } finally {
      if (processId) setTimeout(() => setDownloading(null), 800);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-20 pt-32 text-center">
          <div className="bg-card rounded-2xl p-8 shadow-sm max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-foreground mb-4">Erro ao carregar editais</h2>
            <p className="text-muted-foreground mb-6">
              Tente recarregar a página ou entre em contato com o suporte.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-medium hover:bg-primary-hover transition-colors w-full sm:w-auto"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="px-5 pb-10 pt-16 text-center md:px-8 md:pb-14 md:pt-24">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-highlight ring-2 ring-primary/30" />
          {t('Documentos oficiais')}
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-[clamp(2.25rem,5.5vw,4.25rem)] font-medium leading-[1]">
          <SplitWords text={t('Editais dos')} /><SplitWords text={t('processos')} className="font-serif font-normal italic" delay={0.15} />
        </h1>
        <motion.p
          className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {t('Baixe os editais completos, anexos e documentos de cada processo seletivo para estágio.')}
        </motion.p>
      </section>

      {/* Filtros - responsivo com dropdown em mobile */}
      <motion.div
        className="sticky top-[4.5rem] z-40 border-b bg-background/85 backdrop-blur"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="hidden md:flex md:items-center gap-3">
              <Filter size={20} className="text-muted-foreground" />
              <span className="font-semibold text-foreground/80">Filtrar por:</span>
            </div>

            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Filter size={20} className="text-muted-foreground" />
                <span className="font-semibold text-foreground/80">Filtrar por:</span>
              </div>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-foreground/80 font-medium"
              >
                {statusFilters.find((f) => f.value === selectedStatus)?.label || 'Todos os Editais'}
                <ChevronDown size={18} className={`transition-transform duration-300 ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <div className="hidden md:flex md:flex-wrap gap-2">
              {statusFilters.map((filter, index) => (
                <motion.button
                  key={filter.value}
                  onClick={() => setSelectedStatus(filter.value as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedStatus === filter.value
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-foreground/80 hover:bg-border'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.08 }}
                >
                  {filter.label}
                </motion.button>
              ))}
            </div>

            <motion.div
              className="hidden md:block text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.95 }}
            >
              {isLoading ? 'Carregando...' : `${filteredProcesses.length} edital(is) encontrado(s)`}
            </motion.div>
          </div>

          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                className="md:hidden mt-4 flex flex-col gap-2"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {statusFilters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedStatus(filter.value as any)}
                    className={`w-full px-4 py-3 rounded-xl text-left font-medium transition-all duration-200 ${
                      selectedStatus === filter.value
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-muted text-foreground/80 hover:bg-border'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="md:hidden mt-4 text-sm text-muted-foreground text-center">
            {isLoading ? 'Carregando...' : `${filteredProcesses.length} edital(is) encontrado(s)`}
          </div>
        </div>
      </motion.div>

      {/* Scrollbar estilizada com ajustes mobile */}
      <style jsx global>{`
        .styled-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(85, 118, 28, 0.55) rgba(232, 231, 224, 0.9);
        }
        .styled-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .styled-scroll::-webkit-scrollbar-track {
          background: rgba(232, 231, 224, 0.9);
          border-radius: 999px;
        }
        .styled-scroll::-webkit-scrollbar-thumb {
          background: rgba(85, 118, 28, 0.55);
          border-radius: 999px;
          border: 2px solid rgba(232, 231, 224, 0.9);
        }
        .styled-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(85, 118, 28, 0.75);
        }
        @media (max-width: 640px) {
          .styled-scroll {
            max-height: 100px !important;
          }
        }
      `}</style>

      {/* Lista de processos */}
      <div className="mx-auto max-w-5xl px-5 py-6 pb-24 md:px-8 md:py-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid gap-6 md:gap-8">
            {filteredProcesses.map((process: any, index: number) => {
              const docsCount = process.documents?.length ?? 0;
              const isExpanded = expandedProcess === process.id;
              const hasDocs = docsCount > 0;
              const isDownloading = downloading === process.id;
              const mainDoc = process.mainDoc;

              return (
                <motion.div
                  key={process.id}
                  className="group/card overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: Math.min(index, 3) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -2 }}
                >
                  <div className="grid gap-6 p-3 lg:grid-cols-5">
                    <div className="flex flex-col lg:col-span-2">
                      <ProcessMedia
                        src={failedBannerIds.includes(process.id) ? getDefaultImage(process.course) : process.image.src}
                        alt={process.image.alt}
                        status={process.status}
                        priority={process.status === 'active' && index < 2}
                        onError={() => setFailedBannerIds((prev) => (prev.includes(process.id) ? prev : [...prev, process.id]))}
                        badge={
                          <>
                            <FileText size={12} strokeWidth={1.5} />
                            {t(docsCount === 1 ? '{n} documento' : '{n} documentos', { n: docsCount })}
                          </>
                        }
                      />
<dl className="mt-3 grid grid-cols-3 gap-2">
                        {[
                          { icon: Users, k: t('Vagas'), v: String(process.vacancies) },
                          { icon: Calendar, k: t('Publicado'), v: process.date.split(',').pop()?.trim() || process.date },
                          { icon: MapPin, k: t('Local'), v: process.location },
                        ].map(({ icon: Icon, k, v }) => (
                          <div key={k} className="min-w-0 rounded-2xl bg-secondary p-3">
                            <dt className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                              <Icon size={13} strokeWidth={1.5} className="shrink-0 text-primary" />
                              <span className="truncate">{k}</span>
                            </dt>
                            <dd className="tabular mt-1 truncate font-medium" title={v}>{v}</dd>
                          </div>
                        ))}
                      </dl>

                    </div>

                    <div className="flex flex-col p-2 lg:col-span-3 lg:p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-primary">{process.course}</p>
                      <h3 className="mt-2 text-2xl font-medium leading-tight">{process.title}</h3>
                      <p className="mt-1 text-muted-foreground">{process.subtitle}</p>

                      

                      <div className="mt-5">
                        <ApplicationWindow start={process.startDate} end={process.endDate} />
                      </div>

                    <p className="mt-5 line-clamp-3 leading-relaxed text-muted-foreground">{process.description}</p>

                      <div className="mt-auto">
                        {/* Botões de ação */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border mt-4">
                          <motion.button
                            className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 md:px-6 rounded-full font-medium text-sm md:text-base text-white transition-all duration-300 ${
                              !hasDocs || isDownloading
                                ? 'bg-muted-foreground cursor-not-allowed'
                                : 'bg-primary'
                            }`}
                            whileHover={hasDocs && !isDownloading ? { scale: 1.02 } : {}}
                            whileTap={hasDocs && !isDownloading ? { scale: 0.98 } : {}}
                            onClick={() => {
                              if (!hasDocs || isDownloading) return;
                              if (mainDoc) handleDownload(mainDoc.url, mainDoc.name, process.id);
                            }}
                            disabled={!hasDocs || isDownloading}
                          >
                            {isDownloading ? (
                              <>
                                <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Baixando...</span>
                              </>
                            ) : (
                              <>
                                <Download size={18} />
                                <span className="truncate">
                                  {hasDocs ? 'Baixar Edital Principal' : 'Edital Indisponível'}
                                </span>
                              </>
                            )}
                          </motion.button>
                          <motion.button
                            onClick={() => toggleExpand(process.id)}
                            className={`flex items-center justify-center gap-2 px-4 md:px-6 py-3 border rounded-full font-medium text-sm md:text-base transition-colors ${
                              hasDocs
                                ? 'text-primary border-primary hover:bg-primary hover:text-primary-foreground'
                                : 'text-muted-foreground/70 border-input cursor-not-allowed'
                            }`}
                            whileHover={hasDocs ? { scale: 1.02 } : {}}
                            whileTap={hasDocs ? { scale: 0.98 } : {}}
                            disabled={!hasDocs}
                          >
                            <span>{isExpanded ? 'Menos detalhes' : 'Ver documentos'}</span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ChevronDown size={18} />
                            </motion.div>
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expandido: lista de documentos com layout responsivo */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        className="bg-background border-t border-border overflow-hidden"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-5 md:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {/* Documentos do Edital */}
                            <div>
                              <h4 className="font-bold text-foreground mb-4 text-lg flex items-center gap-2">
                                <FileText size={20} className="text-primary" />
                                Documentos do Edital
                              </h4>
                              {process.documents.length > 0 ? (
                                <div className="space-y-3">
                                  {process.documents.map((doc: any, idx: number) => (
                                    <motion.div
                                      key={idx}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-card rounded-lg border border-border hover:border-primary transition-colors gap-3"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    >
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <FileIcon type={doc.type} />
                                        <div className="min-w-0 flex-1">
                                          <div className="font-medium text-foreground break-words">
                                            {doc.name}
                                          </div>
                                          <div className="text-sm text-muted-foreground">
                                            {doc.size || '—'}
                                          </div>
                                        </div>
                                      </div>
                                      <motion.button
                                        type="button"
                                        onClick={() => handleDownload(doc.url, doc.name, process.id)}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold text-sm w-full sm:w-auto ${
                                          downloading === process.id
                                            ? 'bg-input text-muted-foreground cursor-not-allowed'
                                            : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                                        }`}
                                        whileHover={downloading !== process.id ? { scale: 1.05 } : {}}
                                        whileTap={downloading !== process.id ? { scale: 0.95 } : {}}
                                        disabled={downloading === process.id}
                                      >
                                        <Download size={16} />
                                        Baixar
                                      </motion.button>
                                    </motion.div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-muted-foreground italic">Nenhum documento disponível.</p>
                              )}
                            </div>

                            {/* Informações do Processo */}
                            <div>
                              <h4 className="font-bold text-foreground mb-4 text-lg">
                                Informações do Processo
                              </h4>
                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-semibold text-foreground mb-2">
                                    Requisitos Principais
                                  </h5>
                                  <ul className="space-y-2">
                                    {process.requirements.slice(0, 5).map((req: string, idx: number) => (
                                      <motion.li
                                        key={idx}
                                        className="flex items-start gap-2 text-foreground/80 text-sm"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                                      >
                                        <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                                        <span>{req}</span>
                                      </motion.li>
                                    ))}
                                  </ul>
                                </div>
                                <motion.div
                                  className="bg-card rounded-xl p-4 border border-border"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                  <h5 className="font-semibold text-foreground mb-3">
                                    Período do Processo
                                  </h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                      <span className="text-muted-foreground">Publicação do edital:</span>
                                      <span className="font-medium text-foreground">
                                        {new Date(process.startDate).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                      <span className="text-muted-foreground">Data limite:</span>
                                      <span className="font-medium text-foreground">
                                        {new Date(process.endDate).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                                <div>
                                  <h5 className="font-semibold text-foreground mb-2">Benefícios</h5>
                                  <ul className="space-y-2">
                                    {process.benefits.slice(0, 5).map((b: string, idx: number) => (
                                      <motion.li
                                        key={idx}
                                        className="flex items-start gap-2 text-foreground/80 text-sm"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.05 + 0.1 }}
                                      >
                                        <div className="w-1.5 h-1.5 bg-primary-hover rounded-full mt-2 flex-shrink-0"></div>
                                        <span>{b}</span>
                                      </motion.li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* CTA final */}
                          <motion.div
                            className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-border"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.35 }}
                          >
                            <motion.a
                              className="px-6 py-3 border border-input text-foreground/80 rounded-full font-medium hover:bg-muted transition-all duration-300 text-center sm:text-left"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              href="/faq"
                            >
                              Tirar Dúvidas sobre o Edital
                            </motion.a>
                          </motion.div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        <AnimatePresence>
          {!isLoading && filteredProcesses.length === 0 && (
            <motion.div
              className="text-center py-12 md:py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-muted-foreground/70 mb-4">
                <FileText size={48} className="mx-auto md:w-16 md:h-16" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-muted-foreground mb-2">
                Nenhum edital encontrado
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto px-4">
                Não há editais disponíveis para o filtro selecionado no momento.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}