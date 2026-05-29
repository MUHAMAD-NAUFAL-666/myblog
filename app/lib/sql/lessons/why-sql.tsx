import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/app/components/terminal";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "why-sql",
  number: "01.01",
  title: "Why SQL still wins",
  description:
    "Twenty years in, SQL is still the most leveraged language a backend engineer can know. Here is the case for taking it seriously.",
  duration: "8 min",
  tags: ["fundamentals", "mental-model"],
  headings: [
    { id: "the-honest-pitch", text: "The honest pitch", depth: 2 },
    { id: "what-this-course-is-not", text: "What this course is not", depth: 2 },
    { id: "what-youll-walk-away-with", text: "What you'll walk away with", depth: 2 },
    { id: "how-to-read-this-course", text: "How to read this course", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        SQL has outlived three generations of frameworks. Every new ORM
        eventually gives up and lets you drop down to raw SQL. Every queue,
        analytics tool, and data warehouse speaks a dialect of it. Learning
        SQL well is the highest-leverage backend skill you can pick up — and
        most engineers stop at <code>SELECT * FROM users</code>.
      </p>

      <Prerequisites
        items={[
          "You can read JavaScript, Python, or any C-family syntax.",
          "You've used a database through an ORM or a REST API at least once.",
          "You don't need to know any SQL — we start from the keyboard.",
        ]}
      />

      <H2 id="the-honest-pitch">The honest pitch</H2>
      <p>
        I&apos;ve interviewed hundreds of full-stack engineers. The single
        biggest predictor of seniority isn&apos;t the framework on their
        résumé — it&apos;s how they reach for the database. The juniors
        write five round-trips and call it done. The seniors write one
        query, with the right index, and move on.
      </p>

      <Callout variant="tip" title="The leverage compounds">
        A single query that does what would have been five round-trips
        isn&apos;t just faster — it&apos;s simpler to test, easier to reason
        about, and one fewer place for bugs to hide. Multiply that across
        a career.
      </Callout>

      <H2 id="what-this-course-is-not">What this course is not</H2>
      <p>
        It is <em>not</em> a CS textbook on relational algebra. It&apos;s
        also not a tutorial on ORM-of-the-month. It is the version of SQL I
        wish someone had handed me when I started — pragmatic, opinionated,
        written the way a senior engineer would explain things to a junior
        over lunch.
      </p>

      <H2 id="what-youll-walk-away-with">What you&apos;ll walk away with</H2>

      <KeyConcepts
        items={[
          {
            title: "A working mental model",
            body: "The seven-step execution order behind every SELECT. Once you see it, you can debug any query in 30 seconds.",
          },
          {
            title: "Idiomatic queries",
            body: "Confidence to write SELECT, WHERE, JOIN, GROUP BY without copy-pasting from Stack Overflow.",
          },
          {
            title: "Joins without fear",
            body: "An intuition for when to reach for INNER vs LEFT vs FULL — and the diagram that makes it click.",
          },
          {
            title: "Index literacy",
            body: "What an index actually is, when it helps, and the cases where adding one makes things slower.",
          },
          {
            title: "Window functions",
            body: "The most underused feature in standard SQL — running totals, ranks, lag/lead, all without subqueries.",
          },
          {
            title: "EXPLAIN fluency",
            body: "Reading query plans without flinching. The reflex that turns slow queries into a five-minute fix.",
          },
        ]}
      />

      <H2 id="how-to-read-this-course">How to read this course</H2>
      <ol>
        <li>
          <strong>Read sequentially.</strong> Each lesson assumes the
          previous one. Skipping around works for reference, not learning.
        </li>
        <li>
          <strong>Run every code block.</strong> Set up the playground in
          lesson 1.2 and keep <code>sqlite3</code> open in a side tab.
        </li>
        <li>
          <strong>Modify the queries.</strong> Change a column, break the
          syntax, look at the error. The fastest path to fluency.
        </li>
        <li>
          <strong>Skip the appendix on first pass.</strong> Come back to it
          when a real query stumps you at work.
        </li>
      </ol>

      <p>
        Two hours of work, distilled from ten years of mistakes. Worth your
        Saturday afternoon.
      </p>

      <Terminal
        title="welcome — bash"
        copyText={`> echo "Let's begin."
Let's begin.`}
      >
        <TypingAnimation duration={32}>
          {`> echo "Let's begin."`}
        </TypingAnimation>
        <AnimatedSpan className="text-emerald-400">
          <span>{`Let's begin.`}</span>
        </AnimatedSpan>
      </Terminal>

      <CodeBlock
        language="sql"
        code={`-- Your first query of this course.
-- Don't worry about the syntax yet — we'll explain every keyword.
SELECT 'Hello, SQL.' AS greeting;`}
      />

      <Recap
        items={[
          "SQL is the highest-leverage backend skill you can invest in.",
          "Most engineers stop at SELECT *. The course closes that gap in eight lessons.",
          "Read sequentially, run every example, and modify what you don't understand.",
          "Next up: setting up a local playground database in under a minute.",
        ]}
      />
    </>
  ),
};
