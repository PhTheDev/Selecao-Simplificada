'use client';

import HeaderCandidate from '@/components/candidate-dashboard/HeaderCandidate';
import {
    clearCandidateSession,
    fetchWithCandidateAuth,
    getAccessToken,
    getRefreshToken,
} from '@/utils/candidateAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [checking, setChecking] = useState(true);
  const router = useRouter();

  // ✅ evita rodar 2x no DEV (Strict Mode)
  const ranRef = useRef(false);

  // ✅ DEVE bater com o HeaderCandidate (ele usa 280/80)
  const SIDEBAR_OPEN = 280;
  const SIDEBAR_CLOSED = 80;

  // Detectar mobile + sidebar default
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sync localStorage (apenas desktop)
  useEffect(() => {
    if (isMobile) return;

    const saved = localStorage.getItem('candidate-sidebar-open');
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    localStorage.setItem('candidate-sidebar-open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen, isMobile]);

  // ✅ Auth check (somente candidato)
  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const run = async () => {
      const access = getAccessToken();
      const refresh = getRefreshToken();

      if (!access && !refresh) {
        const currentPath = window.location.pathname;
        router.replace(`/auth/login-candidato?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      try {
        const meUrl = `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/selection/candidates/me/`;
        const res = await fetchWithCandidateAuth(meUrl, { method: 'GET' });

        if (!res.ok) {
          clearCandidateSession();
          const currentPath = window.location.pathname;
          router.replace(`/auth/login-candidato?redirect=${encodeURIComponent(currentPath)}`);
          return;
        }

        setChecking(false);
      } catch {
        clearCandidateSession();
        const currentPath = window.location.pathname;
        router.replace(`/auth/login-candidato?redirect=${encodeURIComponent(currentPath)}`);
      }
    };

    run();
  }, [router]);

  // ✅ offset real do conteúdo (nunca sobrepõe)
  const leftOffset = useMemo(() => {
    if (isMobile) return 0;
    return sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED;
  }, [isMobile, sidebarOpen]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-foreground/80 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <HeaderCandidate sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main
        className="
            min-h-screen transition-[padding] duration-300 ease-in-out
            bg-background
        "
        style={{ paddingLeft: leftOffset }}
        >
        {/* ✅ sem px aqui, senão vira padding duplicado */}
        <div className="w-full max-w-full overflow-x-hidden">
            {children}
        </div>
        </main>
    </div>
  );
}
