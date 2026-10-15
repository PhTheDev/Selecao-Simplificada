import { Candidate } from './candidate';
import { SelectionProcess } from './selection';

export interface Application {
    id: number;
    candidate: Candidate;
    selection_process: SelectionProcess;
    status: 'pending' | 'approved' | 'rejected' | 'waiting';
    application_date: string;
    identity_document: string;
    school_records: string;
    frequency_statement: string;
    vitae_curriculum: string;
    course_certificates: string;
    portfolio_link: string;
    average_score: number | null;
}