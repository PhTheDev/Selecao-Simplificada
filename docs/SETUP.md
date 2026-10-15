# Setup local

## Pré-requisitos

- Docker e Docker Compose (backend)
- Node.js 20+ (frontend)
- Python 3.12+ (opcional, se rodar Django fora do Docker)

## Backend

1. Copie o exemplo de ambiente:

```bash
cd back-end-selecao
cp .env.exemple .env
```

Ajuste pelo menos e-mail/SMTP e, se for testar SMS real, credenciais iSend. Em desenvolvimento use `SMS_PROVIDER=console`.

2. Suba os serviços:

```bash
docker compose -f docker-compose-dev.yml up --build
```

Serviços típicos do compose de desenvolvimento:

| Serviço | Uso |
|---------|-----|
| `app` | Django (`runserver` na porta 8000 do container) |
| `db_postgres` | PostgreSQL (porta externa frequentemente `15436`) |
| `redis` | Cache, Celery e OTP |
| worker / beat | Celery (conforme o compose) |

3. Confirme a API e o Swagger:

- API: `http://localhost:8000` (ou a porta mapeada no compose)
- Swagger: `http://localhost:8000/api/docs/`

Documentação detalhada: [../back-end-selecao/docs/SETUP.md](../back-end-selecao/docs/SETUP.md).

## Frontend

1. Ambiente:

```bash
cd front-end-selecao
cp .env.exemple .env.local
```

Defina `NEXT_PUBLIC_DJANGO_API_URL` apontando para a API (ex.: `http://localhost:8000` ou a porta Nginx/host usada no seu ambiente).

2. Instale e rode:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000` (porta padrão do Next em desenvolvimento).

Documentação detalhada: [../front-end-selecao/docs/AMBIENTE.md](../front-end-selecao/docs/AMBIENTE.md).

## Primeiro administrador

Se ainda não existir nenhum perfil de administrador, use `POST /api/administration/administrators/register/` **sem** autenticação (apenas a primeira vez). Depois, só `super_admin` cria outros.

## Testes do backend

```bash
cd back-end-selecao
pytest
```

Usa `core.test_settings` (SQLite, cache em memória, Celery eager, `SMS_PROVIDER=console`).
