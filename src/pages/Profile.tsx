import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { supabase } from '../lib/supabase';
import { Profile as ProfileType, Exam, ExamResult } from '../lib/types';
import TopBar from '../components/TopBar';

interface PastExam {
  exam: Exam;
  score: number;
}

export default function Profile() {
  const { studentId } = useParams();
  const { profile: ownProfile } = useAuth();
  const { t, lang } = useLanguage();
  const [viewedProfile, setViewedProfile] = useState<ProfileType | null>(null);
  const [courseTitle, setCourseTitle] = useState<string | null>(null);
  const [pastExams, setPastExams] = useState<PastExam[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const isViewingOther = Boolean(studentId) && studentId !== ownProfile?.id;

  useEffect(() => {
    if (!ownProfile) return;

    if (!isViewingOther) {
      setViewedProfile(ownProfile);
      setLoading(false);
      return;
    }

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

  useEffect(() => {
    if (viewedProfile?.role !== 'student') return;
    loadExams(viewedProfile.id);
  }, [viewedProfile]);

  async function loadExams(studentId: string) {
    const { data: examsData } = await supabase.from('exams').select('*').order('position');
    const { data: resultsData } = await supabase.from('exam_results').select('*').eq('student_id', studentId);

    const exams = (examsData as Exam[]) ?? [];
    const results = (resultsData as ExamResult[]) ?? [];
    const scoreByExam: Record<string, number> = {};
    results.forEach((r) => (scoreByExam[r.exam_id] = r.score));

    setPastExams(
      exams.filter((e) => scoreByExam[e.id] !== undefined).map((e) => ({ exam: e, score: scoreByExam[e.id] }))
    );
    setUpcomingExams(exams.filter((e) => scoreByExam[e.id] === undefined));
  }

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
  const formattedDob = viewedProfile.date_of_birth ? formatDate(viewedProfile.date_of_birth, lang) : null;

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

        {isStudent && (
          <div className="card p-6 mt-6">
            <p className="text-[11px] uppercase tracking-wide text-textMuted font-mono mb-4">
              {t('Resultados dos exames', 'Exam Results')}
            </p>

            {pastExams.length === 0 && (
              <p className="text-textMuted text-sm mb-2">{t('Ainda sem resultados.', 'No results yet.')}</p>
            )}

            <div className="flex flex-col divide-y divide-cardBorder mb-6">
              {pastExams.map(({ exam, score }) => {
                const tone = scoreTone(score);
                return (
                  <div key={exam.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm">{lang === 'pt' ? exam.title_pt : exam.title_en}</span>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-textMuted font-mono">{formatDate(exam.exam_date, lang)}</span>
                        <span className={`text-xs font-mono ${tone.text}`}>
                          {score}/{exam.max_score}
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-bg2 rounded-full overflow-hidden">
                      <div className={`h-full ${tone.bar}`} style={{ width: `${(score / exam.max_score) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-[11px] uppercase tracking-wide text-textMuted font-mono mb-3">
              {t('Próximos exames', 'Upcoming exams')}
            </p>
            <div className="flex flex-col gap-1.5">
              {upcomingExams.length === 0 && (
                <p className="text-textMuted text-sm">{t('Nenhum exame agendado.', 'No exams scheduled.')}</p>
              )}
              {upcomingExams.map((exam) => (
                <div
                  key={exam.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg2 border border-cardBorder"
                >
                  <span className="text-sm">{lang === 'pt' ? exam.title_pt : exam.title_en}</span>
                  <span className="text-xs text-textMuted font-mono">{formatDate(exam.exam_date, lang)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
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

function formatDate(iso: string, lang: 'pt' | 'en'): string {
  return new Date(iso).toLocaleDateString(lang === 'pt' ? 'pt-PT' : 'en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function scoreTone(score: number): { bar: string; text: string } {
  if (score < 49) return { bar: 'bg-danger', text: 'text-danger' };
  if (score <= 60) return { bar: 'bg-warning', text: 'text-warning' };
  return { bar: 'bg-success', text: 'text-success' };
}
