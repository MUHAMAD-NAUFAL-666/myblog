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
  slug: "ctes",
  number: "03.04",
  title: "Common Table Expressions (WITH)",
  description:
    "Named subqueries that read top-to-bottom. The single biggest readability win in SQL — and the only way to write recursive queries.",
  duration: "14 min",
  tags: ["cte", "with", "recursive"],
  headings: [
    { id: "what-a-cte-is", text: "What a CTE is", depth: 2 },
    { id: "step-by-step", text: "Step-by-step: refactoring with CTEs", depth: 2 },
    { id: "cte-vs-derived-table", text: "CTE vs derived table", depth: 2 },
    { id: "recursive-ctes", text: "Recursive CTEs", depth: 2 },
    { id: "performance-notes", text: "Performance notes", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        A Common Table Expression (CTE) is a named, temporary result set
        that lives for the duration of a single query. The syntax is{" "}
        <code>WITH name AS (SELECT ...)</code>. Once you start using
        them, every nested subquery feels like a missed opportunity.
      </p>

      <Prerequisites
        items={[
          "Subqueries from lesson 3.2 — CTEs are subqueries with names.",
          "MySQL 8.0+ — CTEs are not supported in 5.7 or earlier.",
          "An appetite for queries that read like prose, not Russian dolls.",
        ]}
      />

      <H2 id="what-a-cte-is">What a CTE is</H2>
      <p>
        A CTE turns this Russian-doll query:
      </p>

      <CodeBlock
        language="sql"
        code={`SELECT u.country, t.revenue, t.orders
FROM   users u
JOIN   (
  SELECT user_id, SUM(amount) AS revenue, COUNT(*) AS orders
  FROM   orders
  WHERE  status = 'paid'
  GROUP  BY user_id
) AS t ON t.user_id = u.id
ORDER  BY t.revenue DESC;`}
      />

      <p>...into something a human can read top-to-bottom:</p>

      <CodeBlock
        language="sql"
        filename="paid-revenue-by-user.sql"
        code={`WITH paid_totals AS (
  SELECT user_id,
         SUM(amount) AS revenue,
         COUNT(*)    AS orders
  FROM   orders
  WHERE  status = 'paid'
  GROUP  BY user_id
)
SELECT u.country, t.revenue, t.orders
FROM   users u
JOIN   paid_totals t ON t.user_id = u.id
ORDER  BY t.revenue DESC;`}
      />

      <Callout variant="tip" title="Why this matters">
        The reader sees the named building block <em>before</em> the
        place it&apos;s used. The same query, six months later, takes
        seconds to understand instead of minutes.
      </Callout>

      <H2 id="step-by-step">Step-by-step: refactoring with CTEs</H2>

      <Steps>
        <Step
          title="Find the noise"
          summary="A query with three nested subqueries is the smoke. Extracting CTEs is the fire."
        >
          <CodeBlock
            language="sql"
            code={`-- The 'before' query — three nested subqueries, hard to follow.
SELECT u.country,
       (SELECT COUNT(*) FROM orders o
        WHERE  o.user_id = u.id AND o.status = 'paid') AS paid_orders,
       (SELECT SUM(amount) FROM orders o
        WHERE  o.user_id = u.id AND o.status = 'paid') AS revenue
FROM   users u
WHERE  EXISTS (
  SELECT 1 FROM orders o WHERE o.user_id = u.id
);`}
          />
        </Step>

        <Step
          title="Name each idea"
          summary="One CTE per concept. The names should read like a table of contents."
        >
          <CodeBlock
            language="sql"
            code={`WITH active_users AS (
  SELECT u.id, u.country
  FROM   users u
  WHERE  EXISTS (
    SELECT 1 FROM orders o WHERE o.user_id = u.id
  )
),
paid_summary AS (
  SELECT user_id,
         COUNT(*)    AS paid_orders,
         SUM(amount) AS revenue
  FROM   orders
  WHERE  status = 'paid'
  GROUP  BY user_id
)
SELECT a.country, p.paid_orders, p.revenue
FROM   active_users a
LEFT   JOIN paid_summary p ON p.user_id = a.id
ORDER  BY p.revenue DESC NULLS LAST;`}
          />

          <Callout variant="info" title="MySQL has no NULLS LAST">
            Postgres supports <code>ORDER BY x DESC NULLS LAST</code>{" "}
            directly. In MySQL, sort by a sentinel:{" "}
            <code>ORDER BY p.revenue IS NULL, p.revenue DESC</code>.
          </Callout>
        </Step>

        <Step
          title="Chain CTEs that depend on each other"
          summary="A later CTE can reference any earlier CTE — building up a pipeline."
        >
          <CodeBlock
            language="sql"
            code={`WITH paid AS (
  SELECT user_id, SUM(amount) AS revenue
  FROM   orders
  WHERE  status = 'paid'
  GROUP  BY user_id
),
ranked AS (
  SELECT user_id, revenue,
         RANK() OVER (ORDER BY revenue DESC) AS rk
  FROM   paid
)
SELECT u.name, r.revenue, r.rk
FROM   ranked r
JOIN   users u ON u.id = r.user_id
WHERE  r.rk <= 3;`}
          />
        </Step>
      </Steps>

      <H2 id="cte-vs-derived-table">CTE vs derived table</H2>

      <KeyConcepts
        items={[
          {
            title: "CTE: named, top-of-query, reusable",
            body: "Reference the same CTE multiple times in the outer query without re-typing the subquery.",
          },
          {
            title: "Derived table: anonymous, in-line",
            body: "Lives where you use it. Fine for one-off subqueries; awkward when reused.",
          },
          {
            title: "MySQL inlines both by default",
            body: "MySQL 8 treats a non-recursive CTE as a derived table — same query plan, just better-organized SQL.",
          },
          {
            title: "Recursion changes the math",
            body: "Only CTEs (with the WITH RECURSIVE keyword) can self-reference. Derived tables cannot.",
          },
        ]}
      />

      <H2 id="recursive-ctes">Recursive CTEs</H2>
      <p>
        Hierarchies — managers, comment trees, category nests — used to
        require a stored procedure or application-side loops. Recursive
        CTEs solve them in a dozen lines.
      </p>

      <CodeBlock
        language="sql"
        filename="number-series.sql"
        code={`-- Generate numbers 1..10 — the 'hello world' of recursion.
WITH RECURSIVE n(x) AS (
  SELECT 1                       -- anchor: the base case
  UNION ALL
  SELECT x + 1 FROM n WHERE x < 10  -- recursive step
)
SELECT x FROM n;`}
      />

      <Terminal title="result — mysql">
        <AnimatedSpan className="text-[#a89e8f]">
          <span>+----+</span>
          <span>| x  |</span>
          <span>+----+</span>
        </AnimatedSpan>
        <AnimatedSpan className="text-[#d8d1c2]">
          <span>|  1 |</span>
          <span>|  2 |</span>
          <span>|... |</span>
          <span>| 10 |</span>
          <span>+----+</span>
        </AnimatedSpan>
      </Terminal>

      <p>
        The pattern is always the same: an <strong>anchor</strong>{" "}
        select, <code>UNION ALL</code>, then a{" "}
        <strong>recursive</strong> select that references the CTE
        itself. MySQL keeps stepping until the recursive part returns no
        new rows.
      </p>

      <CodeBlock
        language="sql"
        filename="org-chart.sql"
        code={`-- Walk an org chart. Assume employees(id, name, manager_id).
WITH RECURSIVE chain AS (
  -- Anchor: the CEO has no manager.
  SELECT id, name, manager_id, 0 AS depth
  FROM   employees
  WHERE  manager_id IS NULL

  UNION ALL

  -- Recursive: anyone whose manager is already in 'chain'.
  SELECT e.id, e.name, e.manager_id, c.depth + 1
  FROM   employees e
  JOIN   chain     c ON e.manager_id = c.id
)
SELECT depth, name FROM chain ORDER BY depth, name;`}
      />

      <Callout variant="warn" title="Runaway recursion is a thing">
        Without a terminating predicate, a recursive CTE can loop until
        MySQL hits <code>cte_max_recursion_depth</code> (default 1000)
        and bails. Add a depth column or a sensible{" "}
        <code>WHERE</code> on the recursive step.
      </Callout>

      <H2 id="performance-notes">Performance notes</H2>

      <KeyConcepts
        items={[
          {
            title: "MySQL 8 inlines non-recursive CTEs",
            body: "The optimizer treats them as derived tables — same plan, no materialization cost. Use them freely for readability.",
          },
          {
            title: "Recursive CTEs are linear in the result size",
            body: "Cost is dominated by how many rows recursion produces. Indexes on join columns matter as much as anywhere else.",
          },
          {
            title: "Postgres MATERIALIZED hint",
            body: "Postgres 12+ caches CTE results unless you write WITH x AS NOT MATERIALIZED. MySQL has no equivalent — it always inlines.",
          },
          {
            title: "Profile when in doubt",
            body: "EXPLAIN ANALYZE works the same on a CTE as on the inlined version. If the plan changes after a refactor, you found a real difference.",
          },
        ]}
      />

      <Recap
        items={[
          "WITH name AS (SELECT ...) gives a subquery a name and lifts it to the top.",
          "CTEs make multi-step queries read top-to-bottom — every reviewer thanks you.",
          "Chain CTEs to express pipelines; reference them multiple times in the main query.",
          "WITH RECURSIVE handles hierarchies in pure SQL — anchor, UNION ALL, recursive step.",
          "MySQL 8 inlines non-recursive CTEs, so readability is free.",
        ]}
      />
    </>
  ),
};
