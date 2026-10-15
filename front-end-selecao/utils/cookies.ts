// utils/cookies.ts
export class Cookies {
    static set(name: string, value: string, days: number = 7): void {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = `expires=${date.toUTCString()}`;
        const secure = process.env.NODE_ENV === 'production' ? '; secure' : '';
        document.cookie = `${name}=${value}; ${expires}; path=/; sameSite=lax${secure}`;
    }

    static get(name: string): string | null {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    static delete(name: string): void {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    static setAuthTokens(accessToken: string, refreshToken: string): void {
        this.set('access-token', accessToken, 1 / 24); // ~1 hora
        this.set('refresh-token', refreshToken, 7); // 7 dias
    }

    static setCandidateData(candidate: any): void {
        this.set('candidate-id', candidate.id.toString(), 7);
        this.set('candidate-name', encodeURIComponent(candidate.name), 7);
        this.set('candidate-email', candidate.email, 7);
    }
}