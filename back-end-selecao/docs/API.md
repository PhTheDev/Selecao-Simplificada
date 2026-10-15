# Mapa da API

A documentação interativa completa está em **`/api/docs/`** (Swagger). Este arquivo só organiza os prefixos.

## Prefixos

| Prefixo | App | Conteúdo |
|---------|-----|----------|
| `/api/administration/` | `administrator` | Administradores (CRUD, login, register, me, logout) |
| `/api/selection/` | `selection` | Candidatos, processos, inscrições, editais, refresh JWT |
| `/api/integration/` | `integration` | Atividades externo |
| `/api/schema/` | spectacular | OpenAPI JSON/YAML |
| `/api/docs/` | spectacular | Swagger UI |
| `/api/redoc/` | spectacular | ReDoc |
| `/admin/` | Django | Admin site |
| `/media/` | uploads | Arquivos de mídia |

## Selection — recursos principais

| Recurso | Base |
|---------|------|
| Candidatos | `/api/selection/candidates/` |
| Processos (lookup por `slug`) | `/api/selection/selection-processes/` |
| Inscrições | `/api/selection/applications/` |
| Documentos de edital | `/api/selection/notice-documents/` |
| Refresh JWT | `POST /api/selection/auth/token/` |

## Tags no Swagger

Administração · Candidatos · Processos seletivos · Inscrições · Editais · Integração externa · Autenticação JWT

## Observações

- Avaliações etapa 1/2 **não** têm ViewSet exposto; use actions em `applications`.
- Processos: retrieve padrão por **slug**; algumas actions administrativas usam `pk` no path.
