# Setup do backend

## Opção Docker (recomendada)

```bash
cd back-end-selecao
cp .env.exemple .env
docker compose -f docker-compose.dev.yml up --build   # na raiz do repositório
```

Serviços típicos: Postgres, Redis, RabbitMQ, app Django, Celery worker/beat (conforme o arquivo compose).

Variáveis importantes (ver `.env.exemple`):

| Grupo | Exemplos |
|-------|----------|
| Geral | `DEBUG`, `SECRET_KEY`, `ALLOWED_HOSTS`, `EXTRA_ORIGINS`, `HOST_BASE_URL` |
| Banco | `DB_*`, `POSTGRES_*` |
| E-mail | `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, … |
| Redis | `CACHE_URL`, `CELERY_RESULT_BACKEND` (cache, OTP, resultados) |
| RabbitMQ/Celery | `CELERY_BROKER_URL`, `RABBITMQ_USER`, `RABBITMQ_PASSWORD` |
| SMS | `SMS_PROVIDER`, `ISEND_*`, `SMS_VERIFICATION_*` |

Em desenvolvimento: `SMS_PROVIDER=console`.

## Opção local (sem Docker da app)

1. Crie um venv e instale `requirements.txt`.
2. Configure `.env` apontando Postgres, Redis e RabbitMQ acessíveis.
3. `python manage.py migrate`
4. `python manage.py runserver`
5. Em outros terminais: `celery -A core worker -Q celery,sms -l info` e `celery -A core beat -l info`

## Testes

```bash
pytest
```

- Settings: `core.test_settings` (SQLite `test_db.sqlite3`, LocMem cache, Celery eager, SMS console)
- Paths: `selection/tests`, `administrator/tests` (`pytest.ini`)

## Swagger

Com o servidor no ar: `http://localhost:8000/api/docs/` (ajuste a porta se necessário).
