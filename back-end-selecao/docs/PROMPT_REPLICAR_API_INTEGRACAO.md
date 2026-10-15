# Prompt reutilizável — API de integração externa

Copie o bloco abaixo, preencha os campos entre `[colchetes]` e cole no Cursor (ou outro agente) no repositório do sistema que deseja integrar.

---

## PROMPT (copiar a partir daqui)

```
Quero criar uma API de integração com o sistema externo (Sistema de Gestão de Integração) no projeto [NOME_DO_SISTEMA / STACK: ex. Django, NestJS, Laravel].

O sistema externo vai CONSULTAR (pull) nossa API via GET. Não é webhook/push.

### Contexto do sistema
- Repositório: [caminho ou descrição]
- Stack: [ex. Django 5 + DRF / Node + Express / etc.]
- Usuários que executam as atividades: [ex. administradores / operadores / staff]
- Identificador padronizado entre sistemas: **matrícula** (numérica, ~6 dígitos, ex. `133755`)

### Atividades que devem ser exportadas

Para cada sistema, defino abaixo quais ações viram atividades. Use este padrão:

| Tipo | Gatilho no sistema | Quem executou | Quando (`created_at`) |
|------|-------------------|---------------|------------------------|
| [ATIVIDADE_1: ex. Cadastro de X] | [ex. POST criar recurso Y] | [campo user/admin que criou] | [timestamp da criação] |
| [ATIVIDADE_2: ex. Análise/conclusão de X] | [ex. ação que finaliza o fluxo] | [todos os usuários que participaram] | [timestamp da conclusão] |

**Regras de negócio (ajuste conforme o sistema):**
- Atividade 1: uma por recurso criado; nome legível: `"Criação de [tipo] [nome/título do recurso]"`.
- Atividade 2: uma por fluxo concluído; incluir TODOS os usuários que participaram (ex. avaliadores etapa 1 + etapa 2); nome: `"Análise de [tipo] [nome/título]"`.
- Usuários **sem matrícula** cadastrada devem ser **omitidos** da resposta.

### Formato da resposta (agrupado por usuário)

```json
[
  {
    "user": {
      "id": 1,
      "matricula": "133755",
      "email": "usuario@empresa.org.br",
      "name": "Nome Completo"
    },
    "activities": [
      {
        "activity": "Criação de [recurso] Exemplo 2025",
        "created_at": "2025-06-01T10:00:00-03:00"
      }
    ]
  }
]
```

### Endpoint

```
GET /api/integration/activities/
```

Query params opcionais: `?since=YYYY-MM-DD&until=YYYY-MM-DD` (filtrar por `created_at`).

### Autenticação

- Token estático **sem expiração** (não usar JWT).
- Cadastrar o token no **Django Admin** (modelo `IntegrationToken`), não no `.env`.
- Mesmo valor na conexão dinâmica do sistema externo.
- Headers aceitos:
  - `Authorization: Bearer <token>` (recomendado)
  - `Authorization: <token>` (sem Bearer)
  - `X-Integration-Token: <token>` (alternativa)
- Requisição sem token ou inválida → rejeitar (401/403).
- Comparação segura do token (`secrets.compare_digest` ou equivalente).

### O que implementar

1. **Campo `matricula`** no perfil do usuário que executa atividades:
   - Numérica, 4–10 dígitos, única, obrigatória em cadastro/edição.
   - UI de admin para preencher (se houver frontend).

2. **Campos de auditoria** nos modelos existentes:
   - `created_by` no recurso principal da atividade 1.
   - `evaluated_by` / `performed_by` nas ações intermediárias (se atividade 2 agrega participantes).
   - Persistir `request.user` nos fluxos que hoje não gravam quem executou.

3. **Registro da atividade consolidada** (atividade 2):
   - Tabela/modelo `IntegrationActivity` (ou equivalente) com M2M de usuários.
   - `UniqueConstraint` em `(recurso, activity_type)` para não duplicar ao reprocessar.
   - Criar/atualizar no gatilho da atividade 2 (ex. definir vencedor, concluir análise).

4. **App/módulo `integration`**:
   - Service que monta payload agrupado por usuário.
   - View/controller GET público apenas com auth por token.
   - Ignorar usuários sem matrícula.

5. **Testes**:
   - Token ausente/inválido rejeitado.
   - Retorno com matrícula após criar recurso.
   - Atividade 2 com múltiplos usuários.
   - Filtro since/until.
   - Sem duplicar atividade ao reprocessar.

6. **Documentação** em `docs/INTEGRACAO_EXTERNA.md`:
   - Configuração do token nos dois sistemas.
   - Exemplo de request/response.
   - Deploy (migrations, .env).

### Referência de implementação já feita (se útil)

Se o repositório `selecao-simplificada` estiver acessível, use como referência:
- `back-end-selecao/integration/` — app completo
- `back-end-selecao/docs/INTEGRACAO_EXTERNA.md` — documentação
- Atividades: cadastro de processo seletivo + análise ao `generate_winners`

### Entregáveis esperados

- Código implementado e testado (`pytest` / testes do stack).
- Migrations se aplicável.
- Documentação `docs/INTEGRACAO_EXTERNA.md`.
- Token cadastrável no Django Admin (`IntegrationToken`).
- Commit convencional: `feat: adicionar API de integração externa com matrícula e rastreamento de atividades`

Não editar arquivos de plano. Implementar diretamente após análise do código existente.
```

---

## Como adaptar para cada sistema

Substitua a tabela de atividades conforme o domínio:

| Sistema | Atividade 1 (criação) | Atividade 2 (conclusão/análise) | Gatilho atividade 2 |
|---------|----------------------|--------------------------------|---------------------|
| Seleção Simplificada | Cadastro processo seletivo | Análise do processo | `generate_winners` |
| [Sistema B] | Cadastro de edital | Publicação do edital | [ação X] |
| [Sistema C] | Abertura de chamado | Resolução do chamado | [ação Y] |

### Checklist antes de colar o prompt

- [ ] Listei as 1–2 atividades que o sistema externo precisa
- [ ] Identifiquei o gatilho exato no código (endpoint/service)
- [ ] Confirmei onde fica o usuário executor (`request.user`, session, etc.)
- [ ] Defini se matrícula já existe ou precisa ser criada
- [ ] Informei stack e caminho do repositório
