# Funcionalidades

## Portal público

- Landing com processos em destaque
- Listagem de processos seletivos e editais
- FAQ e contatos (config em `config/ConselhoConfig.ts`)
- Página de inscrição por slug (`/aplicar/[slug]`)

## Inscrição (3 passos)

1. Dados pessoais / acadêmicos / endereço (ViaCEP)
2. Documentos (RG/CPF, histórico, CV, declaração de frequência, certificados, portfólio)
3. Campos extras + envio (`POST /api/selection/applications/`)

Requer candidato logado com e-mail verificado.

## Área do candidato

- Dashboard com KPIs e atalhos
- Meus processos / status
- Edição de inscrição no período aberto
- Perfil (CPF, telefone, faculdade, foto, etc.)

## Painel administrativo

- CRUD de processos (pesos, datas, benefícios, banner, editais)
- Análise por slug: etapa 1 (documentos) → etapa 2 (entrevista) → ranking / vencedores
- Finalizar / reabrir processo
- Detalhe do candidato
- Configurações: gerenciar administradores (**super_admin**)
- Perfil do administrador

## Clientes de API

| Módulo | Papel |
|--------|-------|
| `api/publicClient.ts` | Chamadas públicas |
| `utils/candidateAuth.ts` | Fetch autenticado candidato |
| `utils/adminAuth.ts` / headers inline | Painel admin |
| `api/hooks/*` | TanStack Query |

Contratos HTTP: Swagger do backend (`/api/docs/`).
