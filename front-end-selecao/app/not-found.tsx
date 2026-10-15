import Footer from '@/components/Footer';
import ProcessosHeader from '@/components/processos-seletivos/ProcessosHeader';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProcessosHeader />

      <div className="bg-gradient-to-br from-[#005f73] to-[#0a9396] text-white pt-32 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-black text-[#e9d8a6] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
            Página não encontrada
          </h1>
          <p className="mt-4 text-white/85 max-w-2xl mx-auto text-lg leading-relaxed">
            O link pode ter sido removido, renomeado ou você digitou o endereço incorretamente.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                  <span className="text-sm">Erro</span>
                  <span className="text-sm font-black">404</span>
                </div>

                <h2 className="mt-4 text-2xl md:text-3xl font-black text-gray-900">
                  Não conseguimos encontrar essa página.
                </h2>

                <p className="mt-3 text-gray-600 leading-relaxed max-w-2xl">
                  Você pode voltar para a página inicial, acessar os processos seletivos ou entrar em contato se achar
                  que isso é um problema do sistema.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-[#005f73] to-[#0a9396] hover:from-[#0a9396] hover:to-[#005f73] transition-all shadow-lg hover:shadow-xl text-center"
                >
                  Voltar para início
                </Link>
                <Link
                  href="/processos-seletivos"
                  className="px-6 py-3 rounded-xl font-bold border-2 border-[#005f73] text-[#005f73] hover:bg-[#005f73] hover:text-white transition-all text-center"
                >
                  Ver processos
                </Link>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <p className="text-sm text-gray-600">
                Dica: confira se o endereço está correto e tente novamente.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
