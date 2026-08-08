export type Lang = 'pt' | 'en';

export type LessonType = 'standard' | 'interactive';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type UserRole = 'student' | 'instructor' | 'admin';

export interface QuizChoice {
  text_pt: string;
  text_en: string;
  correct: boolean;
  explanation_pt?: string;
  explanation_en?: string;
}

export interface QuizQuestion {
  question_pt: string;
  question_en: string;
  choices: QuizChoice[];
}

export interface StandardLessonContent {
  reading_pt: string;
  reading_en: string;
  quiz: QuizQuestion[];
}

export interface InteractiveChoice {
  text_pt: string;
  text_en: string;
  correct: boolean;
  feedback_pt: string;
  feedback_en: string;
}

export interface InteractiveLessonContent {
  channel: 'sms' | 'call' | 'email' | 'video' | 'other';
  sender_pt: string;
  sender_en: string;
  message_pt: string;
  message_en: string;
  choices: InteractiveChoice[];
}

export type LessonContext = 'self_paced' | 'lecture' | 'both';

export interface Lesson {
  id: string;
  module_id: string;
  type: LessonType;
  title_pt: string;
  title_en: string;
  position: number;
  content: StandardLessonContent | InteractiveLessonContent;
  context: LessonContext;
  facilitator_notes_pt: string | null;
  facilitator_notes_en: string | null;
}

export interface Module {
  id: string;
  course_id: string;
  title_pt: string;
  title_en: string;
  position: number;
  lessons?: Lesson[];
}

export interface Course {
  id: string;
  institution_id: string | null;
  title_pt: string;
  title_en: string;
  description_pt: string | null;
  description_en: string | null;
  is_published: boolean;
  modules?: Module[];
}

export interface LessonProgress {
  student_id: string;
  lesson_id: string;
  status: ProgressStatus;
  score: number | null;
  attempts: number;
  last_answer: unknown;
  completed_at: string | null;
  updated_at: string;
}

export interface LessonMaterial {
  id: string;
  lesson_id: string;
  title_pt: string;
  title_en: string;
  body_pt: string;
  body_en: string;
  resource_url: string | null;
  image_url: string | null;
  image_credit: string | null;
  position: number;
}

export interface Exam {
  id: string;
  institution_id: string | null;
  title_pt: string;
  title_en: string;
  exam_date: string;
  max_score: number;
  position: number;
}

export interface ExamResult {
  student_id: string;
  exam_id: string;
  score: number;
}

export interface Profile {
  id: string;
  institution_id: string | null;
  full_name: string;
  role: UserRole;
  student_number: string | null;
  date_of_birth: string | null;
  year_of_study: string | null;
}
