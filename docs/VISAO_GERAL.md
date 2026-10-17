# Visão Geral do Projeto

Este documento descreve o sistema de seleção simplificada de maneira acessível para público geral:
não profissional — só conceitos básicos. É uma visão "de cima para baixo" e rótulos de negócios.

---

## O que é o projeto?

O sistema é uma plataforma digital brasileira web completa para gestão completa de processos
seletivos internos de estágio, utilizada por um departamento de RH em formato corporativo. A
funcionalidade central é permitir que uma organização crie processos com inscrições via web,
receba candidaturas de usuários internos (por e-mail corporativo) e que um time de RH avalie
inscritos, selecione vencedores, configure critérios de avaliação e publique resultados sem
fazer todo manualmente.

## Como é usado no dia a dia?

**Ciclo de uso:**
1. O departamento são responsáveis criam um processo seletivo (nome, datas, vagas)
2. O portal é aberto para inscrições de estágios
3. Candidatos se cadastram, preenchem dados e fazem upload de documentos
4. Área de RH é notificada automaticamente quando há novos candidatos
5. Administradores avaliam candidatos em duas etapas (documental e entrevista)
6. O sistema calcula pontos com base na nota acadêmica, solicitação de experiência, etc.
7. Administradores definem quem ganha baseada no ranking
8. O processo é finalizado (vencedores publicados e análises concluídas) ou reaberto se
   ainda faltar vagas

**Ritual básico:**
O departamento abre um processo e define suas datas. Na hora que abre, o sistema
envia e-mail automaticamente para todos os usuários internos cadastrados avisando
sobre o processo. Candidatos preenchem dados e documentos; o RH recebe a lista e,
usando o painel, avalia candidatos e escolhe quem será o estágio. Ao final,
o organiza publica o resultado para candidatos e, se necessário,
faz um novo processo aberto ou dias específicos. O sistema mantém um históri
de cada etapa (administração) para auditoria.

## Ruídos semânticos

**CICLO O QUE É UM PROCESSO?**

Um processo seletivo é estudar a organização que tem vagas disponíveis. Ele tem início
e encerramento definidos, tem nome e descrição exígua. Ele define como é que alguém vai
entrar na empresa — seja via nota escolar, critérios do RH, experiência antiga, etc.
Um processo pode ser de "maior" ou "menor", e pode ter vaga default: adotado nomes seletivo.

## Papéis (Quem usa?)

**Candidatos:**
Usuários internos (funcionários) da organização que se inscrevem para estágio. Podem cadastrar
conta, verificar e-mail via link, inscrever-se em processos públicos e acompanhar status da
candidatura sem login específico do RH. Podem editar inscrição enquanto o período estiver
aberto (para corrigir documentos, adicionar dados).

**Administradores (RH):**
Equipe responsável por criar e gerenciar processos. Responsável por definir critérios de
avaliação, métricas (nota acadêmica, pontos por experiência, etc.) com pesos configuráveis,
view candidatos, e decidir quem ganha dentro do processo.

**externo:**
Um sistema de terceiros que consome atividades administrativas (criação/processo, análise) e
traduz para events externos usando token estático (não JWT).

## Processo de inscrição: Passo para passo simples

1. Cadastre seu login (e-mail corporativo)
2. Verifique seu e-mail (clique no link enviado)
3. Na área do candidato, veja lista de processos abertos
4. Clique em "Inscrever-se"
5. Preencha seus dados pessoais (nome, CPF, telefone, endereço)
6. Complete com documentos (certidão, CR, passaporte)
7. Clique em "Concluir Inscrição"
8. Espere receber confirmação via e-mail

**Observações:**
O sistema envia e-mail verificação de e-mail para garantir que você é quem você diz ser.
Assim, se um bot tentar criar mil inscrições, pode ser bloqueado. O período é configurável:
pode ter 30 dias de inscrições e depois o RH pode travar processo.

## Análise (Avaliação) no RH

1. Administrador entra no painel e seleciona o processo em análise
2. Avalia candidatura por estágio (ex.: documento completo? está correta?)
3. Quando todos candidatos passam, avança para próximo estágio: entrevista
4. Avalia as entrevistas passando o candidato para próxima fase
5. Ao final, define vencedores baseada no ranking

## Valor para organizações

Reduz o tempo gasto por RH em processos de inscrição, traz um fluxo transversal com integração
(e-mail, SMS) facilitando a gestão em tempo real. Auxilia psicologia e selectiva, tendo maior
número de reclamações, permitindo B2B integrando novos processos de seleção em forma centralizada
automaticamente. Evita a estabilidade telefônica e o uso de processos amendado do RH de RH.

## Visão metodológica para TCC

Um projeto que demonstra uma transição de processo de estágio manual para digital. É interessante
para trabalhos acadêmicos, mostrando a aplicação de desenvolvimento web moderno (Django, Next.js),
segurança em autenticação JWT e integração com serviços externos (API REST, gateway de SMS).

**Desafios incluídos:**
- Equilíbrio entre desenvolvimento rápido em ambiente de produção e estabilidade para ser usado
  pelo usuário com segurança
- Adaptação à cultura organizacional e equilíbrio entre autogestão de RH e documentação acadêmica

(Fim)