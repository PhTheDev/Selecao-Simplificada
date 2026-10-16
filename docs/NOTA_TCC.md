<!-- TCC: Livro de TCC para Seleção Simplificada

Este documento serve como "Cabeçalho" oficial do trabalho acadêmico referente ao software 
acessível neste monorepo. Ele fornece elementos estritamente obrigatórios: título 
formal, autor, orientador, instituição, data e resumo. Cada seção tem um bloco "<?claude 
block X?>" indicando onde deve aparecer a informação final após aprovação formal 
(na gradação final do trabalho).

---

# Capa

<?claude block title?>
**Título:** Desenvolvimento de Sistema de Gestão de Seleção de Estagiários usando Arquitetura 
Monolítica Moderna e Integração via Web e SMS

<?claude block author?>
**Autor:** PhTheDev
**Orientador:** [Nome do Orientador]
**Instituição:** [Universidade/Curso]

<?claude block date?>
**Data:** [Mês/Ano de defesa]

---

# Folha de Rosto

# Desenvolvimento de Sistema de Gestão de Seleção de Estagiários usando Arquitetura 
Monolítica Moderna e Integração via Web e SMS

Faria, PhTheDev.

Trabalho de ... apresentado à Universidade [Nome] como requisito parcial para 
obtenção do título de [Grau].

...

amanho Limitado pela natureza digital

---

# Resumo

O presente trabalho teve como objetivo desenvolver um sistema completo e integrado 
para gestão de processos seletivos internos de estágio, à luz de um ambiente 
corporativo em expansão e necessidade de modernização de processos de RH. O 
sistema proposto combina uma API backend robusta construída com Django REST 
Framework e Next.js 15 como frontend responsivo, utilizando autenticação JWT e 
integrações com serviços externos, como gateway de SMS para envio de OTP, e SMTP 
para verificação de e-mail.

A arquitetura se apoia em um monorepo estruturado em aplicações Django focadas em 
núcleo, seleção, administrador e integração, com persistência via PostgreSQL e 
recursividade com Redis para cache, Celery e gerenciamento de OTP. O fluxo de 
trabalho abrange desde o período de inscrições até a geração final de vencedores, 
com múltiplas etapas de análise administrativa, ponderação de critérios e projeto 
de seleção flexível.

A solução foi desenvolvida durante a atividade de estágio profissional em 
ambiente de produção, com ciclos de desenvolvimento curtos e feedback contínuo. 
O sistema encontra-se em operação há mais de um ano, atendendo processos seletivos 
reais e reduzindo consideravelmente o tempo gasto com processos manuais.

Palavras-chave: Django, Next.js, seleção de pessoal, automação de RH, JWT, 
integração de sistemas.

---

# Abstract

The present work aimed to develop a complete and integrated system for management 
of internal internship selection processes, in the context of a growing corporate 
environment and the need to modernize RH processes. The proposed system combines a 
robust backend API built with Django REST Framework and Next.js 15 as a responsive 
frontend, utilizing JWT authentication and integrations with external services, such 
as SMS gateway for OTP sending, and SMTP for email verification.

The architecture relies on a structured monorepo consisting of Django apps focused 
on core, selection, administrator, and integration, with persistence via PostgreSQL 
and usage of Redis for caching, Celery, and OTP management. The workflow spans from 
the enrollment period up to the final generation of winners, with multiple 
administrative analysis stages, criterion weighting, and flexible selection logic.

The solution was developed during professional internship activity in a production 
environment, with short development cycles and continuous feedback. The system is 
currently in operation for over one year, executing real selection processes and 
significantly reducing the time spent on manual procedures.

Keywords: Django, Next.js, personnel selection, HR automation, JWT, system integration.

--- -->

**Nota:** Este servidor `.md` não deve ser entregue na passagem final do TCC. O código 
deve ser enviado fisicamente (Digite ou days?) ou como link (for site da empresa). 
Este arquivo serve apenas para rastrear os elementos formalmente obrigatórios e 
garantir que não exista duplicação de informações aquando da escrita final do 
trabalho acadêmico.

Fim deste documento.