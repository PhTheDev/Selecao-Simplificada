# Ambiente e deploy do frontend

## Variáveis

| Variável | Onde | Uso |
|----------|------|-----|
| `NEXT_PUBLIC_DJANGO_API_URL` | Cliente + build | Origem da API Django |
| `DJANGO_INTERNAL_ORIGIN` | Server/build | Rewrite de `/media/*` para o Gunicorn interno (Docker) |
| `NODE_ENV` | Runtime | Cookies seguros em produção |
| `PORT` / `HOSTNAME` | Docker | Ex.: `3002` / `0.0.0.0` |

Exemplo: `.env.exemple`.

```bash
cp .env.exemple .env.local
npm install
npm run dev
```

## Mídia

`next.config.ts` reescreve `/media/*` para `DJANGO_INTERNAL_ORIGIN` (padrão típico `http://app_selecao_system:8000` no compose). Em desenvolvimento local, a API pode servir `/media/` diretamente se `NEXT_PUBLIC_DJANGO_API_URL` apontar para o Django.

## Docker

- `Dockerfile` — build standalone, porta **3002**
- `docker-compose-prod.yml` — serviço de produção do frontend

Garanta que `NEXT_PUBLIC_DJANGO_API_URL` no build seja a URL **pública** que o browser usará.
