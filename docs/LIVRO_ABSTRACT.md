<?claude block asof?> · 2026-10-16
# Livro de Resumos e Abstracts

Este documento contém:
- Resumo executivo do projeto
- Resumo acadêmico por capítulo (para o TCC)
- Abstracts para apresentações ou paper

---

## Resumo Executivo

**Nome do Trabalho:** Sistema de Seleção de Estagiários — Seleção Simplificada

**Objetivo:** Desenvolver uma solução web completa para automatizar e gerenciar processos seletivos internos de estágio da Seleção Simplificada, unificando portais público e administrativo em uma plataforma integrada.

**Contexto:** O sistema foi desenvolvido no ambiente de trabalho como estagiário, atendendo às necessidades de uma organização que realizava processos seletivos manuais. Na perspectiva do TCC, ele serve como exemplo prático de implementação de CRM de RH moderno em um ambiente corporativo.

**Abordagem Técnica:**
- Backend: Django 5 + Django REST Framework (JWT)
- Frontend: Next.js 15 (App Router) + React 19
- Persistência: PostgreSQL
- Recursividade: Redis (cache, Celery, OTP)
- Integrações: SMTP (e-mail), iSend SOAP (SMS), integração externa opcional

**Resultados:** Sistema em produção há mais de 1 ano, atendendo processos seletivos reais com inscrição online digital, análise administrativa por estágios, verificação remota de documentos e roteamento de SMS OTP para redefinição de senha.

---

## Resumos por Capítulo (TCC)

### Capítulo 1 — Introdução

**Resumo:**
O capítulo apresenta o problema central: processos seletivos manuais de estágio que envolvem múltiplos canais de comunicação e estados de avaliação que precisam ser registrados de forma segura e auditável. O objetivo geral é desenvolver uma plataforma de gestão de processos seletivos que automatize desde o período de inscrição até a publicação dos vencedores. As áreas de interesse incluem gestão do ciclo de RH, desenvolvimento web moderno em equipes de produção e implementação de segurança de autenticação em sistemas corporativos.

### Capítulo 2 — Revisão Bibliográfica

**Resumo:**
A revisão aborda tecnologias e conceitos fundamentais: Django REST Framework, Next.js App Router, autenticação JWT, sistemas web modernos e tecnologias de integração. Discussões sobre gestão de workflow em sistemas corporativos, segurança de aplicações web em produção e conversão de processos manuais em unidades digitais estão incluídas. A revisão destaca desafios comuns na adoção de soluções de gestão de RH em ambientes corporativos.

### Capítulo 3 — Metodologia

**Resumo:**
A metodologia adotada foi de Desenvolvimento Orientado a Entregáveis (Agile) diretamente dentro de um ciclo de desenvolvimento em produção. O projeto foi desenvolvido sob supervisão técnica, com ciclos curtos de feedback incluindo requisitos do RH e ajustes iterativos. A arquitetura baseada em microsessões e eventos-chave (inscrição, avaliação, decisão) segue princípios de design de interfaces orientadas ao usuário. Técnicas de versionamento com Git e colaboração com equipe de produção fundamentam o desenvolvimento contínuo.

### Capítulo 4 — Contexto do Estágio e Requisitos

**Resumo:**
O sistema foi desenvolvido no cargo de estagiário de Desenvolvimento, por 6 meses, como parte de um projeto de modernização do processo seletivo da organização. Os requisitos funcionais identificados: inscrição online com verificação de e-mail, análise administrativa em duas etapas (documental e entrevista), geração de ranking baseada em critérios ponderáveis, sistema de login seguro, integração com banco de dados histórico e exportação de dados. Requisitos não funcionais: segurança (autenticação JWT, rate limiting), performance (cache Redis, workers Celery), usabilidade responsiva e estabilidade operacional.

### Capítulo 5 — Desenvolvimento

**Resumo:**
O capítulo detalha a arquitetura tetralógica: monorepo com frontend e backend separados, com comunicação via API REST JWT. O backend organiza modelos em apps Django (`core`, `selection`, `administrator`, `integration`), usando autenticação SimpleJWT com tokens de acesso (1 dia) e refresh (7 dias), rotação e blacklist para mitigação de roubo. O frontend baseia-se no App Router do Next.js 15, com protected routes e gerenciamento de estado via TanStack Query e cookies. Integrações externas configuram iSend para SMS OTP e um endpoint REST para integração automática de atividades administrativas.

### Capítulo 6 — Testes

**Resumo:**
O projeto incorpora testes unitários no frontend via Vitest usando jsdom, com coberturas em lógica de negócio específica. Em produção, testes são realizado via usuários reais e processos seletivos ilustrativos, com monitoramento de logs e métricas de erro. O fluxo principal foi validado ao longo de 6 ciclos de desenvolvimento e pilotos em produção por mais de 1 ano, antes da expansão para outros departamentos da organização.

### Capítulo 7 — Conclusão e Trabalhos Futuros

**Resumo:**
Os resultados principais: implementação com sucesso de sistema em produção, redução significativa no tempo gasto com processos manuais de inscrição e avaliação, e alcançamento de requisitos de segurança. Os principais desafios: aderência a políticas corporativas de infraestrutura, adaptação à cultura organizacional e equilíbrio entre agilidade de desenvolvimento e robustez de produção. Trabalhos futuros incluem expansão para leads externos, integração com banco de dados de candidatos externos e automatização de notificações de usuários externos. A extensão deste trabalho é proposta como nova etapa da modernização em RH.

---

## Abstracts para Apresentação ou Paper

### Resumo em Português (palavras-chave: Django, Next.js, processamento seletivo, automação)

O artigo apresenta o desenvolvimento de um sistema de seleção de estagiários totalmente automatizado e integrado, desenvolvido como solução corporativa em parceria com RH. O sistema unifica portais de inscrição pública, gestão candidata e painel administrativo em uma única plataforma web moderna. A arquitetura combina Django REST Framework como API backend seguro com autenticação JWT e Next.js 15 como frontend responsivo rodando como estático com SSR. O fluxo de trabalho cobre o ciclo completo de processamento seletivo: período de inscrições, análise por estágios (documental e entrevista), ponderação de critérios e geração de vencedores. Integrações incluem e-mail SMTP para verificação e SMS via SMS Gateway para redefinição de senha. O sistema está em produção há mais de 1 ano, atendendo processos seletivos reais e reduzindo manualidades significativamente.

**Palavras-chave:** Django, Next.js, processamento seletivo, automação de RH, JWT, integração externa.

---

### Abstract (International / English)

The article presents the development of a fully automated and integrated internship selection system developed as a corporate solution in partnership with HR. The system unifies public application portals, candidate management, and administrative dashboard in a single modern web platform. The architecture combines Django REST Framework as a secure JWT-authenticated backend API with Next.js 15 as responsive frontend running under static rendering with SSR. The workflow covers the complete selection cycle: enrollment period, multi-stage analysis (documental and interview stages), criterion weighting, and winner generation. Integrations include SMTP email for verification and SMS through SMS Gateway for password recovery. The system is in production for over one year, executing real selection processes and significantly reducing manual work.

**Keywords:** Django, Next.js, selection process, HR automation, JWT, external integration.