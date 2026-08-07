// Seeds one course, one module, and all lessons from content/module-1-lessons.json.
// Run with: node scripts/seed.mjs
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY as env vars (service role,
// not the anon key, because RLS blocks anonymous inserts into courses/lessons).

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.');
  console.error('Find both in your Supabase project: Settings -> API.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const pack = JSON.parse(readFileSync('./content/module-1-lessons.json', 'utf-8'));

  console.log('Creating course...');
  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .insert({
      title_pt: 'Reconhecer Fraude Digital',
      title_en: 'Recognizing Digital Fraud',
      description_pt: 'Um módulo introdutório sobre fraude de pagamentos móveis, engenharia social com IA e boas práticas de dados.',
      description_en: 'An introductory module on mobile payment fraud, AI-enabled social engineering, and safe data handling.',
      is_published: true,
    })
    .select()
    .single();

  if (courseErr) throw courseErr;
  console.log(`Course created: ${course.id}`);

  console.log('Creating module...');
  const { data: mod, error: modErr } = await supabase
    .from('modules')
    .insert({
      course_id: course.id,
      title_pt: pack.module_title_pt,
      title_en: pack.module_title_en,
      position: 1,
    })
    .select()
    .single();

  if (modErr) throw modErr;
  console.log(`Module created: ${mod.id}`);

  console.log(`Creating ${pack.lessons.length} lessons...`);
  const rows = pack.lessons.map((lesson, i) => ({
    module_id: mod.id,
    type: lesson.type,
    title_pt: lesson.title_pt,
    title_en: lesson.title_en,
    position: i + 1,
    content: lesson.content,
  }));

  const { error: lessonErr } = await supabase.from('lessons').insert(rows);
  if (lessonErr) throw lessonErr;

  console.log('Done. Seeded 1 course, 1 module, and', rows.length, 'lessons.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
