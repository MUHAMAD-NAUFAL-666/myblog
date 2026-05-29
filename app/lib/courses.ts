import type { ReactNode } from "react";

export type Lesson = {
  slug: string;
  number: number;
  title: string;
  description: string;
  duration: string;
  tags: string[];
  content: ReactNode;
};

export type Course = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "All levels";
  duration: string;
  lessonCount: number;
  accent: "amber" | "emerald" | "indigo" | "rose";
  status: "available" | "coming-soon";
  href: string;
};

export const courses: Course[] = [
  {
    slug: "sql",
    title: "SQL for engineers who ship",
    tagline: "From SELECT to production-ready queries.",
    description:
      "Four chapters, eight pragmatic lessons that take you from your first SELECT to indexes, joins, and the queries you'll actually write at work.",
    level: "All levels",
    duration: "≈ 2 hours",
    lessonCount: 8,
    accent: "amber",
    status: "available",
    href: "/docs/sql",
  },
  {
    slug: "design-systems",
    title: "Design Systems, slowly",
    tagline: "The decisions that compound.",
    description:
      "How to start, scale, and maintain a design system that survives team changes and framework migrations.",
    level: "Intermediate",
    duration: "≈ 3 hours",
    lessonCount: 8,
    accent: "indigo",
    status: "coming-soon",
    href: "/docs/design-systems",
  },
  {
    slug: "performance",
    title: "Frontend Performance, honestly",
    tagline: "Numbers you can feel.",
    description:
      "A practitioner's guide to web performance: the metrics that matter, the ones that don't, and how to make a real-world app fast.",
    level: "Intermediate",
    duration: "≈ 2.5 hours",
    lessonCount: 7,
    accent: "rose",
    status: "coming-soon",
    href: "/docs/performance",
  },
];
