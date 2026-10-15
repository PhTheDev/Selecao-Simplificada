"use client";

import HeaderAdmin from "@/components/admin/HeaderAdmin";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminPanelLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // ✅ Defina aqui as MESMAS larguras que você usa no HeaderAdmin (sidebar)
  const SIDEBAR_OPEN = 280;  // ex: igual ao Candidate (open: 280)
  const SIDEBAR_CLOSED = 80; // ex: igual ao Candidate (closed: 80)

  // Detectar se é mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Sincronizar com localStorage apenas em desktop
  useEffect(() => {
    if (isMobile) return;
    const saved = localStorage.getItem("admin-sidebar-open");
    if (saved !== null) setSidebarOpen(JSON.parse(saved));
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return;
    localStorage.setItem("admin-sidebar-open", JSON.stringify(sidebarOpen));
  }, [sidebarOpen, isMobile]);

  // Verificar autenticação no cliente
  useEffect(() => {
    const checkAuth = () => {
      if (typeof document === "undefined") return;

      const accessToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("admin-access-token="))
        ?.split("=")[1];

      if (!accessToken) {
        const currentPath = window.location.pathname;
        router.push(`/auth/login-admin?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      try {
        const parts = accessToken.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp && payload.exp < now) {
            const currentPath = window.location.pathname;
            router.push(`/auth/login-admin?redirect=${encodeURIComponent(currentPath)}`);
            return;
          }
        }
      } catch {
        const currentPath = window.location.pathname;
        router.push(`/auth/login-admin?redirect=${encodeURIComponent(currentPath)}`);
        return;
      }

      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [router]);

  const leftOffset = useMemo(() => {
    if (isMobile) return 0;
    return sidebarOpen ? SIDEBAR_OPEN : SIDEBAR_CLOSED;
  }, [isMobile, sidebarOpen]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HeaderAdmin inclui sidebar fixed. Ele precisa usar as mesmas larguras 280/80 */}
      <HeaderAdmin sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ✅ O main compensa exatamente a largura real do sidebar */}
      <main
        className="
            min-h-screen transition-[padding] duration-300 ease-in-out
            bg-[radial-gradient(ellipse_at_top,rgba(6,101,120,0.22),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(10,147,150,0.18),transparent_60%)]
            bg-[#f3fbfb]
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
