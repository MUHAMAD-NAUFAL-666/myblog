import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import {
  AnimatedSpan,
  Terminal,
} from "@/app/components/terminal";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
  Step,
  Steps,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "joins",
  number: "03.01",
  title: "JOINs — combining tables without fear",
  description:
    "INNER, LEFT, RIGHT, FULL — and the only diagram you'll ever need to remember which is which.",
  duration: "16 min",
  tags: ["joins", "relations"],
  headings: [
    { id: "the-mental-picture", text: "The mental picture", depth: 2 },
    { id: "step-by-step", text: "Step-by-step: the four joins", depth: 2 },
    { id: "the-diagram", text: "The diagram", depth: 2 },
    { id: "self-joins", text: "Self-joins", depth: 2 },
    { id: "common-mistakes", text: "Common mistakes", depth: 2 },
    { id: "performance", text: "The performance footnote", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        A relational database isn&apos;t one giant spreadsheet. The whole
        point is that data lives in different tables, and you assemble
        what you need at query time. <code>JOIN</code> is the glue.
      </p>

      <Prerequisites
        items={[
          "Comfort with SELECT, WHERE, ORDER BY (chapter 2).",
          "Both users and orders tables seeded — note that users 4 and 6 have no orders.",
          "An hour and a coffee. This lesson rewards reading carefully.",
        ]}
      />

      <H2 id="the-mental-picture">The mental picture</H2>
      <p>
        A <code>JOIN</code> takes two row-sets — call them <em>left</em>{" "}
        and <em>right</em> — and stitches each row on the left to the
        rows on the right that satisfy a condition. The four join types
        differ only in what to do when nothing on one side matches.
      </p>

      <KeyConcepts
        items={[
          {
            title: "INNER",
            body: "Keep only pairs where the condition is true on both sides. Unmatched rows on either side are dropped.",
          },
          {
            title: "LEFT",
            body: "Keep every row on the left. Fill the right side with NULL when no match exists.",
          },
          {
            title: "RIGHT",
            body: "Mirror of LEFT. Rarely used in practice — flip the table order and use LEFT instead.",
          },
          {
            title: "FULL OUTER",
            body: "Keep every row on both sides. NULLs fill in wherever the other side has no match. Postgres only by default.",
          },
        ]}
      />

      <H2 id="step-by-step">Step-by-step: the four joins</H2>

      <Steps>
        <Step
          title="INNER JOIN — only matching rows"
          summary="The default JOIN keyword. Returns rows where the condition is true on both sides."
        >
          <CodeBlock
            language="sql"
            code={`SELECT u.name, o.amount, o.status
FROM   users u
JOIN   orders o ON o.user_id = u.id
ORDER  BY u.name;`}
          />

          <Terminal title="result — sqlite3">
            <AnimatedSpan className="text-[#a89e8f]">
              <span>name           amount   status</span>
              <span>-------------  -------  --------</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-[#d8d1c2]">
              <span>Ana Lopez      49.00    paid</span>
              <span>Ana Lopez      19.00    paid</span>
              <span>Ben Tanaka     129.00   pending</span>
              <span>Cam Williams   79.00    paid</span>
              <span>Cam Williams   29.00    refunded</span>
              <span>Eli Schwartz   999.00   paid</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-amber-300">
              <span>(6 rows — Dee and Fei have no orders, so they&apos;re missing.)</span>
            </AnimatedSpan>
          </Terminal>
        </Step>

        <Step
          title="LEFT JOIN — keep the left side"
          summary="What you want when the question is 'everyone, with their stuff if they have any.'"
        >
          <CodeBlock
            language="sql"
            code={`SELECT u.name, COUNT(o.id) AS order_count
FROM   users u
LEFT   JOIN orders o ON o.user_id = u.id
GROUP  BY u.id, u.name
ORDER  BY order_count DESC, u.name;`}
          />

          <Callout variant="warn" title="COUNT(o.id), not COUNT(*)">
            With <code>LEFT JOIN</code>, unmatched rows contain NULLs.{" "}
            <code>COUNT(*)</code> counts those NULL rows as 1.{" "}
            <code>COUNT(o.id)</code> counts only the rows that actually
            matched. Off-by-one bugs in dashboards usually trace back
            here.
          </Callout>
        </Step>

        <Step
          title="RIGHT JOIN — the rarely-needed sibling"
          summary="Same as LEFT, but keeps the right side instead. In practice, flip the order and use LEFT."
        >
          <CodeBlock
            language="sql"
            code={`-- These two queries return the same rows.
SELECT u.name, o.amount
FROM   orders o
RIGHT  JOIN users u ON u.id = o.user_id;

SELECT u.name, o.amount
FROM   users u
LEFT   JOIN orders o ON o.user_id = u.id;`}
          />
        </Step>

        <Step
          title="FULL OUTER JOIN — both sides, NULL where missing"
          summary="Useful for reconciliation: 'show me everything that exists in either table.'"
        >
          <CodeBlock
            language="sql"
            code={`-- Postgres
SELECT u.name, o.amount
FROM   users u
FULL   OUTER JOIN orders o ON o.user_id = u.id;

-- SQLite added FULL OUTER JOIN in 3.39 (2022).
-- Older versions: emulate with two LEFT JOINs unioned together.`}
          />
        </Step>
      </Steps>

      <H2 id="the-diagram">The diagram you&apos;ll actually remember</H2>

      <CodeBlock
        language="text"
        code={`A INNER JOIN B  →  rows that match in both
A LEFT  JOIN B  →  every A, plus matching B (NULL where missing)
A RIGHT JOIN B  →  every B, plus matching A (rarely needed — flip the order)
A FULL  JOIN B  →  every A and every B, NULLs where unmatched`}
      />

      <H2 id="self-joins">Self-joins</H2>
      <p>
        Useful for hierarchies (managers, comment threads, category
        trees). Just alias both sides:
      </p>

      <CodeBlock
        language="sql"
        code={`-- Find pairs of users from the same country.
SELECT a.name AS user_a, b.name AS user_b, a.country
FROM   users a
JOIN   users b ON b.country = a.country AND b.id > a.id
ORDER  BY a.country;`}
      />

      <p>
        The <code>b.id &gt; a.id</code> condition prevents counting each
        pair twice and avoids matching a row with itself. A small habit
        worth keeping.
      </p>

      <H2 id="common-mistakes">Common mistakes</H2>

      <KeyConcepts
        items={[
          {
            title: "Filtering on the right side of a LEFT JOIN in WHERE",
            body: "WHERE o.status = 'paid' silently turns your LEFT JOIN into an INNER JOIN — NULL rows fail the predicate. Move the condition into ON, or use IS NULL OR ...",
          },
          {
            title: "Forgetting the join condition",
            body: "Without ON, you get a CROSS JOIN — every row paired with every row. Six users × six orders = 36 rows. Always specify ON.",
          },
          {
            title: "Reaching for DISTINCT to fix duplicates",
            body: "Duplicate rows after a join almost always mean your join condition has a one-to-many relationship you didn't account for. Find the missing predicate, don't paper over it.",
          },
          {
            title: "Joining on a non-indexed column",
            body: "Every join becomes a full table scan. Make sure the columns in ON are indexed — usually they're foreign keys, which means already indexed in well-designed schemas.",
          },
        ]}
      />

      <Callout variant="warn" title="LEFT JOIN + WHERE — the silent killer">
        <CodeBlock
          language="sql"
          code={`-- ❌ Becomes an INNER JOIN. Users without paid orders disappear.
SELECT u.name, o.amount
FROM   users u
LEFT   JOIN orders o ON o.user_id = u.id
WHERE  o.status = 'paid';

-- ✅ Push the condition into the ON clause.
SELECT u.name, o.amount
FROM   users u
LEFT   JOIN orders o ON o.user_id = u.id AND o.status = 'paid';`}
        />
      </Callout>

      <H2 id="performance">The performance footnote</H2>
      <p>
        Joins are cheap when the join columns are indexed. The classic
        mistake is joining on a column that isn&apos;t a primary or
        foreign key — every join becomes a full table scan. We&apos;ll
        cover index design and reading <code>EXPLAIN</code> output later
        in the course.
      </p>

      <Recap
        items={[
          "Four join types: INNER, LEFT, RIGHT, FULL — they differ only in how they handle non-matching rows.",
          "LEFT JOIN is your default when the question is 'everyone, with optional related rows.'",
          "Filtering on the right side of a LEFT JOIN belongs in ON, not WHERE.",
          "DISTINCT after a join is a smell — find the missing predicate.",
          "Indexes on join columns turn joins from full scans into B-tree lookups.",
        ]}
      />
    </>
  ),
};
