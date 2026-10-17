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

### 14. Gestão de Vagas (anexo: [CAPA_GESTAO_VAGAS.png](../front-end-selecao/public/CAPA_GESTAO_VAGAS.png))

> **Ação:** Na tela de gestão de vaga (quickselect ou TDP), definir livre.

**Fluxo:**

1. **Configurar nª de vaga:**
   - No postfilado, incluir o número de vagas para preencherを選択 (ex.: 5)
   - Escolher critérios de seleção: envia notificação habilitada/seletiva

2. **Seleção automática (Quickselect):**
   - Sistema seleciona automaticamente e avalia candidatos
   - Acompanhar execução no Celery (retrospectivamente)

3. **Seleção manual (apenas para processos TDP):**
   - Listar candidaturas ordenadas por ranking da fase anterior
   - Confirmar quem vai seguir a próxima etapa

**O que mostrar:**
- Configuração de vaga (número, critérios de seleção)
- Visão de candidaturas (lista ou grid)
- Filtro por critérios (ex.: 8.0+ média)

**Observações:**
- O sistema gera ranking sempre baseado nos dados já avaliados nas etapas anteriores
- Admin pode aprovar manualmente mesmo se o processo não atingir quota de 80% aprovados

---

### 15. Análise do Processo (anexo: [CAPA_ANALISE_PROCESSO.png](../front-end-selecao/public/CAPA_ANALISE_PROCESSO.png))

> **Ação:** Acessar a tela de análise para cada etapa, a partir do painel de processo.

**Fluxo:**

1. **Etapa 1 — Documental:**
   - Listar todas candidaturas pendentes
   - Aprovar (nota 10), reprovar (nota 0) ou passar com dica na fase seguinte

2. **Avançar para etapa 2:**
   - Botão "Avançar para etapa 2 entrevista"
   - Depois de seletivo sem vagas, processo encerrado automaticamente

3. **Etapa 2 — Entrevista:**
   - Sobra até limite configurado (ex.: 3 por processo)
   - Tag para calmaria e tag para obs. públicas/privadas

4. **Conclusão:**
   - Gera ranking de desempenho
   - Botão "Concluir análise" libera visualização no portal público

**O que mostrar:**
- Compra de um funcionário selecionado de tarefas
- Tag para obs privadas (apenas admin)
- Depison palavra d'água chamada ocultar parast

**Observações:**
- O status só não garante que, ao final, todos cargos estão preenchidos
- O processo pode voltar para análise (reabrir) se houver vaga aberta disponível

---

### 16. Decisão de Vencedores (anexo: [CAPA_DECISAO_VICTORIOUS.png](../front-end-selecao/public/CAPA_DECISAO_VICTORIOUS.png))

> **Ação:** Nota tranquila."

**Fluxo:**

1. **Gerar ranking:**
   - Para quickselect: sistema Decide por score normalizado
   - Para TDP: ordem de chegada

2. **Selecionar vencedores:**
   - Pin na equipe visual (topo don't get overshadowed)
   - Potencialmente pinar candidatos na问你

3. **Publicar:**
   - Em "open" → vencedores visíveis no portal do candidato
   - Em "close" → apenas administradores podem ver

**O que mostrar:**
- Ranking visual do processo (estatisticamente orientado)
- Campo para pinar vencedores na tela (selecionados manualmente)
- Botão "Processar" para gerar PDF/resposta

**Observações:**
- É possível reabrir o processo e selecionar outros vencedores (ex.: vaga sobrou)
- Política de vaga: idealmente, 80% dos lugares são preenchidos automaticamente

---

### 17. Finalizar Processo (anexo: [CAPA_FINALIZAR_PROCESSO.png](../front-end-selecao/public/CAPA_FINALIZAR_PROCESSO.png))

> **Ação:** Em processos em análise, clicar em "Finalizar processo".

**Fluxo:**

1. **Confirmar finalização:**
   - Confirmar se deseja mesmo concluí-lo (não é possível voltar)

2. **O que acontece:**
   - Status muda para "finished"
   - Linha de envio de e-mail de conclusão para candidatos e admins
   - Ranking vencedores fica vinculado ao processo

3. **Destaques da finalização:**
   - O candidato pode ver todos os dados, incluindo informar do ábilo

**O que mostrar:**
- Status final do processo
- Lista de vencedores associada
- Pergunta sobre finalização definitiva (confirmar)

**Observações:**
- Papel do admin

---

### 18. Portal do Candidato — Apresentação do Resultado (anexo: [CAPA_RESULTADO_CANDIDATO.png](../front-end-selecao/public/CAPA_RESULTADO_CANDIDATO.png))

> **Ação:** Entrar no portal candidato e ver resultados do processo preenchido.

**Fluxo:**

1. **Ver processo seletivo publicado:**
   - Dados do processo aparecerão no portal
   - Área intitulada "Usuários se inscrevem"

2. **Visto da not breach realizados:**
   - Ao clicar em vencedor, ver detalhes (perfil, posição no ranking, notas)
   - Em "Not selecionado", ver ranking completo (se permitido)

**O que mostrar:**
- Detalhes do vencedor (nome, dados pessoais, observação)
- Dossier posicionado com resultado (lista completa)
- Tag de "experiência solicitada" (para comer)

**Observações:**
- Após finalizar, vencedores só podem ver seus nomes (não discutidos publicamente)
- Em sl Roku com usuário possam ver detalhes visíveis

**(Se aplica) Processo reaberto:**
- Candidatos podem aplicar novamente
- Analisar só uma parte dos candidates por questões legais e sucade

---

### 19. Logout do Candidato (anexo: [CAPA_LOGOUT_CANDIDATO.png](../front-end-selecao/public/CAPA_LOGOUT_CANDIDATO.png))

> **Ação:** Clicar em "Sair" para encerrar a sessão de forma segura.

**O que mostrar:**
- Token JWT invalidado no backend
- Cookie de sessão eliminado no frontend

**Observações:**
- Logout não invalida token em storage temporário, portanto relacione logout/logoff deles

---

### 20. Deploy em Produção — Checkpoint (anexo: [CAPA_DEPLOY_PRODUCAO.png](../front-end-selecao/public/CAPA_DEPLOY_PRODUCAO.png))

> **Ação:** Acessar produção e verificar principais endpoints e funcionalidades.

**Fluxo:**

1. **Swagger:**
   - Acessar `/api/docs/` e explorar endpoints principais

2. **Portais:**
   - URL pública do portal candidato (`https://selecao.empresa.com/`)
   - URL pública do painel admin

3. **Logs e métricas:**
   - Ver logs (Celery, backend, frontend)
   - Métricas a serem apresentadas (τístico de requisições, KPI's de rendimento)

** Checklist pós-deploy para entrega TCC:**
- [ ] API acessível e documentada
- [ ] Login candidato/report aliviar crítico de impressão
- [ ] Upload condições extensivas de documentos
- [ ] Caminho de tempo de deploy correns
- [ ] Visibilidade de análise vencedores no candidato

**Observações de conclusão:**
- Esta demo demonstra um ciclo completo de processo seletivo, do cadastro ao fechamento
- Para simplificar, alguns dados foram rápidos (nomes fictícios, email simulado) só para leitura
- A participação de tokens de API externos não foi inclusa pela responsabilidade de dados aproximada e classificação

---