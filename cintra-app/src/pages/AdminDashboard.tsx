import { useEffect, useState, Fragment } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import TopBar from '../components/TopBar';
import { Lang } from '../lib/types';

interface LessonMeta {
  id: string;
  title_pt: string;
  title_en: string;
  position: number;
  context: string;
  facilitator_notes_pt: string | null;
  facilitator_notes_en: string | null;
}

interface ProgressRow {
  student_id: string;
  lesson_id: string;
  status: string;
  score: number | null;
  updated_at: string;
}

interface StudentRow {
  student_id: string;
  full_name: string;
  completed: number;
  total: number;
  avg_score: number;
  last_activity: string | null;
  at_risk: boolean;
  lessonStatus: Record<string, { status: string; score: number | null }>;
}

interface LessonStat {
  lesson: LessonMeta;
  avg_score: number;
  completion_rate: number;
  attempts: number;
}

const AT_RISK_PROGRESS_THRESHOLD = 0.5; // below 50% complete
const AT_RISK_INACTIVITY_DAYS = 7;

export default function AdminDashboard() {
  const { t, lang } = useLanguage();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [lessons, setLessons] = useState<LessonMeta[]>([]);
  const [lessonStats, setLessonStats] = useState<LessonStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: lessonData } = await supabase
      .from('lessons')
      .select('id, title_pt, title_en, position, context, facilitator_notes_pt, facilitator_notes_en')
      .order('position');
    const allLessonsRaw = (lessonData as LessonMeta[]) ?? [];
    const lessonList = allLessonsRaw.filter((l) => l.context !== 'lecture');
    setLessons(lessonList);
    const total = lessonList.length;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'student');

    const { data: progressData } = await supabase.from('lesson_progress').select('*');
    const progress = (progressData as ProgressRow[]) ?? [];

    const now = Date.now();

    const result: StudentRow[] = (profiles ?? []).map((p) => {
      const own = progress.filter((pr) => pr.student_id === p.id);
      const completed = own.filter((pr) => pr.status === 'completed').length;
      const scores = own.filter((pr) => pr.score !== null).map((pr) => pr.score as number);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      const lastActivity = own.length
        ? own.reduce((latest, pr) => (pr.updated_at > latest ? pr.updated_at : latest), own[0].updated_at)
        : null;

      const daysSinceActivity = lastActivity ? (now - new Date(lastActivity).getTime()) / 86400000 : Infinity;
      const progressRatio = total ? completed / total : 0;
      const atRisk = progressRatio < AT_RISK_PROGRESS_THRESHOLD && daysSinceActivity > AT_RISK_INACTIVITY_DAYS;

      const lessonStatus: Record<string, { status: string; score: number | null }> = {};
      lessonList.forEach((l) => {
        const pr = own.find((o) => o.lesson_id === l.id);
        lessonStatus[l.id] = { status: pr?.status ?? 'not_started', score: pr?.score ?? null };
      });

      return {
        student_id: p.id,
        full_name: p.full_name,
        completed,
        total,
        avg_score: avg,
        last_activity: lastActivity,
        at_risk: atRisk,
        lessonStatus,
      };
    });

    // Per-lesson stats across the whole cohort, to surface the weakest lesson.
    const stats: LessonStat[] = lessonList.map((l) => {
      const attemptsForLesson = progress.filter((pr) => pr.lesson_id === l.id);
      const completedForLesson = attemptsForLesson.filter((pr) => pr.status === 'completed');
      const scores = completedForLesson.filter((pr) => pr.score !== null).map((pr) => pr.score as number);
      const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const completionRate = result.length ? Math.round((completedForLesson.length / result.length) * 100) : 0;
      return { lesson: l, avg_score: avgScore, completion_rate: completionRate, attempts: attemptsForLesson.length };
    });

    setRows(result);
    setLessonStats(stats);
    setLoading(false);
  }

  const totalLessons = lessons.length;
  const cohortAvgCompletion = rows.length
    ? Math.round(
        (rows.reduce((sum, r) => sum + (totalLessons ? r.completed / totalLessons : 0), 0) / rows.length) * 100
      )
    : 0;
  const atRiskCount = rows.filter((r) => r.at_risk).length;

  const weakestLesson = lessonStats
    .filter((s) => s.attempts > 0)
    .sort((a, b) => a.avg_score - b.avg_score)[0];

  function exportCsv() {
    const header = ['Name', 'Completed', 'Total', 'Progress %', 'Avg Score', 'Last Activity', 'At Risk'];
    const csvRows = rows.map((r) => [
      r.full_name,
      r.completed,
      r.total,
      r.total ? Math.round((r.completed / r.total) * 100) : 0,
      r.avg_score,
      r.last_activity ? new Date(r.last_activity).toISOString() : 'never',
      r.at_risk ? 'yes' : 'no',
    ]);
    const csv = [header, ...csvRows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cintra-cohort-progress-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <TopBar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display font-bold text-xl">{t('Progresso da turma', 'Cohort progress')}</h1>
          <button
            onClick={exportCsv}
            className="text-xs font-mono text-textMuted border border-cardBorder rounded-lg px-3 py-1.5 hover:border-accent hover:text-accent transition-colors"
          >
            {t('Exportar CSV', 'Export CSV')}
          </button>
        </div>
        <p className="text-textMuted text-sm mb-6">
          {t('Visão geral de todos os estudantes.', 'Overview across all students.')}
        </p>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatCard label={t('Estudantes', 'Students')} value={String(rows.length)} />
          <StatCard label={t('Conclusão média', 'Avg completion')} value={`${cohortAvgCompletion}%`} />
          <StatCard label={t('Lições totais', 'Total lessons')} value={String(totalLessons)} />
          <StatCard
            label={t('Em risco', 'At risk')}
            value={String(atRiskCount)}
            tone={atRiskCount > 0 ? 'danger' : undefined}
          />
        </div>

        {weakestLesson && (
          <div className="card p-4 mb-6 border-warning/40 bg-warning/5">
            <p className="text-[11px] uppercase tracking-wide text-warning font-mono mb-1">
              {t('Lição com mais dificuldade', 'Weakest lesson')}
            </p>
            <p className="font-display font-semibold text-sm mb-1">
              {lang === 'pt' ? weakestLesson.lesson.title_pt : weakestLesson.lesson.title_en}
            </p>
            <p className="text-xs text-textMuted">
              {t('Pontuação média', 'Avg score')}: {weakestLesson.avg_score}% ·{' '}
              {t('Taxa de conclusão', 'Completion rate')}: {weakestLesson.completion_rate}%
            </p>
          </div>
        )}

        {loading ? (
          <p className="text-textMuted text-sm">{t('A carregar...', 'Loading...')}</p>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cardBorder text-left text-textMuted text-xs font-mono">
                  <th className="px-4 py-3 font-normal">{t('Estudante', 'Student')}</th>
                  <th className="px-4 py-3 font-normal">{t('Progresso', 'Progress')}</th>
                  <th className="px-4 py-3 font-normal">{t('Pontuação média', 'Avg score')}</th>
                  <th className="px-4 py-3 font-normal">{t('Última actividade', 'Last activity')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const pct = r.total ? Math.round((r.completed / r.total) * 100) : 0;
                  const isExpanded = expandedStudent === r.student_id;
                  return (
                    <Fragment key={r.student_id}>
                      <tr
                        onClick={() => setExpandedStudent(isExpanded ? null : r.student_id)}
                        className={`border-b border-cardBorder last:border-0 cursor-pointer hover:bg-bg2/50 transition-colors ${
                          r.at_risk ? 'bg-dangerDim/30' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {r.at_risk && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-danger flex-shrink-0"
                                title={t('Em risco: baixo progresso e inactividade', 'At risk: low progress and inactivity')}
                              />
                            )}
                            {r.full_name}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-1.5 bg-bg2 rounded-full overflow-hidden">
                              <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="font-mono text-xs text-textMuted">{pct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{r.avg_score}%</td>
                        <td className="px-4 py-3 font-mono text-xs text-textMuted">
                          {formatLastActivity(r.last_activity, t)}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-bg2/40">
                          <td colSpan={4} className="px-4 py-3">
                            <LessonBreakdown lessons={lessons} lessonStatus={r.lessonStatus} lang={lang} t={t} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function LessonBreakdown({
  lessons,
  lessonStatus,
  lang,
  t,
}: {
  lessons: LessonMeta[];
  lessonStatus: Record<string, { status: string; score: number | null }>;
  lang: Lang;
  t: (pt: string, en: string) => string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {lessons.map((l) => {
        const s = lessonStatus[l.id];
        return (
          <div key={l.id} className="flex items-center justify-between text-xs py-1">
            <span className="text-text">{lang === 'pt' ? l.title_pt : l.title_en}</span>
            <span className="font-mono flex items-center gap-2">
              {s.score !== null && <span className="text-textMuted">{s.score}%</span>}
              <LessonStatusBadge status={s.status} t={t} />
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LessonStatusBadge({ status, t }: { status: string; t: (pt: string, en: string) => string }) {
  if (status === 'completed') return <span className="text-success">{t('concluído', 'done')}</span>;
  if (status === 'in_progress') return <span className="text-warning">{t('em curso', 'in progress')}</span>;
  return <span className="text-textFaint">{t('por iniciar', 'not started')}</span>;
}

function formatLastActivity(iso: string | null, t: (pt: string, en: string) => string): string {
  if (!iso) return t('nunca', 'never');
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return t('hoje', 'today');
  if (days === 1) return t('há 1 dia', '1 day ago');
  return t(`há ${days} dias`, `${days} days ago`);
}

function StatCard({ label, value, tone }: { label: string; value: string; tone?: 'danger' }) {
  return (
    <div className="card p-4">
      <p className="text-[11px] uppercase tracking-wide text-textMuted font-mono mb-1">{label}</p>
      <p className={`font-display font-bold text-xl ${tone === 'danger' ? 'text-danger' : ''}`}>{value}</p>
    </div>
  );
}
