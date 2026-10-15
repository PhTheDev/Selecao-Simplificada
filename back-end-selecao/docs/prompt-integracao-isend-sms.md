# Prompt: Integração iSend SMS (recuperação de senha por OTP)

Use este prompt em outro projeto (Django, Laravel, Node, etc.) para replicar a integração validada na Seleção Simplificada.

---

## Prompt (copiar e colar)

```
Implemente recuperação de senha por SMS com OTP usando iSend (Intelly) SOAP + Redis.

## Escopo
- Apenas fluxo de recuperação de senha (não é verificação genérica de telefone).
- Dois endpoints públicos com rate limit:
  - POST /password_reset_sms_request  { "phone": "62999999999" }
  - POST /password_reset_sms_verify   { "verification_id": "...", "code": "123456" }
- Resposta do verify deve retornar reset_token para concluir a troca de senha.

## Provedor iSend (SOAP)

### 1) Autenticação (token de sessão, TTL 12h)
- WSDL: http://www2.isend.com.br/iSend/ws/PartnerSendIntegrationWs?wsdl
- Operação: getAccessToken
- Request: username (login do painel), password (TEXTO PURO — mesma senha do app.isend.com.br)
- IMPORTANTE: a documentação iSend cita MD5, mas este endpoint rejeita MD5 e aceita senha em texto puro.
- Response: accessToken, expirationDate
- Cachear accessToken no Redis por 12h (chave ex.: isend:auth:token).
- Antes de cada envio SMS: usar token do cache; se ausente/expirado, autenticar novamente.

### 2) Envio SMS unitário
- WSDL: http://www2.isend.com.br/SendWSImplService/SendWSImpl?wsdl
- Operação: unitarySms
- Parâmetros:
  - token: accessToken da autenticação
  - sms.cell_phone_ddd: "62"
  - sms.cell_phone: "999999999" (sem DDD)
  - sms.text: mensagem com OTP
  - sms.long_sms: 0 ou 1
  - sms.enable_answer: 0
  - sms.schedule_sms: false
- Response: success, sms_ctr (id do envio), sms_error (códigos 1–7 documentados)

## OTP (Redis)
- Gerar verification_id (UUID) no request; nunca expor OTP na API nem no banco.
- Armazenar no Redis: hash SHA-256 do código, candidate_id, attempts, TTL 300s.
- Código: 6 dígitos numéricos.
- Cooldown de reenvio por phone_hash: 60s.
- Máximo 5 tentativas de verificação; depois bloquear.
- OTP em texto claro só na task de envio SMS (nunca em logs).

## Auditoria (PostgreSQL)
- Tabela SMSVerification: verification_id, phone_hash, ddd, status (PENDING/SENT/FAILED/VERIFIED/EXPIRED/BLOCKED), sms_ctr, error_code, error_message, sent_at, verified_at, expires_at, attempts.
- Não persistir OTP nem telefone completo.

## Segurança e UX (produção)
- Anti-enumeração: request sempre retorna 200 com mensagem genérica:
  "Se este número estiver cadastrado, enviaremos um código por SMS."
  (exceto cooldown 429)
- Telefone inválido ou não cadastrado: mesma resposta genérica 200.
- Verify: mensagens específicas apenas para código inválido/expirado/bloqueado.
- Logs: mascarar telefone (*******1234), nunca logar OTP, token ou senha.
- SMS_DEBUG_EXPOSE_ERRORS=false em produção.

## Envio assíncrono
- Request cria auditoria PENDING e enfileira task (Celery/RQ).
- Task: gera OTP → Redis → envia SMS → atualiza auditoria SENT ou FAILED.

## Variáveis de ambiente
SMS_PROVIDER=isend|console
ISEND_USERNAME=
ISEND_PASSWORD=          # texto puro do painel
ISEND_AUTH_WSDL=http://www2.isend.com.br/iSend/ws/PartnerSendIntegrationWs?wsdl
ISEND_WSDL=http://www2.isend.com.br/SendWSImplService/SendWSImpl?wsdl
ISEND_TOKEN_TTL=43200
SMS_VERIFICATION_TTL=300
SMS_VERIFICATION_RESEND_COOLDOWN=60
SMS_DEBUG_EXPOSE_ERRORS=false

## Dev local
- SMS_PROVIDER=console imprime OTP no stdout do worker (somente DEBUG).
- Testes unitários com mocks SOAP; testes de API com Celery eager.

## Checklist de validação
1. Auth getAccessToken com senha em texto puro retorna accessToken.
2. unitarySms com token retorna success=1 e sms_ctr.
3. Request com telefone cadastrado → SMS no celular em até 30s.
4. Verify com código correto → reset_token.
5. Logs sem OTP/telefone completo/token.
6. Request com telefone inexistente → mesma mensagem 200 (sem vazar existência).
```

---

## Referência rápida (Seleção Simplificada)

| Componente | Arquivo |
|------------|---------|
| Auth + cache Redis | `selection/candidate/isend_auth.py` |
| Envio SOAP | `selection/candidate/isend.py` |
| Gateway SMS | `selection/candidate/sms.py` |
| OTP Redis | `selection/candidate/otp.py` |
| Task Celery | `selection/tasks.py` → `send_password_reset_sms` |
| API | `selection/candidate/views.py` |
| Frontend | `front-end-selecao/app/(Pages)/(Auth)/auth/recuperar-senha/page.tsx` |

## Erros comuns

| Sintoma | Causa |
|---------|--------|
| Unable to generate access token | Senha em MD5 no .env (usar texto puro) ou credenciais erradas |
| Token inválido no envio | Token expirado; renovar via getAccessToken |
| SMS não chega, API 200 | SMS_PROVIDER=console ou falha silenciosa na task (ver auditoria FAILED) |
| Docker com senha antiga | Recriar containers após alterar `.env` |
