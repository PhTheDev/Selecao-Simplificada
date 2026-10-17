import Footer from '@/components/Footer';
import Header from '@/components/main-page/Header';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="bg-primary text-primary-foreground pt-32 pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl xl:text-5xl font-semibold text-primary-foreground/80 drop-shadow-sm">
            Página não encontrada
          </h1>
          <p className="mt-4 text-white/85 max-w-2xl mx-auto text-lg leading-relaxed">
            O link pode ter sido removido, renomeado ou você digitou o endereço incorretamente.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10">
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-8 md:p-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-warning-soft text-warning border border-warning/30 font-semibold">
                  <span className="text-sm">Erro</span>
                  <span className="text-sm font-semibold">404</span>
                </div>

                <h2 className="mt-4 text-2xl md:text-3xl font-semibold text-foreground">
                  Não conseguimos encontrar essa página.
                </h2>

                <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
                  Você pode voltar para a página inicial, acessar os processos seletivos ou entrar em contato se achar
                  que isso é um problema do sistema.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/"
                  className="px-6 py-3 rounded-xl font-bold text-primary-foreground bg-primary transition-all shadow-sm text-center"
                >
                  Voltar para início
                </Link>
                <Link
                  href="/processos-seletivos"
                  className="px-6 py-3 rounded-xl font-bold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all text-center"
                >
                  Ver processos
                </Link>
              </div>
            </div>

            <div className="mt-8 rounded-2xl bg-background border border-border p-5">
              <p className="text-sm text-muted-foreground">
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
