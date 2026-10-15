'use client';

import { useCandidateAuth } from '@/api/hooks/useCandidateAuth';
import { useSelectionProcesses } from '@/api/hooks/useSelectionProcess';
import { SelectionProcess } from '@/api/types/selection';
import Footer from '@/components/Footer';
import ProcessosHeader from '@/components/processos-seletivos/ProcessosHeader';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronDown, Clock, Filter, MapPin, Users } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import {
    formatShortWeekdayDatePtBr,
    getPublicProcessCardStatus,
    INSCRIPTION_CLOSE_TIME_LABEL,
    INSCRIPTION_OPEN_TIME_LABEL,
} from '@/utils/selectionProcessDates';

type ProcessStatus = 'active' | 'upcoming' | 'finished';

// ✅ Componente de Loading
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

// Determina o status do processo (inscrições: 00:00 do 1º dia até 23:59 do último)
const getProcessStatus = (process: SelectionProcess): ProcessStatus => {
  return getPublicProcessCardStatus(process);
};

const formatDate = formatShortWeekdayDatePtBr;

// Imagem padrão baseada no curso
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

  const lowerCourse = course.toLowerCase();
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

// Mapeamento de turno
const boutLabelMap: Record<string, string> = {
  M: 'Matutino',
  T: 'Vespertino',
  E: 'Escala',
};

export default function ProcessosSeletivos() {
  const [selectedStatus, setSelectedStatus] = useState<ProcessStatus | 'all'>('all');
  const [expandedProcess, setExpandedProcess] = useState<number | null>(null);
  const [failedBannerIds, setFailedBannerIds] = useState<number[]>([]);
  const { isAuthenticated, isLoading: authLoading } = useCandidateAuth();
  const { data: processesData, isLoading: processesLoading, error } = useSelectionProcesses();

  const handleCandidatarClick = (process: any) => {
    if (process.status !== 'active') return;
    if (authLoading) return;

    if (isAuthenticated) {
      window.location.href = `/aplicar/${process.slug}`;
    } else {
      window.location.href = '/auth/login-candidato';
    }
  };

  const statusFilters = [
    { value: 'all', label: 'Todos os Processos', color: 'bg-gray-500' },
    { value: 'active', label: 'Inscrições Abertas', color: 'bg-green-500' },
    { value: 'upcoming', label: 'Em Breve', color: 'bg-blue-500' },
    { value: 'finished', label: 'Finalizados', color: 'bg-gray-400' },
  ];

  // Mapeamento dos processos com campos formatados
  const processes =
    processesData?.map((process): any => {
      const status = getProcessStatus(process);
      const bout = (process as any).bout;
      const boutLabel = bout ? boutLabelMap[bout] ?? bout : 'Não informado';

      return {
        id: process.id,
        title: process.title,
        subtitle: process.subtitle || `Processo Seletivo para ${process.course}`,
        location: process.local || 'Seleção Simplificada - Local a definir',
        vacancies: process.number_vacancies,
        status,
        slug: process.slug,
        description: process.description || 'Processo seletivo para estágio na Seleção Simplificada.',
        image: {
          src: getAbsoluteUrl(process.process_banner) || getDefaultImage(process.course),
          alt: `Processo Seletivo para ${process.title}`,
        },
        bout,
        boutLabel,
        // Datas brutas (usadas nos detalhes)
        startDate: process.beginning_date,
        endDate: process.ending_date,
        // Datas formatadas para exibição no card
        startDateFormatted: formatDate(process.beginning_date),
        startTimeFormatted: INSCRIPTION_OPEN_TIME_LABEL,
        endDateFormatted: formatDate(process.ending_date),
        endTimeFormatted: INSCRIPTION_CLOSE_TIME_LABEL,
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
      };
    }) || [];

  const filteredProcesses = processes.filter(
    (process) => selectedStatus === 'all' || process.status === selectedStatus
  );

  const toggleExpand = (id: number) => setExpandedProcess(expandedProcess === id ? null : id);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <ProcessosHeader />
        <div className="container mx-auto px-4 py-20 pt-32 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Erro ao carregar processos seletivos</h2>
            <p className="text-gray-600 mb-6">Tente recarregar a página ou entre em contato com o suporte.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#005f73] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#0a9396] transition-colors"
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

      {/* Hero */}
      <motion.div
        className="bg-gradient-to-br from-[#005f73] to-[#0a9396] text-white py-20 pt-32"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center">
            <motion.h1
              className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black text-[#e9d8a6] mb-6 leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Processos Seletivos
            </motion.h1>
            <motion.p
              className="text-xl text-white/80 max-w-2xl mx-auto leading-relaxed"
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              Confira todos os processos seletivos para estágio na Seleção Simplificada, incluindo oportunidades ativas, futuras e já
              finalizadas.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        className="bg-white border-b border-gray-200 sticky top-20 z-40"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <Filter size={20} className="text-gray-600" />
              <span className="font-semibold text-gray-700">Filtrar por:</span>
            </div>

            <div className="flex flex-wrap gap-2">
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
                  transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                >
                  {filter.label}
                </motion.button>
              ))}
            </div>

            <motion.div
              className="text-sm text-gray-600"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              {processesLoading ? 'Carregando...' : `${filteredProcesses.length} processo(s) encontrado(s)`}
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Estilos globais para a scrollbar */}
      <style jsx global>{`
        /* Firefox */
        .styled-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(10, 147, 150, 0.55) rgba(226, 232, 240, 0.8);
        }
        /* Chrome/Edge/Safari */
        .styled-scroll::-webkit-scrollbar {
          width: 10px;
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
      `}</style>

      {/* Lista de Processos */}
      <div className="container mx-auto px-4 py-8">
        {processesLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="grid gap-8">
            {filteredProcesses.map((process, index) => (
              <motion.div
                key={process.id}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                id={
                  process.status === 'active'
                    ? 'processos-ativos'
                    : process.status === 'upcoming'
                      ? 'processos-futuros'
                      : undefined
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
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
                        priority={process.status === 'active'}
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        onError={() =>
                          setFailedBannerIds((prev) =>
                            prev.includes(process.id) ? prev : [...prev, process.id]
                          )
                        }
                      />
                      <div className="absolute inset-0 bg-black/10"></div>
                    </motion.div>

                    <div className="p-4 flex flex-col items-center gap-5 mt-4">
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          <Users size={12} />
                          {process.vacancies} vaga{process.vacancies > 1 ? 's' : ''}
                        </span>

                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock size={12} />
                          {process.boutLabel}
                        </span>

                        {process.status === 'active' && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            Inscrições abertas
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="lg:w-3/5 p-6">
                    <div className="flex flex-col h-full">
                      <div className="flex-1">
                        <div className="flex flex-col gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-black text-gray-900">{process.title}</h3>
                            </div>

                            <p className="text-gray-600 font-medium mb-4">{process.subtitle}</p>

                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                              <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-[#005f73]" />
                                <span>{process.location}</span>
                              </div>

                              {/* ✅ Período completo de inscrições */}
                              <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-[#005f73]" />
                                <span>
                                  {process.startDateFormatted} {process.startTimeFormatted} —{' '}
                                  {process.endDateFormatted} {process.endTimeFormatted}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Clock size={16} className="text-[#005f73]" />
                                <span>Turno: {process.boutLabel}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <Users size={16} className="text-[#005f73]" />
                                <span>{process.vacancies} vaga(s)</span>
                              </div>
                            </div>

                            {/* ✅ Descrição com scroll estilizado – SEM o fade */}
                            <div className="styled-scroll max-h-[132px] overflow-y-auto pr-3 rounded-xl border border-gray-100 bg-gray-50/40 p-4">
                              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                                {process.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ações */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                        <motion.button
                          className={`flex-1 py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 ${
                            process.status === 'active'
                              ? 'bg-gradient-to-r from-[#005f73] to-[#0a9396] hover:from-[#0a9396] hover:to-[#005f73]'
                              : 'bg-gray-400 cursor-not-allowed'
                          }`}
                          disabled={process.status !== 'active' || authLoading}
                          onClick={() => handleCandidatarClick(process)}
                          whileHover={process.status === 'active' && !authLoading ? { scale: 1.02 } : {}}
                          whileTap={process.status === 'active' && !authLoading ? { scale: 0.98 } : {}}
                        >
                          {authLoading ? (
                            <span className="flex items-center justify-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Verificando...
                            </span>
                          ) : process.status === 'active' ? (
                            'Realizar Inscrição'
                          ) : process.status === 'upcoming' ? (
                            'Inscrições em Breve'
                          ) : (
                            'Processo Finalizado'
                          )}
                        </motion.button>

                        <motion.button
                          onClick={() => toggleExpand(process.id)}
                          className="flex items-center justify-center gap-2 text-[#005f73] hover:text-[#0a9396] transition-colors px-6 py-3 border-2 border-[#005f73] rounded-xl font-bold hover:bg-[#005f73]"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {expandedProcess === process.id ? 'Menos detalhes' : 'Mais detalhes'}
                          <motion.div
                            animate={{ rotate: expandedProcess === process.id ? 180 : 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <ChevronDown size={20} />
                          </motion.div>
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes expandidos */}
                <AnimatePresence>
                  {expandedProcess === process.id && (
                    <motion.div
                      className="bg-gray-50 border-t border-gray-100 overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="p-6">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-bold text-gray-900 mb-4 text-lg">Requisitos</h4>
                            <ul className="space-y-3">
                              {process.requirements.map((req: string, idx: number) => (
                                <motion.li
                                  key={idx}
                                  className="flex items-start gap-3 text-gray-700"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                                >
                                  <div className="w-2 h-2 bg-[#005f73] rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{req}</span>
                                </motion.li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-bold text-gray-900 mb-4 text-lg">Benefícios</h4>
                            <ul className="space-y-3 mb-6">
                              {process.benefits.map((benefit: string, idx: number) => (
                                <motion.li
                                  key={idx}
                                  className="flex items-start gap-3 text-gray-700"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ duration: 0.3, delay: idx * 0.05 + 0.1 }}
                                >
                                  <div className="w-2 h-2 bg-[#0a9396] rounded-full mt-2 flex-shrink-0"></div>
                                  <span>{benefit}</span>
                                </motion.li>
                              ))}
                            </ul>

                            <motion.div
                              className="bg-white rounded-xl p-4 border border-gray-200"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: 0.3 }}
                            >
                              <h5 className="font-semibold text-gray-900 mb-3">Período do Processo</h5>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Início das inscrições:</span>
                                  <span className="font-medium">
                                    {new Date(process.startDate).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Término das inscrições:</span>
                                  <span className="font-medium">
                                    {new Date(process.endDate).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Turno:</span>
                                  <span className="font-medium">{process.boutLabel}</span>
                                </div>
                              </div>
                            </motion.div>
                          </div>
                        </div>

                        <motion.div
                          className="flex flex-col sm:flex-row gap-3 mt-6 pt-6 border-t border-gray-200"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.4 }}
                        >
                          <motion.a
                            className="px-6 py-3 border-2 border-[#005f73] text-[#005f73] rounded-xl font-bold hover:bg-[#005f73] hover:text-white transition-all duration-300"
                            href="/editais"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Olhar Edital
                          </motion.a>

                          <motion.a
                            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300"
                            href="/faq"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            Tirar Dúvidas
                          </motion.a>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}

        {/* Nenhum processo encontrado */}
        <AnimatePresence>
          {!processesLoading && filteredProcesses.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-gray-400 mb-4">
                <Users size={64} className="mx-auto" />
              </div>
              <h3 className="text-2xl font-bold text-gray-600 mb-2">Nenhum processo encontrado</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Não há processos seletivos disponíveis para o filtro selecionado no momento.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Footer />
    </div>
  );
}