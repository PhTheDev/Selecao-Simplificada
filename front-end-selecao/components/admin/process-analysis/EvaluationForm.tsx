'use client';

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from '@headlessui/react';
import { CheckCircle, FileText, Lock, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import Stage1EvaluationComponent from './Stage1Evaluation';
import Stage2EvaluationComponent from './Stage2Evaluation';
import { Application, Stage1Evaluation, Stage1SaveOptions, Stage2Evaluation } from './types';

// ✅ Interface completa com todos os campos do processo
interface ProcessConfig {
  has_interview?: boolean;
  has_essay?: boolean;
  include_curriculum_in_score?: boolean;
  include_portfolio_in_score?: boolean;
  include_certificates_in_score?: boolean;
  weight_curriculum?: number;
  weight_school_records?: number;
  weight_certificates?: number;
  weight_portfolio?: number;
  weight_interview?: number;
  weight_essay?: number;
}

interface EvaluationFormProps {
  application: Application;
  onUpdate: (application: Application) => void;
  processId: number;
  currentStage: 'stage1_documents' | 'stage2_interview' | 'analysis_completed';
  processConfig?: ProcessConfig;
}

function getAccessToken() {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith('admin-access-token='))
    ?.split('=')[1];
}

export default function EvaluationForm({
  application,
  onUpdate,
  processId,
  currentStage,
  processConfig,
}: EvaluationFormProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ trava etapa 1 assim que o processo não estiver mais em stage1_documents
  const stage1Locked = currentStage !== 'stage1_documents';

  // ✅ etapa 2 só liberada quando o processo está em stage2_interview ou analysis_completed
  const stage2Locked =
    processConfig?.has_interview === false ||
    (currentStage !== 'stage2_interview' && currentStage !== 'analysis_completed');

  const tabs = useMemo(
    () => [
      {
        name: 'Etapa 1 - Documentos',
        icon: FileText,
        description: stage1Locked
          ? 'Etapa 1 bloqueada após avanço para etapa 2'
          : 'Validação de documentos e atribuição de notas',
        disabled: false,
        locked: stage1Locked,
      },
      {
        name: `Etapa 2 - ${
          processConfig?.has_essay !== false ? 'Entrevista & Redação' : 'Entrevista'
        }`,
        icon: Users,
        description:
          processConfig?.has_interview === false
            ? 'Etapa 2 não configurada para este processo'
            : currentStage === 'stage2_interview' || currentStage === 'analysis_completed'
              ? processConfig?.has_essay !== false
                ? 'Avaliação de entrevista e redação'
                : 'Avaliação de entrevista'
              : 'Aguarde a liberação da etapa 2 pelo administrador',
        disabled: stage2Locked,
        locked: stage2Locked,
      },
    ],
    [stage1Locked, stage2Locked, processConfig?.has_essay, processConfig?.has_interview, currentStage]
  );

  // ✅ agora suporta "silent" (sem toast)
  const handleStage1Submit = async (data: Partial<Stage1Evaluation>, options?: Stage1SaveOptions) => {
    if (stage1Locked) {
      toast.error('Etapa 1 está bloqueada após o avanço para a etapa 2.');
      return;
    }

    const silent = options?.silent ?? false;
    const mode = options?.mode ?? 'complete';

    setIsSubmitting(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error('Token de acesso não encontrado');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/${application.id}/stage1_evaluation/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
          },
          body: JSON.stringify({ application: application.id, ...data }),
        }
      );

      if (response.ok) {
        const updatedApplication = await response.json();
        onUpdate(updatedApplication);

        if (!silent) {
          const candidateName = application.candidate?.name || 'Candidato';
          const totalScore = Number(
            updatedApplication.stage1_evaluation?.total_score ?? data.total_score ?? 0
          ).toFixed(2);

          if (mode === 'draft_scores') {
            toast.success('Rascunho salvo', {
              description: `${candidateName} — alterações visíveis para outros avaliadores após atualizar a lista.`,
              duration: 4000,
            });
          } else if (mode === 'documents') {
            toast.success('Validação de documentos salva', {
              description: candidateName,
              duration: 3000,
            });
          } else {
            const isUpdate = application.stage1_evaluation ? 'atualizada' : 'concluída';
            toast.success(`Etapa 1 ${isUpdate} com sucesso!`, {
              description: `${candidateName} - Pontuação: ${totalScore}/10`,
              duration: 5000,
            });
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Erro ao salvar avaliação');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar avaliação';
      toast.error('Erro ao salvar avaliação', { description: errorMessage, duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStage2Submit = async (data: Stage2Evaluation) => {
    if (currentStage !== 'stage2_interview' && currentStage !== 'analysis_completed') {
      toast.error('Etapa 2 ainda não foi liberada para avaliação');
      return;
    }
    if (processConfig?.has_interview === false) {
      toast.error('Este processo não possui etapa 2 configurada');
      return;
    }

    setIsSubmitting(true);
    try {
      const accessToken = getAccessToken();
      if (!accessToken) throw new Error('Token de acesso não encontrado');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/applications/${application.id}/stage2_evaluation/`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${decodeURIComponent(accessToken)}`,
          },
          body: JSON.stringify(data),
        }
      );

      if (response.ok) {
        const updatedApplication = await response.json();
        onUpdate(updatedApplication);

        const candidateName = application.candidate?.name || 'Candidato';
        const totalScore = Number(data.total_score ?? 0).toFixed(2);
        const isUpdate = application.stage2_evaluation ? 'atualizada' : 'concluída';

        toast.success(`Etapa 2 ${isUpdate} com sucesso!`, {
          description: `${candidateName} - Pontuação: ${totalScore}/10`,
          duration: 5000,
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || 'Erro ao salvar avaliação');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar avaliação';
      toast.error('Erro ao salvar avaliação', { description: errorMessage, duration: 5000 });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4">
      <TabGroup selectedIndex={activeTab} onChange={setActiveTab}>
        <TabList className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            return (
              <Tab
                key={tab.name}
                disabled={tab.disabled}
                className={({ selected }) => `
                  w-full py-3 px-4 text-sm font-medium rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                  ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  ${selected ? 'bg-white text-blue-700 shadow' : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-800'}
                `}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="w-5 h-5" />
                  {tab.name}
                  {idx === 0 && application.stage1_evaluation && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {idx === 1 && application.stage2_evaluation && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                  {tab.locked && <Lock className="w-4 h-4 text-gray-400" />}
                </div>
                {tab.locked && <p className="text-xs text-gray-500 mt-1 text-center">Bloqueada</p>}
              </Tab>
            );
          })}
        </TabList>

        <TabPanels>
          <TabPanel>
            <Stage1EvaluationComponent
              application={application}
              onSubmit={handleStage1Submit} // ✅ agora aceita (data, silent?)
              isSubmitting={isSubmitting}
              existingEvaluation={application.stage1_evaluation ?? undefined}
              processConfig={processConfig}
              readOnly={stage1Locked}
            />
          </TabPanel>

          <TabPanel>
            {!stage2Locked && processConfig?.has_interview !== false ? (
              <Stage2EvaluationComponent
                application={application}
                onSubmit={handleStage2Submit}
                isSubmitting={isSubmitting}
                existingEvaluation={application.stage2_evaluation ?? undefined}
                processConfig={processConfig}
                readOnly={currentStage === 'analysis_completed'}
              />
            ) : processConfig?.has_interview === false ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                <Lock className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-blue-800 mb-2">Etapa 2 Não Configurada</h4>
                <p className="text-blue-700 mb-4">
                  Este processo seletivo não possui etapa de entrevista configurada.
                </p>
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-yellow-800 mb-2">Etapa 2 Bloqueada</h4>
                <p className="text-yellow-700 mb-4">
                  A etapa 2 será liberada após a conclusão da Etapa 1 para todos os candidatos.
                </p>
                <div className="text-sm text-yellow-600">
                  Status:{' '}
                  {application.stage1_evaluation ? '✅ Etapa 1 concluída' : '⏳ Etapa 1 pendente'}
                </div>
              </div>
            )}
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
