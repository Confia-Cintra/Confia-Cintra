import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase';
import { Profile as ProfileType } from '../lib/types';
import TopBar from '../components/TopBar';

export default function Profile() {
  const { studentId } = useParams();
  const { profile: ownProfile } = useAuth();
  const { t, lang } = useLanguage();
  const [viewedProfile, setViewedProfile] = useState<ProfileType | null>(null);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isViewingOther = Boolean(studentId) && studentId !== ownProfile?.id;

  useEffect(() => {
    if (!ownProfile) return;

    if (!isViewingOther) {
      setViewedProfile(ownProfile);
      setLoading(false);
      return;
    }

    // Viewing someone else's profile — only reaches real data if the
    // database's row-level security allows it (instructor viewing a
    // student at the same institution); otherwise this comes back empty.
    setLoading(true);
    supabase
      .from('profiles')
      .select('*')
      .eq('id', studentId)
      .single()
      .then(({ data }) => {
        setViewedProfile((data as ProfileType) ?? null);
        setLoading(false);
      });
  }, [ownProfile, studentId, isViewingOther]);

  useEffect(() => {
    if (viewedProfile?.role !== 'student') return;
    supabase
      .from('courses')
      .select('title_pt, title_en')
      .eq('is_published', true)
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setCourseTitle(lang === 'pt' ? data.title_pt : data.title_en);
      });
  }, [viewedProfile, lang]);

  if (loading) {
    return (
      <div>
        <TopBar />
        <div className="text-center text-textMuted text-sm py-20">{t('A carregar...', 'Loading...')}</div>
      </div>
    );
  }

  if (!viewedProfile) {
    return (
      <div>
        <TopBar />
        <div className="text-center text-textMuted text-sm py-20">
          {t('Não foi possível encontrar este perfil.', 'This profile could not be found.')}
        </div>
      </div>
    );
  }

  const isStudent = viewedProfile.role === 'student';
  const initials = getInitials(viewedProfile.full_name);
  const formattedDob = viewedProfile.date_of_birth
    ? new Date(viewedProfile.date_of_birth).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
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
            <h1 className="font-display font-bold text-xl">{viewedProfile.full_name}</h1>
          </div>
        </div>

        <div className="card p-6">
          <p className="text-[11px] uppercase tracking-wide text-textMuted font-mono mb-4">
            {t('Dados pessoais', 'Personal information')}
          </p>

          <div className="flex flex-col divide-y divide-cardBorder">
            <InfoRow
              label={isStudent ? t('Número de estudante', 'Student ID number') : t('Número de funcionário', 'Staff ID number')}
              value={viewedProfile.student_number ?? '—'}
            />
            <InfoRow label={t('Nome completo', 'Full name')} value={viewedProfile.full_name} />

            {isStudent && (
              <>
                <InfoRow label={t('Data de nascimento', 'Date of birth')} value={formattedDob ?? t('Não indicado', 'Not provided')} />
                <InfoRow label={t('Curso', 'Course enrolled')} value={courseTitle ?? '—'} />
                <InfoRow label={t('Ano de estudo', 'Year of study')} value={viewedProfile.year_of_study ?? t('Não indicado', 'Not provided')} />
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
