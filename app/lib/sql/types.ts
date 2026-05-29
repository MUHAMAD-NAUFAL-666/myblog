import type { ReactNode } from "react";

export type LessonHeading = {
  id: string;
  text: string;
  depth: 2 | 3;
};

export type Lesson = {
  slug: string;
  number: string; // chapter.lesson e.g. "01.02"
  title: string;
  description: string;
  duration: string;
  tags: string[];
  /** Anchors for the right-rail "On this page" TOC */
  headings: LessonHeading[];
  content: ReactNode;
};

export type Chapter = {
  slug: string;
  number: string; // "01"
  title: string;
  summary: string;
  lessons: Lesson[];
};
