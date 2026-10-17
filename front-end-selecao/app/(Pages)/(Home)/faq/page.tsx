'use client';

import Footer from '@/components/Footer';
import { useI18n } from '@/components/i18n/LanguageProvider';
import Header from '@/components/main-page/Header';
import SplitWords from '@/components/motion/SplitWords';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ChevronDown, HelpCircle, Mail, MapPin, Search, Users } from 'lucide-react';
import { JSX, useMemo, useState } from 'react';

// ------------------------------------------------------------
// 1. DADOS ESTÁTICOS (poderiam estar em arquivos separados)
// ------------------------------------------------------------

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  tags: string[];
}

interface FAQCategory {
  category: string;
  icon: string;
  questions: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    category: 'Processos Seletivos',
    icon: '📋',
    questions: [
      {
        id: 1,
        question: 'Como faço para me inscrever em um processo seletivo?',
        answer:
          'Para se inscrever, acesse a página de Processos Seletivos, localize o edital desejado com status "Inscrições Abertas", clique em "Realizar Inscrição" e preencha o formulário online. Certifique-se de ter todos os documentos necessários em mãos.',
        tags: ['inscrição', 'processo', 'formulário'],
      },
      {
        id: 2,
        question: 'Quais são os requisitos básicos para participar?',
        answer:
          'Os requisitos variam conforme o edital, mas geralmente incluem: estar matriculado em instituição de ensino superior, ter disponibilidade de 20-30h semanais, e atender aos requisitos específicos da vaga. Consulte o edital específico para informações detalhadas.',
        tags: ['requisitos', 'eligibilidade', 'documentos'],
      },
      {
        id: 3,
        question: 'Posso me inscrever em mais de um processo seletivo?',
        answer:
          'Sim, você pode se inscrever em múltiplos processos seletivos, desde que atenda aos requisitos específicos de cada um. No entanto, cada inscrição deve ser feita separadamente.',
        tags: ['múltiplas', 'inscrições', 'vagas'],
      },
    ],
  },
  {
    category: 'Editais e Documentos',
    icon: '📄',
    questions: [
      {
        id: 4,
        question: 'Onde encontro os editais completos?',
        answer:
          'Todos os editais estão disponíveis na página "Editais dos Processos Seletivos". Lá você pode baixar o edital principal e todos os anexos necessários para a inscrição.',
        tags: ['editais', 'download', 'documentos'],
      },
      {
        id: 5,
        question: 'O que fazer se tiver problemas para baixar os editais?',
        answer:
          'Caso enfrente problemas técnicos, entre em contato conosco através do email contato@example.com ou pelo telefone (00) 0000-0000. Estamos disponíveis para ajudar.',
        tags: ['suporte', 'tecnico', 'download'],
      },
    ],
  },
  {
    category: 'Critérios de Seleção',
    icon: '⚖️',
    questions: [
      {
        id: 6,
        question: 'Como funciona o processo de seleção?',
        answer:
          'O processo geralmente inclui: análise curricular, redação (quando aplicável) e entrevista. O peso de cada etapa varia conforme o edital. Detalhes completos estão disponíveis em cada edital específico.',
        tags: ['seleção', 'etapas', 'avaliação'],
      },
      {
        id: 7,
        question: 'Quais critérios são considerados na análise curricular?',
        answer:
          'Avaliamos: histórico escolar, experiência anterior, cursos complementares, participação em projetos de extensão e adequação ao perfil da vaga. Cada edital especifica os critérios e seus pesos.',
        tags: ['currículo', 'análise', 'critérios'],
      },
    ],
  },
  {
    category: 'Dúvidas Gerais',
    icon: '❓',
    questions: [
      {
        id: 8,
        question: 'Qual o horário de funcionamento do setor de processos seletivos?',
        answer:
          'Atendemos de segunda a sexta, das 9h às 12h e das 14h às 17h. O atendimento presencial requer agendamento prévio através do nosso email ou telefone.',
        tags: ['horário', 'atendimento', 'contato'],
      },
      {
        id: 9,
        question: 'Os estágios são remunerados?',
        answer:
          'Sim, todos os nossos estágios não obrigatórios são remunerados com bolsa-auxílio compatível com o mercado, além de benefícios como vale-transporte. Já os estágios obrigatórios, por serem parte integrante da grade curricular exigida pela instituição de ensino, não são remunerados, conforme prevê a legislação, porem contam com vale-transporte. Ainda assim, os estudantes podem ter acesso a benefícios como seguro contra acidentes pessoais e acompanhamento pedagógico durante o período do estágio. Os valores específicos da bolsa e os benefícios oferecidos variam conforme o programa e estão detalhados em cada edital de seleção.',
        tags: ['remuneração', 'bolsa', 'benefícios'],
      },
      {
        id: 10,
        question: 'Posso estagiar mesmo morando em outra cidade?',
        answer:
          'Sim, desde que tenha condições de se deslocar diariamente para o local de estágio na Seleção Simplificada. Não oferecemos auxílio moradia, mas o vale-transporte cobre os deslocamentos.',
        tags: ['cidade', 'deslocamento', 'local'],
      },
    ],
  },
];

interface ContactInfo {
  icon: JSX.Element;
  title: string;
  content: string;
  subtitle: string;
  link?: string;
}

const contactInfo: ContactInfo[] = [
  {
    icon: <MapPin className="text-primary" size={20} />,
    title: 'Endereço',
    content: 'Seleção Simplificada',
    subtitle: 'Endereço da instituição',
  },
  {
    icon: <Calendar className="text-primary" size={20} />,
    title: 'Horário de Atendimento',
    content: 'Segunda a Sexta-feira',
    subtitle: '9h às 12h e 14h às 17h',
  },
  {
    icon: <Mail className="text-primary" size={20} />,
    title: 'Email de Contato',
    content: 'contato@example.com',
    subtitle: 'Respondemos em até 48h úteis',
    link: 'mailto:contato@example.com',
  },
  {
    icon: <Users className="text-primary" size={20} />,
    title: 'Telefone',
    content: '(00) 0000-0000',
    subtitle: 'Segunda a Sexta-feira, 9h às 17h',
    link: 'tel:+550000000000',
  },
];

// ------------------------------------------------------------
// 2. FUNÇÕES AUXILIARES
// ------------------------------------------------------------

const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
};

const highlightMatchingTags = (tags: string[], searchTerm: string) => {
  if (!searchTerm) return tags.map((tag) => ({ tag, isMatch: false }));
  const normalizedSearch = searchTerm.toLowerCase();
  return tags.map((tag) => ({
    tag,
    isMatch: tag.toLowerCase().includes(normalizedSearch),
  }));
};

const filterFaqData = (
  data: FAQCategory[],
  searchTerm: string,
  activeCategory: string | null
): FAQCategory[] => {
  if (!searchTerm && !activeCategory) return data;

  const normalizedSearchTerm = normalizeString(searchTerm);
  const searchWords = normalizedSearchTerm.split(' ').filter((word) => word.length > 0);

  const filtered = data
    .map((category) => ({
      ...category,
      questions: category.questions.filter((q) => {
        if (!searchTerm) return true;
        const normalizedQuestion = normalizeString(q.question);
        const normalizedAnswer = normalizeString(q.answer);
        const normalizedTags = q.tags.map((tag) => normalizeString(tag));

        return searchWords.some((word) => {
          return (
            normalizedQuestion.includes(word) ||
            normalizedAnswer.includes(word) ||
            normalizedTags.some((tag) => tag.includes(word))
          );
        });
      }),
    }))
    .filter((category) => category.questions.length > 0);

  if (activeCategory && !searchTerm) {
    return filtered.filter((category) => category.category === activeCategory);
  }

  return filtered;
};

// ------------------------------------------------------------
// 3. COMPONENTES MENORES
// ------------------------------------------------------------

// Hero da página
const FAQHero = ({ totalQuestions, totalCategories }: { totalQuestions: number; totalCategories: number }) => {
  const { t } = useI18n();
  return (
  <section className="px-5 pb-10 pt-16 text-center md:px-8 md:pb-14 md:pt-24">
    <p className="mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm text-muted-foreground">
      <span className="h-2 w-2 rounded-full bg-highlight ring-2 ring-primary/30" />
      <span className="tabular">{totalQuestions}</span> perguntas · <span className="tabular">{totalCategories}</span> categorias
    </p>
    <h1 className="mx-auto mt-6 max-w-3xl text-[clamp(2.25rem,5.5vw,4.25rem)] font-medium leading-[1]">
      <SplitWords text={t('Central de')} /><SplitWords text={t('ajuda')} className="font-serif font-normal italic" delay={0.15} />
    </h1>
    <motion.p
      className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground"
      initial={{ y: 12, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      {t('Encontre respostas para as dúvidas mais frequentes sobre nossos processos seletivos.')}
    </motion.p>
  </section>
  );
};

// Barra de pesquisa
const FAQSearch = ({
  searchTerm,
  setSearchTerm,
  visibleCount,
  activeCategory,
  clearFilters,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  visibleCount: number;
  activeCategory: string | null;
  clearFilters: () => void;
}) => (
  <motion.div
    className="container mx-auto px-4 -mt-10 relative z-10"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, delay: 0.45 }}
  >
    <div className="mx-auto max-w-4xl rounded-3xl bg-card shadow-sm ring-1 border p-5 md:p-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/70" size={20} />
        <input
          type="text"
          placeholder="Buscar por palavras-chave, perguntas, respostas ou tags..."
          className="w-full rounded-2xl border border-border bg-background/70 py-4 pl-12 pr-12 text-foreground placeholder:text-muted-foreground/70 outline-none transition
                     focus:border-primary focus:ring-4 focus:ring-primary/15
                     hover:bg-background"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <motion.button
            type="button"
            aria-label="Limpar busca"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground/80 hover:bg-muted transition"
            onClick={() => setSearchTerm('')}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            ✕
          </motion.button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">
          {searchTerm || activeCategory ? (
            <>
              <span className="font-semibold text-foreground">{visibleCount}</span> resultado(s)
              {searchTerm && (
                <> para "<span className="font-semibold text-foreground">{searchTerm}</span>"</>
              )}
              {activeCategory && (
                <> em <span className="font-semibold text-foreground">"{activeCategory}"</span></>
              )}
            </>
          ) : (
            'Digite para buscar por palavras-chave, perguntas, respostas ou tags'
          )}
        </div>

        {(searchTerm || activeCategory) && (
          <motion.button
            type="button"
            onClick={clearFilters}
            className="text-sm font-semibold text-primary hover:text-primary-hover underline-offset-4 hover:underline transition"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Limpar filtros
          </motion.button>
        )}
      </div>
    </div>
  </motion.div>
);

// Barra lateral de categorias
const FAQSidebar = ({
  categories,
  activeCategory,
  onToggleCategory,
  onClearCategory,
}: {
  categories: FAQCategory[];
  activeCategory: string | null;
  onToggleCategory: (category: string) => void;
  onClearCategory: () => void;
}) => (
  <motion.aside
    className="lg:col-span-1"
    initial={{ opacity: 0, x: -18 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.6, delay: 0.55 }}
  >
    <div className="sticky top-28 rounded-3xl bg-card shadow-sm ring-1 border p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Categorias</h3>
        {activeCategory && (
          <button
            type="button"
            onClick={onClearCategory}
            className="text-xs font-semibold text-primary hover:text-primary-hover transition"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="space-y-2">
        {categories.map((category, index) => {
          const active = activeCategory === category.category;
          return (
            <motion.button
              key={category.category}
              type="button"
              onClick={() => onToggleCategory(category.category)}
              className={[
                'w-full rounded-2xl px-4 py-3 text-left transition ring-1',
                active
                  ? 'bg-primary text-primary-foreground ring-white/20 shadow-sm'
                  : 'bg-background text-foreground/80 ring-ring hover:bg-muted hover:ring-ring',
              ].join(' ')}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.06 }}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{category.icon}</span>
                <span className="font-semibold">{category.category}</span>
                <span className={`ml-auto text-sm ${active ? 'text-white/80' : 'text-muted-foreground'}`}>
                  ({category.questions.length})
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Call to Action */}
      <div className="mt-8 border-t border-border pt-6">
        <h4 className="mb-4 text-sm font-semibold text-foreground">Não encontrou o que procura?</h4>
        <motion.button
          type="button"
          onClick={() => (window.location.href = '#contato')}
          className="w-full rounded-2xl bg-primary py-3 font-semibold text-primary-foreground shadow-sm hover:brightness-[1.03] transition"
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          Entrar em Contato
        </motion.button>
      </div>
    </div>
  </motion.aside>
);

// Componente de uma pergunta individual
const FAQQuestion = ({
  item,
  isOpen,
  onToggle,
  searchTerm,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: (id: number) => void;
  searchTerm: string;
}) => {
  const foundByTag =
    searchTerm &&
    item.tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.28 }}
    >
      <div className="w-full p-6 text-left transition hover:bg-background/70">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggle(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${item.id}`}
                  className="w-full text-left"
                >
                  <h3 className="mb-3 text-lg font-semibold text-foreground group-hover:text-primary transition">
                    {item.question}
                  </h3>
                </button>
                {foundByTag && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-primary whitespace-nowrap"
                  >
                    Encontrado pela tag
                  </motion.span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="mb-3 flex flex-wrap gap-2">
              {highlightMatchingTags(item.tags, searchTerm).map(({ tag, isMatch }, tagIndex) => (
                <span
                  key={tagIndex}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 transition-all ${
                    isMatch && searchTerm
                      ? 'bg-white text-primary ring-white shadow-sm'
                      : 'bg-primary-soft text-primary ring-ring'
                  }`}
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Resposta */}
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  id={`faq-${item.id}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.28 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 rounded-2xl bg-card p-5 ring-1 ring-ring">
                    <p className="text-foreground/80 leading-relaxed">{item.answer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => onToggle(item.id)}
            aria-expanded={isOpen}
            aria-controls={`faq-${item.id}`}
            className="mt-1 flex-shrink-0 rounded-xl p-2 text-muted-foreground/70 ring-1 ring-transparent group-hover:text-primary group-hover:bg-card group-hover:ring-ring transition"
          >
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
              <ChevronDown size={20} />
            </motion.div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// Categoria expandida com suas perguntas
const FAQCategorySection = ({
  category,
  openItems,
  onToggleQuestion,
  searchTerm,
}: {
  category: FAQCategory;
  openItems: number[];
  onToggleQuestion: (id: number) => void;
  searchTerm: string;
}) => (
  <motion.section
    className="overflow-hidden rounded-3xl bg-card shadow-sm ring-1 border"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45 }}
  >
    {/* Cabeçalho da categoria */}
    <div className="border-b border-border bg-gradient-to-r from-background to-primary-soft p-6">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-card p-3 shadow-sm ring-1 border">
          <span className="text-2xl">{category.icon}</span>
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-foreground">{category.category}</h2>
          <p className="text-sm text-muted-foreground">
            {category.questions.length} pergunta
            {category.questions.length !== 1 ? 's' : ''} disponível
            {category.questions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </div>

    {/* Lista de perguntas */}
    <div className="divide-y divide-border">
      {category.questions.map((item, idx) => (
        <FAQQuestion
          key={item.id}
          item={item}
          isOpen={openItems.includes(item.id)}
          onToggle={onToggleQuestion}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  </motion.section>
);

// Estado vazio (nenhum resultado)
const FAQEmpty = ({ clearFilters }: { clearFilters: () => void }) => (
  <motion.div
    className="mt-6 rounded-3xl bg-card p-12 text-center shadow-sm ring-1 border"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
  >
    <HelpCircle size={64} className="mx-auto mb-4 text-muted-foreground/70" />
    <h3 className="mb-2 text-2xl font-semibold text-foreground/80">Nenhum resultado encontrado</h3>
    <p className="mx-auto mb-6 max-w-md text-muted-foreground">
      Não encontramos perguntas correspondentes à sua busca. Tente outros termos ou tags.
    </p>
    <motion.button
      type="button"
      onClick={clearFilters}
      className="rounded-2xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow hover:bg-primary-hover transition"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
    >
      Ver todas as perguntas
    </motion.button>
  </motion.div>
);

// Seção de contato
const FAQContact = () => (
  <motion.section
    id="contato"
    className="mt-12 overflow-hidden rounded-3xl bg-primary shadow-sm"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, delay: 0.85 }}
  >
    <div className="p-8 md:p-10 text-white">
      <div className="mb-10 text-center">
        <h2 className="mb-4 text-3xl md:text-4xl font-semibold text-primary-foreground/80">
          Ainda precisa de ajuda?
        </h2>
        <p className="mx-auto max-w-2xl text-white/80 text-base md:text-lg leading-relaxed">
          Nossa equipe está pronta para esclarecer todas as suas dúvidas sobre processos seletivos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {contactInfo.map((contact, index) => (
          <motion.div
            key={index}
            className="group relative rounded-2xl bg-white/10 p-6 ring-1 ring-white/15 hover:bg-white/15 transition-all duration-300 hover:shadow-sm min-h-[200px] flex flex-col"
            whileHover={{ scale: 1.02, y: -4 }}
            transition={{ type: 'spring', stiffness: 300 }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-card shadow-sm">
                  {contact.icon}
                </div>

                <div className="flex-1">
                  <h4 className="mb-2 font-semibold text-white text-lg">{contact.title}</h4>
                  <div className="space-y-1">
                    {contact.link ? (
                      <a
                        href={contact.link}
                        className="block font-semibold text-white hover:text-primary-foreground/80 transition-colors duration-300 break-words"
                        target={contact.link.startsWith('http') ? '_blank' : '_self'}
                        rel={contact.link.startsWith('http') ? 'noopener noreferrer' : ''}
                      >
                        {contact.content}
                      </a>
                    ) : (
                      <p className="font-semibold text-white break-words">{contact.content}</p>
                    )}
                    <p className="text-sm text-white/70 break-words">{contact.subtitle}</p>
                  </div>
                </div>
              </div>

              {contact.link && (
                <motion.div
                  className="mt-auto opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a
                    href={contact.link}
                    className="block w-full rounded-xl bg-white/20 py-2 text-center text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/30 transition-colors duration-300 mt-4"
                    target={contact.link.startsWith('http') ? '_blank' : '_self'}
                    rel={contact.link.startsWith('http') ? 'noopener noreferrer' : ''}
                  >
                    {contact.link.startsWith('mailto')
                      ? 'Enviar Email'
                      : contact.link.startsWith('tel')
                      ? 'Ligar Agora'
                      : contact.link.startsWith('http')
                      ? 'Ver no Mapa'
                      : 'Acessar'}
                  </a>
                </motion.div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </motion.section>
);

// ------------------------------------------------------------
// 4. COMPONENTE PRINCIPAL
// ------------------------------------------------------------

export default function FAQ() {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState<number[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const totalQuestions = useMemo(
    () => faqData.reduce((acc, cat) => acc + cat.questions.length, 0),
    []
  );
  const totalCategories = faqData.length;

  const filteredData = useMemo(
    () => filterFaqData(faqData, searchTerm, activeCategory),
    [searchTerm, activeCategory]
  );

  const visibleQuestionsCount = useMemo(
    () => filteredData.reduce((acc, cat) => acc + cat.questions.length, 0),
    [filteredData]
  );

  const toggleQuestion = (id: number) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleCategory = (category: string) => {
    setActiveCategory((prev) => (prev === category ? null : category));
    setOpenItems([]);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveCategory(null);
    setOpenItems([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <FAQHero totalQuestions={totalQuestions} totalCategories={totalCategories} />

      <FAQSearch
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        visibleCount={visibleQuestionsCount}
        activeCategory={activeCategory}
        clearFilters={clearFilters}
      />

      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-4">
          <FAQSidebar
            categories={faqData}
            activeCategory={activeCategory}
            onToggleCategory={toggleCategory}
            onClearCategory={() => setActiveCategory(null)}
          />

          <motion.main
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="space-y-6">
              {filteredData.map((category) => (
                <FAQCategorySection
                  key={category.category}
                  category={category}
                  openItems={openItems}
                  onToggleQuestion={toggleQuestion}
                  searchTerm={searchTerm}
                />
              ))}
            </div>

            <AnimatePresence>
              {filteredData.length === 0 && <FAQEmpty clearFilters={clearFilters} />}
            </AnimatePresence>

            <FAQContact />
          </motion.main>
        </div>
      </div>

      <Footer />
    </div>
  );
}