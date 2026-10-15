// api/hooks/useProcessGrid.ts
import { SelectionProcess } from '@/api/types/selection';
import {
    getPublicProcessCardStatus,
    INSCRIPTION_OPEN_TIME_LABEL,
    parseLocalCalendarDate,
} from '@/utils/selectionProcessDates';
import { useActiveSelectionProcesses, useSelectionProcesses } from './useSelectionProcess';

const getProcessStatus = (process: SelectionProcess): 'active' | 'upcoming' | 'finished' => {
    return getPublicProcessCardStatus(process);
};

// Formatar data para "QUA. 01 OUT."
const formatProcessDate = (dateString: string): string => {
    const date = parseLocalCalendarDate(dateString);
    if (isNaN(date.getTime())) return '---. -- ---.';

    const weekdays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

    const weekday = weekdays[date.getDay()];
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];

    return `${weekday}. ${day} ${month}.`;
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

export const useProcessGrid = () => {
    const { data, isLoading, error } = useSelectionProcesses();

    // Processar e enriquecer os dados da API
    const processesData = data ? data.map(process => ({
        ...process,
        status: getProcessStatus(process),
        displayDate: formatProcessDate(process.beginning_date),
        displayTime: INSCRIPTION_OPEN_TIME_LABEL,
        process_banner: getAbsoluteUrl(process.process_banner) || '',
        notice_doc: getAbsoluteUrl(process.notice_doc) || '',
    })) : [];

    // Ordenar processos: ativos primeiro, depois próximos, depois finalizados
    const sortedProcesses = [...processesData].sort((a, b) => {
        const statusOrder = { active: 0, upcoming: 1, finished: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
    });

    return {
        processes: sortedProcesses,
        isLoading,
        error,
        isEmpty: !isLoading && processesData.length === 0
    };
};

// Hook específico para o Hero component
export const useHeroProcesses = () => {
    const { data, isLoading, error } = useActiveSelectionProcesses();

    const processesData = data ? data.map(process => ({
        ...process,
        process_banner: getAbsoluteUrl(process.process_banner) || '/images/hero-carousel/fallback.png'
    })) : [];

    return {
        processesData,
        isLoading,
        error,
        isEmpty: !isLoading && processesData.length === 0
    };
};