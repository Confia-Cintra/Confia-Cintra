import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';

export default function ProfileBadge() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="px-4 py-6">
      <Link
        to="/profile"
        className="flex items-center gap-4 w-fit hover:opacity-80 transition-opacity"
      >
        <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
          <span className="font-display font-bold text-lg text-accent">{getInitials(profile?.full_name)}</span>
        </div>
        <div className="text-left">
          <p className="text-[11px] uppercase tracking-wide text-textMuted font-mono mb-1">
            {profile?.role === 'student' ? t('Estudante', 'Student') : t('Instrutor', 'Instructor')}
          </p>
          <p className="font-display font-semibold text-lg">{profile?.full_name}</p>
        </div>
      </Link>
    </div>
  );
}

function getInitials(fullName: string | undefined): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
