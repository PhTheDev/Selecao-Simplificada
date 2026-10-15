# Deploy

## Visão geral

Há composes de produção separados:

- [`back-end-selecao/docker-compose-prod.yml`](../back-end-selecao/docker-compose-prod.yml) — Django (Gunicorn), Postgres, Redis, Celery, Nginx
- [`front-end-selecao/docker-compose-prod.yml`](../front-end-selecao/docker-compose-prod.yml) — Next.js (porta típica **3002**)

Não versionar `.env` real. Use `.env.exemple` como referência de chaves.

## Backend (produção)

1. Configure variáveis (DB, `SECRET_KEY`, `ALLOWED_HOSTS`, `EXTRA_ORIGINS`, SMTP, Redis, SMS).
2. `docker compose -f docker-compose-prod.yml up --build -d`
3. Migrations rodam no start do app (conforme `command` do compose).
4. Cadastre token de integração no Django Admin se a integração estiver ativa.
5. `SMS_PROVIDER=isend` apenas com credenciais válidas; em staging prefira `console`.

### Mídia

Uploads ficam em `MEDIA_ROOT`. Em `DEBUG=False` o Django ainda serve `/media/` via `serve` (ver `core/urls.py`). O frontend Next reescreve `/media/*` para a origem interna do Gunicorn (`DJANGO_INTERNAL_ORIGIN`).

## Frontend (produção)

Build args / env:

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_DJANGO_API_URL` | URL pública da API |
| `DJANGO_INTERNAL_ORIGIN` | Host interno para rewrite de mídia no build/runtime |

## Checklist pós-deploy

- [ ] `/api/docs/` acessível (ou restrito por rede, se política de segurança)
- [ ] Login candidato e admin
- [ ] Upload e visualização de documentos
- [ ] E-mail de verificação (SMTP)
- [ ] Celery worker + beat ativos
- [ ] Integração externa (se aplicável)
