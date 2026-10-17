'use client';

import Footer from '@/components/Footer';
import { useI18n } from '@/components/i18n/LanguageProvider';
import Header from '@/components/main-page/Header';
import SplitWords from '@/components/motion/SplitWords';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  KeyRound,
  Link2,
  Mail,
  MapPin,
  Phone,
  Search,
  ThumbsDown,
  ThumbsUp,
  UserPlus,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ------------------------------------------------------------
// 1. DADOS (PT/EN lado a lado para não depender do dicionário global)
// ------------------------------------------------------------

type Bi = { pt: string; en: string };

interface FAQItem {
  id: string;
  category: string;
  question: Bi;
  answer: Bi;
  tags: string[];
  isNew?: boolean;
}

const categories: { id: string; label: Bi }[] = [
  { id: 'conta', label: { pt: 'Conta e acesso', en: 'Account & access' } },
  { id: 'processos', label: { pt: 'Inscrição', en: 'Applying' } },
  { id: 'painel', label: { pt: 'Painel do candidato', en: 'Candidate dashboard' } },
  { id: 'selecao', label: { pt: 'Seleção e resultado', en: 'Selection & results' } },
  { id: 'estagio', label: { pt: 'Estágio', en: 'Internship' } },
];

const faqData: FAQItem[] = [
  {
    id: 'cadastro',
    category: 'conta',
    question: { pt: 'Preciso de cadastro para me inscrever?', en: 'Do I need an account to apply?' },
    answer: {
      pt: 'Sim. Você pode navegar pelos processos sem login, mas para enviar a inscrição é preciso criar o cadastro com seus dados pessoais, e-mail e telefone e entrar na sua conta. O cadastro é feito uma única vez e vale para todos os processos.',
      en: 'Yes. You can browse the processes without logging in, but to submit an application you need to create an account with your personal details, email and phone, and sign in. You only register once, and it works for every process.',
    },
    tags: ['cadastro', 'conta', 'login'],
  },
  {
    id: 'recuperar-senha',
    category: 'conta',
    isNew: true,
    question: { pt: 'Esqueci minha senha. Como recupero o acesso?', en: 'I forgot my password. How do I get back in?' },
    answer: {
      pt: 'Em "Recuperar senha" você escolhe entre duas formas. Por e-mail, enviamos um link para criar uma nova senha. Por código, você informa o telefone cadastrado e enviamos um código de 6 dígitos para o e-mail da conta, válido por 5 minutos. Digite o código, defina a nova senha e pronto.',
      en: 'On "Recover password" you can pick one of two ways. By email, we send a link to set a new password. By code, you enter your registered phone and we send a 6-digit code to the account email, valid for 5 minutes. Type the code, set the new password and you are done.',
    },
    tags: ['senha', 'recuperar', 'código'],
  },
  {
    id: 'codigo-nao-chegou',
    category: 'conta',
    isNew: true,
    question: { pt: 'O código de recuperação não chegou. O que faço?', en: 'The recovery code did not arrive. What now?' },
    answer: {
      pt: 'Confira a caixa de spam e se o telefone digitado é o mesmo do cadastro. Você pode pedir um novo código após 1 minuto, e há um limite de 3 pedidos por hora. Se o código expirar ou você errar várias vezes, peça um novo. Persistindo o problema, fale com a gente pelos canais de contato abaixo.',
      en: 'Check your spam folder and that the phone you typed is the one on your account. You can request a new code after 1 minute, with a limit of 3 requests per hour. If the code expires or you enter it wrong too many times, request a new one. If it still fails, reach us through the contact channels below.',
    },
    tags: ['código', 'e-mail', 'expirou'],
  },
  {
    id: 'inscrever',
    category: 'processos',
    question: { pt: 'Como faço para me inscrever em um processo seletivo?', en: 'How do I apply to a selection process?' },
    answer: {
      pt: 'Entre na sua conta, abra Processos Seletivos, escolha um processo com inscrições abertas e clique em "Realizar Inscrição". O formulário tem 3 passos e você envia tudo online. Tenha os documentos em mãos antes de começar.',
      en: 'Sign in, open Selection Processes, pick one with open applications and click "Apply". The form has 3 steps and everything is sent online. Have your documents ready before you start.',
    },
    tags: ['inscrição', 'formulário', 'passos'],
  },
  {
    id: 'documentos',
    category: 'processos',
    question: { pt: 'Quais documentos preciso enviar?', en: 'Which documents do I need to send?' },
    answer: {
      pt: 'Em geral, documento de identidade, histórico escolar e declaração de frequência. Cada edital pode pedir anexos adicionais, então confira a lista no edital do processo antes de se inscrever.',
      en: 'Usually an ID document, school records and an attendance statement. Each notice may ask for extra attachments, so check the list in the process notice before applying.',
    },
    tags: ['documentos', 'anexos', 'histórico'],
  },
  {
    id: 'requisitos',
    category: 'processos',
    question: { pt: 'Quais são os requisitos para participar?', en: 'What are the requirements to take part?' },
    answer: {
      pt: 'Variam conforme o edital, mas geralmente incluem estar matriculado em instituição de ensino superior, ter disponibilidade de 20 a 30 horas semanais e atender aos requisitos da vaga. O edital traz os detalhes de cada processo.',
      en: 'They vary by notice, but usually include being enrolled in higher education, having 20 to 30 hours a week available and meeting the position requirements. The notice has the details for each process.',
    },
    tags: ['requisitos', 'elegibilidade'],
  },
  {
    id: 'varios-processos',
    category: 'processos',
    question: { pt: 'Posso me inscrever em mais de um processo?', en: 'Can I apply to more than one process?' },
    answer: {
      pt: 'Sim, desde que atenda aos requisitos de cada um. Cada inscrição é feita separadamente e aparece em "Meus processos" no seu painel.',
      en: 'Yes, as long as you meet the requirements of each one. Each application is made separately and shows up in "My processes" on your dashboard.',
    },
    tags: ['múltiplas', 'inscrições', 'vagas'],
  },
  {
    id: 'editais',
    category: 'processos',
    question: { pt: 'Onde encontro os editais completos?', en: 'Where can I find the full notices?' },
    answer: {
      pt: 'Na página Editais. Lá você baixa o edital principal e todos os anexos de cada processo. Se algum download falhar, escreva para o nosso e-mail de contato.',
      en: 'On the Notices page. There you can download the main notice and all the attachments of each process. If a download fails, write to our contact email.',
    },
    tags: ['editais', 'download', 'anexos'],
  },
  {
    id: 'acompanhar',
    category: 'painel',
    isNew: true,
    question: { pt: 'Como acompanho minhas inscrições?', en: 'How do I track my applications?' },
    answer: {
      pt: 'No seu painel, abra "Meus processos". Cada inscrição mostra o processo, a situação atual e as ações disponíveis, como editar enquanto o período está aberto.',
      en: 'On your dashboard, open "My processes". Each application shows the process, its current status and the available actions, such as editing while the period is open.',
    },
    tags: ['painel', 'status', 'acompanhar'],
  },
  {
    id: 'editar-inscricao',
    category: 'painel',
    isNew: true,
    question: { pt: 'Posso corrigir uma inscrição depois de enviada?', en: 'Can I fix an application after sending it?' },
    answer: {
      pt: 'Sim, enquanto o período de inscrições do processo estiver aberto. Vá em "Meus processos", escolha a inscrição e use a opção de editar. Depois que o período encerra, a inscrição não pode mais ser alterada.',
      en: 'Yes, while the application period of the process is still open. Go to "My processes", pick the application and use the edit option. Once the period closes, the application can no longer be changed.',
    },
    tags: ['editar', 'corrigir', 'prazo'],
  },
  {
    id: 'perfil',
    category: 'painel',
    question: { pt: 'Como atualizo meus dados pessoais?', en: 'How do I update my personal details?' },
    answer: {
      pt: 'No painel, acesse "Perfil". Lá você atualiza seus dados, telefone e foto. Mantenha o telefone correto, porque ele é usado na recuperação de senha por código.',
      en: 'On the dashboard, open "Profile". There you can update your details, phone and photo. Keep the phone correct, since it is used for password recovery by code.',
    },
    tags: ['perfil', 'dados', 'telefone'],
  },
  {
    id: 'etapas',
    category: 'selecao',
    question: { pt: 'Como funciona a seleção?', en: 'How does the selection work?' },
    answer: {
      pt: 'O processo costuma ter análise curricular, redação (quando aplicável) e entrevista. O peso de cada etapa varia conforme o edital, que traz o detalhamento completo.',
      en: 'The process usually includes a resume review, an essay (when applicable) and an interview. The weight of each stage varies by notice, which has the full breakdown.',
    },
    tags: ['etapas', 'avaliação', 'seleção'],
  },
  {
    id: 'criterios',
    category: 'selecao',
    question: { pt: 'O que é avaliado na análise curricular?', en: 'What is assessed in the resume review?' },
    answer: {
      pt: 'Histórico escolar, experiência anterior, cursos complementares, projetos de extensão e adequação ao perfil da vaga. Cada edital define os critérios e seus pesos.',
      en: 'School records, previous experience, complementary courses, extension projects and fit with the position profile. Each notice defines the criteria and their weights.',
    },
    tags: ['currículo', 'critérios', 'pesos'],
  },
  {
    id: 'resultado',
    category: 'selecao',
    question: { pt: 'Como saberei o resultado?', en: 'How will I find out the result?' },
    answer: {
      pt: 'A situação da sua inscrição é atualizada no painel, em "Meus processos", conforme o processo avança. O resultado final segue o cronograma do edital.',
      en: 'The status of your application is updated on the dashboard, under "My processes", as the process moves forward. The final result follows the schedule in the notice.',
    },
    tags: ['resultado', 'status', 'cronograma'],
  },
  {
    id: 'remunerado',
    category: 'estagio',
    question: { pt: 'Os estágios são remunerados?', en: 'Are the internships paid?' },
    answer: {
      pt: 'Os estágios não obrigatórios são remunerados com bolsa-auxílio e vale-transporte. Os obrigatórios, por fazerem parte da grade curricular, não têm bolsa conforme a legislação, mas contam com vale-transporte. Valores e benefícios de cada programa estão no edital.',
      en: 'Non-mandatory internships are paid with a stipend and transport voucher. Mandatory ones, being part of the curriculum, have no stipend under the law, but include a transport voucher. Amounts and benefits for each program are in the notice.',
    },
    tags: ['bolsa', 'remuneração', 'benefícios'],
  },
  {
    id: 'outra-cidade',
    category: 'estagio',
    question: { pt: 'Posso estagiar morando em outra cidade?', en: 'Can I intern while living in another city?' },
    answer: {
      pt: 'Sim, desde que consiga se deslocar diariamente até o local do estágio. Não há auxílio moradia, mas o vale-transporte cobre os deslocamentos.',
      en: 'Yes, as long as you can commute daily to the internship site. There is no housing aid, but the transport voucher covers commuting.',
    },
    tags: ['cidade', 'deslocamento', 'local'],
  },
  {
    id: 'tema-idioma',
    category: 'estagio',
    isNew: true,
    question: { pt: 'Posso mudar o idioma e o tema do site?', en: 'Can I change the site language and theme?' },
    answer: {
      pt: 'Sim. No menu "Idioma e tema" do cabeçalho você alterna entre português e inglês e entre tema claro e escuro. A escolha fica salva no seu navegador.',
      en: 'Yes. In the "Language and theme" menu in the header you can switch between Portuguese and English and between light and dark themes. Your choice is saved in your browser.',
    },
    tags: ['idioma', 'tema', 'escuro'],
  },
];

const quickLinks = [
  { href: '/auth/register', icon: UserPlus, label: { pt: 'Criar cadastro', en: 'Create account' }, hint: { pt: 'Leva 2 minutos', en: 'Takes 2 minutes' } },
  { href: '/processos-seletivos', icon: ClipboardList, label: { pt: 'Ver processos', en: 'See processes' }, hint: { pt: 'Inscrições abertas', en: 'Open applications' } },
  { href: '/auth/recuperar-senha', icon: KeyRound, label: { pt: 'Recuperar senha', en: 'Recover password' }, hint: { pt: 'Por e-mail ou código', en: 'By email or code' } },
  { href: '/candidato/meus-processos', icon: Check, label: { pt: 'Minhas inscrições', en: 'My applications' }, hint: { pt: 'Acompanhe o status', en: 'Track the status' } },
];

const contacts = [
  { icon: Mail, title: { pt: 'E-mail', en: 'Email' }, value: 'contato@example.com', sub: { pt: 'Respondemos em até 48h úteis', en: 'We reply within 48 business hours' }, href: 'mailto:contato@example.com' },
  { icon: Phone, title: { pt: 'Telefone', en: 'Phone' }, value: '(00) 0000-0000', sub: { pt: 'Segunda a sexta, 9h às 17h', en: 'Monday to Friday, 9am to 5pm' }, href: 'tel:+550000000000' },
  { icon: Clock, title: { pt: 'Atendimento', en: 'Hours' }, value: { pt: 'Segunda a sexta', en: 'Monday to Friday' }, sub: { pt: '9h às 12h e 14h às 17h', en: '9am to 12pm and 2pm to 5pm' } },
  { icon: MapPin, title: { pt: 'Endereço', en: 'Address' }, value: 'Seleção Simplificada', sub: { pt: 'Presencial somente com agendamento', en: 'In person by appointment only' } },
];

// ------------------------------------------------------------
// 2. AUXILIARES
// ------------------------------------------------------------

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const FEEDBACK_KEY = 'faq-feedback';

function readFeedback(): Record<string, 'up' | 'down'> {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}');
  } catch {
    return {};
  }
}

// shortcut: realce ignora acentos só na busca, não no destaque; ok enquanto o conteúdo for curto.
function Highlight({ text, words }: { text: string; words: string[] }) {
  if (!words.length) return <>{text}</>;
  const pattern = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return (
    <>
      {text.split(pattern).map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-highlight px-0.5 text-highlight-foreground">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

// ------------------------------------------------------------
// 3. ITEM
// ------------------------------------------------------------

function FAQRow({
  item,
  open,
  onToggle,
  words,
  vote,
  onVote,
}: {
  item: FAQItem;
  open: boolean;
  onToggle: () => void;
  words: string[];
  vote?: 'up' | 'down';
  onVote: (v: 'up' | 'down') => void;
}) {
  const { t, lang } = useI18n();
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}#faq-${item.id}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sem clipboard: ignora */
    }
  };

  return (
    <div id={`faq-${item.id}`} className="scroll-mt-28 border-b border-border last:border-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`faq-panel-${item.id}`}
        className="group flex w-full items-start gap-4 px-5 py-5 text-left transition-colors hover:bg-muted/60 md:px-7"
      >
        <span className="min-w-0 flex-1">
          <span className="block text-base font-medium leading-snug text-foreground md:text-lg">
            <Highlight text={item.question[lang]} words={words} />
            {item.isNew && (
              <span className="ml-2 inline-block translate-y-[-1px] rounded-full bg-highlight px-2 py-0.5 align-middle text-[11px] font-semibold text-highlight-foreground">
                {t('Novo')}
              </span>
            )}
          </span>
        </span>
        <span
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
            open ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground group-hover:text-foreground'
          }`}
        >
          <ChevronDown size={16} className={`transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-panel-${item.id}`}
            role="region"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 md:px-7">
              <p className="max-w-2xl leading-relaxed text-muted-foreground">
                <Highlight text={item.answer[lang]} words={words} />
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-primary-soft px-2.5 py-1 text-xs font-medium text-primary">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>{vote ? t('Obrigado pelo retorno!') : t('Esta resposta ajudou?')}</span>
                  {(['up', 'down'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => onVote(v)}
                      aria-label={v === 'up' ? t('Ajudou') : t('Não ajudou')}
                      aria-pressed={vote === v}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                        vote === v ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-muted'
                      }`}
                    >
                      {v === 'up' ? <ThumbsUp size={14} /> : <ThumbsDown size={14} />}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={copyLink}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {copied ? <Check size={14} /> : <Link2 size={14} />}
                  {copied ? t('Link copiado') : t('Copiar link')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------
// 4. PÁGINA
// ------------------------------------------------------------

export default function FAQ() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [openIds, setOpenIds] = useState<string[]>([]);
  const [votes, setVotes] = useState<Record<string, 'up' | 'down'>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  // abre e rola até a pergunta do link (#faq-id) e carrega os votos salvos
  useEffect(() => {
    setVotes(readFeedback());
    const id = window.location.hash.replace('#faq-', '');
    if (id && faqData.some((q) => q.id === id)) {
      setOpenIds([id]);
      setTimeout(() => document.getElementById(`faq-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
    }
  }, []);

  // "/" foca a busca
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(el.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const words = useMemo(() => normalize(query).split(/\s+/).filter(Boolean), [query]);
  const rawWords = useMemo(() => query.trim().split(/\s+/).filter((w) => w.length > 1), [query]);

  const results = useMemo(
    () =>
      faqData.filter((q) => {
        if (category && q.category !== category) return false;
        if (!words.length) return true;
        const hay = normalize(`${q.question[lang]} ${q.answer[lang]} ${q.tags.join(' ')}`);
        return words.every((w) => hay.includes(w));
      }),
    [words, category, lang],
  );

  const grouped = useMemo(
    () =>
      categories
        .map((c) => ({ ...c, items: results.filter((q) => q.category === c.id) }))
        .filter((c) => c.items.length > 0),
    [results],
  );

  const toggle = useCallback((id: string) => setOpenIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id])), []);
  const allOpen = results.length > 0 && results.every((q) => openIds.includes(q.id));
  const filtering = Boolean(query || category);

  const vote = (id: string, v: 'up' | 'down') => {
    const next = { ...votes, [id]: v };
    setVotes(next);
    try {
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
  };

  const clear = () => {
    setQuery('');
    setCategory(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero + busca */}
      <section className="px-5 pb-8 pt-16 text-center md:px-8 md:pt-24">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-highlight ring-2 ring-primary/30" />
          <span className="tabular">{faqData.length}</span> {t('respostas')} · <span className="tabular">{categories.length}</span> {t('temas')}
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-[clamp(2.25rem,5.5vw,4.25rem)] font-medium leading-[1]">
          <SplitWords text={t('Central de')} />
          <SplitWords text={t('ajuda')} className="font-serif font-normal italic" delay={0.15} />
        </h1>
        <motion.p
          className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {t('Encontre respostas para as dúvidas mais frequentes sobre nossos processos seletivos.')}
        </motion.p>

        <motion.div
          className="mx-auto mt-8 max-w-2xl"
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('Busque por "senha", "documentos", "prazo"...')}
              aria-label={t('Buscar no FAQ')}
              className="w-full rounded-full border bg-card py-4 pl-14 pr-24 text-base text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-4 focus:ring-primary/15 [&::-webkit-search-cancel-button]:hidden"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('Limpar busca')}
                className="absolute right-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            ) : (
              <kbd className="absolute right-5 top-1/2 hidden -translate-y-1/2 rounded-md border bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:block">/</kbd>
            )}
          </div>
        </motion.div>
      </section>

      <div className="mx-auto max-w-3xl px-5 pb-20 md:px-8">
        {/* Atalhos (somem quando está buscando) */}
        {!filtering && (
          <motion.div
            className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {quickLinks.map(({ href, icon: Icon, label, hint }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-soft text-primary">
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span className="mt-3 block text-sm font-medium text-foreground">{label[lang]}</span>
                <span className="block text-xs text-muted-foreground">{hint[lang]}</span>
              </Link>
            ))}
          </motion.div>
        )}

        {/* Filtros por tema */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0" role="tablist" aria-label={t('Temas')}>
          {[{ id: null as string | null, label: { pt: 'Todas', en: 'All' }, count: faqData.length }, ...categories.map((c) => ({ id: c.id as string | null, label: c.label, count: faqData.filter((q) => q.category === c.id).length }))].map((c) => {
            const active = category === c.id;
            return (
              <button
                key={c.id ?? 'all'}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setCategory(c.id)}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  active ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground'
                }`}
              >
                {c.label[lang]} <span className={`tabular ml-1 ${active ? 'opacity-80' : 'opacity-60'}`}>{c.count}</span>
              </button>
            );
          })}
        </div>

        {/* Barra de status */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <p aria-live="polite">
            {filtering ? (
              <>
                <span className="tabular font-semibold text-foreground">{results.length}</span> {t('resultado(s)')}
              </>
            ) : (
              t('Toque em uma pergunta para ver a resposta')
            )}
          </p>
          <div className="flex items-center gap-4">
            {filtering && (
              <button type="button" onClick={clear} className="font-medium text-primary underline-offset-4 hover:underline">
                {t('Limpar filtros')}
              </button>
            )}
            {results.length > 1 && (
              <button
                type="button"
                onClick={() => setOpenIds(allOpen ? [] : results.map((q) => q.id))}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {allOpen ? t('Recolher todas') : t('Expandir todas')}
              </button>
            )}
          </div>
        </div>

        {/* Lista */}
        <div className="mt-6 space-y-8">
          {grouped.map((group) => (
            <section key={group.id} aria-labelledby={`cat-${group.id}`}>
              {!category && (
                <h2 id={`cat-${group.id}`} className="mb-3 px-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label[lang]}
                </h2>
              )}
              <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                {group.items.map((item) => (
                  <FAQRow
                    key={item.id}
                    item={item}
                    open={openIds.includes(item.id)}
                    onToggle={() => toggle(item.id)}
                    words={rawWords}
                    vote={votes[item.id]}
                    onVote={(v) => vote(item.id, v)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {results.length === 0 && (
          <div className="mt-8 rounded-3xl border bg-card p-10 text-center">
            <Search size={40} className="mx-auto mb-4 text-muted-foreground/60" strokeWidth={1.5} />
            <h3 className="text-xl font-semibold text-foreground">{t('Nenhum resultado encontrado')}</h3>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
              {t('Tente outras palavras ou fale direto com a nossa equipe.')}
            </p>
            <button
              type="button"
              onClick={clear}
              className="mt-6 rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
            >
              {t('Ver todas as perguntas')}
            </button>
          </div>
        )}

        {/* Contato */}
        <section id="contato" className="mt-16 scroll-mt-28 rounded-3xl border bg-card p-6 shadow-sm md:p-10">
          <div className="max-w-xl">
            <h2 className="text-2xl font-medium md:text-3xl">
              {t('Ainda com dúvida?')} <span className="font-serif font-normal italic">{t('Fale com a gente.')}</span>
            </h2>
            <p className="mt-3 text-muted-foreground">
              {t('Nossa equipe está pronta para esclarecer todas as suas dúvidas sobre processos seletivos.')}
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {contacts.map(({ icon: Icon, title, value, sub, href }) => {
              const val = typeof value === 'string' ? value : value[lang];
              const body = (
                <>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs uppercase tracking-wider text-muted-foreground">{title[lang]}</span>
                    <span className="block break-words font-medium text-foreground">{val}</span>
                    <span className="block text-sm text-muted-foreground">{sub[lang]}</span>
                  </span>
                </>
              );
              const cls = 'flex items-start gap-4 rounded-2xl border bg-background p-4 transition-colors';
              return href ? (
                <a key={href} href={href} className={`${cls} hover:border-primary/40`}>
                  {body}
                </a>
              ) : (
                <div key={title.pt} className={cls}>
                  {body}
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <Footer />
    </div>
  );
}
