import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "case-conditional",
  number: "04.03",
  title: "CASE and conditional logic",
  description:
    "Branch inside a query — labels, bucketing, conditional sums, and the difference between CASE, IF, IFNULL, and COALESCE.",
  duration: "10 min",
  tags: ["case", "if", "coalesce"],
  headings: [
    { id: "the-two-shapes", text: "The two shapes of CASE", depth: 2 },
    { id: "labels-and-bucketing", text: "Labels and bucketing", depth: 2 },
    { id: "conditional-aggregates-revisited", text: "Conditional aggregates revisited", depth: 2 },
    { id: "if-ifnull-coalesce", text: "IF, IFNULL, COALESCE", depth: 2 },
    { id: "case-in-order-by", text: "CASE in ORDER BY", depth: 2 },
    { id: "common-mistakes", text: "Common mistakes", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        SQL has no <code>if/else</code> in the imperative sense — but{" "}
        <code>CASE</code> covers everything you&apos;d ever need it for.
        Bucketing, labels, conditional sums, custom sort orders. A
        small, sharp tool.
      </p>

      <Prerequisites
        items={[
          "Aggregations from lesson 4.1.",
          "Window functions from lesson 4.2 (we'll combine them).",
          "MySQL or SQLite with the playground database open.",
        ]}
      />

      <H2 id="the-two-shapes">The two shapes of CASE</H2>
      <p>
        Both forms return a value. They&apos;re expressions, not
        statements — they belong inside <code>SELECT</code>,{" "}
        <code>WHERE</code>, <code>ORDER BY</code>, anywhere a value
        belongs.
      </p>

      <CodeBlock
        language="sql"
        filename="two-shapes.sql"
        code={`-- 1. Searched CASE — each WHEN has its own predicate.
CASE
  WHEN amount >= 500 THEN 'high'
  WHEN amount >= 50  THEN 'mid'
  ELSE                   'low'
END

-- 2. Simple CASE — one expression, multiple equality checks.
CASE status
  WHEN 'paid'     THEN 'green'
  WHEN 'pending'  THEN 'amber'
  WHEN 'refunded' THEN 'red'
  ELSE                 'gray'
END`}
      />

      <Callout variant="tip" title="Always include ELSE">
        Without an <code>ELSE</code>, unmatched rows return{" "}
        <code>NULL</code> — which then propagates through any{" "}
        <code>SUM</code> or arithmetic. Be explicit. Even{" "}
        <code>ELSE NULL</code> is documentation.
      </Callout>

      <H2 id="labels-and-bucketing">Labels and bucketing</H2>

      <CodeBlock
        language="sql"
        code={`-- Bucket order amounts into pricing tiers.
SELECT id,
       amount,
       CASE
         WHEN amount >= 500 THEN 'high'
         WHEN amount >= 100 THEN 'mid'
         WHEN amount >= 25  THEN 'low'
         ELSE                    'micro'
       END AS bucket
FROM   orders
ORDER  BY amount DESC;`}
      />

      <p>
        WHEN clauses are evaluated top-to-bottom. The first one to match
        wins. Order them from most-restrictive to least-restrictive.
      </p>

      <H2 id="conditional-aggregates-revisited">Conditional aggregates revisited</H2>
      <p>
        Lesson 4.1 introduced this pattern with{" "}
        <code>FILTER (WHERE ...)</code>. CASE is the portable
        alternative — and what every MySQL version before 8.0.16
        actually supports.
      </p>

      <CodeBlock
        language="sql"
        code={`-- One scan of the orders table, three metrics.
SELECT
  COUNT(*)                                                 AS orders_total,
  SUM(CASE WHEN status = 'paid'     THEN 1 ELSE 0 END)     AS orders_paid,
  SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END)     AS orders_refunded,
  SUM(CASE WHEN status = 'paid'     THEN amount ELSE 0 END) AS revenue_paid,
  AVG(CASE WHEN status = 'paid'     THEN amount END)        AS avg_paid_amount
FROM orders;`}
      />

      <Callout variant="info" title="AVG and NULLs">
        Notice the last expression has no <code>ELSE 0</code> — that&apos;s
        deliberate. <code>AVG</code> ignores NULLs, so non-paid rows are
        excluded from the denominator. <code>ELSE 0</code> would skew the
        average toward zero.
      </Callout>

      <H2 id="if-ifnull-coalesce">IF, IFNULL, COALESCE — the cousins</H2>

      <KeyConcepts
        items={[
          {
            title: "IF(cond, a, b) — MySQL only",
            body: "Two-branch shortcut. IF(amount > 100, 'big', 'small'). Not portable; CASE is the standard equivalent.",
          },
          {
            title: "IFNULL(x, fallback)",
            body: "Returns x if not NULL, else fallback. MySQL-specific name — the standard is COALESCE.",
          },
          {
            title: "COALESCE(a, b, c, ...)",
            body: "Returns the first non-NULL argument. Portable, works in every database. Default to this one.",
          },
          {
            title: "NULLIF(a, b)",
            body: "Returns NULL if a = b, else a. Useful for divide-by-zero: amount / NULLIF(qty, 0).",
          },
        ]}
      />

      <CodeBlock
        language="sql"
        code={`SELECT id,
       COALESCE(country, 'unknown')        AS country,
       IFNULL(NULLIF(quantity, 0), 1)      AS safe_qty,
       amount / NULLIF(quantity, 0)        AS unit_price
FROM   orders;`}
      />

      <H2 id="case-in-order-by">CASE in ORDER BY — custom sort orders</H2>
      <p>
        SQL sorts alphabetically by default. When the natural order of
        an enum doesn&apos;t match the alphabet,{" "}
        <code>CASE</code> in <code>ORDER BY</code> is the cleanest fix.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Sort: paid first, then pending, then refunded.
SELECT id, status, amount
FROM   orders
ORDER  BY
  CASE status
    WHEN 'paid'     THEN 1
    WHEN 'pending'  THEN 2
    WHEN 'refunded' THEN 3
    ELSE                 99
  END,
  amount DESC;`}
      />

      <Callout variant="pro" title="Better: store an integer enum">
        If you find yourself writing the same CASE-in-ORDER-BY across the
        codebase, the underlying schema is fighting you. Store a numeric
        priority alongside the label — sort becomes free, and the meaning
        moves into the data instead of every query.
      </Callout>

      <H2 id="common-mistakes">Common mistakes</H2>

      <KeyConcepts
        items={[
          {
            title: "Forgetting ELSE",
            body: "Unmatched rows silently become NULL. SUM still works, but AVG, percentages, and downstream JSON serializers might surprise you.",
          },
          {
            title: "Reordering WHEN branches",
            body: "WHEN amount >= 25 before WHEN amount >= 100 makes the second branch unreachable. Always order from strictest to loosest.",
          },
          {
            title: "Using IF for portability",
            body: "IF is MySQL-only. Use CASE if the same SQL might run on Postgres or SQLite.",
          },
          {
            title: "Mixing types across branches",
            body: "All WHEN branches must return compatible types. CASE WHEN cond THEN 1 ELSE 'no' END will be coerced — and that coercion is rarely what you wanted.",
          },
        ]}
      />

      <Recap
        items={[
          "CASE is an expression, not a statement — it returns a value anywhere a value belongs.",
          "Searched form for arbitrary predicates; simple form for equality on one expression.",
          "Always include ELSE; it documents intent and prevents stealth NULLs.",
          "COALESCE is the portable cousin of IFNULL; NULLIF kills divide-by-zero.",
          "CASE in ORDER BY gives you custom sort orders — but consider storing the priority instead.",
        ]}
      />
    </>
  ),
};
