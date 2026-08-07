import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useLanguage } from '../lib/LanguageContext';
import { LessonMaterial } from '../lib/types';
import TopBar from '../components/TopBar';

export default function LectureView() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { lang, t } = useLanguage();

  const [lessonTitlePt, setLessonTitlePt] = useState('');
  const [lessonTitleEn, setLessonTitleEn] = useState('');
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [saved, setSaved] = useState(false);

  async function markComplete() {
    if (!profile || !lessonId || saved) return;
    setSaved(true);
    await supabase.from('lesson_progress').upsert({
      student_id: profile.id,
      lesson_id: lessonId,
      status: 'completed',
      score: 100,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  useEffect(() => {
    if (!lessonId) return;
    load();
  }, [lessonId]);

  async function load() {
    const { data: lesson } = await supabase
      .from('lessons')
      .select('title_pt, title_en')
      .eq('id', lessonId)
      .single();

    if (lesson) {
      setLessonTitlePt(lesson.title_pt);
      setLessonTitleEn(lesson.title_en);
    }

    const { data: materialRows } = await supabase
      .from('lesson_materials')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('position');

    setMaterials((materialRows as LessonMaterial[]) ?? []);
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

  if (materials.length === 0) {
    return (
      <div>
        <TopBar />
        <div className="text-center text-textMuted text-sm py-20">
          {t('Ainda não há diapositivos para esta lição.', 'No slides for this lesson yet.')}
        </div>
      </div>
    );
  }

  const slide = materials[slideIndex];
  const total = materials.length;
  const hasImage = Boolean(slide.image_url);

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <div className="flex items-center justify-between px-6 py-3 border-b border-cardBorder">
        <div>
          <p className="text-xs text-textMuted font-mono">{lang === 'pt' ? lessonTitlePt : lessonTitleEn}</p>
          <p className="text-xs text-textFaint font-mono">
            {slideIndex + 1} / {total}
          </p>
        </div>
        <button onClick={() => navigate('/')} className="text-textMuted hover:text-text text-sm">
          {t('Voltar ✕', 'Back ✕')}
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-6">
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
          {materials.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlideIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === slideIndex ? 'bg-accent' : 'bg-cardBorder'
              }`}
            />
          ))}
        </div>
        {slideIndex === total - 1 ? (
          <button
            onClick={async () => {
              await markComplete();
              navigate('/');
            }}
            className="bg-accent text-bg0 font-semibold rounded-lg px-4 py-2 text-sm"
          >
            {t('Concluir →', 'Finish →')}
          </button>
        ) : (
          <button
            onClick={() => setSlideIndex(Math.min(total - 1, slideIndex + 1))}
            className="bg-accent text-bg0 font-semibold rounded-lg px-4 py-2 text-sm"
          >
            {t('Seguinte →', 'Next →')}
          </button>
        )}
      </div>
    </div>
  );
}
