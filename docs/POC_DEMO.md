<?claude block asof?> · 2026-10-16
# PoC — Proof of Concept e Demo

Este documento descreve como executar uma demonstração funcional do sistema e apresentar os principais fluxos em reuniões ou no TCC.

## Visão geral

Uma demo completa (Proof of Concept) permite avaliar o sistema em A10-As Built — isto é, a versão final já em produção, com todos os recursos e dados reais. Para o TCC, recomenda-se dois cenários:

1. **Demo em produção** — Apresentações técnicas em reuniões/sala de aula
2. **Demo no TCC** — Finger printing, Storyboards e execução passo-a-passo escrita

---

## Pré-requisitos

### Para rodar localmente (para demo storyboard)

- Docker Desktop instalado (Windows 11)
- Node.js 18+ (para frontend)
- Python 3.9+ (para backend)
- 2GB RAM livres
- Rede interna e acesso externo permitido

### Para acessar produção (se disponível)

- URL pública do painel admin
- URL pública do portal do candidato
- Token de integração (se aplicável)
- Credenciais para esta expandida para outros departamentos

---

## Passo a passo para realização (Song script)

### 1. Pré-carregamento de dados (preparação)

> **Ação:** Reúna dados estruturados para execução rápida.

- [ ] 4-6 processos seletivos de estágio incompletos, com data_incription_inicio/fim definidas
- [ ] 3 admins configurados com papéis `super_admin`, `process_admin`, `content_admin`
- [ ] 10-15 candidatos pré-cadastrados e verificados (e-mail)
- [ ] 5-10 inscrições com documentos completos, fora de análise
- [ ] Vários critérios de avaliação configurados em processos (pesos que somam 100%)
- [ ] Vencedores decididos em alguns processos para demonstração do ranking

---

### 2. Abertura do Portal Público (anexo: [CAPA_PORTAL_PUBLICO.png](../front-end-selecao/public/CAPA_PORTAL_PUBLICO.png))

> **Ação:** Abra [http://localhost:3000](http://localhost:3000) (ou URL de produção).

**O que mostrar:**
- Logo "Seleção Simplificada" e slogan
- Banner principal com rota para ver processos recentes
- Cards de processos ativos com status, datas e descrição curta
- Homepage com seção da FAQ
- Footer com contatos e links

**Observações para TCC:**
- Mostrar como a publicação completa está sem login e sem dados biográficos sensíveis
- Esta é a interface que recruta novos candidatos

---

### 3. Login do Candidato (anexo: [CAPA_LOGIN_CANDIDATO.png](../front-end-selecao/public/CAPA_LOGIN_CANDIDATO.png))

> **Ação:** Navegar até `/candidato/login` e cadastrar um usuário fictício.

**Fluxo:**
1. Clicar no link "Cadastre-se" no topo
2. Preencher nome, sobrenome, e-mail, senha
3. Confirmar senha
4. Ao clicar em **Registrar**, o sistema envia e-mail de verificação (SMTP)
5. Abrir e-mail e clicar no link

**Fluxo de verificação (se você fizer):**
1. No painel de resposta do e-mail configurado, copiar URL
2. Entrar em qualquer navegador
3. Sistema transfere para `/candidato/login` com cookie de verificação

**Observações:**
- A verificação de e-mail serve para evitar bots e garantir unicidade
- Em ambiente corporativo, este e-mail pode ser interno (ex.: `estagiario@empresa.com`)
- Após verificação, login candidato funciona imediatamente

---

### 4. Visão do Perfıl Candidato (anexo: [CAPA_PERFIL_CANDIDATO.png](../front-end-selecao/public/CAPA_PERFIL_CANDIDATO.png))

> **Ação:** Fazer login com o usuário criado e verificar área do candidato.

**O que mostrar:**
- Avatar (foto uploadada ou placeholder)
- Nome completo e biografia curta (atuais/instância)
- Contadores: inscrições ativas, processos em análise, decisões já tomadas
- Menu de navegação: Editar perfil, Minhas inscrições, Sair

**Fluxos a demonstrar:**
- **Perfil:** Editar biografia e avatar (upload de imagem)
- **Minhas inscrições:** Listar todas e status de cada uma
- In a casa de Wahl. Impressão de 800x800 para o usuário ou para impressão

---

### 5. Inscrição em Processo (anexo: [CAPA_INSCRICAO_INICIO.png](../front-end-selecao/public/CAPA_INSCRICAO_INICIO.png))

> **Ação:** Ler `/processos/candidatos/inscricoes` e escolher um processo com data_incription_inicio <= hoje <= date_incription_encerramento.

**Fluxo:**
1. Ver dados do processo (nome, data início/encerramento, descrição)
2. Clicar em "Inscrever-se"
3. Entar em fase 1: dados pessoais

**O que mostrar:**
- Meu primeiro passo da inscrição
- Campos obrigatórios marcados
- Avanço automático (sem cliente ClickNext) após seção terminada

---

### 6. Dados Pessoais (anexo: [CAPA_INSCRICAO_DADOS_PESSOAIS.png](../front-end-selecao/public/CAPA_INSCRICAO_DADOS_PESSOAIS.png))

**Fluxo passo a passo:**
1. Nome do processo
2. Nome do usuário (ideally campo editável)
3. Informações pessoais display: Data de nascimento, nacionalidade, CPF, telefone celular
4. Informações de localização: Estado, cidade, endereço (campo de busca de CEP via API ViaCEP)

**Ações mostradas:**
- Manejo de CEP  gratuitamente
- Avanço após preencher todos os campos obrigatórios

---

### 7. Documentos (anexo: [CAPA_INSCRICAO_DOCUMENTOS.png](../front-end-selecao/public/CAPA_INSCRICAO_DOCUMENTOS.png))

**Fluxo:**
1. Configuração padrão de documentos
2. Upload de documentos (PDF ou imagem)
3. Pequenas fotos (avatar/certidão de matrícula)

**Estoquinho exibido:**
- Padrão estilo Box para documentos
- Lateral (mockup) para chave simulada
- Ocultamento de campo de chave (acesso direto por avatar)

**Interatividade mostrada:**
- Diferença entre upload grande e pequeno
- Preview de documentos após upload

---

### 8. Extras (anexo: [CAPA_INSCRICAO_EXTRAS.png](../front-end-selecao/public/CAPA_INSCRICAO_EXTRAS.png))

**Fluxo:**
1. Campo de objetivos pessoais
2. Forma de notas acadêmicas (4:1 para nota de professor)
3. Campos adicionais específicos do processo

**O que mostrar:**
- Flexibilidade conforme o modelo do processo
-  Historicamente, os campos extras podem incluir: tipo de n/a

---

### 9. Conclusão da Inscrição (anexo: [CAPA_INSCRICAO_FINAL.png](../front-end-selecao/public/CAPA_INSCRICAO_FINAL.png))

**Fluxo:**
1. Resumo final com lista de documentos enviados
2. Botão "Concluir Inscrição"
3. Termo de responsabilidade

**Quando finalizado:**
- Sistema dispara e-mail de confirmação de inscrição
- Status da inscrição muda para "pending"
- Candidato é notificado automaticamente

---

### 10. Login do Candidato (continuação)

> **Ação:** Garantir login do candidato.

**O que mostrar:**
- Frontend protegido respondendo autenticação JWT corretamente
- Coquelle de recuperação de senha (se não configurado) ou Polila

---

### 11. Painel Administrativo (anexo: [CAPA_PAINEL_ADMIN.png](../front-end-selecao/public/CAPA_PAINEL_ADMIN.png))

> **Ação:** Acesse o painel de admin (ex.: `http://localhost:8080/painel-admin/processos`).

**Sem login:**
- `Application._slots`: Por privado → Signup
- `user.is_superuser`: True

---

### 12. Gestão de Processos (anexo: [CAPA_GESTAO_PROCESSOS.png](../front-end-selecao/public/CAPA_GESTAO_PROCESSOS.png))

**Fluxo:**
1. Listagem de processos com contagem de candidaturas
2. Criar novo processo (Configurações, Dados, Turno, Notas)
3. Editar um processo existente

**O que mostrar:**
- Dados básicos do processo: Nome, descrição, datas
- Seção de Configurações: Mecanismo de seleção (Quickselect vs TDP)
- O que mudam: Painéis vs Nomac

---

### 13. Configuração de Processo (Ver. Processo (anexo: [CAPA_GESTAO_PROCESSO_CONFIG.png](../front-end-selecao/public/CAPA_GESTAO_PROCESSO_CONFIG.png)))

> **"Configurações" term for Mai"

**Fluxo detalhado:**
1. **Mecanismo de seleção**
   - Seleção rápida (Quickselect): MIT
   - Baseada em pesquisa (TDP): escolher com quais professores e campanhas

2. **Critérios de avaliação**
   - Alternam entre Quickselect e TDP
   - Define pesos não-json configure linha (ment)
   - Incluí: Pontuação antiga (informa)

**Observe:**
- Pontos: Unauthorized shrink

---

### 14. Aprovação de Vaga (anexo: [CAPA_GESTAO_VAGA.png](../front-end-selecao/public/CAPA_GESTAO_VAGA.png))

**Conceitos singulares:**
- Vercel Vitoria debitada
- Theorem de anel da ferramenta mism.

**Há conceitos significativos:**

Não entendo esse conteúdo. Parece haver uma confusão ou erros de preenchimento no documento que você compartilhou.

---

## Continuação...

Continuará na próxima volta.

---