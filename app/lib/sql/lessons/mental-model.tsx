import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  Prerequisites,
  Recap,
  Step,
  Steps,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "mental-model",
  number: "01.03",
  title: "The mental model",
  description:
    "SQL is a language about sets — and about asking the database for what you want, not how to find it. Internalize this and the rest is detail.",
  duration: "10 min",
  tags: ["fundamentals", "execution-order"],
  headings: [
    { id: "declarative-not-imperative", text: "Declarative, not imperative", depth: 2 },
    { id: "the-shape-of-every-query", text: "The shape of every query", depth: 2 },
    { id: "execution-order", text: "Logical execution order", depth: 2 },
    { id: "walk-through-a-query", text: "Walk through a real query", depth: 2 },
    { id: "why-this-matters", text: "Why this matters in practice", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Most engineers learn SQL by accumulating examples. They copy a
        <code>SELECT</code> from one query, a <code>WHERE</code> from
        another, paste them together until it works. It compiles. It even
        returns data. But the mental model never lands — and they spend
        the rest of their career uncertain about which clause runs first.
      </p>

      <Prerequisites
        items={[
          "You completed lesson 1.2 and have a working playground.db.",
          "You can paste SQL into a terminal and read the output.",
          "Comfort with how a for-loop works in any imperative language.",
        ]}
      />

      <p>
        Spend the next ten minutes on this lesson. It&apos;s the cheat
        sheet that makes the rest of the course click.
      </p>

      <H2 id="declarative-not-imperative">Declarative, not imperative</H2>
      <p>
        SQL doesn&apos;t describe <em>how</em> to find your data. It
        describes <em>what set</em> you want, and lets the database&apos;s
        query planner pick the implementation. That distinction looks
        small. It&apos;s the whole language.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Imperative pseudocode (what you'd write in JS)
const out = []
for (const u of users) {
  if (u.country === 'JP') out.push({ id: u.id, name: u.name })
}
return out

-- SQL — declarative
SELECT id, name FROM users WHERE country = 'JP';`}
      />

      <p>
        In the JS version you control the loop. In the SQL version, the
        database is free to use an index, parallelize, reorder operations,
        cache plans — whatever&apos;s fastest. Your job is to describe the
        set correctly. The planner&apos;s job is everything else.
      </p>

      <H2 id="the-shape-of-every-query">The shape of every query</H2>
      <p>
        Every <code>SELECT</code> in SQL has the same skeleton, executed
        in a fixed order — and it&apos;s <strong>not</strong> the order
        you write it in.
      </p>

      <CodeBlock
        language="sql"
        filename="skeleton.sql"
        code={`-- Written order
SELECT   columns
FROM     tables
WHERE    row_filter
GROUP BY ...
HAVING   group_filter
ORDER BY ...
LIMIT    ...;`}
      />

      <H2 id="execution-order">Logical execution order</H2>

      <p>
        Walking through the seven steps below in order is the single most
        useful exercise in this course. Bookmark it.
      </p>

      <Steps>
        <Step
          title="FROM — assemble the source"
          summary="Put the rows on the table. Joins happen here. The result is a virtual table."
        >
          <p>
            If you write <code>FROM users JOIN orders ...</code>, the
            database first builds the combined rowset. Nothing is filtered
            yet — every matching pair is on the table.
          </p>
        </Step>
        <Step
          title="WHERE — filter rows"
          summary="Drop rows that don't match the predicate. Runs before grouping or aggregation."
        >
          <p>
            Because <code>WHERE</code> runs before <code>SELECT</code>, you
            cannot reference an alias defined in <code>SELECT</code> here.
          </p>
        </Step>
        <Step
          title="GROUP BY — bucket the survivors"
          summary="Collapse rows that share the grouping columns into one row per bucket."
        >
          <p>
            After this step, the row count drops to the number of distinct
            groups. <code>SELECT</code> can only reference the grouping
            columns or aggregate functions on the rest.
          </p>
        </Step>
        <Step
          title="HAVING — filter buckets"
          summary="Same idea as WHERE, but it runs on aggregated rows."
        >
          <p>
            Use <code>HAVING SUM(amount) &gt; 100</code>, not{" "}
            <code>WHERE SUM(amount) &gt; 100</code>. The aggregate
            doesn&apos;t exist yet during <code>WHERE</code>.
          </p>
        </Step>
        <Step
          title="SELECT — pick columns"
          summary="Compute the columns and aliases you want in the output."
        >
          <p>
            Aliases assigned here are visible to <code>ORDER BY</code> —
            but not to anything earlier in the pipeline.
          </p>
        </Step>
        <Step
          title="ORDER BY — sort"
          summary="Sort the result. The first clause where SELECT aliases are usable."
        />
        <Step
          title="LIMIT / OFFSET — truncate"
          summary="Take the first N rows of the sorted result."
        >
          <p>
            <code>OFFSET</code> is computed by the database — it doesn&apos;t
            magically &ldquo;jump&rdquo; to row N. We&apos;ll fix this with
            keyset pagination in lesson 2.3.
          </p>
        </Step>
      </Steps>

      <Callout variant="warn" title="The classic trap">
        Column aliases defined in <code>SELECT</code> aren&apos;t available
        in <code>WHERE</code> — because <code>WHERE</code> runs first. They
        <em> are</em> available in <code>ORDER BY</code>, because that runs
        after.
      </Callout>

      <CodeBlock
        language="sql"
        code={`-- ❌ Doesn't work — alias 'rev' doesn't exist yet at WHERE.
SELECT amount * 0.95 AS rev
FROM   orders
WHERE  rev > 50;

-- ✅ Repeat the expression in WHERE.
SELECT amount * 0.95 AS rev
FROM   orders
WHERE  amount * 0.95 > 50;

-- ✅ Or use ORDER BY, which runs after SELECT.
SELECT amount * 0.95 AS rev
FROM   orders
ORDER  BY rev DESC;`}
      />

      <H2 id="walk-through-a-query">Walk through a real query</H2>
      <p>
        Pretend you&apos;re the database. Walk through the query below
        line by line, in execution order, not written order.
      </p>

      <CodeBlock
        language="sql"
        filename="example.sql"
        code={`SELECT u.country,
       SUM(o.amount) AS revenue
FROM   users u
JOIN   orders o ON o.user_id = u.id
WHERE  o.status = 'paid'
GROUP  BY u.country
HAVING SUM(o.amount) > 50
ORDER  BY revenue DESC
LIMIT  10;`}
      />

      <ol>
        <li>
          <strong>FROM</strong> — combine each user with each of their
          orders. Six users × matching orders.
        </li>
        <li>
          <strong>WHERE</strong> — drop pairs whose order isn&apos;t paid.
        </li>
        <li>
          <strong>GROUP BY</strong> — collapse to one row per country.
        </li>
        <li>
          <strong>HAVING</strong> — drop countries with revenue ≤ 50.
        </li>
        <li>
          <strong>SELECT</strong> — compute <code>SUM(amount)</code> and
          alias it as <code>revenue</code>.
        </li>
        <li>
          <strong>ORDER BY</strong> — sort by <code>revenue</code> DESC.
        </li>
        <li>
          <strong>LIMIT</strong> — keep the top 10.
        </li>
      </ol>

      <H2 id="why-this-matters">Why this matters in practice</H2>
      <p>Internalize the seven steps and three things happen:</p>
      <ol>
        <li>
          You stop being surprised when a <code>WHERE</code> can&apos;t see
          a <code>SELECT</code> alias.
        </li>
        <li>
          You stop writing <code>HAVING</code> when you meant{" "}
          <code>WHERE</code> (and vice versa — see lesson 4.1).
        </li>
        <li>
          You can debug any query in 30 seconds by walking through the
          steps mentally.
        </li>
      </ol>

      <p>
        That last one is the senior-engineer move. Anyone can write SQL.
        Reading it under pressure is what separates the experienced from
        the rest.
      </p>

      <Recap
        items={[
          "SQL is declarative — you describe the set, the planner picks the algorithm.",
          "Every SELECT runs in seven steps: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT.",
          "Aliases live in SELECT and only become visible in ORDER BY.",
          "When in doubt, walk through the steps mentally before guessing.",
        ]}
      />
    </>
  ),
};
