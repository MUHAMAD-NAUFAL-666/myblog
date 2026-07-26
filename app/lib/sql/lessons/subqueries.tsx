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
  slug: "subqueries",
  number: "03.02",
  title: "Subqueries — queries inside queries",
  description:
    "Scalar, row, and table subqueries — when to reach for them, when to flatten them into a join, and the EXISTS pattern that beats them all.",
  duration: "14 min",
  tags: ["subqueries", "exists", "in"],
  headings: [
    { id: "the-three-flavours", text: "The three flavours of subquery", depth: 2 },
    { id: "scalar-subqueries", text: "Scalar subqueries", depth: 2 },
    { id: "in-and-not-in", text: "IN and NOT IN", depth: 2 },
    { id: "exists-and-not-exists", text: "EXISTS and NOT EXISTS", depth: 2 },
    { id: "correlated-subqueries", text: "Correlated subqueries", depth: 2 },
    { id: "derived-tables", text: "Derived tables (FROM subqueries)", depth: 2 },
    { id: "subquery-vs-join", text: "Subquery vs JOIN", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        A subquery is a <code>SELECT</code> nested inside another query.
        They&apos;re how you ask questions like &ldquo;users whose biggest
        order is over $500&rdquo; or &ldquo;orders from the country with
        the most signups.&rdquo; Powerful — and frequently overused.
      </p>

      <Prerequisites
        items={[
          "Joins from lesson 3.1 — most subqueries can be rewritten as joins.",
          "WHERE and aggregations from chapters 2 and 4.",
          "Playground database open in your terminal.",
        ]}
      />

      <H2 id="the-three-flavours">The three flavours of subquery</H2>

      <KeyConcepts
        items={[
          {
            title: "Scalar — returns one value",
            body: "A single row, single column. Lives anywhere a literal would: SELECT, WHERE, ORDER BY.",
          },
          {
            title: "Row / set — returns a list",
            body: "Used with IN, NOT IN, ANY, ALL. The outer query checks membership.",
          },
          {
            title: "Table — returns a result set",
            body: "Used in FROM as a derived table, or with EXISTS to test for at least one matching row.",
          },
          {
            title: "Correlated — references the outer query",
            body: "Re-evaluated once per outer row. Powerful, but watch the cost.",
          },
        ]}
      />

      <H2 id="scalar-subqueries">Scalar subqueries</H2>
      <p>
        A subquery that returns exactly one row, one column. Use it
        anywhere a single value belongs.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Average order value, alongside each order.
SELECT id,
       amount,
       (SELECT AVG(amount) FROM orders) AS overall_avg,
       amount - (SELECT AVG(amount) FROM orders) AS delta
FROM   orders
ORDER  BY delta DESC;`}
      />

      <Callout variant="warn" title="One row, one column. No exceptions.">
        If the scalar subquery ever returns two rows, MySQL throws{" "}
        <code>ERROR 1242 (21000): Subquery returns more than 1 row</code>.
        Add <code>LIMIT 1</code> only when the multiple-row case is
        impossible by design — usually a hint your aggregation is
        missing.
      </Callout>

      <H2 id="in-and-not-in">IN and NOT IN</H2>
      <p>
        Test membership against the result of a subquery. Reads naturally
        but has a sharp edge with <code>NULL</code>.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Users who have placed at least one paid order.
SELECT id, name
FROM   users
WHERE  id IN (
  SELECT user_id FROM orders WHERE status = 'paid'
);

-- Users who have NEVER placed a paid order.
SELECT id, name
FROM   users
WHERE  id NOT IN (
  SELECT user_id FROM orders WHERE status = 'paid'
);`}
      />

      <Callout variant="warn" title="NOT IN + NULL = silent zero rows">
        If the subquery can return <code>NULL</code> (a nullable column,
        say), <code>NOT IN</code> returns no rows at all. Filter NULLs
        explicitly, or switch to <code>NOT EXISTS</code>:
        <CodeBlock
          language="sql"
          code={`-- Safe: NULLs filtered out
WHERE id NOT IN (
  SELECT user_id FROM orders
  WHERE status = 'paid' AND user_id IS NOT NULL
)

-- Safer: NOT EXISTS doesn't care about NULLs in the subquery.
WHERE NOT EXISTS (
  SELECT 1 FROM orders o
  WHERE  o.user_id = u.id AND o.status = 'paid'
)`}
        />
      </Callout>

      <H2 id="exists-and-not-exists">EXISTS and NOT EXISTS</H2>
      <p>
        <code>EXISTS</code> returns true the moment the subquery finds
        one row. The planner short-circuits — it doesn&apos;t materialize
        the full result set. For &ldquo;at least one&rdquo; questions,
        this is almost always the fastest pattern.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Users with at least one paid order.
SELECT id, name
FROM   users u
WHERE  EXISTS (
  SELECT 1
  FROM   orders o
  WHERE  o.user_id = u.id
    AND  o.status  = 'paid'
);

-- Users who have NEVER placed an order at all.
SELECT id, name
FROM   users u
WHERE  NOT EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);`}
      />

      <Callout variant="tip" title="Why SELECT 1?">
        Inside <code>EXISTS</code>, the column list is ignored — only
        existence matters. <code>SELECT 1</code> is the convention. Some
        engineers write <code>SELECT *</code>; same plan, slightly less
        idiomatic.
      </Callout>

      <H2 id="correlated-subqueries">Correlated subqueries</H2>
      <p>
        A subquery that references columns from the outer query. The
        subquery is logically re-evaluated once per outer row.
      </p>

      <Steps>
        <Step
          title="The classic shape"
          summary="The 'biggest order per user' pattern."
        >
          <CodeBlock
            language="sql"
            code={`-- Each order, with how it ranks within that user's history.
SELECT o.id,
       o.user_id,
       o.amount,
       (SELECT COUNT(*) + 1
        FROM   orders o2
        WHERE  o2.user_id = o.user_id
          AND  o2.amount  > o.amount) AS rank_for_user
FROM   orders o
ORDER  BY o.user_id, rank_for_user;`}
          />
        </Step>

        <Step
          title="Watch the cost"
          summary="Without an index on (user_id, amount), this is O(n²)."
        >
          <p>
            On 10 orders, fine. On 10 million, it scans the whole orders
            table once per outer row. The right answer is usually a
            window function (lesson 4.2) or a join with a pre-aggregated
            subquery.
          </p>
        </Step>

        <Step
          title="Rewrite when possible"
          summary="The same query, with a window function. Cleaner and faster."
        >
          <CodeBlock
            language="sql"
            code={`SELECT id,
       user_id,
       amount,
       RANK() OVER (PARTITION BY user_id ORDER BY amount DESC) AS rank_for_user
FROM   orders
ORDER  BY user_id, rank_for_user;`}
          />
        </Step>
      </Steps>

      <H2 id="derived-tables">Derived tables (FROM subqueries)</H2>
      <p>
        Any <code>SELECT</code> wrapped in parentheses can sit in{" "}
        <code>FROM</code>. The result is a temporary, anonymous table you
        can join to like any other.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Users alongside their lifetime paid revenue.
SELECT u.name, COALESCE(r.revenue, 0) AS revenue
FROM   users u
LEFT   JOIN (
  SELECT user_id, SUM(amount) AS revenue
  FROM   orders
  WHERE  status = 'paid'
  GROUP  BY user_id
) AS r ON r.user_id = u.id
ORDER  BY revenue DESC;`}
      />

      <Terminal title="result — mysql">
        <AnimatedSpan className="text-[#a89e8f]">
          <span>+--------------+----------+</span>
          <span>| name         | revenue  |</span>
          <span>+--------------+----------+</span>
        </AnimatedSpan>
        <AnimatedSpan className="text-[#d8d1c2]">
          <span>| Eli Schwartz |   999.00 |</span>
          <span>| Cam Williams |    79.00 |</span>
          <span>| Ana Lopez    |    68.00 |</span>
          <span>| Ben Tanaka   |     0.00 |</span>
          <span>| Dee Patel    |     0.00 |</span>
          <span>| Fei Chen     |     0.00 |</span>
          <span>+--------------+----------+</span>
        </AnimatedSpan>
      </Terminal>

      <Callout variant="info" title="MySQL requires the alias">
        Every derived table needs an alias (<code>AS r</code> above).
        Postgres lets you omit it; MySQL throws{" "}
        <code>ERROR 1248 (42000): Every derived table must have its own alias</code>.
      </Callout>

      <H2 id="subquery-vs-join">Subquery vs JOIN — which to reach for</H2>

      <KeyConcepts
        items={[
          {
            title: "Pick a JOIN when you need columns from both sides",
            body: "If you want users plus their order data, joining is the natural shape. Subqueries hide the relationship.",
          },
          {
            title: "Pick a subquery when you only need one side",
            body: "'Users who have a paid order' doesn't need order columns. EXISTS reads more clearly than a JOIN + DISTINCT.",
          },
          {
            title: "Pick a derived table to pre-aggregate",
            body: "Aggregating in a subquery and joining the result avoids the row-multiplication trap of joining first then grouping.",
          },
          {
            title: "Modern planners normalize most of this",
            body: "MySQL 8 rewrites IN/EXISTS/JOIN forms into the same plan in many cases. Optimize for readability, profile when it matters.",
          },
        ]}
      />

      <Recap
        items={[
          "Subqueries come in scalar, set, and table flavours.",
          "EXISTS / NOT EXISTS short-circuit and dodge the NOT IN + NULL trap.",
          "Correlated subqueries are O(n²) without the right index — prefer window functions for ranks.",
          "Derived tables let you pre-aggregate before joining; MySQL requires an alias.",
          "Subquery vs JOIN is mostly about readability — modern planners rewrite both.",
        ]}
      />
    </>
  ),
};
