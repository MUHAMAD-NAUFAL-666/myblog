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
  slug: "aggregations",
  number: "04.01",
  title: "Aggregations and GROUP BY",
  description:
    "Counting, summing, and the small details that separate correct dashboards from misleading ones.",
  duration: "16 min",
  tags: ["aggregations", "group-by"],
  headings: [
    { id: "the-five-you-will-use", text: "The five you'll use most", depth: 2 },
    { id: "step-by-step", text: "Step-by-step: revenue by country", depth: 2 },
    { id: "having", text: "HAVING — filter buckets, not rows", depth: 2 },
    { id: "filter-clause", text: "Conditional aggregates", depth: 2 },
    { id: "date-bucketing", text: "Date bucketing", depth: 2 },
    { id: "common-mistakes", text: "Common mistakes", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Aggregations turn many rows into one. They&apos;re the
        foundation of every dashboard, every revenue report, every
        &ldquo;how many users signed up last week&rdquo; question.
        They&apos;re also the source of most subtly-wrong numbers in
        production.
      </p>

      <Prerequisites
        items={[
          "Joins from lesson 3.1 — most aggregate queries combine tables first.",
          "Memory of the seven-step execution order — GROUP BY runs after WHERE, before SELECT.",
          "Playground database with users and orders tables.",
        ]}
      />

      <H2 id="the-five-you-will-use">The five you&apos;ll use most</H2>
      <CodeBlock
        language="sql"
        code={`SELECT COUNT(*)              AS total_orders,
       COUNT(DISTINCT user_id) AS unique_buyers,
       SUM(amount)             AS revenue,
       AVG(amount)             AS avg_order,
       MIN(amount)             AS smallest,
       MAX(amount)             AS largest
FROM   orders
WHERE  status = 'paid';`}
      />

      <KeyConcepts
        items={[
          {
            title: "COUNT(*) vs COUNT(col)",
            body: "COUNT(*) counts rows. COUNT(col) counts non-NULL values of col. Different numbers if col is nullable.",
          },
          {
            title: "COUNT(DISTINCT col)",
            body: "Counts unique non-NULL values. Useful for 'how many users' when each user has many rows.",
          },
          {
            title: "SUM and AVG ignore NULLs",
            body: "AVG = SUM / COUNT(non-NULL rows). If you want NULLs to count as zero, use AVG(COALESCE(x, 0)).",
          },
          {
            title: "MIN and MAX work on text and dates too",
            body: "MAX(created_at) gives the most recent timestamp. MIN(name) gives the alphabetically-first user.",
          },
        ]}
      />

      <H2 id="step-by-step">Step-by-step: revenue by country</H2>

      <Steps>
        <Step
          title="Start with the join you need"
          summary="Aggregates almost always sit on top of a join. Get the row-set right first."
        >
          <CodeBlock
            language="sql"
            code={`SELECT u.country, o.amount
FROM   users u
JOIN   orders o ON o.user_id = u.id
WHERE  o.status = 'paid';`}
          />
          <p>
            One row per paid order. Country is denormalized in via the
            join.
          </p>
        </Step>

        <Step
          title="Add GROUP BY to bucket the rows"
          summary="One row per group. Every non-aggregated SELECT column must appear in GROUP BY."
        >
          <CodeBlock
            language="sql"
            code={`SELECT u.country
FROM   users u
JOIN   orders o ON o.user_id = u.id
WHERE  o.status = 'paid'
GROUP  BY u.country;`}
          />
        </Step>

        <Step
          title="Add aggregate functions"
          summary="One per metric. Aliases for readability."
        >
          <CodeBlock
            language="sql"
            filename="revenue-by-country.sql"
            code={`SELECT u.country,
       COUNT(o.id)     AS orders,
       SUM(o.amount)   AS revenue
FROM   users u
JOIN   orders o ON o.user_id = u.id
WHERE  o.status = 'paid'
GROUP  BY u.country
ORDER  BY revenue DESC;`}
          />

          <Terminal title="result — sqlite3">
            <AnimatedSpan className="text-[#a89e8f]">
              <span>country  orders   revenue</span>
              <span>-------  -------  -------</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-[#d8d1c2]">
              <span>US       1        999.00</span>
              <span>GB       1        79.00</span>
              <span>ES       2        68.00</span>
            </AnimatedSpan>
          </Terminal>
        </Step>

        <Step
          title="Validate by hand"
          summary="Pick the smallest group and check the math against the raw rows."
        >
          <p>
            Three orders from ES (Ana, two paid). Sum 49 + 19 = 68. The
            query agrees. Whenever a number on a dashboard surprises you,
            do this check before blaming the data team.
          </p>
        </Step>
      </Steps>

      <H2 id="having">HAVING — filter the buckets, not the rows</H2>
      <p>
        <code>WHERE</code> filters <em>rows</em>. <code>HAVING</code>{" "}
        filters <em>groups</em> after aggregation.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Countries that brought in more than $100 in paid revenue.
SELECT u.country, SUM(o.amount) AS revenue
FROM   users u
JOIN   orders o ON o.user_id = u.id
WHERE  o.status = 'paid'      -- row filter
GROUP  BY u.country
HAVING SUM(o.amount) > 100;   -- group filter`}
      />

      <Callout variant="pro" title="The classic mistake">
        A dashboard says &ldquo;500 active users this week.&rdquo; You
        check the query: <code>COUNT(user_id)</code>. That counts events,
        not users. Use <code>COUNT(DISTINCT user_id)</code>. Off by an
        order of magnitude. Nobody noticed for six months.
      </Callout>

      <H2 id="filter-clause">Conditional aggregates</H2>
      <p>
        Compute several metrics in one pass — paid count, refunded
        count, paid revenue — without scanning the table N times.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Postgres / modern SQLite syntax (FILTER clause)
SELECT
  COUNT(*)                                       AS orders_total,
  COUNT(*) FILTER (WHERE status = 'paid')        AS orders_paid,
  COUNT(*) FILTER (WHERE status = 'refunded')    AS orders_refunded,
  SUM(amount) FILTER (WHERE status = 'paid')     AS revenue_paid
FROM orders;

-- Older SQLite / MySQL — equivalent with CASE
SELECT
  COUNT(*)                                                 AS orders_total,
  SUM(CASE WHEN status = 'paid'     THEN 1 ELSE 0 END)     AS orders_paid,
  SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END)     AS orders_refunded,
  SUM(CASE WHEN status = 'paid'     THEN amount ELSE 0 END) AS revenue_paid
FROM orders;`}
      />

      <H2 id="date-bucketing">Date bucketing</H2>
      <p>
        Almost every dashboard wants &ldquo;per day&rdquo; or &ldquo;per
        week.&rdquo; Use the database&apos;s date functions, not
        application code, to bucket.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Postgres
SELECT DATE_TRUNC('day', created_at) AS day,
       COUNT(*)                      AS orders
FROM   orders
GROUP  BY day
ORDER  BY day;

-- SQLite
SELECT DATE(created_at) AS day,
       COUNT(*)         AS orders
FROM   orders
GROUP  BY day
ORDER  BY day;`}
      />

      <Callout variant="info" title="Time zones bite">
        <code>DATE_TRUNC</code> respects the session time zone. If your
        users span continents, truncate in their zone — usually with
        <code> DATE_TRUNC(&apos;day&apos;, created_at AT TIME ZONE
        &apos;Asia/Jakarta&apos;)</code>.
      </Callout>

      <H2 id="common-mistakes">Common mistakes</H2>

      <KeyConcepts
        items={[
          {
            title: "Counting after a LEFT JOIN with COUNT(*)",
            body: "Unmatched rows are still rows — they're just full of NULLs. Use COUNT(o.id) to count actual matches.",
          },
          {
            title: "Mixing aggregates and non-aggregates without GROUP BY",
            body: "SELECT name, COUNT(*) FROM users gives you a single row in some databases (and an error in others). Always GROUP BY when mixing.",
          },
          {
            title: "Using WHERE for a condition on an aggregate",
            body: "WHERE COUNT(*) > 5 doesn't work — the aggregate doesn't exist yet at WHERE time. Use HAVING.",
          },
          {
            title: "Forgetting that AVG ignores NULLs",
            body: "AVG of (1, 2, NULL) is 1.5, not 1.0. Decide what NULLs should mean before reaching for AVG.",
          },
        ]}
      />

      <Recap
        items={[
          "Aggregates collapse rows into summary statistics: COUNT, SUM, AVG, MIN, MAX.",
          "GROUP BY buckets rows; every non-aggregated SELECT column must appear in it.",
          "WHERE filters rows; HAVING filters groups after aggregation.",
          "FILTER (or CASE) lets you compute several metrics in one pass.",
          "Always validate at least one bucket by hand the first time you write a dashboard query.",
        ]}
      />
    </>
  ),
};
