# Frontend — Seleção Simplificada

Portal público, área do candidato e painel administrativo do sistema de seleção de estagiários da Seleção Simplificada.

**Stack:** Next.js 15 (App Router) · React 19 · Tailwind · TanStack Query

## Documentação

- Índice: **[docs/README.md](docs/README.md)**
- Sistema (monorepo): [../docs/](../docs/)
- API (Swagger no backend): `/api/docs/`

## Desenvolvimento

```bash
cp .env.exemple .env.local
# Ajuste NEXT_PUBLIC_DJANGO_API_URL para a API Django

npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Detalhes de ambiente e Docker: [docs/AMBIENTE.md](docs/AMBIENTE.md).
