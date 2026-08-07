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
          <Link
            to="/profile"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            title={t('Perfil', 'Profile')}
          >
            <span className="w-7 h-7 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="font-display font-bold text-[10px] text-accent">
                {getInitials(profile?.full_name)}
              </span>
            </span>
            <span className="text-xs font-medium max-w-[8rem] truncate">{profile?.full_name}</span>
          </Link>
          <button onClick={signOut} className="text-xs text-textMuted hover:text-danger">
            {t('Sair', 'Sign out')}
          </button>
        </div>
      </div>
    </div>
  );
}

function getInitials(fullName: string | undefined): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
