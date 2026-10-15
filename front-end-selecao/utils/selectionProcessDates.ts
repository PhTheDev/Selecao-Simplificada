/**
 * Datas de inscrição (API: DateField como YYYY-MM-DD):
 * abertura às 00:00 e encerramento às 23:59:59 no calendário local.
 */

export const INSCRIPTION_OPEN_TIME_LABEL = '00:00';
export const INSCRIPTION_CLOSE_TIME_LABEL = '23:59';

/** Interpreta YYYY-MM-DD (ou ISO) como meia-noite local — evita deslocamento UTC de `new Date("YYYY-MM-DD")`. */
export function parseLocalCalendarDate(dateStr: string): Date {
    const part = dateStr.split('T')[0];
    const [y, m, d] = part.split('-').map(Number);
    if (!y || !m || !d) return new Date(NaN);
    return new Date(y, m - 1, d);
}

export function endOfLocalCalendarDay(dateStr: string): Date {
    const d = parseLocalCalendarDate(dateStr);
    if (isNaN(d.getTime())) return d;
    d.setHours(23, 59, 59, 999);
    return d;
}

export function isNowWithinInscriptionWindow(
    beginning_date: string,
    ending_date: string,
    now: Date = new Date()
): boolean {
    const start = parseLocalCalendarDate(beginning_date);
    const end = endOfLocalCalendarDay(ending_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    return now >= start && now <= end;
}

/** Após 23:59:59 do último dia de inscrição. */
export function isPastInscriptionEnd(ending_date: string, now: Date = new Date()): boolean {
    const end = endOfLocalCalendarDay(ending_date);
    if (isNaN(end.getTime())) return true;
    return now > end;
}

/** Status para cards públicos: inativo ou fora da janela = encerrado/em breve conforme datas. */
export function getPublicProcessCardStatus(
    process: { is_active: boolean; beginning_date: string; ending_date: string },
    now: Date = new Date()
): 'active' | 'upcoming' | 'finished' {
    if (!process.is_active) return 'finished';
    const start = parseLocalCalendarDate(process.beginning_date);
    const end = endOfLocalCalendarDay(process.ending_date);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'finished';
    if (now < start) return 'upcoming';
    if (now > end) return 'finished';
    return 'active';
}

export function formatShortWeekdayDatePtBr(dateStr: string): string {
    const d = parseLocalCalendarDate(dateStr);
    if (isNaN(d.getTime())) return '---';
    return d
        .toLocaleDateString('pt-BR', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
        })
        .replace('.', '')
        .toUpperCase();
}
