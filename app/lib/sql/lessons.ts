import type { Chapter, Lesson } from "@/app/lib/sql/types";

import { lesson as whySql } from "@/app/lib/sql/lessons/why-sql";
import { lesson as setup } from "@/app/lib/sql/lessons/setup";
import { lesson as mentalModel } from "@/app/lib/sql/lessons/mental-model";
import { lesson as select } from "@/app/lib/sql/lessons/select";
import { lesson as where } from "@/app/lib/sql/lessons/where";
import { lesson as orderingAndLimit } from "@/app/lib/sql/lessons/ordering-and-limit";
import { lesson as joins } from "@/app/lib/sql/lessons/joins";
import { lesson as subqueries } from "@/app/lib/sql/lessons/subqueries";
import { lesson as setOperations } from "@/app/lib/sql/lessons/set-operations";
import { lesson as ctes } from "@/app/lib/sql/lessons/ctes";
import { lesson as aggregations } from "@/app/lib/sql/lessons/aggregations";
import { lesson as windowFunctions } from "@/app/lib/sql/lessons/window-functions";
import { lesson as caseConditional } from "@/app/lib/sql/lessons/case-conditional";
import { lesson as dataTypes } from "@/app/lib/sql/lessons/data-types";
import { lesson as ddl } from "@/app/lib/sql/lessons/ddl";
import { lesson as constraints } from "@/app/lib/sql/lessons/constraints";
import { lesson as indexesDesign } from "@/app/lib/sql/lessons/indexes-design";
import { lesson as normalization } from "@/app/lib/sql/lessons/normalization";
import { lesson as insert } from "@/app/lib/sql/lessons/insert";
import { lesson as updateDelete } from "@/app/lib/sql/lessons/update-delete";
import { lesson as upserts } from "@/app/lib/sql/lessons/upserts";
import { lesson as transactions } from "@/app/lib/sql/lessons/transactions";
import { lesson as explain } from "@/app/lib/sql/lessons/explain";
import { lesson as indexInternals } from "@/app/lib/sql/lessons/index-internals";
import { lesson as queryOptimization } from "@/app/lib/sql/lessons/query-optimization";
import { lesson as views } from "@/app/lib/sql/lessons/views";
import { lesson as storedProcedures } from "@/app/lib/sql/lessons/stored-procedures";
import { lesson as triggers } from "@/app/lib/sql/lessons/triggers";
import { lesson as usersPrivileges } from "@/app/lib/sql/lessons/users-privileges";
import { lesson as backupRestore } from "@/app/lib/sql/lessons/backup-restore";
import { lesson as replication } from "@/app/lib/sql/lessons/replication";
import { lesson as json } from "@/app/lib/sql/lessons/json";
import { lesson as fullTextSearch } from "@/app/lib/sql/lessons/full-text-search";
import { lesson as generatedColumns } from "@/app/lib/sql/lessons/generated-columns";

/* ------------------------------------------------------------------
   Chapters — the canonical structure of the course.
   The chapter number drives the lesson's display number ("01.02").
   ------------------------------------------------------------------ */
export const chapters: Chapter[] = [
  {
    slug: "foundations",
    number: "01",
    title: "Foundations",
    summary:
      "Why SQL still matters, how to set up a playground (SQLite + MySQL), and the mental model behind every query.",
    lessons: [whySql, setup, mentalModel],
  },
  {
    slug: "single-table",
    number: "02",
    title: "Single-table queries",
    summary:
      "SELECT, WHERE, ORDER BY — the keywords you'll write a hundred times a week.",
    lessons: [select, where, orderingAndLimit],
  },
  {
    slug: "relations",
    number: "03",
    title: "Relations",
    summary:
      "Joins, subqueries, set operations, and CTEs — the four ways to combine row-sets without ending up with the wrong row count.",
    lessons: [joins, subqueries, setOperations, ctes],
  },
  {
    slug: "shaping-results",
    number: "04",
    title: "Shaping results",
    summary:
      "Aggregations, window functions, and CASE — the toolkit behind every dashboard and reporting query.",
    lessons: [aggregations, windowFunctions, caseConditional],
  },
  {
    slug: "schema-design",
    number: "05",
    title: "Schema & data types",
    summary:
      "MySQL types, DDL, constraints, indexes, and normalization — the foundation every other decision rests on.",
    lessons: [dataTypes, ddl, constraints, indexesDesign, normalization],
  },
  {
    slug: "modifying-data",
    number: "06",
    title: "Modifying data",
    summary:
      "INSERT, UPDATE, DELETE, upserts, and transactions with isolation levels — the writes side of SQL.",
    lessons: [insert, updateDelete, upserts, transactions],
  },
  {
    slug: "performance",
    number: "07",
    title: "Performance",
    summary:
      "Reading EXPLAIN, the B+ trees and buffer pool behind it, and the playbook for tuning slow queries.",
    lessons: [explain, indexInternals, queryOptimization],
  },
  {
    slug: "programmability",
    number: "08",
    title: "Programmability",
    summary:
      "Views, stored procedures, functions, and triggers — when database-side code earns its place, and when it doesn't.",
    lessons: [views, storedProcedures, triggers],
  },
  {
    slug: "production",
    number: "09",
    title: "Production MySQL",
    summary:
      "Users and privileges, backups and restore drills, replication and high availability — the operations side of running MySQL.",
    lessons: [usersPrivileges, backupRestore, replication],
  },
  {
    slug: "advanced",
    number: "10",
    title: "Advanced features",
    summary:
      "JSON, full-text search, and generated columns — the modern features that close the gap with NoSQL and search engines.",
    lessons: [json, fullTextSearch, generatedColumns],
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
