export type Difficulty = "easy" | "medium" | "hard";

export interface Subject {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  position: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  name: string;
  position: number;
}

export interface Mcq {
  id: string;
  subject_id: string;
  topic_id: string | null;
  text: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  difficulty: Difficulty;
  past_paper_year: number | null;
  is_free: boolean;
}

/** MCQ shape safe to send to the browser — no correct answer / explanation. */
export type PracticeMcq = Pick<
  Mcq,
  "id" | "text" | "options" | "difficulty" | "is_free"
>;

export interface Plan {
  id: string;
  name: string;
  description: string | null;
  price_pkr: number;
  duration_days: number;
  features: string[] | null;
  active: boolean;
  position: number;
}

export type TestType = "mock" | "topic" | "past_paper" | "practice";

export interface Test {
  id: string;
  title: string;
  type: TestType;
  subject_id: string | null;
  topic_id: string | null;
  total_questions: number;
  duration_minutes: number;
  marks_per_correct: number;
  negative_marks: number;
  past_paper_year: number | null;
  is_free: boolean;
  published: boolean;
  created_at: string;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  mcq_id: string;
  position: number;
}

export interface Lecture {
  id: string;
  subject_id: string;
  topic_id: string | null;
  title: string;
  video_url: string | null;
  video_path: string | null;
  notes_body: string | null;
  notes_path: string | null;
  position: number;
  is_free: boolean;
}

export type BookType = "book" | "notes";

export interface Book {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  type: BookType;
  file_path: string;
  cover_url: string | null;
  file_size_mb: number | null;
  is_free: boolean;
  position: number;
  created_at: string;
}
