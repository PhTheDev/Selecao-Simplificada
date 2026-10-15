import type { NextConfig } from "next";

/** Origem HTTP do Gunicorn dentro da rede Docker (rewrites de /media → backend). */
const djangoInternal =
  process.env.DJANGO_INTERNAL_ORIGIN?.replace(/\/$/, "") ||
  "http://app_selecao_system:8000";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "localhost",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/media/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        pathname: "/media/**",
      },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
    ],
  },
  /**
   * Pedidos a https://selecao.../media/... devem chegar ao Next (proxy público) e ser
   * encaminhados ao Gunicorn. Sem isto, /media fica só no domínio público e o nginx pode
   * nunca repassar ao Django → 404 para o otimizador de imagens e para o browser.
   */
  async rewrites() {
    return [
      {
        source: "/media/:path*",
        destination: `${djangoInternal}/media/:path*`,
      },
    ];
  },
  output: "standalone",
};

export default nextConfig;
