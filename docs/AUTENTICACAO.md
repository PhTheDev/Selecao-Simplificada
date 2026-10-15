# Autenticação (visão do sistema)

O sistema mantém **dois universos JWT** separados: candidato e administrador. O sistema externo usa token estático, não JWT.

## Candidato

1. **Registro** → `POST /api/selection/candidates/register/`
2. **Verificação de e-mail** → link `GET .../verify-email/{token}/` (HTML)
3. **Login** → `POST /api/selection/candidates/login/` → `access` + `refresh`
4. Frontend grava cookies: `access-token`, `refresh-token`, `auth_user`
5. Chamadas autenticadas: `Authorization: Bearer <access>`
6. Refresh: `POST /api/selection/auth/token/` com `{ "refresh": "..." }`

### Recuperação de senha

| Canal | Fluxo resumido |
|-------|----------------|
| E-mail | `password_reset_request` → link → `password_reset_confirm` |
| SMS | `password_reset_sms_request` → OTP → `password_reset_sms_verify` → `reset_token` → `password_reset_confirm` |

No frontend: `/auth/recuperar-senha` (e-mail ou SMS) e rotas legadas `/password-reset*`.

## Administrador

1. **Login** → `POST /api/administration/administrators/login/` (`username` / `password`)
2. Cookies: `admin-access-token`, `admin-refresh-token`, `admin-user`
3. Logout: blacklist do refresh (`.../logout/`)
4. Papel efetivo no produto: `super_admin` (CRUD de outros admins nas Configurações)

## Guards no frontend

- Layouts `/candidato` e `/painel-admin` validam sessão (me / JWT).
- Tokens de admin e candidato **não** são compartilhados.

## externo

Token estático no Django Admin → header `Authorization: Bearer <token>` ou `X-Integration-Token`.

Detalhes de backend: [../back-end-selecao/docs/AUTENTICACAO.md](../back-end-selecao/docs/AUTENTICACAO.md).  
Detalhes de frontend: [../front-end-selecao/docs/AUTENTICACAO.md](../front-end-selecao/docs/AUTENTICACAO.md).
