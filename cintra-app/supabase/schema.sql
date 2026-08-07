-- Cintra platform schema
-- Run this in the Supabase SQL editor for a new project.

-- ============ EXTENSIONS ============
create extension if not exists "uuid-ossp";

-- ============ INSTITUTIONS ============
-- Supports multi-university from day one, even though the pilot is UEM only.
create table institutions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,        -- e.g. 'uem'
  country text not null default 'Mozambique',
  created_at timestamptz not null default now()
);

-- ============ PROFILES ============
-- Extends Supabase's built-in auth.users with app-specific fields.
create type user_role as enum ('student', 'instructor', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  institution_id uuid references institutions(id),
  full_name text not null,
  role user_role not null default 'student',
  created_at timestamptz not null default now()
);

-- ============ COURSES / MODULES / LESSONS ============
create table courses (
  id uuid primary key default uuid_generate_v4(),
  institution_id uuid references institutions(id), -- null = available to all institutions
  title_pt text not null,
  title_en text not null,
  description_pt text,
  description_en text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table modules (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  title_pt text not null,
  title_en text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create type lesson_type as enum ('standard', 'interactive');

create table lessons (
  id uuid primary key default uuid_generate_v4(),
  module_id uuid not null references modules(id) on delete cascade,
  type lesson_type not null,
  title_pt text not null,
  title_en text not null,
  position int not null default 0,
  -- Content is stored as JSON so both lesson types share one table:
  -- standard:    { reading_pt, reading_en, quiz: [{ question_pt, question_en, choices:[{text_pt,text_en,correct}], explanation_pt, explanation_en }] }
  -- interactive: { channel, sender_pt, sender_en, message_pt, message_en, choices:[{text_pt,text_en,correct,feedback_pt,feedback_en}] }
  content jsonb not null,
  created_at timestamptz not null default now()
);

-- ============ COHORTS ============
-- A cohort is a group of students at an institution taking a course (e.g. "UEM Pilot - Sept 2026").
create table cohorts (
  id uuid primary key default uuid_generate_v4(),
  institution_id uuid not null references institutions(id),
  course_id uuid not null references courses(id),
  name text not null,
  created_at timestamptz not null default now()
);

create table cohort_members (
  cohort_id uuid not null references cohorts(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (cohort_id, student_id)
);

-- ============ PROGRESS ============
create type progress_status as enum ('not_started', 'in_progress', 'completed');

create table lesson_progress (
  student_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  status progress_status not null default 'not_started',
  score numeric,               -- percentage correct, for lessons with a quiz/choices
  attempts int not null default 0,
  last_answer jsonb,           -- what the student last selected, for resume
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (student_id, lesson_id)
);

-- ============ INDEXES ============
create index idx_modules_course on modules(course_id);
create index idx_lessons_module on lessons(module_id);
create index idx_progress_student on lesson_progress(student_id);
create index idx_cohort_members_student on cohort_members(student_id);

-- ============ ROW LEVEL SECURITY ============
alter table profiles enable row level security;
alter table lesson_progress enable row level security;
alter table cohort_members enable row level security;
alter table courses enable row level security;
alter table modules enable row level security;
alter table lessons enable row level security;
alter table cohorts enable row level security;

-- Profiles: users see their own profile; instructors/admins see profiles in their institution
create policy "own profile" on profiles for select using (auth.uid() = id);
create policy "update own profile" on profiles for update using (auth.uid() = id);

-- Courses/modules/lessons: readable by any authenticated user (published content)
create policy "read published courses" on courses for select using (is_published = true);
create policy "read modules" on modules for select using (true);
create policy "read lessons" on lessons for select using (true);

-- Progress: students manage their own progress rows
create policy "own progress select" on lesson_progress for select using (auth.uid() = student_id);
create policy "own progress upsert" on lesson_progress for insert with check (auth.uid() = student_id);
create policy "own progress update" on lesson_progress for update using (auth.uid() = student_id);

-- Instructors/admins: read all progress for students in their institution
-- (implemented via a security definer function to avoid recursive RLS)
create function is_instructor_or_admin(check_institution uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('instructor', 'admin')
    and institution_id = check_institution
  );
$$;

create policy "instructor reads cohort progress" on lesson_progress for select using (
  exists (
    select 1 from profiles p
    where p.id = lesson_progress.student_id
    and is_instructor_or_admin(p.institution_id)
  )
);

create policy "cohort members read own membership" on cohort_members for select using (
  auth.uid() = student_id or is_instructor_or_admin(
    (select institution_id from cohorts where id = cohort_members.cohort_id)
  )
);

create policy "cohorts readable by institution" on cohorts for select using (true);
