# Seleção Simplificada

Sistema de seleção de estagiários.

## Estrutura do monorepo

| Pasta | Descrição |
|-------|-----------|
| [`front-end-selecao/`](front-end-selecao/) | Portal público, área do candidato e painel administrativo (Next.js) |
| [`back-end-selecao/`](back-end-selecao/) | API REST (Django + DRF + JWT + Celery) |
| [`docs/`](docs/) | Documentação do **sistema** (visão geral) |

## Documentação

Comece por **[docs/README.md](docs/README.md)**.

### API (Swagger)

Com o backend no ar:

- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`
- Schema OpenAPI: `/api/schema/`

### Por projeto

- Backend: [back-end-selecao/docs/](back-end-selecao/docs/)
- Frontend: [front-end-selecao/docs/](front-end-selecao/docs/)
