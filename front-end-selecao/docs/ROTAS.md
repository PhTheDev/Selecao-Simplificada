# Rotas

Grupos em `app/(Pages)/` **não** alteram a URL; só organizam o código.

## Público (`(Home)`)

| URL | Função |
|-----|--------|
| `/` | Landing (hero, processos abertos, features) |
| `/processos-seletivos` | Lista/filtro de processos |
| `/editais` | Processos com foco em download de editais |
| `/faq` | FAQ estático |
| `/aplicar/[slug]` | Formulário de inscrição (3 passos; exige login de candidato para enviar) |

## Auth (`(Auth)`)

| URL | Função |
|-----|--------|
| `/auth/login-candidato` | Login candidato |
| `/auth/login-admin` | Login administrador |
| `/auth/register` | Cadastro candidato |
| `/auth/recuperar-senha` | Recuperação por e-mail **ou** SMS |
| `/auth/redefinir-senha` | Nova senha com `?token=` (fluxo SMS) |
| `/auth/error` | Erro genérico de auth |
| `/password-reset` | Fluxo legado só e-mail |
| `/password-reset/success` | Sucesso do pedido por e-mail |
| `/password-reset-confirm/[uid]/[token]` | Confirmação via link de e-mail |

**Canônico para recuperação:** preferir `/auth/recuperar-senha`.

## Candidato (`/candidato/*`)

Requer cookie `access-token`.

| URL | Função |
|-----|--------|
| `/candidato` | Dashboard |
| `/candidato/perfil` | Editar perfil |
| `/candidato/meus-processos` | Inscrições e status |
| `/candidato/editar-inscricao/[id]` | Editar inscrição (se período aberto) |

## Admin (`/painel-admin/*`)

Requer cookie `admin-access-token`.

| URL | Função |
|-----|--------|
| `/painel-admin` | Dashboard |
| `/painel-admin/processos` | Lista / gestão de processos |
| `/painel-admin/processos/novo` | Criar processo |
| `/painel-admin/processos/analise/[slug]` | Pipeline de análise |
| `/painel-admin/candidatos/[id]` | Detalhe do candidato |
| `/painel-admin/configuracoes` | CRUD de administradores (`super_admin`) |
| `/painel-admin/perfil` | Perfil do admin |
