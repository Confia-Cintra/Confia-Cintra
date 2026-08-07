import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../lib/LanguageContext';
import TopBar from '../components/TopBar';
import { LessonMaterial, Lang } from '../lib/types';

interface LessonWithMaterials {
  id: string;
  title_pt: string;
  title_en: string;
  module_title_pt: string;
  module_title_en: string;
  module_position: number;
  materials: LessonMaterial[];
  hasQuiz: boolean;
}

export default function Materials() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonWithMaterials[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<LessonWithMaterials | null>(null);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: lessonRows } = await supabase
      .from('lessons')
      .select('id, title_pt, title_en, position, content, modules(title_pt, title_en, position)')
      .order('position');

    const { data: materialRows } = await supabase
      .from('lesson_materials')
      .select('*')
      .order('position');

    const materials = (materialRows as LessonMaterial[]) ?? [];

    const combined: LessonWithMaterials[] = (lessonRows ?? []).map((l: any) => ({
      id: l.id,
      title_pt: l.title_pt,
      title_en: l.title_en,
      module_title_pt: l.modules?.title_pt ?? '',
      module_title_en: l.modules?.title_en ?? '',
      module_position: l.modules?.position ?? 0,
      materials: materials.filter((m) => m.lesson_id === l.id),
      hasQuiz: Array.isArray(l.content?.quiz) && l.content.quiz.length > 0,
    }));

    setLessons(combined);
    setLoading(false);
  }

  function openLesson(lesson: LessonWithMaterials) {
    if (lesson.materials.length > 0) {
      setActiveLesson(lesson);
      setSlideIndex(0);
    } else if (lesson.hasQuiz) {
      navigate(`/lesson/${lesson.id}`);
    }
  }

  // Group lessons by module, then sort both the modules and the lessons
  // within each module explicitly by position — Week 1 must always be
  // first, regardless of row order returned by the database.
  const groupedByPosition = lessons.reduce<Record<string, { position: number; lessons: LessonWithMaterials[] }>>(
    (acc, l) => {
      const key = lang === 'pt' ? l.module_title_pt : l.module_title_en;
      if (!acc[key]) acc[key] = { position: l.module_position, lessons: [] };
      acc[key].lessons.push(l);
      return acc;
    },
    {}
  );

  const orderedModules = (
    Object.entries(groupedByPosition) as [string, { position: number; lessons: LessonWithMaterials[] }][]
  ).sort(([, a], [, b]) => a.position - b.position);

  return (
    <div>
      <TopBar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="font-display font-bold text-xl mb-1">{t('Materiais de aula', 'Lecture materials')}</h1>
        <p className="text-textMuted text-sm mb-8">
          {t(
            'Conteúdo por lição para apresentar em sala de aula.',
            'Lesson-by-lesson content to present in class.'
          )}
        </p>

        {loading ? (
          <p className="text-textMuted text-sm">{t('A carregar...', 'Loading...')}</p>
        ) : (
          orderedModules.map(([moduleTitle, group]) => (
            <div key={moduleTitle} className="mb-8">
              <p className="text-xs uppercase tracking-wide text-textMuted font-mono mb-3">{moduleTitle}</p>
              <div className="flex flex-col gap-2">
                {group.lessons.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => openLesson(l)}
                    disabled={l.materials.length === 0 && !l.hasQuiz}
                    className="text-left card p-4 flex items-center justify-between hover:border-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="text-sm font-medium">{lang === 'pt' ? l.title_pt : l.title_en}</span>
                    <span className="text-xs font-mono text-textMuted">
                      {l.materials.length > 0
                        ? `${l.materials.length} ${t('diapositivos', 'slides')}`
                        : l.hasQuiz
                        ? t('questionário', 'quiz')
                        : t('sem material', 'no material yet')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {activeLesson && (
        <SlideViewer
          lesson={activeLesson}
          slideIndex={slideIndex}
          setSlideIndex={setSlideIndex}
          onClose={() => setActiveLesson(null)}
          lang={lang}
          t={t}
        />
      )}
    </div>
  );
}

function SlideViewer({
  lesson,
  slideIndex,
  setSlideIndex,
  onClose,
  lang,
  t,
}: {
  lesson: LessonWithMaterials;
  slideIndex: number;
  setSlideIndex: (i: number) => void;
  onClose: () => void;
  lang: Lang;
  t: (pt: string, en: string) => string;
}) {
  const slide = lesson.materials[slideIndex];
  const total = lesson.materials.length;
  const hasImage = Boolean(slide.image_url);

  return (
    <div className="fixed inset-0 bg-bg0/95 backdrop-blur-sm flex flex-col z-50">
      <div className="flex items-center justify-between px-6 py-4 border-b border-cardBorder">
        <div>
          <p className="text-xs text-textMuted font-mono">{lang === 'pt' ? lesson.title_pt : lesson.title_en}</p>
          <p className="text-xs text-textFaint font-mono">
            {slideIndex + 1} / {total}
          </p>
        </div>
        <button onClick={onClose} className="text-textMuted hover:text-text text-sm">
          {t('Fechar ✕', 'Close ✕')}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-6 overflow-auto">
        {/* Slide surface: white background, black text — presentation-ready for a projector */}
        <div className="max-w-3xl w-full bg-white text-black rounded-2xl shadow-2xl p-8 md:p-10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 min-w-0">
              <h2 className="font-display font-bold text-2xl mb-5 text-black">
                {lang === 'pt' ? slide.title_pt : slide.title_en}
              </h2>
              <p className="text-base leading-relaxed whitespace-pre-line text-gray-800">
                {lang === 'pt' ? slide.body_pt : slide.body_en}
              </p>
              {slide.resource_url && (
                <a
                  href={slide.resource_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-6 text-sm text-blue-600 hover:underline"
                >
                  {t('Abrir recurso →', 'Open resource →')}
                </a>
              )}
            </div>
            {hasImage && (
              <div className="w-full md:w-40 flex-shrink-0">
                <img
                  src={slide.image_url ?? undefined}
                  alt={lang === 'pt' ? slide.title_pt : slide.title_en}
                  className="w-full h-32 md:h-40 object-cover rounded-lg"
                />
                {slide.image_credit && (
                  <p className="text-[10px] text-gray-400 mt-1.5">{slide.image_credit}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 px-6 py-6">
        <button
          onClick={() => setSlideIndex(Math.max(0, slideIndex - 1))}
          disabled={slideIndex === 0}
          className="bg-bg2 border border-cardBorder text-text rounded-lg px-4 py-2 text-sm disabled:opacity-30"
        >
          {t('← Anterior', '← Previous')}
        </button>
        <div className="flex gap-1.5">
          {lesson.materials.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === slideIndex ? 'bg-accent' : 'bg-cardBorder'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setSlideIndex(Math.min(total - 1, slideIndex + 1))}
          disabled={slideIndex === total - 1}
          className="bg-accent text-bg0 font-semibold rounded-lg px-4 py-2 text-sm disabled:opacity-30"
        >
          {t('Seguinte →', 'Next →')}
        </button>
      </div>
    </div>
  );
}
