import { createContext, useContext, useState, ReactNode } from 'react';
import { Lang } from './types';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (pt: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('pt');
  const t = (pt: string, en: string) => (lang === 'pt' ? pt : en);
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
}
