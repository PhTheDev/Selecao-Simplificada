# Modelos

## Visão geral

```
User (Django auth)
 ├── AdministratorProfile (1:1) — role, matricula, department, is_active
 └── Candidate (1:1, opcional) — perfil, documentos, email_verified
       ├── EmailVerification (*)
       ├── PasswordResetToken (*)
       ├── SMSVerification (*) — auditoria (sem OTP em texto)
       └── Application (*) ── SelectionProcess
             ├── Stage1Evaluation (1:1)
             └── Stage2Evaluation (1:1)

SelectionProcess
 ├── NoticeDocument (*)
 ├── enrollments → Application (*)
 ├── created_by → User
 └── IntegrationActivity (*) ── M2M users (avaliadores)

IntegrationToken — token estático sistema externo
```

`BaseModel` em `selection` adiciona timestamps comuns onde aplicável.

## SelectionProcess

- Campos de datas (início/fim de inscrição), pesos de critérios (soma 100% quando ativos), benefícios, pré-requisitos, banner, `slug`, `status`, estágio de análise, `is_active`.
- Status: `created`, `in_application`, `in_analysis`, `finished`.

## Application

- Vínculo candidato ↔ processo; documentos (identity, school records, CV, etc.); status da inscrição; ranking / scores / winner status.

## AdministratorProfile

- `matricula` obrigatória (4–10 dígitos, única) — usada na exportação sistema externo.
- Papel atual do produto: `super_admin`.

## Integração

- `IntegrationToken`: nome, token, ativo.
- `IntegrationActivity`: descrição da atividade + usuários envolvidos.

Arquivos: `selection/*/models.py`, `administrator/models.py`, `integration/models.py`.
