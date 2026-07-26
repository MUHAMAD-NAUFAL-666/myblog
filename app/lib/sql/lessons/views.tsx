import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "views",
  number: "08.01",
  title: "Views — saved queries with a name",
  description:
    "Wrap a complex SELECT in a name. When views simplify code, when they hide problems, and the difference between regular and materialized views.",
  duration: "10 min",
  tags: ["views", "abstraction"],
  headings: [
    { id: "what-a-view-is", text: "What a view is", depth: 2 },
    { id: "creating-and-using", text: "Creating and using a view", depth: 2 },
    { id: "updatable-views", text: "Updatable views", depth: 2 },
    { id: "with-check-option", text: "WITH CHECK OPTION", depth: 2 },
    { id: "materialized-views", text: "Materialized views (MySQL doesn't have them)", depth: 2 },
    { id: "when-to-use", text: "When to use views", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        A view is a stored <code>SELECT</code> with a name. Query the
        view as if it were a table; MySQL substitutes the underlying
        SQL. Views simplify common queries, encapsulate filters (like
        soft-delete), and provide a stable API even when the schema
        below changes.
      </p>

      <Prerequisites
        items={[
          "Comfort with multi-table SELECTs.",
          "DDL basics from lesson 5.2.",
          "Awareness that views are 'just queries' — they don't store data.",
        ]}
      />

      <H2 id="what-a-view-is">What a view is</H2>

      <KeyConcepts
        items={[
          {
            title: "A named SELECT",
            body: "CREATE VIEW v AS SELECT .... Read v like a table; the planner inlines the underlying query.",
          },
          {
            title: "Stored as definition, not data",
            body: "MySQL re-runs the SELECT every time you query the view. No caching, no precomputation.",
          },
          {
            title: "Read-only by default — sometimes",
            body: "Simple views (single table, no aggregates) accept INSERT/UPDATE/DELETE. Complex ones don't.",
          },
          {
            title: "A documentation tool, mostly",
            body: "Views can express domain concepts that raw tables can't. 'active_users' is more meaningful than 'users WHERE deleted_at IS NULL AND status = active'.",
          },
        ]}
      />

      <H2 id="creating-and-using">Creating and using a view</H2>

      <CodeBlock
        language="sql"
        filename="views.sql"
        code={`CREATE OR REPLACE VIEW active_users AS
SELECT id, email, name, country, created_at
FROM   users
WHERE  deleted_at IS NULL;

-- Use it like a table.
SELECT COUNT(*) FROM active_users WHERE country = 'GB';

-- Drop or list views.
DROP VIEW IF EXISTS active_users;
SHOW FULL TABLES WHERE Table_type = 'VIEW';`}
      />

      <Callout variant="info" title="MERGE vs TEMPTABLE algorithms">
        MySQL chooses how to evaluate the view. <code>MERGE</code>{" "}
        inlines the view&apos;s SQL into the outer query (fast,
        index-friendly). <code>TEMPTABLE</code> materializes the view
        first (slow, no index from the outer query). Force one with{" "}
        <code>ALGORITHM = MERGE | TEMPTABLE</code> in the{" "}
        <code>CREATE VIEW</code>.
      </Callout>

      <H2 id="updatable-views">Updatable views</H2>

      <CodeBlock
        language="sql"
        code={`-- This view is updatable — single table, no aggregates.
CREATE VIEW recent_orders AS
SELECT * FROM orders WHERE created_at > NOW() - INTERVAL 30 DAY;

INSERT INTO recent_orders (user_id, amount, status)
VALUES (1, 49.00, 'paid');                    -- writes to orders

UPDATE recent_orders SET status = 'paid' WHERE id = 42;
DELETE FROM recent_orders WHERE id = 42;`}
      />

      <p>
        A view is updatable when MySQL can map a row in the view back
        to exactly one row in exactly one base table. The list of
        disqualifiers is long:
      </p>

      <KeyConcepts
        items={[
          {
            title: "Aggregates",
            body: "SUM, COUNT, AVG. The output isn't a row of any base table.",
          },
          {
            title: "DISTINCT, GROUP BY, HAVING",
            body: "Same reason — the row identity is gone.",
          },
          {
            title: "UNION / UNION ALL",
            body: "MySQL can't tell which branch a write should go to.",
          },
          {
            title: "Multiple tables in some configurations",
            body: "Some join shapes are updatable in MySQL; many aren't. Check the docs for the specific case.",
          },
        ]}
      />

      <H2 id="with-check-option">WITH CHECK OPTION</H2>

      <CodeBlock
        language="sql"
        code={`CREATE VIEW paid_orders AS
SELECT * FROM orders WHERE status = 'paid'
WITH CHECK OPTION;

-- ❌ ERROR 1369 (HY000): CHECK OPTION failed
INSERT INTO paid_orders (user_id, amount, status)
VALUES (1, 49.00, 'pending');`}
      />

      <p>
        <code>WITH CHECK OPTION</code> means writes through the view
        must satisfy the view&apos;s <code>WHERE</code> clause. Without
        it, you can <code>INSERT</code> rows that don&apos;t even appear
        in the view — confusing and a known footgun.
      </p>

      <H2 id="materialized-views">Materialized views (MySQL doesn&apos;t have them)</H2>
      <p>
        Postgres and Oracle have <code>MATERIALIZED VIEW</code> — a
        view whose result is precomputed and stored. MySQL has no
        native equivalent. Two emulation patterns:
      </p>

      <KeyConcepts
        items={[
          {
            title: "Summary table + scheduled refresh",
            body: "CREATE TABLE summary AS SELECT ...; refresh nightly via an event or external scheduler. Stale by design.",
          },
          {
            title: "Summary table + triggers",
            body: "Triggers on the source tables keep the summary table fresh. Real-time but adds write overhead and maintenance burden.",
          },
          {
            title: "External tools",
            body: "Apache Pinot, Clickhouse, or even a simple cron job can rebuild the summary efficiently. Often the right answer if the data is large.",
          },
          {
            title: "Read replicas with extra indexes",
            body: "If the issue is read load, a replica with denormalized indexes is sometimes simpler than a materialized view.",
          },
        ]}
      />

      <H2 id="when-to-use">When to use views</H2>

      <KeyConcepts
        items={[
          {
            title: "Encapsulate soft-delete / tenancy filters",
            body: "Every read should filter deleted_at IS NULL? Wrap the table in a view and reference the view from the application.",
          },
          {
            title: "Express domain concepts",
            body: "active_subscribers, paid_invoices, eligible_promotions. Views make the data model self-documenting.",
          },
          {
            title: "Simplify reporting queries",
            body: "Reporting and BI tools often query views — analysts can read SELECT * FROM revenue_by_country without re-deriving the joins.",
          },
          {
            title: "Stabilize the API across migrations",
            body: "Rename a table or split a column? Update the view; the application sees the same shape.",
          },
        ]}
      />

      <Callout variant="warn" title="Views can hide performance cliffs">
        A view that uses a couple of joins is fine. A view of a view of
        a view, queried with a non-trivial WHERE, can confuse the
        optimizer into terrible plans. Profile views the same way you
        profile raw queries — and don&apos;t nest them deeply.
      </Callout>

      <Recap
        items={[
          "A view is a stored SELECT with a name; MySQL re-runs it every time.",
          "Updatable views require a 1:1 map back to a single base table.",
          "WITH CHECK OPTION makes inserts/updates respect the view's WHERE clause.",
          "MySQL has no materialized views — use summary tables, triggers, or external tools.",
          "Use views to encapsulate filters, express domain concepts, and stabilize APIs.",
        ]}
      />
    </>
  ),
};
