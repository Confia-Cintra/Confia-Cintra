-- Run this after schema.sql to populate demo content.

insert into institutions (name, slug, country) values
  ('Universidade Eduardo Mondlane', 'uem', 'Mozambique');

insert into courses (title_pt, title_en, description_pt, description_en, is_published)
values (
  'Reconhecer Fraude Digital',
  'Recognizing Digital Fraud',
  'Um módulo introdutório sobre fraude de pagamentos móveis, engenharia social com IA e boas práticas de dados.',
  'An introductory module on mobile payment fraud, AI-enabled social engineering, and safe data handling.',
  true
) returning id;

-- NOTE: after running the insert above, copy the returned course id and paste it
-- into the module inserts below (replace COURSE_ID). Supabase SQL editor shows
-- the returned id in the results panel.

-- Example (replace COURSE_ID with the real uuid):
-- insert into modules (course_id, title_pt, title_en, position) values
--   ('COURSE_ID', 'Fraude de Pagamentos Móveis', 'Mobile Payment Fraud', 1),
--   ('COURSE_ID', 'Ameaças com Inteligência Artificial', 'AI-Enabled Threats', 2);

-- Then, for each module id, insert lessons like the examples below.

-- ============ EXAMPLE: interactive lesson (mobile money phishing) ============
-- insert into lessons (module_id, type, title_pt, title_en, position, content) values (
--   'MODULE_ID',
--   'interactive',
--   'Mensagem suspeita do M-Pesa',
--   'Suspicious M-Pesa message',
--   1,
--   '{
--     "channel": "sms",
--     "sender_pt": "M-Pesa",
--     "sender_en": "M-Pesa",
--     "message_pt": "A sua conta será suspensa. Responda com o seu PIN agora para confirmar a sua identidade.",
--     "message_en": "Your account will be suspended. Reply with your PIN now to confirm your identity.",
--     "choices": [
--       {
--         "text_pt": "Responder com o PIN para garantir segurança",
--         "text_en": "Reply with the PIN to be safe",
--         "correct": false,
--         "feedback_pt": "Nenhuma instituição financeira legítima pede o seu PIN por SMS.",
--         "feedback_en": "No legitimate financial institution asks for your PIN by SMS."
--       },
--       {
--         "text_pt": "Não responder, denunciar a mensagem",
--         "text_en": "Do not reply, report the message",
--         "correct": true,
--         "feedback_pt": "Correcto. O PIN nunca deve ser partilhado.",
--         "feedback_en": "Correct. A PIN should never be shared."
--       },
--       {
--         "text_pt": "Ignorar e apagar",
--         "text_en": "Ignore and delete",
--         "correct": false,
--         "feedback_pt": "Melhor do que responder, mas denunciar ajuda a proteger outros.",
--         "feedback_en": "Better than replying, but reporting helps protect others."
--       }
--     ]
--   }'::jsonb
-- );

-- ============ EXAMPLE: standard lesson (reading + quiz) ============
-- insert into lessons (module_id, type, title_pt, title_en, position, content) values (
--   'MODULE_ID',
--   'standard',
--   'O que é engenharia social?',
--   'What is social engineering?',
--   2,
--   '{
--     "reading_pt": "Engenharia social é a manipulação psicológica de pessoas para que revelem informação confidencial ou realizem acções que comprometem a segurança...",
--     "reading_en": "Social engineering is the psychological manipulation of people into revealing confidential information or taking actions that compromise security...",
--     "quiz": [
--       {
--         "question_pt": "Qual destes é um exemplo de engenharia social?",
--         "question_en": "Which of these is an example of social engineering?",
--         "choices": [
--           { "text_pt": "Um vírus que se espalha automaticamente", "text_en": "A virus that spreads automatically", "correct": false },
--           { "text_pt": "Uma chamada a fingir ser o banco a pedir dados", "text_en": "A call pretending to be the bank asking for details", "correct": true },
--           { "text_pt": "Uma falha de hardware", "text_en": "A hardware failure", "correct": false }
--         ]
--       }
--     ]
--   }'::jsonb
-- );

-- A full content pack (all lessons for weeks 2-3) should be generated as a
-- separate seed file once the module structure is finalized. This file is a
-- starting template — see /content/module-1-lessons.json for the fuller set
-- to convert into inserts.
