# Autenticação no frontend

## Cookies

### Candidato

| Cookie | Uso |
|--------|-----|
| `access-token` | JWT access |
| `refresh-token` | JWT refresh |
| `auth_user` | Dados do usuário (UI) |

Helpers: `utils/candidateAuth.ts` (`setCandidateSession`, `fetchWithCandidateAuth` com refresh em 401).

### Administrador

| Cookie | Uso |
|--------|-----|
| `admin-access-token` | JWT access (1 hora) |
| `admin-refresh-token` | JWT refresh (7 dias) |
| `admin-user` | Dados do admin |

Helpers: `utils/adminAuth.ts`.

Os dois universos **não** compartilham tokens. Ter cookie de admin não autoriza área de candidato (e vice-versa).

## Fluxos

### Candidato

1. Register → mensagem de verificação de e-mail
2. Login → cookies
3. Layout `/candidato` chama `GET .../candidates/me/`
4. Logout limpa cookies (+ endpoint de logout quando usado)

### Admin

1. Login com username/password
2. Layout valida presença/validade do JWT admin
3. Não há recuperação de senha pública no UI (contato com suporte)

### Recuperação de senha

- **Preferencial:** `/auth/recuperar-senha` (e-mail ou SMS → `/auth/redefinir-senha?token=`)
- **Legado:** `/password-reset` → e-mail → `/password-reset-confirm/...`

## Middleware

O arquivo `middleware.ts` na **raiz** do frontend (ao lado de `app/`) protege `/painel-admin` e `/candidato` no edge, checando cookies JWT (estrutura + `exp`). A assinatura do token continua sendo validada pelo Django nas APIs.
