# Autenticação e permissões

## JWT (SimpleJWT)

| Item | Valor típico |
|------|----------------|
| Access | 1 dia |
| Refresh | 7 dias |
| Header | `Authorization: Bearer <access>` |
| Rotação | Ativa + blacklist no logout |

Refresh compartilhado: `POST /api/selection/auth/token/` com `{ "refresh": "..." }`.

Classes padrão em `REST_FRAMEWORK`: `JWTAuthentication` + `SessionAuthentication`. Permissão default: `IsAuthenticated` (endpoints públicos sobrescrevem com `AllowAny`).

## Atores

| Ator | Como autentica |
|------|----------------|
| Candidato | Login/register em `/api/selection/candidates/` |
| Administrador | Login/register em `/api/administration/administrators/` |
| externo | `IntegrationToken` (`IntegrationTokenAuthentication`) |

## Permissões customizadas

Em `selection/permissions.py` (resumo):

- `IsAdminOrReadOnly` — leitura pública / escrita staff
- `IsAdminOnly` / `IsOwnerOrAdmin` — conforme uso nas views

Staff (`is_staff` / `IsAdminUser`) controla escrita em processos e destroy de candidatos.

## Throttles

Definidos em `core/throttles.py` / `DEFAULT_THROTTLE_RATES`:

| Escopo | Limite |
|--------|--------|
| `login` | 10/min |
| `sms_reset` | 3/hora |

## Register de admin

- Primeiro admin: sem JWT, se não existir nenhum perfil.
- Depois: apenas `super_admin`.
- Destroy: soft-delete (`is_active=False` no perfil e no User).
