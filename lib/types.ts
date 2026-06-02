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
