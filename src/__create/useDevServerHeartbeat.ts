'use client';

import { useEffect } from 'react';

/**
 * Mantém o dev server vivo enquanto o usuário está na página.
 * Faz um ping a cada 3 minutos via fetch para evitar que o servidor duerma.
 *
 * ⚠️  Roda APENAS no browser e APENAS em ambiente de desenvolvimento.
 *     Em produção (Vercel / SSR), este hook é um no-op total.
 */
export function useDevServerHeartbeat() {
  useEffect(() => {
    // Garante que não rode no servidor (SSR) nem em produção.
    if (import.meta.env.SSR || !import.meta.env.DEV) return;

    const pingInterval = setInterval(() => {
      fetch('/', { method: 'GET' }).catch(() => {
        // no-op: apenas mantém o dev server vivo
      });
    }, 60_000 * 3);

    return () => clearInterval(pingInterval);
  }, []);
}
