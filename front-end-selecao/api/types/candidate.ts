export type SemesterChoice =
  | '1' | '2' | '3' | '4' | '5'
  | '6' | '7' | '8' | '9' | '10'

export interface Candidate {
    id: number;
    name: string;
    email: string;
    email_verified: boolean;
    cpf: string | null;
    gender: string | null;
    phone: string | null;
    college: string | null;
    period: string | null;
    semester: SemesterChoice | null;
    cep: string | null;
    address: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    uf: string | null;
    profile_image: string | null;
    profile_image_url: string | null;
    is_active: boolean;
    created_at: string;
}