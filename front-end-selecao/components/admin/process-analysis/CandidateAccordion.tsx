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
        return 'bg-warning-soft text-warning border-warning/30';
      case 'approved':
        return 'bg-success-soft text-success border-success/30';
      case 'rejected':
        return 'bg-destructive-soft text-destructive border-destructive/30';
      default:
        return 'bg-muted text-foreground border-border';
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
        className: 'bg-success-soft text-success border-success/30',
        Icon: FileText,
        title: 'A avaliação da etapa 1 já foi registrada.',
      });
    }

    if (stage2Done) {
      items.push({
        key: 's2',
        label: 'Etapa 2 avaliada',
        className: 'bg-primary-soft text-primary border-primary/30',
        Icon: Users,
        title: 'A avaliação da etapa 2 já foi registrada.',
      });
    }

    if (!stage1Done && !stage2Done) {
      items.push({
        key: 'none',
        label: 'Sem avaliação',
        className: 'bg-background text-foreground/80 border-border',
        Icon: Clock,
        title: 'Nenhuma etapa foi avaliada ainda.',
      });
    }

    if (inconsistent) {
      items.push({
        key: 'warn',
        label: 'Inconsistente',
        className: 'bg-warning-soft text-warning border-warning/30',
        Icon: AlertTriangle,
        title: 'Etapa 2 existe sem Etapa 1 (verifique dados no backend).',
      });
    }

    return items;
  }, [stage1Done, stage2Done, inconsistent]);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 text-left hover:bg-background transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              {application.candidate.name.charAt(0)}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-foreground">{application.candidate.name}</h3>

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

              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
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
              <div className="flex items-center gap-1 bg-primary-soft px-3 py-1.5 rounded-lg">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-primary font-bold">{finalGlobalScore}</span>
              </div>
            )}

            <ChevronDown
              className={`w-5 h-5 transition-all ${
                isExpanded
                  ? 'rotate-180 text-primary scale-110'
                  : 'text-muted-foreground group-hover:text-primary'
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
