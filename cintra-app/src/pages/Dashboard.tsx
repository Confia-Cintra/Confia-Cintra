import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { Course, Module, Lesson, LessonProgress } from '../lib/types';
import TopBar from '../components/TopBar';

type CourseWithModules = Course & { modules: (Module & { lessons: Lesson[] })[] };

export default function Dashboard() {
  const { profile } = useAuth();
  const { t, lang } = useLanguage();
  const [courses, setCourses] = useState<CourseWithModules[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    loadData();
  }, [profile]);

  async function loadData() {
    const { data: courseData } = await supabase
      .from('courses')
      .select('*, modules(*, lessons(*))')
      .eq('is_published', true);

    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('*')
      .eq('student_id', profile!.id);

    setCourses((courseData as CourseWithModules[]) ?? []);
    const map: Record<string, LessonProgress> = {};
    (progressData as LessonProgress[] ?? []).forEach((p) => (map[p.lesson_id] = p));
    setProgressMap(map);
    setLoading(false);
  }

  if (loading) {
    return (
      <div>
        <TopBar />
        <div className="text-center text-textMuted text-sm py-20">{t('A carregar...', 'Loading...')}</div>
      </div>
    );
  }

  return (
    <div>
      <TopBar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile section — left-aligned, directly below the top bar */}
        <div className="flex items-center gap-4 pb-8 mb-8 border-b border-cardBorder">
          <div className="w-16 h-16 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center flex-shrink-0">
            <span className="font-display font-bold text-lg text-accent">
              {getInitials(profile?.full_name)}
            </span>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-textMuted font-mono mb-1">
              {t('Estudante', 'Student')}
            </p>
            <p className="font-display font-semibold text-lg">{profile?.full_name}</p>
          </div>
        </div>

        <h1 className="font-display font-bold text-xl mb-1">
          {t('Os teus cursos', 'Your courses')}
        </h1>
        <p className="text-textMuted text-sm mb-8">
          {t('Continua de onde ficaste.', 'Pick up where you left off.')}
        </p>

        {courses.length === 0 && (
          <p className="text-textMuted text-sm">
            {t('Ainda não há cursos publicados.', 'No courses published yet.')}
          </p>
        )}

        {courses.map((course) => {
          const progressLessons = course.modules.flatMap((m) => m.lessons).filter((l) => l.context !== 'lecture');
          const completed = progressLessons.filter((l) => progressMap[l.id]?.status === 'completed').length;
          const total = progressLessons.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <div key={course.id} className="card p-6 mb-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display font-semibold text-base">
                  {lang === 'pt' ? course.title_pt : course.title_en}
                </h2>
                <span className="font-mono text-xs text-accent">{pct}%</span>
              </div>
              <div className="w-full h-1.5 bg-bg2 rounded-full overflow-hidden mb-5">
                <div className="h-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>

              {course.modules
                .sort((a, b) => a.position - b.position)
                .map((mod) => {
                  const studentLessons = mod.lessons
                    .filter((l) => l.context !== 'lecture')
                    .sort((a, b) => a.position - b.position);
                  if (studentLessons.length === 0) return null;
                  return (
                    <div key={mod.id} className="mb-4 last:mb-0">
                      <p className="text-xs uppercase tracking-wide text-textMuted font-mono mb-2">
                        {lang === 'pt' ? mod.title_pt : mod.title_en}
                      </p>
                      <div className="flex flex-col gap-1.5">
                        {studentLessons.map((lesson) => {
                          const isLecture = lesson.context === 'both' || lesson.context === 'lecture';
                          const status = progressMap[lesson.id]?.status ?? 'not_started';
                          return (
                            <Link
                              key={lesson.id}
                              to={isLecture ? `/lecture/${lesson.id}` : `/lesson/${lesson.id}`}
                              className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-bg2 border border-cardBorder hover:border-accent transition-colors"
                            >
                              <span className="text-sm">
                                {lang === 'pt' ? lesson.title_pt : lesson.title_en}
                              </span>
                              <StatusBadge status={status} t={t} />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          );
        })}
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

function StatusBadge({
  status,
  t,
}: {
  status: string;
  t: (pt: string, en: string) => string;
}) {
  if (status === 'completed')
    return <span className="text-[11px] font-mono text-success">{t('concluído', 'done')}</span>;
  if (status === 'in_progress')
    return <span className="text-[11px] font-mono text-warning">{t('em curso', 'in progress')}</span>;
  return <span className="text-[11px] font-mono text-textFaint">{t('por iniciar', 'not started')}</span>;
}
