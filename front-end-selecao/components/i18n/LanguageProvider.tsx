'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { en } from './en';

export type Lang = 'pt' | 'en';
type Vars = Record<string, string | number>;

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (s: string, v?: Vars) => string }>({
  lang: 'pt',
  setLang: () => {},
  t: (s) => s,
});

export const useI18n = () => useContext(Ctx);

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('pt');

  // começa em pt (igual ao servidor) e troca após hidratar; padrão do sistema é pt
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lang');
      if (saved === 'en') setLangState('en');
    } catch {
      /* sem localStorage: fica em pt */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('lang', l);
    } catch {
      /* ignora */
    }
  }, []);

  const t = useCallback(
    (s: string, v?: Vars) => {
      let out = lang === 'en' ? en[s] ?? s : s;
      if (v) for (const k in v) out = out.replace(`{${k}}`, String(v[k]));
      return out;
    },
    [lang],
  );

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}
