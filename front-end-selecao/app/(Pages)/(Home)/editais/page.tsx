'use client';

import { useSelectionProcesses } from '@/api/hooks/useSelectionProcess';
import { SelectionProcess } from '@/api/types/selection';
import Footer from '@/components/Footer';
import ProcessosHeader from '@/components/processos-seletivos/ProcessosHeader';
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
      <div key={item} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-2/5">
            <div className="aspect-video bg-gray-300"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>
          </div>
          <div className="lg:w-3/5 p-6">
            <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="space-y-2 mb-4">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
            <div className="flex gap-4 mt-6">
              <div className="h-10 bg-gray-300 rounded-xl flex-1"></div>
              <div className="h-10 bg-gray-300 rounded-xl w-32"></div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const FileIcon = ({ type }: { type: string }) => {
  if (type === 'pdf') return <FileText className="text-red-500" size={20} />;
  if (type === 'doc' || type === 'docx') return <FileText className="text-blue-500" size={20} />;
  return <FileText className="text-gray-500" size={20} />;
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
        return 'bg-green-50 text-green-700 border border-green-200';
      case 'upcoming':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'finished':
        return 'bg-gray-100 text-gray-700 border border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
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
      <div className="min-h-screen bg-gray-50">
        <ProcessosHeader />
        <div className="container mx-auto px-4 py-20 pt-32 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar editais</h2>
            <p className="text-gray-600 mb-6">
              Tente recarregar a página ou entre em contato com o suporte.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#005f73] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0a9396] transition-colors w-full sm:w-auto"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ProcessosHeader />

      {/* Hero - responsivo */}
      <motion.div
        className="bg-gradient-to-br from-[#005f73] to-[#0a9396] text-white py-12 md:py-16 lg:py-20 pt-24 md:pt-28 lg:pt-32"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl font-black text-[#e9d8a6] mb-4 md:mb-6 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Editais dos Processos Seletivos
            </motion.h1>
            <motion.p
              className="text-base sm:text-lg md:text-xl text-white/80 leading-relaxed px-2"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Acesse todos os editais completos dos processos seletivos para estágio na Seleção Simplificada.
              Download de documentos, anexos e informações detalhadas.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Filtros - responsivo com dropdown em mobile */}
      <motion.div
        className="bg-white border-b border-gray-200 sticky top-20 z-40"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="hidden md:flex md:items-center gap-3">
              <Filter size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-700">Filtrar por:</span>
            </div>

            <div className="flex md:hidden items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Filter size={20} className="text-gray-600" />
                <span className="font-semibold text-gray-700">Filtrar por:</span>
              </div>
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-gray-700 font-medium"
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
                      ? 'bg-[#005f73] text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              className="hidden md:block text-sm text-gray-600"
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
                        ? 'bg-[#005f73] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="md:hidden mt-4 text-sm text-gray-600 text-center">
            {isLoading ? 'Carregando...' : `${filteredProcesses.length} edital(is) encontrado(s)`}
          </div>
        </div>
      </motion.div>

      {/* Scrollbar estilizada com ajustes mobile */}
      <style jsx global>{`
        .styled-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(10, 147, 150, 0.55) rgba(226, 232, 240, 0.8);
        }
        .styled-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .styled-scroll::-webkit-scrollbar-track {
          background: rgba(226, 232, 240, 0.8);
          border-radius: 999px;
        }
        .styled-scroll::-webkit-scrollbar-thumb {
          background: rgba(10, 147, 150, 0.55);
          border-radius: 999px;
          border: 2px solid rgba(226, 232, 240, 0.8);
        }
        .styled-scroll::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 95, 115, 0.75);
        }
        @media (max-width: 640px) {
          .styled-scroll {
            max-height: 100px !important;
          }
        }
      `}</style>

      {/* Lista de processos */}
      <div className="container mx-auto px-4 py-6 md:py-8">
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
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ y: -2 }}
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Imagem */}
                    <div className="lg:w-2/5">
                      <motion.div
                        className="relative aspect-video overflow-hidden"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Image
                          src={failedBannerIds.includes(process.id) ? getDefaultImage(process.course) : process.image.src}
                          alt={process.image.alt}
                          fill
                          className="object-cover"
                          priority={process.status === 'active' && index < 2}
                          sizes="(max-width: 1024px) 100vw, 40vw"
                          onError={() =>
                            setFailedBannerIds((prev) =>
                              prev.includes(process.id) ? prev : [...prev, process.id]
                            )
                          }
                        />
                        <div className="absolute inset-0 bg-black/10"></div>
                      </motion.div>

                      {/* Badges */}
                      <div className="p-4 flex flex-col items-center gap-4 mt-2">
                        <div className="flex flex-wrap gap-2 justify-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusPillClass(
                              process.status
                            )}`}
                          >
                            <Clock size={12} />
                            {getStatusText(process.status)}
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                            <Users size={12} />
                            {process.vacancies} vaga{process.vacancies > 1 ? 's' : ''}
                          </span>
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            <FileText size={12} />
                            {docsCount} documento{docsCount > 1 ? 's' : ''}
                          </span>
                          {process.status === 'active' && (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              Edital vigente
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <div className="lg:w-3/5 p-5 md:p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <div className="flex flex-col gap-3 mb-4">
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="text-xl md:text-2xl font-black text-gray-900">
                                  {process.title}
                                </h3>
                              </div>
                              <p className="text-gray-600 font-medium text-sm md:text-base mb-3">
                                {process.subtitle}
                              </p>
                              <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                  <MapPin size={14} className="text-[#005f73]" />
                                  <span className="truncate max-w-[150px] sm:max-w-none">
                                    {process.location}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar size={14} className="text-[#005f73]" />
                                  <span>
                                    {process.date} - {process.time}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users size={14} className="text-[#005f73]" />
                                  <span>{process.vacancies} vaga(s)</span>
                                </div>
                              </div>
                              <div className="relative">
                                <div className="styled-scroll max-h-[100px] md:max-h-[132px] overflow-y-auto pr-2 rounded-xl border border-gray-100 bg-gray-50/40 p-3 md:p-4">
                                  <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm md:text-base">
                                    {process.description}
                                  </p>
                                </div>
                                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 md:h-8 bg-gradient-to-t from-white via-white/70 to-transparent"></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 mt-4">
                          <motion.button
                            className={`flex items-center justify-center gap-2 flex-1 py-3 px-4 md:px-6 rounded-xl font-bold text-sm md:text-base text-white transition-all duration-300 ${
                              !hasDocs || isDownloading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-[#005f73] to-[#0a9396] hover:from-[#0a9396] hover:to-[#005f73]'
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
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
                            className={`flex items-center justify-center gap-2 px-4 md:px-6 py-3 border-2 rounded-xl font-bold text-sm md:text-base transition-colors ${
                              hasDocs
                                ? 'text-[#005f73] border-[#005f73] hover:bg-[#005f73] hover:text-white'
                                : 'text-gray-400 border-gray-300 cursor-not-allowed'
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
                        className="bg-gray-50 border-t border-gray-100 overflow-hidden"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-5 md:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                            {/* Documentos do Edital */}
                            <div>
                              <h4 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                                <FileText size={20} className="text-[#005f73]" />
                                Documentos do Edital
                              </h4>
                              {process.documents.length > 0 ? (
                                <div className="space-y-3">
                                  {process.documents.map((doc: any, idx: number) => (
                                    <motion.div
                                      key={idx}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-[#005f73] transition-colors gap-3"
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                                    >
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <FileIcon type={doc.type} />
                                        <div className="min-w-0 flex-1">
                                          <div className="font-medium text-gray-900 break-words">
                                            {doc.name}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            {doc.size || '—'}
                                          </div>
                                        </div>
                                      </div>
                                      <motion.button
                                        type="button"
                                        onClick={() => handleDownload(doc.url, doc.name, process.id)}
                                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold text-sm w-full sm:w-auto ${
                                          downloading === process.id
                                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                            : 'bg-[#005f73] text-white hover:bg-[#0a9396]'
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
                                <p className="text-gray-500 italic">Nenhum documento disponível.</p>
                              )}
                            </div>

                            {/* Informações do Processo */}
                            <div>
                              <h4 className="font-bold text-gray-900 mb-4 text-lg">
                                Informações do Processo
                              </h4>
                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-2">
                                    Requisitos Principais
                                  </h5>
                                  <ul className="space-y-2">
                                    {process.requirements.slice(0, 5).map((req: string, idx: number) => (
                                      <motion.li
                                        key={idx}
                                        className="flex items-start gap-2 text-gray-700 text-sm"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.05 }}
                                      >
                                        <div className="w-1.5 h-1.5 bg-[#005f73] rounded-full mt-2 flex-shrink-0"></div>
                                        <span>{req}</span>
                                      </motion.li>
                                    ))}
                                  </ul>
                                </div>
                                <motion.div
                                  className="bg-white rounded-xl p-4 border border-gray-200"
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                  <h5 className="font-semibold text-gray-900 mb-3">
                                    Período do Processo
                                  </h5>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                      <span className="text-gray-600">Publicação do edital:</span>
                                      <span className="font-medium text-gray-900">
                                        {new Date(process.startDate).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                      <span className="text-gray-600">Data limite:</span>
                                      <span className="font-medium text-gray-900">
                                        {new Date(process.endDate).toLocaleDateString('pt-BR')}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-2">Benefícios</h5>
                                  <ul className="space-y-2">
                                    {process.benefits.slice(0, 5).map((b: string, idx: number) => (
                                      <motion.li
                                        key={idx}
                                        className="flex items-start gap-2 text-gray-700 text-sm"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.3, delay: idx * 0.05 + 0.1 }}
                                      >
                                        <div className="w-1.5 h-1.5 bg-[#0a9396] rounded-full mt-2 flex-shrink-0"></div>
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
                            className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.35 }}
                          >
                            <motion.a
                              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 text-center sm:text-left"
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
              <div className="text-gray-400 mb-4">
                <FileText size={48} className="mx-auto md:w-16 md:h-16" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-600 mb-2">
                Nenhum edital encontrado
              </h3>
              <p className="text-gray-500 max-w-md mx-auto px-4">
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