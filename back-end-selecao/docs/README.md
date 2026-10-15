# Backend — Seleção Simplificada

API Django REST Framework do sistema de seleção de estagiários.

## Swagger / OpenAPI

| Interface | URL |
|-----------|-----|
| Swagger UI | `/api/docs/` |
| ReDoc | `/api/redoc/` |
| Schema | `/api/schema/` |

A **fonte da verdade** dos contratos HTTP é o Swagger. Este diretório complementa com setup, modelos e operações.

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [SETUP.md](SETUP.md) | Ambiente local, Docker, pytest |
| [API.md](API.md) | Mapa de prefixos da API |
| [MODELOS.md](MODELOS.md) | Entidades e relacionamentos |
| [AUTENTICACAO.md](AUTENTICACAO.md) | JWT, permissões, throttles |
| [CELERY.md](CELERY.md) | Workers, beat e tasks |
| [SMS.md](SMS.md) | OTP de recuperação de senha |
| [INTEGRACAO_EXTERNA.md](INTEGRACAO_EXTERNA.md) | Contrato sistema externo |
| [PROMPT_REPLICAR_API_INTEGRACAO_EXTERNA.md](PROMPT_REPLICAR_API_INTEGRACAO_EXTERNA.md) | Prompt de replicação sistema externo |
| [prompt-integracao-isend-sms.md](prompt-integracao-isend-sms.md) | Prompt de replicação iSend |

Documentação do sistema (front + back): [../../docs/](../../docs/).
