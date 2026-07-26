import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "generated-columns",
  number: "10.03",
  title: "Generated columns",
  description:
    "Columns whose value is an expression — VIRTUAL vs STORED, the indexing patterns they unlock, and the right way to compute denormalized fields.",
  duration: "10 min",
  tags: ["generated-columns", "computed", "indexing"],
  headings: [
    { id: "what-they-are", text: "What generated columns are", depth: 2 },
    { id: "virtual-vs-stored", text: "VIRTUAL vs STORED", depth: 2 },
    { id: "indexing-derived-values", text: "Indexing derived values", depth: 2 },
    { id: "common-uses", text: "Common uses", depth: 2 },
    { id: "constraints", text: "Constraints and limits", depth: 2 },
    { id: "common-mistakes", text: "Common mistakes", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        A generated column is a column whose value is an expression
        over other columns. You don&apos;t insert into it; MySQL
        computes it. They unlock the indexing patterns we&apos;ve seen
        in JSON and full-text — and clean up a class of denormalized
        fields that used to require triggers.
      </p>

      <Prerequisites
        items={[
          "DDL from lesson 5.2.",
          "Indexes from lesson 5.4.",
          "JSON paths from lesson 10.1 — generated columns are how we index inside JSON.",
        ]}
      />

      <H2 id="what-they-are">What generated columns are</H2>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE orders (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  amount_cents  BIGINT UNSIGNED NOT NULL,
  tax_cents     BIGINT UNSIGNED NOT NULL,

  -- Total is always derived from amount + tax. Never insert into it.
  total_cents   BIGINT UNSIGNED
                  GENERATED ALWAYS AS (amount_cents + tax_cents) STORED
);

INSERT INTO orders (amount_cents, tax_cents) VALUES (4900, 490);
SELECT id, amount_cents, tax_cents, total_cents FROM orders;
-- total_cents = 5390, computed automatically.`}
      />

      <KeyConcepts
        items={[
          {
            title: "Read-only",
            body: "INSERT and UPDATE can't write to a generated column. Attempting to do so raises an error — useful guarantee against drift.",
          },
          {
            title: "Recomputed when its inputs change",
            body: "Update amount_cents, total_cents updates with it. No triggers, no application logic.",
          },
          {
            title: "Deterministic functions only",
            body: "NOW() and RAND() are not allowed in the expression. The value must be reproducible from the inputs at any time.",
          },
          {
            title: "Two storage modes",
            body: "VIRTUAL recomputes on read; STORED writes to disk. Both can be indexed.",
          },
        ]}
      />

      <H2 id="virtual-vs-stored">VIRTUAL vs STORED</H2>

      <KeyConcepts
        items={[
          {
            title: "VIRTUAL — default",
            body: "No extra storage. Value is computed every time the column is read. Cheap on writes, slightly more expensive on reads.",
          },
          {
            title: "STORED",
            body: "Value materialized to disk on write. More expensive on writes (and on space), faster on reads, mandatory for some uses.",
          },
          {
            title: "Index on either kind",
            body: "An index on a VIRTUAL column stores the indexed value (so the index isn't 'virtual'). Index on STORED is a normal column index.",
          },
          {
            title: "Pick by access pattern",
            body: "Hot read path with selective index? VIRTUAL is fine. Reporting / analytics column queried in many SELECT lists? STORED avoids recomputing each time.",
          },
        ]}
      />

      <CodeBlock
        language="sql"
        code={`ALTER TABLE orders
  ADD COLUMN amount_total BIGINT UNSIGNED
    GENERATED ALWAYS AS (amount_cents + tax_cents) VIRTUAL,
  ADD INDEX  idx_orders_total (amount_total);

-- The index makes range queries on the derived column efficient.
SELECT id FROM orders WHERE amount_total BETWEEN 1000 AND 5000;`}
      />

      <H2 id="indexing-derived-values">Indexing derived values</H2>

      <CodeBlock
        language="sql"
        filename="indexed-derivations.sql"
        code={`-- 1. Case-insensitive search without changing the collation.
ALTER TABLE users
  ADD COLUMN email_lower VARCHAR(320)
    GENERATED ALWAYS AS (LOWER(email)) VIRTUAL,
  ADD UNIQUE INDEX uq_users_email_lower (email_lower);

-- 2. Index inside a JSON document.
ALTER TABLE events
  ADD COLUMN source VARCHAR(40)
    GENERATED ALWAYS AS (payload->>'$.source') STORED,
  ADD INDEX  idx_events_source (source);

-- 3. Reverse-string index for suffix queries.
ALTER TABLE users
  ADD COLUMN email_reversed VARCHAR(320)
    GENERATED ALWAYS AS (REVERSE(email)) STORED,
  ADD INDEX  idx_users_email_rev (email_reversed);
-- Now WHERE email LIKE '%@example.com' becomes
-- WHERE email_reversed LIKE 'moc.elpmaxe@%' — sargable.

-- 4. Composite computed key.
ALTER TABLE orders
  ADD COLUMN year_month CHAR(7)
    GENERATED ALWAYS AS (DATE_FORMAT(created_at, '%Y-%m')) STORED,
  ADD INDEX  idx_orders_ym (year_month);
-- WHERE year_month = '2025-01' uses the index;
-- WHERE YEAR(created_at) = 2025 doesn't.`}
      />

      <Callout variant="pro" title="Functional indexes (8.0.13+)">
        MySQL 8.0.13 added functional indexes — same idea, no
        explicit column. Slightly less verbose; same plan and
        constraints. Generated columns still win when you also want
        to <code>SELECT</code> the derived value or reuse it across
        queries.
      </Callout>

      <H2 id="common-uses">Common uses</H2>

      <KeyConcepts
        items={[
          {
            title: "Always-correct derived totals",
            body: "amount + tax, base_price * quantity, days_until_renewal. The schema enforces the formula.",
          },
          {
            title: "Indexable JSON fields",
            body: "Promote hot keys out of a JSON column without copying data. The lesson 10.1 pattern.",
          },
          {
            title: "Case-insensitive uniques",
            body: "UNIQUE on LOWER(email) — possible only via a generated column or a functional index.",
          },
          {
            title: "Bucket columns for analytics",
            body: "year_month, week_of_year, country_region. Stable bucket keys for GROUP BY without recomputing each query.",
          },
          {
            title: "Search keys",
            body: "Tokenized or normalized versions of names/SKUs that LIKE-search well. Indexed once, queried fast.",
          },
        ]}
      />

      <H2 id="constraints">Constraints and limits</H2>

      <KeyConcepts
        items={[
          {
            title: "No non-deterministic functions",
            body: "NOW(), RAND(), CONNECTION_ID() — all rejected. The value must be reproducible from row data alone.",
          },
          {
            title: "No subqueries",
            body: "The expression sees the row's columns and constants. No SELECT inside.",
          },
          {
            title: "STORED columns increase row size",
            body: "Each STORED column is real bytes per row. Big STORED expressions can push InnoDB rows toward the 8 KB limit.",
          },
          {
            title: "Foreign keys forbidden on generated columns",
            body: "An FK from a generated column is rejected. Use the underlying base column or rethink the constraint.",
          },
          {
            title: "ALTER changes can be expensive",
            body: "Adding a STORED generated column rewrites the table; VIRTUAL is metadata-only on 8.0+. Plan ALTERs accordingly.",
          },
        ]}
      />

      <H2 id="common-mistakes">Common mistakes</H2>

      <KeyConcepts
        items={[
          {
            title: "Trying to INSERT into one",
            body: "MySQL: 'The value specified for generated column is not allowed'. Either skip the column or send DEFAULT explicitly.",
          },
          {
            title: "Expecting it to update on schema change",
            body: "If you ALTER the expression, existing STORED rows aren't recomputed. Force a rebuild with UPDATE ... SET id = id, or recreate the table.",
          },
          {
            title: "Indexing a VIRTUAL column you read often",
            body: "If the same query reads the column in SELECT, ORDER BY, and a covering index, STORED ends up cheaper despite the storage cost.",
          },
          {
            title: "Replacing application logic",
            body: "Generated columns are for derivations the database can compute deterministically. Anything that needs external data, business rules, or randomness still belongs in the app.",
          },
        ]}
      />

      <Recap
        items={[
          "Generated columns are derived fields — read-only, deterministic, kept in sync automatically.",
          "VIRTUAL: free on writes, recomputes on reads. STORED: written to disk, faster reads.",
          "The standard pattern for indexing JSON paths, lowercased text, reversed strings, and bucket keys.",
          "Subset of expressions allowed: deterministic, no subqueries, no NOW/RAND.",
          "Functional indexes (8.0.13+) cover similar ground; pick generated columns when you also want to SELECT the value.",
        ]}
      />
    </>
  ),
};
