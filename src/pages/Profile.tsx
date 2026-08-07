import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase';
import TopBar from '../components/TopBar';

export default function Profile() {
  const { profile } = useAuth();
  const { t, lang } = useLanguage();
  const [courseTitle, setCourseTitle] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role !== 'student') return;
    supabase
      .from('courses')
      .select('title_pt, title_en')
      .eq('is_published', true)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setCourseTitle(lang === 'pt' ? data.title_pt : data.title_en);
      });
  }, [profile, lang]);

  if (!profile) return null;

  const isStudent = profile.role === 'student';

  const initials = getInitials(profile.full_name);
  const formattedDob = profile.date_of_birth
    ? new Date(profile.date_of_birth).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <div>
      <TopBar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-2xl text-accent">{initials}</span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-textMuted font-mono mb-1">
              {isStudent ? t('Estudante', 'Student') : t('Instrutor', 'Instructor')}
            </p>
            <h1 className="font-display font-bold text-xl">{profile.full_name}</h1>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-[11px] uppercase tracking-wide text-textMuted font-mono mb-4">
            {t('Dados pessoais', 'Personal information')}
          </p>

          <div className="flex flex-col divide-y divide-cardBorder">
            <InfoRow
              label={isStudent ? t('Número de estudante', 'Student ID number') : t('Número de funcionário', 'Staff ID number')}
              value={profile.student_number ?? '—'}
            />
            <InfoRow label={t('Nome completo', 'Full name')} value={profile.full_name} />

            {isStudent && (
              <>
                <InfoRow label={t('Data de nascimento', 'Date of birth')} value={formattedDob ?? t('Não indicado', 'Not provided')} />
                <InfoRow label={t('Curso', 'Course enrolled')} value={courseTitle ?? '—'} />
                <InfoRow label={t('Ano de estudo', 'Year of study')} value={profile.year_of_study ?? t('Não indicado', 'Not provided')} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-textMuted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function getInitials(fullName: string | undefined): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
