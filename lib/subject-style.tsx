import {
  Dna,
  FlaskConical,
  Atom,
  BookOpen,
  Brain,
  BookMarked,
  type LucideIcon,
} from "lucide-react";

export interface SubjectStyle {
  sc: string; // subject-card class
  accent: string; // hex accent
  Icon: LucideIcon;
}

const MAP: Record<string, SubjectStyle> = {
  biology: { sc: "sc-bio", accent: "#06b6d4", Icon: Dna },
  chemistry: { sc: "sc-chem", accent: "#6366f1", Icon: FlaskConical },
  physics: { sc: "sc-phys", accent: "#f97316", Icon: Atom },
  english: { sc: "sc-eng", accent: "#22c55e", Icon: BookOpen },
  "logical-reasoning": { sc: "sc-lr", accent: "#ec4899", Icon: Brain },
};

export function subjectStyle(slug: string): SubjectStyle {
  return MAP[slug] ?? { sc: "sc-blue", accent: "#1a56db", Icon: BookMarked };
}
