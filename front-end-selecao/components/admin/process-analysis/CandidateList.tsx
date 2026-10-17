'use client';

import { useState } from 'react';
import { Application, ProcessConfig } from './types'; // importe ProcessConfig
import CandidateAccordion from './CandidateAccordion';
import { Search, Filter } from 'lucide-react';

interface CandidateListProps {
    applications: Application[];
    onUpdate: (application: Application) => void;
    processId: number;
    currentStage: 'stage1_documents' | 'stage2_interview' | 'analysis_completed';
    processConfig?: ProcessConfig;
    onRefreshList?: () => void;
    isRefreshingList?: boolean;
}

export default function CandidateList({
    applications,
    onUpdate,
    processId,
    currentStage,
    processConfig,
    onRefreshList,
    isRefreshingList = false,
}: CandidateListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [stageFilter, setStageFilter] = useState<string>('all');

    const filteredApplications = applications.filter(application => {
        const matchesSearch =
            application.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            application.candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (application.candidate.cpf && application.candidate.cpf.includes(searchTerm)) ||
            (application.candidate.phone && application.candidate.phone.includes(searchTerm));

        const matchesStatus = statusFilter === 'all' || application.status === statusFilter;

        const matchesStage =
            stageFilter === 'all' ||
            (stageFilter === 'stage1_completed' && application.stage1_evaluation) ||
            (stageFilter === 'stage2_completed' && application.stage2_evaluation) ||
            (stageFilter === 'stage1_pending' && !application.stage1_evaluation) ||
            (stageFilter === 'stage2_pending' && application.stage1_evaluation && !application.stage2_evaluation);

        return matchesSearch && matchesStatus && matchesStage;
    });

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/70" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, email, CPF ou telefone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent"
                        >
                            <option value="all">Todos os status</option>
                            <option value="pending">Pendente</option>
                            <option value="approved">Aprovado</option>
                            <option value="rejected">Rejeitado</option>
                        </select>
                        <select
                            value={stageFilter}
                            onChange={(e) => setStageFilter(e.target.value)}
                            className="px-4 py-3 border border-input rounded-xl focus:ring-2 focus:ring-ring focus:border-transparent"
                        >
                            <option value="all">Todas as etapas</option>
                            <option value="stage1_pending">Etapa 1 Pendente</option>
                            <option value="stage1_completed">Etapa 1 Concluída</option>
                            <option value="stage2_pending">Etapa 2 Pendente</option>
                            <option value="stage2_completed">Etapa 2 Concluída</option>
                        </select>
                    </div>
                </div>

                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-foreground">
                        Candidatos Inscritos
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                            ({filteredApplications.length} de {applications.length})
                        </span>
                    </h2>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span>
                            <Filter className="w-4 h-4 inline mr-1" />
                            Filtros aplicados
                        </span>
                        {onRefreshList && (
                            <button
                                type="button"
                                onClick={onRefreshList}
                                disabled={isRefreshingList}
                                className="px-3 py-1.5 rounded-lg border border-input text-foreground/80 hover:bg-background disabled:opacity-50"
                            >
                                {isRefreshingList ? 'Atualizando...' : 'Atualizar lista'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="divide-y divide-border">
                {filteredApplications.map((application) => (
                    <CandidateAccordion
                        key={application.id}
                        application={application}
                        onUpdate={onUpdate}
                        processId={processId}
                        currentStage={currentStage}
                        processConfig={processConfig} // ✅ agora passa tudo
                    />
                ))}

                {filteredApplications.length === 0 && (
                    <div className="py-16 text-center">
                        <div className="text-muted-foreground/70 mb-4">
                            <Search className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-foreground font-semibold text-xl mb-2">
                            Nenhum candidato encontrado
                        </h3>
                        <p className="text-muted-foreground">
                            Tente ajustar os termos de busca ou filtros.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}