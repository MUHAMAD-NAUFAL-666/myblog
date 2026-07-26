import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
  Step,
  Steps,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "set-operations",
  number: "03.03",
  title: "UNION, INTERSECT, EXCEPT",
  description:
    "Stacking result sets vertically — when to UNION, when to UNION ALL, and how to fake the missing operators in MySQL.",
  duration: "10 min",
  tags: ["union", "intersect", "except"],
  headings: [
    { id: "the-mental-picture", text: "The mental picture", depth: 2 },
    { id: "union-vs-union-all", text: "UNION vs UNION ALL", depth: 2 },
    { id: "intersect-and-except", text: "INTERSECT and EXCEPT", depth: 2 },
    { id: "the-shape-rule", text: "The shape rule", depth: 2 },
    { id: "ordering-the-result", text: "Ordering the result", depth: 2 },
    { id: "common-uses", text: "Common uses", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        <code>JOIN</code> stitches tables side by side. Set operations
        stack them on top of each other. Two result sets, same shape,
        merged into one. Useful, simple — and most engineers reach for
        them once a year and forget the gotchas.
      </p>

      <Prerequisites
        items={[
          "Comfort with SELECT and WHERE.",
          "Understanding that two queries can return the same column shape.",
          "MySQL 8.0.31+ for INTERSECT / EXCEPT support; earlier versions emulate.",
        ]}
      />

      <H2 id="the-mental-picture">The mental picture</H2>

      <KeyConcepts
        items={[
          {
            title: "UNION",
            body: "Rows from A or B. Duplicates removed.",
          },
          {
            title: "UNION ALL",
            body: "Rows from A or B. Duplicates kept. Faster — no de-dup pass.",
          },
          {
            title: "INTERSECT",
            body: "Rows that appear in both A and B.",
          },
          {
            title: "EXCEPT (a.k.a. MINUS)",
            body: "Rows in A that are not in B.",
          },
        ]}
      />

      <H2 id="union-vs-union-all">UNION vs UNION ALL</H2>
      <p>
        Both stack the rows. The difference is whether the database does
        an expensive duplicate-elimination step at the end.
      </p>

      <CodeBlock
        language="sql"
        filename="audit.sql"
        code={`-- Distinct list of countries we touch — one row per country.
SELECT country FROM users
UNION
SELECT country FROM suppliers;

-- Full audit trail — rows from both, duplicates kept.
SELECT 'user'     AS source, id, created_at FROM users
UNION ALL
SELECT 'order'    AS source, id, created_at FROM orders
ORDER BY created_at DESC
LIMIT  20;`}
      />

      <Callout variant="pro" title="Default to UNION ALL">
        If you know the two sets can&apos;t overlap (or duplicates
        don&apos;t matter), <code>UNION ALL</code> skips the de-dup
        sort. <code>UNION</code> without <code>ALL</code> is the slower
        choice — only pay for it when you actually need uniqueness.
      </Callout>

      <H2 id="intersect-and-except">INTERSECT and EXCEPT</H2>
      <p>
        Both arrived in MySQL 8.0.31 (Oct 2022). Older versions emulate
        them with subqueries.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Users who are both buyers AND on the newsletter.
SELECT user_id FROM orders
INTERSECT
SELECT user_id FROM newsletter_subscribers;

-- Users on the newsletter who never bought anything.
SELECT user_id FROM newsletter_subscribers
EXCEPT
SELECT user_id FROM orders;`}
      />

      <Callout variant="info" title="Pre-8.0.31 emulation">
        Before native support, you emulate with{" "}
        <code>EXISTS</code>/<code>NOT EXISTS</code>:
        <CodeBlock
          language="sql"
          code={`-- INTERSECT
SELECT user_id FROM newsletter_subscribers s
WHERE  EXISTS (SELECT 1 FROM orders o WHERE o.user_id = s.user_id);

-- EXCEPT
SELECT user_id FROM newsletter_subscribers s
WHERE  NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = s.user_id);`}
        />
      </Callout>

      <H2 id="the-shape-rule">The shape rule</H2>
      <p>
        Every branch of a set operation must produce the{" "}
        <strong>same number of columns</strong> with{" "}
        <strong>compatible types</strong>, in the{" "}
        <strong>same order</strong>. Column names come from the first
        branch.
      </p>

      <Steps>
        <Step
          title="Wrong number of columns"
          summary="MySQL: 'The used SELECT statements have a different number of columns'."
        >
          <CodeBlock
            language="sql"
            code={`-- ❌ 1 column unioned with 2 columns
SELECT id FROM users
UNION
SELECT id, name FROM users;`}
          />
        </Step>

        <Step
          title="Incompatible types"
          summary="A string and a number can be coerced; a date and a JSON cannot."
        >
          <CodeBlock
            language="sql"
            code={`-- ❌ — DATE on one side, JSON on the other.
SELECT created_at FROM orders
UNION
SELECT metadata   FROM events;

-- ✅ Cast explicitly when types differ.
SELECT CAST(id AS CHAR) AS code FROM users
UNION
SELECT order_code           FROM orders;`}
          />
        </Step>

        <Step
          title="Column names follow the first branch"
          summary="Aliases on the first SELECT define the result columns."
        >
          <CodeBlock
            language="sql"
            code={`SELECT id  AS entity_id, 'user'  AS kind FROM users
UNION ALL
SELECT id,             'order'             FROM orders;
-- Result columns: entity_id, kind`}
          />
        </Step>
      </Steps>

      <H2 id="ordering-the-result">Ordering the combined result</H2>
      <p>
        <code>ORDER BY</code> sorts the <em>final</em> stacked set, so it
        only goes after the last branch.
      </p>

      <CodeBlock
        language="sql"
        code={`-- ❌ ORDER BY in the middle is a syntax error in most engines.
SELECT id FROM users ORDER BY id
UNION ALL
SELECT id FROM orders;

-- ✅ Sort once at the end.
SELECT id FROM users
UNION ALL
SELECT id FROM orders
ORDER  BY id DESC
LIMIT  100;`}
      />

      <H2 id="common-uses">Common uses</H2>

      <KeyConcepts
        items={[
          {
            title: "Audit / activity feeds",
            body: "Combine events from several tables (orders, comments, logins) into a single timeline.",
          },
          {
            title: "Schema migrations",
            body: "Compare 'rows in old table' EXCEPT 'rows in new table' to spot drift.",
          },
          {
            title: "User segmentation",
            body: "INTERSECT to find users in two groups; EXCEPT for the difference.",
          },
          {
            title: "Polyglot reports",
            body: "Pull from multiple shards or partitions, stack, and aggregate.",
          },
        ]}
      />

      <Recap
        items={[
          "UNION removes duplicates; UNION ALL keeps them and runs faster.",
          "INTERSECT (both) and EXCEPT (A minus B) need MySQL 8.0.31+.",
          "All branches must agree on column count, types, and order — names follow the first.",
          "ORDER BY belongs at the very end, sorting the merged result.",
          "When in doubt: UNION ALL + DISTINCT-on-purpose beats UNION's blind de-dup.",
        ]}
      />
    </>
  ),
};
