# Backend — Seleção Simplificada

API REST do sistema de seleção de estagiários da Seleção Simplificada (Django + DRF + JWT + Celery).

## Documentação

- Índice: **[docs/README.md](docs/README.md)**
- Sistema (monorepo): [../docs/](../docs/)

## Swagger

Com o servidor rodando:

- UI: `/api/docs/`
- ReDoc: `/api/redoc/`
- Schema: `/api/schema/`

## Início rápido

```bash
cp .env.exemple .env
docker compose -f docker-compose-dev.yml up --build
```

Detalhes: [docs/SETUP.md](docs/SETUP.md).
