# Integrações

## externo (Sistema de Gestão de Integração)

O sistema externo faz **pull** de atividades administrativas (criação de processo, análise/vencedores) agrupadas por matrícula do administrador.

- Contrato e exemplos: [../back-end-selecao/docs/INTEGRACAO_EXTERNA.md](../back-end-selecao/docs/INTEGRACAO_EXTERNA.md)
- Endpoint no Swagger: tag **Integração externa** em `/api/docs/`
- Prompt de replicação (dev): [../back-end-selecao/docs/PROMPT_REPLICAR_API_INTEGRACAO_EXTERNA.md](../back-end-selecao/docs/PROMPT_REPLICAR_API_INTEGRACAO_EXTERNA.md)

## SMS (recuperação de senha — iSend)

OTP por SMS via SOAP iSend, com código em Redis e auditoria sem plaintext do OTP.

- Operação: [../back-end-selecao/docs/SMS.md](../back-end-selecao/docs/SMS.md)
- Prompt de replicação (dev): [../back-end-selecao/docs/prompt-integracao-isend-sms.md](../back-end-selecao/docs/prompt-integracao-isend-sms.md)
- UI: `/auth/recuperar-senha`

## E-mail (SMTP)

Verificação de cadastro, reset de senha e notificações de processo em análise. Variáveis `EMAIL_*` no `.env.exemple` do backend.

## ViaCEP (frontend)

Consulta de endereço no formulário de inscrição (`https://viacep.com.br/...`). Não passa pelo backend.
