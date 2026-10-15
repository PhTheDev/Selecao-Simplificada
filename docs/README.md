# Documentação do sistema — Seleção Simplificada

Portal e API para processos seletivos de estágio da Seleção Simplificada: candidatura pública, área do candidato e painel administrativo.

## Como navegar

| Documento | Conteúdo |
|-----------|----------|
| [ARQUITETURA.md](ARQUITETURA.md) | Monorepo, papéis, stack e diagrama de contexto |
| [SETUP.md](SETUP.md) | Ambiente local (Docker + frontend) |
| [AUTENTICACAO.md](AUTENTICACAO.md) | JWT candidato vs admin, cookies, verificação de e-mail |
| [FLUXOS.md](FLUXOS.md) | Ciclo do processo, inscrição, etapas e vencedores |
| [DEPLOY.md](DEPLOY.md) | Produção, mídia e variáveis relevantes |
| [INTEGRACOES.md](INTEGRACOES.md) | externo e SMS (iSend) |

## Documentação por projeto

- **Backend:** [../back-end-selecao/docs/](../back-end-selecao/docs/) — modelos, API, Celery, SMS
- **Frontend:** [../front-end-selecao/docs/](../front-end-selecao/docs/) — rotas, auth no browser, funcionalidades

## Swagger (fonte da verdade da API)

Com o backend rodando:

| Interface | URL |
|-----------|-----|
| Swagger UI | `/api/docs/` |
| ReDoc | `/api/redoc/` |
| Schema OpenAPI | `/api/schema/` |

Não duplique contratos de request/response nos Markdowns: use o Swagger.
