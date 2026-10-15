'use client';

import {
    AlertTriangle,
    Calendar,
    CheckCircle,
    ChevronDown,
    Clock,
    FileText,
    Mail,
    Phone,
    Star,
    Users,
    XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import EvaluationForm from './EvaluationForm';
import { Application, ProcessConfig } from './types';

interface CandidateAccordionProps {
  application: Application;
  onUpdate: (application: Application) => void;
  processId: number;
  currentStage: 'stage1_documents' | 'stage2_interview' | 'analysis_completed';
  processConfig?: ProcessConfig;
}

export default function CandidateAccordion({
  application,
  onUpdate,
  processId,
  currentStage,
  processConfig,
}: CandidateAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock;
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      default:
        return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const StatusIcon = getStatusIcon(application.status);
  const finalGlobalScore =
    application.average_score !== null && application.average_score !== undefined
      ? Number(application.average_score).toFixed(2)
      : null;

  // ✅ flags das etapas
  const stage1Done = !!application.stage1_evaluation;
  const stage2Done = !!application.stage2_evaluation;

  // (opcional) regra de consistência:
  // etapa 2 não deveria existir sem etapa 1
  const inconsistent = stage2Done && !stage1Done;

  // ✅ badges visuais das etapas
  const stageBadges = useMemo(() => {
    const items: Array<{
      key: string;
      label: string;
      className: string;
      Icon: any;
      title?: string;
    }> = [];

    if (stage1Done) {
      items.push({
        key: 's1',
        label: 'Etapa 1 avaliada',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        Icon: FileText,
        title: 'A avaliação da etapa 1 já foi registrada.',
      });
    }

    if (stage2Done) {
      items.push({
        key: 's2',
        label: 'Etapa 2 avaliada',
        className: 'bg-purple-50 text-purple-700 border-purple-200',
        Icon: Users,
        title: 'A avaliação da etapa 2 já foi registrada.',
      });
    }

    if (!stage1Done && !stage2Done) {
      items.push({
        key: 'none',
        label: 'Sem avaliação',
        className: 'bg-gray-50 text-gray-700 border-gray-200',
        Icon: Clock,
        title: 'Nenhuma etapa foi avaliada ainda.',
      });
    }

    if (inconsistent) {
      items.push({
        key: 'warn',
        label: 'Inconsistente',
        className: 'bg-amber-50 text-amber-800 border-amber-200',
        Icon: AlertTriangle,
        title: 'Etapa 2 existe sem Etapa 1 (verifique dados no backend).',
      });
    }

    return items;
  }, [stage1Done, stage2Done, inconsistent]);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
              {application.candidate.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-gray-900">{application.candidate.name}</h3>

                {/* ✅ Badges das etapas */}
                <div className="flex items-center gap-2 flex-wrap">
                  {stageBadges.map((b) => (
                    <span
                      key={b.key}
                      title={b.title}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${b.className}`}
                    >
                      <b.Icon className="w-3.5 h-3.5" />
                      {b.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {application.candidate.email}
                </span>

                {application.candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {application.candidate.phone}
                  </span>
                )}

                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(application.application_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {finalGlobalScore !== null && (
              <div className="flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg">
                <Star className="w-4 h-4 text-blue-600" />
                <span className="text-blue-700 font-bold">{finalGlobalScore}</span>
              </div>
            )}

            <ChevronDown
              className={`w-5 h-5 transition-all ${
                isExpanded
                  ? 'rotate-180 text-blue-600 scale-110'
                  : 'text-gray-500 group-hover:text-blue-500'
              }`}
            />
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <EvaluationForm
            application={application}
            onUpdate={onUpdate}
            processId={processId}
            currentStage={currentStage}
            processConfig={processConfig}
          />
        </div>
      )}
    </div>
  );
}
