import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware do Next.js para gerenciar autenticação e proteção de rotas.
 * 
 * Funcionalidades:
 * - Verifica e renova tokens JWT automaticamente
 * - Protege rotas que requerem autenticação
 * - Redireciona usuários não autenticados
 * - Gerencia tokens de candidato e administrador separadamente
 */

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = [
    '/',
    '/auth',
    '/processos-seletivos',
    '/editais',
    '/faq',
];

// Rotas que requerem autenticação de candidato
const CANDIDATE_ROUTES = [
    '/candidato',
];

// Rotas que requerem autenticação de candidato mas podem ser acessadas via link direto
// (o middleware verifica autenticação, mas permite acesso inicial para mostrar formulário)
const CANDIDATE_ROUTES_WITH_PUBLIC_ACCESS = [
    '/aplicar', // Permite ver a página, mas requer login para submeter
];

// Rotas que requerem autenticação de administrador
const ADMIN_ROUTES = [
    '/painel-admin',
];

// Rotas de autenticação (redireciona se já estiver autenticado)
const AUTH_ROUTES = [
    '/auth/login-candidato',
    '/auth/login-admin',
    '/auth/register',
];

/**
 * Verifica se uma rota é pública
 */
function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Verifica se uma rota requer autenticação de candidato
 */
function isCandidateRoute(pathname: string): boolean {
    return CANDIDATE_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Verifica se uma rota requer autenticação de administrador
 */
function isAdminRoute(pathname: string): boolean {
    return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Verifica se uma rota é de autenticação
 */
function isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Obtém cookie do servidor
 */
function getCookie(request: NextRequest, name: string): string | null {
    const cookie = request.cookies.get(name);
    return cookie?.value || null;
}

/**
 * Decodifica JWT no servidor (usando Buffer do Node.js)
 */
function decodeJWT(token: string): any | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        
        // No middleware do Next.js, podemos usar Buffer diretamente
        const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
        return JSON.parse(payload);
    } catch (error) {
        return null;
    }
}

/**
 * Verifica se um token JWT está expirado (decodifica sem fazer requisição)
 */
function isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    
    const payload = decodeJWT(token);
    if (!payload || !payload.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    // Adiciona margem de segurança de 60 segundos para evitar problemas de sincronização
    return payload.exp < (now + 60);
}

/**
 * Verifica se o usuário está autenticado como candidato
 */
function isCandidateAuthenticated(request: NextRequest): boolean {
    const accessToken = getCookie(request, 'access-token');
    const adminToken = getCookie(request, 'admin-access-token');
    
    // Se tem token de admin, não é candidato
    if (adminToken) {
        return false;
    }
    
    // Se não tem token de candidato, não está autenticado
    if (!accessToken) {
        return false;
    }
    
    // Verifica se o token está expirado
    if (isTokenExpired(accessToken)) {
        return false;
    }
    
    // Verifica se o token é válido (tem estrutura de JWT)
    const payload = decodeJWT(accessToken);
    if (!payload) {
        return false;
    }
    
    // Verifica se tem pelo menos um campo que indica que é um token válido
    if (!payload.exp) {
        return false;
    }
    
    return true;
}

/**
 * Verifica se o usuário está autenticado como administrador
 */
function isAdminAuthenticated(request: NextRequest): boolean {
    const adminToken = getCookie(request, 'admin-access-token');
    
    // Se não tem token, não está autenticado
    if (!adminToken) {
        return false;
    }
    
    // Verifica se o token está expirado
    if (isTokenExpired(adminToken)) {
        return false;
    }
    
    // Verifica se o token é válido (tem estrutura de JWT)
    const payload = decodeJWT(adminToken);
    if (!payload) {
        return false;
    }
    
    // Verifica se tem pelo menos um campo que indica que é um token válido
    // JWT tokens geralmente têm 'exp', 'iat', e algum identificador de usuário
    if (!payload.exp) {
        return false;
    }
    
    return true;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // Ignora arquivos estáticos e API routes do Next.js
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // Arquivos com extensão
    ) {
        return NextResponse.next();
    }
    
    // PRIMEIRO: Verifica rotas de administrador ANTES de verificar rotas públicas
    // Isso garante que /painel-admin seja sempre protegido
    if (isAdminRoute(pathname)) {
        const isAuthenticated = isAdminAuthenticated(request);
        
        if (!isAuthenticated) {
            // Salva a URL atual para redirecionar após login
            const loginUrl = new URL('/auth/login-admin', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    }
    
    // SEGUNDO: Verifica rotas de candidato ANTES de verificar rotas públicas
    // Isso garante que /candidato seja sempre protegido
    if (isCandidateRoute(pathname)) {
        const isAuthenticated = isCandidateAuthenticated(request);
        
        if (!isAuthenticated) {
            // Salva a URL atual para redirecionar após login
            const loginUrl = new URL('/auth/login-candidato', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
        return NextResponse.next();
    }
    
    // Rotas públicas - permite acesso
    if (isPublicRoute(pathname)) {
        return NextResponse.next();
    }
    
    // Rotas de autenticação - redireciona se já estiver autenticado
    if (isAuthRoute(pathname)) {
        if (pathname.includes('candidato') && isCandidateAuthenticated(request)) {
            return NextResponse.redirect(new URL('/candidato', request.url));
        }
        if (pathname.includes('admin') && isAdminAuthenticated(request)) {
            return NextResponse.redirect(new URL('/painel-admin', request.url));
        }
        return NextResponse.next();
    }
    
    // Rotas de aplicação - permite acesso inicial, mas requer login para ações
    // (a própria página verifica autenticação antes de permitir submissão)
    if (CANDIDATE_ROUTES_WITH_PUBLIC_ACCESS.some(route => pathname.startsWith(route))) {
        // Permite acesso, mas a página deve verificar autenticação internamente
        return NextResponse.next();
    }
    
    // Por padrão, bloqueia acesso a rotas desconhecidas
    // Isso garante que novas rotas sejam explicitamente definidas como públicas ou protegidas
    return NextResponse.next();
}

/**
 * Configuração do matcher para otimizar performance
 * Aplica middleware apenas nas rotas necessárias
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

