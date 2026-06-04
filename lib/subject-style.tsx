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
  sc: string; // subject-card accent class (.sc-bio, etc.)
  accent: string; // hex accent colour
  emoji: string; // top emoji, matching design-reference.html
  Icon: LucideIcon; // lucide icon (used in page headers)
}

const MAP: Record<string, SubjectStyle> = {
  biology: { sc: "sc-bio", accent: "#06b6d4", emoji: "🧬", Icon: Dna },
  chemistry: { sc: "sc-chem", accent: "#6366f1", emoji: "⚗️", Icon: FlaskConical },
  physics: { sc: "sc-phys", accent: "#f97316", emoji: "⚡", Icon: Atom },
  english: { sc: "sc-eng", accent: "#22c55e", emoji: "📝", Icon: BookOpen },
  "logical-reasoning": { sc: "sc-lr", accent: "#ec4899", emoji: "🧠", Icon: Brain },
};

export function subjectStyle(slug: string): SubjectStyle {
  return (
    MAP[slug] ?? {
      sc: "sc-blue",
      accent: "#1a56db",
      emoji: "📘",
      Icon: BookMarked,
    }
  );
}
