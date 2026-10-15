'use client';

import Footer from '@/components/Footer';
import ProcessosHeader from '@/components/processos-seletivos/ProcessosHeader';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // aqui você pode integrar com Sentry/LogRocket etc.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProcessosHeader />

      <div className="bg-gradient-to-br from-[#005f73] to-[#0a9396] text-white pt-32 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-black text-[#e9d8a6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            Ops… algo deu errado
          </h1>
          <p className="mt-4 text-white/85 max-w-2xl mx-auto text-lg leading-relaxed">
            Encontramos um erro inesperado ao carregar esta página. Tente novamente em instantes.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 border border-red-200 font-semibold">
                    <span className="text-sm">Erro</span>
                    <span className="text-sm font-black">500</span>
                  </div>

                  <h2 className="mt-4 text-2xl md:text-3xl font-black text-gray-900">
                    Não foi possível concluir a solicitação.
                  </h2>

                  <p className="mt-3 text-gray-600 leading-relaxed max-w-2xl">
                    Você pode recarregar esta tela agora. Se o problema persistir, use o menu para voltar para o início.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => reset()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#005f73] to-[#0a9396] hover:from-[#0a9396] hover:to-[#005f73] transition-all shadow-lg hover:shadow-xl"
                >
                  <RotateCcw className="w-5 h-5" />
                  Tentar novamente
                </button>

                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl font-bold border-2 border-[#005f73] text-[#005f73] hover:bg-[#005f73] hover:text-white transition-all text-center"
                >
                  Ir para início
                </Link>
              </div>
            </div>

            {/* Detalhe técnico opcional (só em dev) */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-5">
                <p className="text-sm font-semibold text-gray-700 mb-2">Detalhes (dev)</p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                  {error?.message}
                  {error?.digest ? `\nDigest: ${error.digest}` : ''}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
