import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';

export default function TopBar() {
  const { profile, signOut } = useAuth();
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="border-b border-cardBorder">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-base">
          Cintra
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/profile" className="text-xs text-textMuted hover:text-accent">
            {t('Perfil', 'Profile')}
          </Link>
          {profile?.role !== 'student' && (
            <>
              <Link to="/admin" className="text-xs text-textMuted hover:text-accent">
                {t('Painel do instrutor', 'Instructor panel')}
              </Link>
              <Link to="/materials" className="text-xs text-textMuted hover:text-accent">
                {t('Materiais', 'Materials')}
              </Link>
            </>
          )}
          <div className="flex bg-bg2 border border-cardBorder rounded-full p-0.5 font-mono text-[11px]">
            <button
              onClick={() => setLang('pt')}
              className={`px-2.5 py-1 rounded-full ${lang === 'pt' ? 'bg-accent text-bg0' : 'text-textFaint'}`}
            >
              PT
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-full ${lang === 'en' ? 'bg-accent text-bg0' : 'text-textFaint'}`}
            >
              EN
            </button>
          </div>
          <button onClick={signOut} className="text-xs text-textMuted hover:text-danger">
            {t('Sair', 'Sign out')}
          </button>
        </div>
      </div>
    </div>
  );
}
