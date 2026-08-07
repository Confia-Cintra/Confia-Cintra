import { useEffect, useState, ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import {
  Lesson,
  StandardLessonContent,
  InteractiveLessonContent,
  InteractiveChoice,
  QuizChoice,
} from '../lib/types';

// Fisher-Yates shuffle — returns a new array, doesn't mutate the input.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LessonPlayer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t, lang } = useLanguage();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [finished, setFinished] = useState(false);
  const [shuffledInteractiveChoices, setShuffledInteractiveChoices] = useState<InteractiveChoice[]>([]);
  const [shuffledQuizChoices, setShuffledQuizChoices] = useState<Record<number, QuizChoice[]>>({});

  useEffect(() => {
    if (!lessonId) return;
    supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()
      .then(({ data }) => {
        const l = data as Lesson | null;
        setLesson(l);
        if (l?.type === 'interactive') {
          const c = l.content as InteractiveLessonContent;
          setShuffledInteractiveChoices(shuffle(c.choices));
        }
        setLoading(false);
      });
  }, [lessonId]);

  // Shuffle each quiz question's choices once, the first time that question
  // is reached — not on every render, and not re-shuffled on retry.
  useEffect(() => {
    if (!lesson || lesson.type !== 'standard') return;
    if (shuffledQuizChoices[questionIndex]) return;
    const content = lesson.content as StandardLessonContent;
    const q = content.quiz[questionIndex];
    if (!q) return;
    setShuffledQuizChoices((prev) => ({ ...prev, [questionIndex]: shuffle(q.choices) }));
  }, [lesson, questionIndex, shuffledQuizChoices]);

  if (loading) return <Centered>{t('A carregar...', 'Loading...')}</Centered>;
  if (!lesson) return <Centered>{t('Lição não encontrada.', 'Lesson not found.')}</Centered>;

  const isInteractive = lesson.type === 'interactive';

  async function saveProgress(score: number, attemptCount: number) {
    if (!profile) return;
    await supabase.from('lesson_progress').upsert({
      student_id: profile.id,
      lesson_id: lesson!.id,
      status: 'completed',
      score,
      attempts: attemptCount,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ---------- STANDARD LESSON (reading + quiz) ----------
  if (!isInteractive) {
    const content = lesson.content as StandardLessonContent;
    const totalQuestions = content.quiz.length;
    const question = content.quiz[questionIndex];
    const displayChoices = shuffledQuizChoices[questionIndex] ?? question.choices;
    const isCorrectSelection = selectedIndex !== null && displayChoices[selectedIndex].correct;

    function selectAnswer(idx: number) {
      if (selectedIndex !== null) return;
      setSelectedIndex(idx);
      setAttempts((a) => a + 1);
    }

    function retryQuestion() {
      setSelectedIndex(null);
    }

    function next() {
      if (questionIndex < totalQuestions - 1) {
        setQuestionIndex((i) => i + 1);
        setSelectedIndex(null);
      } else {
        // Every question was eventually answered correctly to get here.
        // Score reflects whether any retries were needed along the way.
        const pct = attempts <= totalQuestions ? 100 : 80;
        saveProgress(pct, attempts);
        setFinished(true);
      }
    }

    if (finished) {
      const pct = attempts <= totalQuestions ? 100 : 80;
      return (
        <ResultScreen
          pct={pct}
          onBack={() => navigate('/')}
          t={t}
        />
      );
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="card p-6 mb-4">
          <p className="text-xs uppercase tracking-wide text-textMuted font-mono mb-3">
            {t('Leitura', 'Reading')}
          </p>
          <p className="text-sm leading-relaxed text-text whitespace-pre-line">
            {lang === 'pt' ? content.reading_pt : content.reading_en}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-xs text-textMuted font-mono mb-3">
            {t('Pergunta', 'Question')} {questionIndex + 1}/{totalQuestions}
          </p>
          <p className="font-display font-semibold text-sm mb-4">
            {lang === 'pt' ? question.question_pt : question.question_en}
          </p>
          <div className="flex flex-col gap-2">
            {displayChoices.map((c, idx) => {
              // Only reveal correct/wrong for the choice actually picked —
              // consistent with the interactive scenarios, never give away
              // the right answer on the unselected options.
              const state = selectedIndex === idx ? (c.correct ? 'correct' : 'wrong') : 'default';
              return (
                <button
                  key={idx}
                  disabled={selectedIndex !== null}
                  onClick={() => selectAnswer(idx)}
                  className={choiceClass(state)}
                >
                  {lang === 'pt' ? c.text_pt : c.text_en}
                </button>
              );
            })}
          </div>

          {selectedIndex !== null && (
            isCorrectSelection ? (
              <button
                onClick={next}
                className="mt-4 w-full bg-accent text-bg0 font-display font-semibold rounded-lg py-2.5 text-sm"
              >
                {questionIndex < totalQuestions - 1
                  ? t('Próxima pergunta →', 'Next question →')
                  : t('Ver resultados', 'See results')}
              </button>
            ) : (
              <button
                onClick={retryQuestion}
                className="mt-4 w-full bg-bg2 border border-cardBorder text-text font-display font-semibold rounded-lg py-2.5 text-sm"
              >
                {t('Tentar novamente', 'Try again')}
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  // ---------- INTERACTIVE LESSON (scenario) ----------
  const content = lesson.content as InteractiveLessonContent;
  const displayInteractiveChoices =
    shuffledInteractiveChoices.length > 0 ? shuffledInteractiveChoices : content.choices;
  const lastChoice = selectedIndex !== null ? displayInteractiveChoices[selectedIndex] : null;
  const isCorrect = lastChoice?.correct ?? false;

  function selectInteractive(idx: number, choice: InteractiveChoice) {
    if (selectedIndex !== null) return;
    setSelectedIndex(idx);
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    if (choice.correct) {
      saveProgress(100, newAttempts);
    }
  }

  function retry() {
    setSelectedIndex(null);
  }

  if (finished) {
    // Score reflects whether it took more than one attempt: 100 on first try, 80 otherwise.
    const pct = attempts <= 1 ? 100 : 80;
    return <ResultScreen pct={pct} onBack={() => navigate('/')} t={t} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="card p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-textMuted font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse" />
          {t('Incidente simulado', 'Simulated incident')}
        </div>

        <div className="bg-bg2 border border-cardBorder rounded-xl p-4 mb-5">
          <p className="text-xs font-semibold text-warning mb-1.5">
            {lang === 'pt' ? content.sender_pt : content.sender_en}
          </p>
          <p className="text-sm leading-relaxed">
            {lang === 'pt' ? content.message_pt : content.message_en}
          </p>
        </div>

        <p className="font-display font-semibold text-sm mb-3">{t('O que deve fazer?', 'What should you do?')}</p>

        <div className="flex flex-col gap-2">
          {displayInteractiveChoices.map((c, idx) => {
            // Only reveal correct/wrong for the choice actually picked — never
            // give away the right answer on the unselected options.
            const state = selectedIndex === idx ? (c.correct ? 'correct' : 'wrong') : 'default';
            return (
              <button
                key={idx}
                disabled={selectedIndex !== null}
                onClick={() => selectInteractive(idx, c)}
                className={choiceClass(state)}
              >
                {lang === 'pt' ? c.text_pt : c.text_en}
              </button>
            );
          })}
        </div>

        {lastChoice && (
          <>
            <div
              className={`mt-4 p-4 rounded-xl text-sm leading-relaxed ${
                isCorrect ? 'bg-successDim text-success' : 'bg-dangerDim text-danger'
              }`}
            >
              {lang === 'pt' ? lastChoice.feedback_pt : lastChoice.feedback_en}
            </div>
            {isCorrect ? (
              <button
                onClick={() => setFinished(true)}
                className="mt-4 w-full bg-accent text-bg0 font-display font-semibold rounded-lg py-2.5 text-sm"
              >
                {t('Concluir', 'Finish')}
              </button>
            ) : (
              <button
                onClick={retry}
                className="mt-4 w-full bg-bg2 border border-cardBorder text-text font-display font-semibold rounded-lg py-2.5 text-sm"
              >
                {t('Tentar novamente', 'Try again')}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function choiceClass(state: 'default' | 'correct' | 'wrong') {
  const base = 'text-left w-full px-4 py-3 rounded-lg text-sm border transition-colors';
  if (state === 'correct') return `${base} bg-successDim border-success text-success`;
  if (state === 'wrong') return `${base} bg-dangerDim border-danger text-danger`;
  return `${base} bg-bg2 border-cardBorder hover:border-accent`;
}

function Centered({ children }: { children: ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center text-textMuted text-sm">{children}</div>;
}

function ResultScreen({
  pct,
  onBack,
  t,
}: {
  pct: number;
  onBack: () => void;
  t: (pt: string, en: string) => string;
}) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <p className="font-display font-bold text-4xl text-accent mb-2">{pct}%</p>
      <p className="text-textMuted text-sm mb-8">{t('Lição concluída', 'Lesson completed')}</p>
      <button
        onClick={onBack}
        className="bg-accent text-bg0 font-display font-semibold rounded-lg px-6 py-2.5 text-sm"
      >
        {t('Voltar ao painel', 'Back to dashboard')}
      </button>
    </div>
  );
}
