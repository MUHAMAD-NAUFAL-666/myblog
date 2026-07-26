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
  slug: "query-optimization",
  number: "07.03",
  title: "Optimizing slow queries",
  description:
    "A practical playbook: find the slow ones, understand why, and apply the fix that's actually cheapest.",
  duration: "14 min",
  tags: ["performance", "tuning", "slow-query-log"],
  headings: [
    { id: "find-the-slow-ones", text: "Find the slow ones first", depth: 2 },
    { id: "the-fix-hierarchy", text: "The fix hierarchy", depth: 2 },
    { id: "rewrite-patterns", text: "Rewrite patterns that pay off", depth: 2 },
    { id: "sargability", text: "Sargability — making predicates indexable", depth: 2 },
    { id: "n-plus-one", text: "N+1 — the application-side villain", depth: 2 },
    { id: "when-to-stop", text: "When to stop", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Tuning is mostly bookkeeping. Find what&apos;s slow, prove
        why, apply the smallest fix that matches the cause, measure
        again. Skip steps and you spend a week chasing the wrong
        bottleneck.
      </p>

      <Prerequisites
        items={[
          "EXPLAIN from lesson 7.1 — you can read a query plan.",
          "Index internals from lesson 7.2.",
          "A queriable copy of production data (or a realistic dev snapshot).",
        ]}
      />

      <H2 id="find-the-slow-ones">Find the slow ones first</H2>

      <Steps>
        <Step
          title="Enable the slow query log"
          summary="MySQL writes anything over a threshold to a file. Free, low-overhead profiling."
        >
          <CodeBlock
            language="sql"
            code={`-- Set per-session for ad-hoc work.
SET GLOBAL slow_query_log = 1;
SET GLOBAL long_query_time = 0.5;             -- log queries > 500ms
SET GLOBAL slow_query_log_file = '/var/log/mysql/slow.log';

-- See what's set.
SHOW VARIABLES LIKE 'slow_query%';
SHOW VARIABLES LIKE 'long_query_time';`}
          />
        </Step>

        <Step
          title="Aggregate with pt-query-digest or sys.statement_analysis"
          summary="Raw log files are useless. Aggregate by query fingerprint."
        >
          <CodeBlock
            language="bash"
            code={`# Percona Toolkit (CLI)
pt-query-digest /var/log/mysql/slow.log | head -100

# Or query the sys schema directly
mysql> SELECT *
       FROM   sys.statement_analysis
       ORDER  BY total_latency DESC
       LIMIT  10;`}
          />
          <p>
            <code>sys.statement_analysis</code> aggregates from the
            performance schema — same data, no log file required.
            Sort by total time spent, not average; one slow-but-rare
            query matters less than a moderately slow one ran 10k times
            an hour.
          </p>
        </Step>

        <Step
          title="Profile the worst offenders one at a time"
          summary="EXPLAIN, EXPLAIN ANALYZE, then iterate."
        >
          <CodeBlock
            language="sql"
            code={`EXPLAIN SELECT ...;
EXPLAIN ANALYZE SELECT ...;
SHOW PROFILES;                       -- per-step timings (deprecated but useful)
SHOW STATUS LIKE 'Handler%';         -- read patterns: index_read, rnd_read, etc.`}
          />
        </Step>
      </Steps>

      <H2 id="the-fix-hierarchy">The fix hierarchy</H2>
      <p>
        Try cheap fixes first, expensive ones last. Don&apos;t skip
        ahead.
      </p>

      <KeyConcepts
        items={[
          {
            title: "1. Add the missing index",
            body: "EXPLAIN says ALL on a hot query? Add an index that matches the WHERE / JOIN. 80% of slow queries die here.",
          },
          {
            title: "2. Cover the index",
            body: "Already using an index but bookmark lookups dominate? Add the SELECT columns to the index. EXPLAIN should show 'Using index'.",
          },
          {
            title: "3. Refresh statistics",
            body: "ANALYZE TABLE my_table; The optimizer is making decisions on stale numbers. Costs nothing to try.",
          },
          {
            title: "4. Rewrite the query",
            body: "EXISTS instead of IN, CTE instead of nested subqueries, derived table to pre-aggregate. Same result, different plan.",
          },
          {
            title: "5. Tune server variables",
            body: "innodb_buffer_pool_size, sort_buffer_size, join_buffer_size. DBA territory; never start here.",
          },
          {
            title: "6. Reshape the schema",
            body: "Add a generated column, denormalize a counter, partition the table. Last resort — schema changes are expensive to ship.",
          },
          {
            title: "7. Throw hardware at it",
            body: "More RAM, faster disk, replicas. Only after exhausting the above.",
          },
        ]}
      />

      <H2 id="rewrite-patterns">Rewrite patterns that pay off</H2>

      <CodeBlock
        language="sql"
        filename="rewrites.sql"
        code={`-- 1. Replace correlated subquery with a window function.
-- Before:
SELECT id, amount,
       (SELECT COUNT(*) FROM orders o2
        WHERE  o2.user_id = o.user_id AND o2.amount > o.amount) AS rk
FROM   orders o;

-- After:
SELECT id, amount,
       RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rk
FROM   orders;

-- 2. Replace IN (subquery) with EXISTS.
-- Before:
SELECT * FROM users WHERE id IN (SELECT user_id FROM orders WHERE status='paid');

-- After (better with NULLs, often same plan):
SELECT * FROM users u
WHERE  EXISTS (SELECT 1 FROM orders o
               WHERE  o.user_id = u.id AND o.status = 'paid');

-- 3. Pre-aggregate in a CTE before joining.
-- Before:
SELECT u.country, SUM(o.amount)
FROM   users u JOIN orders o ON o.user_id = u.id
WHERE  o.status = 'paid'
GROUP  BY u.country;

-- After (smaller intermediate result):
WITH paid AS (
  SELECT user_id, SUM(amount) AS revenue
  FROM   orders
  WHERE  status = 'paid'
  GROUP  BY user_id
)
SELECT u.country, SUM(p.revenue)
FROM   users u JOIN paid p ON p.user_id = u.id
GROUP  BY u.country;

-- 4. Replace LIMIT with high OFFSET by keyset pagination.
-- Before:
SELECT * FROM orders ORDER BY created_at DESC LIMIT 20 OFFSET 10000;

-- After:
SELECT * FROM orders
WHERE  (created_at, id) < (?, ?)
ORDER  BY created_at DESC, id DESC
LIMIT  20;`}
      />

      <H2 id="sargability">Sargability — making predicates indexable</H2>
      <p>
        A predicate is &ldquo;sargable&rdquo; (Search ARGument-able) if
        the database can use an index for it. Common ways to break
        sargability:
      </p>

      <CodeBlock
        language="sql"
        code={`-- ❌ Function on the indexed column.
SELECT * FROM orders WHERE YEAR(created_at) = 2025;

-- ✅ Range that the index can serve.
SELECT * FROM orders
WHERE  created_at >= '2025-01-01'
  AND  created_at <  '2026-01-01';

-- ❌ Leading wildcard.
SELECT * FROM users WHERE email LIKE '%@example.com';

-- ✅ Reverse and index, or use a generated column.
ALTER TABLE users ADD COLUMN email_reversed VARCHAR(320)
  GENERATED ALWAYS AS (REVERSE(email)) STORED,
  ADD INDEX idx_users_email_reversed (email_reversed);

SELECT * FROM users WHERE email_reversed LIKE 'moc.elpmaxe@%';

-- ❌ Implicit type conversion.
-- user_id is BIGINT; comparing to a string forces a scan.
SELECT * FROM orders WHERE user_id = '42';

-- ✅ Match the type.
SELECT * FROM orders WHERE user_id = 42;`}
      />

      <Callout variant="warn" title="Type mismatches are silent killers">
        A nullable VARCHAR column compared to an integer often forces a
        full table scan because MySQL converts every column value
        before comparing. <code>EXPLAIN</code> hides this. Match types
        explicitly or with <code>CAST</code>.
      </Callout>

      <H2 id="n-plus-one">N+1 — the application-side villain</H2>
      <p>
        The query that&apos;s 5ms in EXPLAIN can still be a disaster if
        it runs 500 times per request. ORM-driven N+1 is the most
        common cause of slow-but-not-slow-on-EXPLAIN endpoints.
      </p>

      <KeyConcepts
        items={[
          {
            title: "Symptom",
            body: "An endpoint takes 800ms. EXPLAIN on every individual query shows 2-3ms. The database is fine; the application is asking 300 times.",
          },
          {
            title: "Cause",
            body: "Loading a parent, then iterating children with a per-row query. Classic ORM trap — Active Record's belongs_to, Hibernate's lazy fetch, Sequelize's default.",
          },
          {
            title: "Fix",
            body: "Eager load (JOIN or a single batch query with WHERE id IN (...)). Most ORMs have an .includes() / .preload() / .with() helper.",
          },
          {
            title: "Detect with the slow query log",
            body: "Sort sys.statement_analysis by 'exec_count'. Same query running 1000x per minute is your N+1.",
          },
        ]}
      />

      <H2 id="when-to-stop">When to stop</H2>

      <KeyConcepts
        items={[
          {
            title: "When the query meets the SLO",
            body: "If the requirement is p95 < 200ms and you're at 80ms, stop. Diminishing returns are real — the next 10ms costs more than the previous 100.",
          },
          {
            title: "When the cost outweighs the win",
            body: "A 30% speedup on a 5ms query saves 1.5ms. A new index that costs 10% on writes is rarely worth it.",
          },
          {
            title: "When you've moved the bottleneck",
            body: "Don't optimize a query that's no longer the slowest one. Re-profile and pick the new top of the list.",
          },
          {
            title: "When the answer is 'caching'",
            body: "Sometimes the database is doing exactly the right amount of work — it's just being asked too often. Cache layer above; don't torture the schema.",
          },
        ]}
      />

      <Recap
        items={[
          "Find slow queries first — slow query log + sys.statement_analysis aggregated by fingerprint.",
          "Try fixes in order: indexes, covering, statistics, rewrite, server vars, schema, hardware.",
          "Sargability: avoid functions on indexed columns, leading wildcards, type mismatches.",
          "N+1 is an application bug masquerading as a database problem — eager-load.",
          "Stop tuning when you hit the SLO; re-profile when the bottleneck moves.",
        ]}
      />
    </>
  ),
};
