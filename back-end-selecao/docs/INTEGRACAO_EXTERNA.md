# Integração externa — API de atividades

> **Swagger:** com a API no ar, veja a tag **Integração externa** em `/api/docs/` (schema em `/api/schema/`).

Documentação da API que permite ao **sistema externo** consultar atividades realizadas no sistema de seleçãa Seleção Simplificada.

## Visão geral

O sistema externo consulta (pull) um endpoint REST que retorna atividades agrupadas por usuário administrador. Cada usuário é identificado pela **matrícula** padronizada entre os sistemas (ex.: `133755`).

### Atividades exportadas

| Atividade | Quando é registrada | Origem dos dados |
|-----------|---------------------|------------------|
| **Criação do processo seletivo {título}** | Admin cria um processo seletivo | `SelectionProcess.created_by` + `created_at` |
| **Análise do processo seletivo {título}** | Admin define vencedores (`generate_winners`) | `IntegrationActivity` com todos os avaliadores das etapas 1 e 2 |

Usuários **sem matrícula cadastrada** não aparecem na resposta.

---

## Autenticação

A API usa um **token estático** (sem expiração), cadastrado no **Django Admin** do Seleção.

### Cadastrar o token (Seleção)

1. Acesse `/admin/`
2. Vá em **Integração externa → Tokens de integração**
3. Clique em **Adicionar token de integração**
4. Preencha:
   - **Nome:** ex. `externo produção`
   - **Token:** gere um valor seguro (ex.: `python -c "import secrets; print(secrets.token_hex(32))"`)
   - **Ativo:** marcado
5. Salve

Use o **mesmo valor** no cadastro da conexão dinâmica no sistema externo.

### Headers aceitos

| Header | Exemplo |
|--------|---------|
| `Authorization: Bearer <token>` | Recomendado (guia externo) |
| `Authorization: <token>` | Aceito |
| `X-Integration-Token: <token>` | Alternativa |

Requisições sem token ou com token inválido/inativo são rejeitadas.

---

## Endpoint

```
GET /api/integration/activities/
```

### Query params (opcionais)

| Parâmetro | Formato | Descrição |
|-----------|---------|-----------|
| `since` | `YYYY-MM-DD` | Retorna atividades a partir desta data |
| `until` | `YYYY-MM-DD` | Retorna atividades até o fim deste dia |

### Exemplo de requisição

```http
GET /api/integration/activities/?since=2025-01-01
Authorization: Bearer seu-token-aqui
Host: localhost
```

### Exemplo de resposta (`200 OK`)

```json
[
  {
    "user": {
      "id": 1,
      "matricula": "133755",
      "email": "admin@example.com",
      "name": "João Silva"
    },
    "activities": [
      {
        "activity": "Criação do processo seletivo Estágio Administrativo 2025",
        "created_at": "2025-06-01T10:00:00-03:00"
      },
      {
        "activity": "Análise do processo seletivo Estágio Administrativo 2025",
        "created_at": "2025-06-20T15:30:00-03:00"
      }
    ]
  }
]
```

---

## Matrícula dos administradores

- Campo obrigatório em **novos cadastros** e ao **editar** administradores existentes.
- Formato: apenas números, 4 a 10 dígitos (ex.: `133755`).
- Única no sistema.
- Configurável em: **Painel Admin → Configurações → Administradores**.

Administradores criados antes desta versão precisam ter a matrícula preenchida manualmente para aparecer na API.

---

## Deploy

1. Aplicar migrations:

```bash
python manage.py migrate
```

2. Cadastrar o token no Django Admin (**Integração externa → Tokens de integração**).
3. Configurar o mesmo token na conexão dinâmica do sistema externo.
4. Reiniciar o serviço Django se necessário após o migrate.

---

## Limitações

- Dados históricos (processos/avaliações anteriores à migração) não têm `created_by` / `evaluated_by` e **não aparecem** na API.
- A atividade de análise é criada/atualizada apenas quando `generate_winners` é executado (não ao avançar etapas individualmente).
- Re-gerar vencedores **atualiza** a mesma atividade de análise (não duplica).

---

## Arquivos principais

| Arquivo | Responsabilidade |
|---------|------------------|
| `integration/views.py` | Endpoint GET |
| `integration/authentication.py` | Validação do token |
| `integration/services.py` | Montagem do payload agrupado por usuário |
| `integration/models.py` | `IntegrationActivity` |
| `administrator/models.py` | Campo `matricula` |
| `selection/selectionprocess/models.py` | Campo `created_by` |
| `selection/evaluation/models.py` | Campo `evaluated_by` |
