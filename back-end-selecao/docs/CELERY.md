# Celery

## Infraestrutura

- Broker: RabbitMQ (`CELERY_BROKER_URL`, ex. `amqp://user:pass@rabbitmq:5672//`)
- Result backend / cache / OTP: Redis (`CELERY_RESULT_BACKEND`, `CACHE_URL`)
- App: `core.celery`
- Scheduler: `django_celery_beat` (`DatabaseScheduler` em settings; schedule também em `beat_schedule`)

## Filas

| Fila | Uso |
|------|-----|
| `celery` | Padrão (status de processo, e-mail) |
| `sms` | Envio iSend (`send_password_reset_sms`) |

O worker deve consumir as duas: `celery -A core worker -Q celery,sms --loglevel=info`.

## Tasks periódicas (`core/celery.py`)

| Task | Agenda | Função |
|------|--------|--------|
| `selection.tasks.update_selection_process_status` | A cada 30 min | Atualiza status dos processos ativos (exceto `finished`) conforme datas |
| `selection.tasks.notify_process_entered_analysis` | Diário 09:00 | Notificação de processos em análise |

## Tasks sob demanda

| Task | Uso |
|------|-----|
| `selection.tasks.send_password_reset_sms` | Fila `sms`. Reset por senha; retry seletivo em falha transitória do iSend |

Detalhes de retry e erros: [SMS.md](SMS.md).

## Desenvolvimento

No `core.test_settings`, Celery roda em modo **eager** (tasks síncronas nos testes). RabbitMQ não é necessário para `pytest`.

Em Docker, garanta containers de **rabbitmq**, **worker** e **beat** além da app web. UI de gestão (dev): `http://localhost:15672`.
