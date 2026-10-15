'use client';

import { useEffect, useState } from 'react';

function getCookie(name: string) {
  if (typeof document === 'undefined') return null;

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);

  if (parts.length !== 2) return null;

  const raw = parts.pop()!.split(';').shift()!;
  return decodeURIComponent(raw);
}

export function useCandidateAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const candidateToken = getCookie('access-token');

      // Se existe token de candidato e não existe token de admin
      setIsAuthenticated(Boolean(candidateToken));
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isAuthenticated, isLoading };
}
