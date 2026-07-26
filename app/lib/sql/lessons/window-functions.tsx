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
  slug: "window-functions",
  number: "04.02",
  title: "Window functions",
  description:
    "Running totals, rankings, lag/lead, moving averages — the most underused feature in standard SQL, demystified in fifteen minutes.",
  duration: "16 min",
  tags: ["window-functions", "ranking", "analytics"],
  headings: [
    { id: "the-mental-picture", text: "The mental picture", depth: 2 },
    { id: "the-over-clause", text: "The OVER clause", depth: 2 },
    { id: "ranking-functions", text: "Ranking functions", depth: 2 },
    { id: "lag-and-lead", text: "LAG and LEAD", depth: 2 },
    { id: "running-totals", text: "Running totals and frames", depth: 2 },
    { id: "common-patterns", text: "Common patterns", depth: 2 },
    { id: "gotchas", text: "Gotchas", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        A window function performs a calculation across a set of rows
        related to the current row — without collapsing the result like
        <code>GROUP BY</code> does. Running totals, ranks, &ldquo;previous
        value&rdquo;, percentiles, moving averages — all of it lives
        here. If you only learn one new thing in this course, make it
        windows.
      </p>

      <Prerequisites
        items={[
          "Aggregations and GROUP BY from lesson 4.1.",
          "MySQL 8.0+ — window functions are not available in 5.7.",
          "Comfort reading queries that span multiple lines.",
        ]}
      />

      <H2 id="the-mental-picture">The mental picture</H2>
      <p>
        With <code>GROUP BY</code>, you collapse N rows into 1. With a
        window function, you keep N rows and attach a computed value to
        each — based on a &ldquo;window&rdquo; of related rows.
      </p>

      <KeyConcepts
        items={[
          {
            title: "GROUP BY",
            body: "Six paid orders → one row per country. Original detail is gone.",
          },
          {
            title: "Window function",
            body: "Six paid orders → six rows, each annotated with the country's revenue. Detail is preserved.",
          },
          {
            title: "OVER (...)",
            body: "Defines the window: how to partition the rows, in what order, and what frame of rows counts.",
          },
          {
            title: "PARTITION BY",
            body: "Like GROUP BY for the window — splits rows into independent groups before computing.",
          },
        ]}
      />

      <H2 id="the-over-clause">The OVER clause</H2>

      <CodeBlock
        language="sql"
        filename="anatomy.sql"
        code={`function(args) OVER (
  [PARTITION BY column, ...]   -- optional: split into groups
  [ORDER BY column, ...]       -- optional: order within the group
  [frame_clause]               -- optional: ROWS BETWEEN ... AND ...
)`}
      />

      <CodeBlock
        language="sql"
        code={`-- Order amount, alongside the country's total revenue.
SELECT u.name,
       u.country,
       o.amount,
       SUM(o.amount) OVER (PARTITION BY u.country) AS country_revenue
FROM   users u
JOIN   orders o ON o.user_id = u.id
WHERE  o.status = 'paid'
ORDER  BY u.country, o.amount DESC;`}
      />

      <Terminal title="result — mysql">
        <AnimatedSpan className="text-[#a89e8f]">
          <span>+--------------+---------+--------+-----------------+</span>
          <span>| name         | country | amount | country_revenue |</span>
          <span>+--------------+---------+--------+-----------------+</span>
        </AnimatedSpan>
        <AnimatedSpan className="text-[#d8d1c2]">
          <span>| Ana Lopez    | ES      |  49.00 |           68.00 |</span>
          <span>| Ana Lopez    | ES      |  19.00 |           68.00 |</span>
          <span>| Cam Williams | GB      |  79.00 |           79.00 |</span>
          <span>| Eli Schwartz | US      | 999.00 |          999.00 |</span>
          <span>+--------------+---------+--------+-----------------+</span>
        </AnimatedSpan>
      </Terminal>

      <H2 id="ranking-functions">Ranking functions</H2>
      <p>Three flavours, three different behaviours on ties.</p>

      <KeyConcepts
        items={[
          {
            title: "ROW_NUMBER()",
            body: "1, 2, 3, 4. Always unique, ties broken arbitrarily by the order.",
          },
          {
            title: "RANK()",
            body: "1, 2, 2, 4. Ties share a rank, then a gap.",
          },
          {
            title: "DENSE_RANK()",
            body: "1, 2, 2, 3. Ties share a rank, no gap.",
          },
          {
            title: "NTILE(n)",
            body: "Buckets the rows into n equal-ish groups. Useful for quartiles, deciles.",
          },
        ]}
      />

      <Steps>
        <Step
          title="Top order per user"
          summary="Classic 'greatest-N-per-group' pattern. Pre-windows, this required a correlated subquery."
        >
          <CodeBlock
            language="sql"
            code={`WITH ranked AS (
  SELECT user_id,
         id AS order_id,
         amount,
         ROW_NUMBER() OVER (
           PARTITION BY user_id
           ORDER BY amount DESC
         ) AS rn
  FROM   orders
)
SELECT * FROM ranked WHERE rn = 1;`}
          />
        </Step>

        <Step
          title="Top 3 per country, with ties allowed"
          summary="Use RANK or DENSE_RANK when tied rows should all qualify."
        >
          <CodeBlock
            language="sql"
            code={`SELECT *
FROM (
  SELECT u.country,
         u.name,
         o.amount,
         DENSE_RANK() OVER (
           PARTITION BY u.country
           ORDER BY o.amount DESC
         ) AS rk
  FROM   users u
  JOIN   orders o ON o.user_id = u.id
) t
WHERE rk <= 3;`}
          />
        </Step>
      </Steps>

      <H2 id="lag-and-lead">LAG and LEAD — peek across rows</H2>
      <p>
        Compare the current row to the one before or after — without
        joining the table to itself.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Time between consecutive orders, per user.
SELECT user_id,
       id AS order_id,
       created_at,
       LAG(created_at) OVER (
         PARTITION BY user_id
         ORDER BY created_at
       ) AS previous_at,
       TIMESTAMPDIFF(
         SECOND,
         LAG(created_at) OVER (PARTITION BY user_id ORDER BY created_at),
         created_at
       ) AS gap_seconds
FROM   orders
ORDER  BY user_id, created_at;`}
      />

      <Callout variant="tip" title="LAG / LEAD on the first / last row">
        The first row has no &ldquo;previous,&rdquo; so{" "}
        <code>LAG</code> returns <code>NULL</code>. Pass a third argument
        to set a default:{" "}
        <code>LAG(amount, 1, 0) OVER (...)</code> returns 0 instead of
        NULL.
      </Callout>

      <H2 id="running-totals">Running totals and frames</H2>
      <p>
        The frame clause tells the window which rows to include in the
        calculation, relative to the current row.
      </p>

      <CodeBlock
        language="sql"
        filename="running-total.sql"
        code={`-- Running revenue total per user, ordered by time.
SELECT user_id,
       id,
       amount,
       SUM(amount) OVER (
         PARTITION BY user_id
         ORDER BY     created_at
         ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_total
FROM   orders
WHERE  status = 'paid'
ORDER  BY user_id, created_at;`}
      />

      <KeyConcepts
        items={[
          {
            title: "ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW",
            body: "Default for ordered windows in MySQL. Running total from the start of the partition.",
          },
          {
            title: "ROWS BETWEEN N PRECEDING AND CURRENT ROW",
            body: "Trailing window. AVG over a 7-day moving average becomes ROWS 6 PRECEDING.",
          },
          {
            title: "RANGE BETWEEN — value-based, not row-based",
            body: "RANGE BETWEEN INTERVAL 7 DAY PRECEDING AND CURRENT ROW. Postgres-friendly, MySQL 8 supports it for numeric/date orderings.",
          },
          {
            title: "Default frame is the gotcha",
            body: "Without a frame clause, ORDER BY adds 'RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW' implicitly. Without ORDER BY, the frame is the whole partition.",
          },
        ]}
      />

      <H2 id="common-patterns">Common patterns worth memorizing</H2>

      <CodeBlock
        language="sql"
        code={`-- 1. Percent of total per row.
SELECT id, amount,
       amount * 100.0 / SUM(amount) OVER () AS pct_of_total
FROM   orders;

-- 2. 7-day moving average of daily revenue.
SELECT day, daily_revenue,
       AVG(daily_revenue) OVER (
         ORDER BY day
         ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
       ) AS rolling_7d
FROM   daily_summary;

-- 3. Sessionize events by 30-minute idle gap.
SELECT user_id, event_at,
       SUM(CASE
             WHEN TIMESTAMPDIFF(MINUTE, prev_at, event_at) >= 30
             THEN 1 ELSE 0
           END) OVER (PARTITION BY user_id ORDER BY event_at) AS session_id
FROM (
  SELECT user_id, event_at,
         LAG(event_at) OVER (PARTITION BY user_id ORDER BY event_at) AS prev_at
  FROM events
) t;`}
      />

      <H2 id="gotchas">Gotchas</H2>

      <KeyConcepts
        items={[
          {
            title: "Window functions can't be filtered in WHERE",
            body: "SELECT runs after WHERE — the window value doesn't exist yet. Wrap in a subquery or CTE and filter on the outer query.",
          },
          {
            title: "ORDER BY inside OVER vs outside",
            body: "OVER (ORDER BY x) controls the window's order. The query's outer ORDER BY controls the result's order. They're independent.",
          },
          {
            title: "PARTITION BY with no ORDER BY = partition-wide aggregate",
            body: "Useful for 'percent of group' calculations. Frame defaults to the whole partition.",
          },
          {
            title: "MySQL 5.7 has none of this",
            body: "Window functions arrived in MySQL 8.0. If you're stuck on 5.7, you're stuck with self-joins and correlated subqueries.",
          },
        ]}
      />

      <Recap
        items={[
          "Window functions compute per-row values across a window of related rows — without collapsing.",
          "OVER defines the window: PARTITION BY (groups), ORDER BY (sequence), frame (which rows count).",
          "ROW_NUMBER, RANK, DENSE_RANK differ on how they handle ties.",
          "LAG/LEAD reach across rows without self-joins; running totals use frame clauses.",
          "Filter window results in an outer query — SELECT runs after WHERE.",
        ]}
      />
    </>
  ),
};
