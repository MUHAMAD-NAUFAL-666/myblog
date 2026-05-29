import type { Chapter, Lesson } from "@/app/lib/sql/types";

import { lesson as whySql } from "@/app/lib/sql/lessons/why-sql";
import { lesson as setup } from "@/app/lib/sql/lessons/setup";
import { lesson as mentalModel } from "@/app/lib/sql/lessons/mental-model";
import { lesson as select } from "@/app/lib/sql/lessons/select";
import { lesson as where } from "@/app/lib/sql/lessons/where";
import { lesson as orderingAndLimit } from "@/app/lib/sql/lessons/ordering-and-limit";
import { lesson as joins } from "@/app/lib/sql/lessons/joins";
import { lesson as aggregations } from "@/app/lib/sql/lessons/aggregations";

/* ------------------------------------------------------------------
   Chapters — the canonical structure of the course.
   The chapter number drives the lesson's display number ("01.02").
   ------------------------------------------------------------------ */
export const chapters: Chapter[] = [
  {
    slug: "foundations",
    number: "01",
    title: "Foundations",
    summary: "Why SQL still matters, how to set up a playground, and the mental model behind every query.",
    lessons: [whySql, setup, mentalModel],
  },
  {
    slug: "single-table",
    number: "02",
    title: "Single-table queries",
    summary: "SELECT, WHERE, ORDER BY — the keywords you'll write a hundred times a week.",
    lessons: [select, where, orderingAndLimit],
  },
  {
    slug: "relations",
    number: "03",
    title: "Relations",
    summary: "Combining tables with joins — without ending up with the wrong row count.",
    lessons: [joins],
  },
  {
    slug: "shaping-results",
    number: "04",
    title: "Shaping results",
    summary: "Aggregations, GROUP BY, HAVING, and conditional metrics that match your dashboard.",
    lessons: [aggregations],
  },
];

/* ------------------------------------------------------------------
   Flat lesson list — preserves chapter order. Used for prev/next,
   sidebar rendering, and static params.
   ------------------------------------------------------------------ */
export const sqlLessons: Lesson[] = chapters.flatMap((c) => c.lessons);

export function findLesson(slug: string): Lesson | undefined {
  return sqlLessons.find((l) => l.slug === slug);
}

export function findChapterFor(slug: string): Chapter | undefined {
  return chapters.find((c) => c.lessons.some((l) => l.slug === slug));
}

export function lessonNeighbours(slug: string): {
  prev: Lesson | null;
  next: Lesson | null;
  index: number;
} {
  const index = sqlLessons.findIndex((l) => l.slug === slug);
  return {
    prev: index > 0 ? sqlLessons[index - 1] : null,
    next: index >= 0 && index < sqlLessons.length - 1 ? sqlLessons[index + 1] : null,
    index,
  };
}
