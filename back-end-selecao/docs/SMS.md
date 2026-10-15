# SMS — recuperação de senha por OTP

## Objetivo

Permitir redefinição de senha do candidato via código SMS, com anti-enumeração e sem armazenar o OTP em texto no banco.

## Fluxo

1. `POST /api/selection/candidates/password_reset_sms_request/` — body com `phone`
2. Backend normaliza telefone, aplica cooldown, cria `verification_id`
3. Se houver **exatamente um** candidato com aquele telefone, enfileira `send_password_reset_sms` na fila Celery `sms` (broker RabbitMQ)
4. Resposta sempre genérica (mesmo formato se não houver match)
5. `POST .../password_reset_sms_verify/` — `verification_id` + `code`
6. Sucesso → `reset_token` (PasswordResetToken)
7. `POST .../password_reset_confirm/` — nova senha + token

O SOAP iSend não roda no request HTTP. A view só cria a auditoria `PENDING` e publica a mensagem.

## Fila e retries

| Item | Valor |
|------|--------|
| Fila | `sms` |
| Broker | RabbitMQ (`CELERY_BROKER_URL`) |
| OTP / cache | Redis (`CACHE_URL`) |
| `max_retries` | 5 |
| Backoff | 2, 4, 8, 16, 32s + jitter |
| Ack | `acks_late` — se o worker cair no meio, a mensagem volta à fila |

O mesmo OTP é reenviado em todos os retries. `SMSVerification` permanece `PENDING` até sucesso ou falha definitiva.

| Tipo de erro | Exemplos | Ação |
|--------------|----------|------|
| Transitório | timeout, `TransportError`, SOAP fault de rede | Retry |
| Permanente | códigos iSend `1–7` (token, texto, crédito, long_sms, agendamento), telefone inválido | `FAILED`, sem retry |
| Retries esgotados | 5 retries sem sucesso | `FAILED` + OTP removido |

Código `1` (token inválido): uma tentativa de `get_isend_token(force_refresh=True)` antes de tratar como permanente (token dinâmico expirado no Redis).

## Providers

| `SMS_PROVIDER` | Comportamento |
|----------------|---------------|
| `console` | Dev: loga/simula envio |
| `isend` | Produção: SOAP iSend (`ISEND_*`) |

OTP fica no **Redis** (hash); `SMSVerification` guarda auditoria (status, tentativas, `error_code`).

## Parâmetros (`settings` / `.env.exemple`)

| Variável | Uso típico |
|----------|------------|
| `SMS_VERIFICATION_TTL` | Validade do código (ex.: 300 s) |
| `SMS_VERIFICATION_LENGTH` | Dígitos (ex.: 6) |
| `SMS_VERIFICATION_MAX_ATTEMPTS` | Bloqueio após N erros |
| `SMS_VERIFICATION_RESEND_COOLDOWN` | Cooldown entre pedidos |
| `SMS_DEBUG_EXPOSE_ERRORS` | Só em debug controlado |
| `CELERY_BROKER_URL` | `amqp://user:pass@rabbitmq:5672//` |
| `RABBITMQ_USER` / `RABBITMQ_PASSWORD` | Credenciais do broker |

Throttle: `sms_reset` (3/hora).

## Código

- Views: `selection/candidate/views.py`
- Task: `selection/tasks.py` → `send_password_reset_sms`
- OTP/Redis: `selection/candidate/otp.py`
- iSend: `selection/candidate/isend.py`, `isend_auth.py`, `sms.py`
- Prompt de replicação: [prompt-integracao-isend-sms.md](prompt-integracao-isend-sms.md)
