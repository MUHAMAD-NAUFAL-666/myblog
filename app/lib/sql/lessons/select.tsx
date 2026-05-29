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
  slug: "select",
  number: "02.01",
  title: "SELECT — picking your columns",
  description:
    "The most common keyword in SQL, and the one most engineers misuse. Be explicit and your queries age well.",
  duration: "10 min",
  tags: ["select", "fundamentals"],
  headings: [
    { id: "the-anatomy", text: "The anatomy of a SELECT", depth: 2 },
    { id: "step-by-step", text: "Step-by-step: building a SELECT", depth: 2 },
    { id: "avoid-select-star", text: "Avoid SELECT * in production", depth: 2 },
    { id: "expressions-and-aliases", text: "Expressions and aliases", depth: 2 },
    { id: "distinct", text: "DISTINCT — when to reach for it", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        <code>SELECT</code> tells the database which columns you want.
        That&apos;s it. The clause is simple. The discipline around it is
        what makes queries good.
      </p>

      <Prerequisites
        items={[
          "Playground database from lesson 1.2 is loaded.",
          "You understand the seven-step execution order from lesson 1.3.",
          "Open sqlite3 in a side terminal — every block here is meant to be run.",
        ]}
      />

      <H2 id="the-anatomy">The anatomy of a SELECT</H2>

      <CodeBlock
        language="sql"
        filename="anatomy.sql"
        code={`SELECT  column_a, column_b, expression AS alias
FROM    table_name
[WHERE  ... ]
[ORDER  BY ... ]
[LIMIT  ... ];`}
      />

      <p>
        The brackets mark optional clauses. We&apos;ll cover{" "}
        <code>WHERE</code> in lesson 2.2 and <code>ORDER BY</code> in
        lesson 2.3. For now, focus on the <code>SELECT</code> list itself.
      </p>

      <H2 id="step-by-step">Step-by-step: building a SELECT</H2>

      <Steps>
        <Step
          title="Start with the table"
          summary="Identify the table that holds the data you want. SELECT always pairs with FROM."
        >
          <CodeBlock
            language="sql"
            code={`-- We want users. They live in the 'users' table.
SELECT * FROM users;`}
          />
          <p>
            <code>SELECT *</code> is the right call <em>only</em> while
            you&apos;re exploring. We&apos;ll narrow down in step 2.
          </p>
        </Step>

        <Step
          title="Name the columns you actually need"
          summary="Be explicit. Future you, and the planner, will thank you."
        >
          <CodeBlock
            language="sql"
            code={`SELECT id, email, name FROM users;`}
          />

          <Terminal title="result — sqlite3">
            <AnimatedSpan className="text-[#a89e8f]">
              <span>id  email          name</span>
              <span>--  -------------  -------------</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-[#d8d1c2]">
              <span>1   ana@ex.com     Ana Lopez</span>
              <span>2   ben@ex.com     Ben Tanaka</span>
              <span>3   cam@ex.com     Cam Williams</span>
              <span>...</span>
            </AnimatedSpan>
          </Terminal>
        </Step>

        <Step
          title="Add expressions where they help"
          summary="The SELECT list isn't just columns — it's any expression that returns a value."
        >
          <CodeBlock
            language="sql"
            code={`SELECT name,
       UPPER(country)  AS country_code,
       LENGTH(email)   AS email_length
FROM   users;`}
          />
        </Step>

        <Step
          title="Alias for clarity"
          summary="When the expression is more than a column reference, give it a name."
        >
          <CodeBlock
            language="sql"
            code={`-- Without alias the column is unnamed in the output.
SELECT name, amount * 0.85 FROM orders;

-- With alias your downstream code (or your future self) can read it.
SELECT name, amount * 0.85 AS net FROM orders;`}
          />
        </Step>
      </Steps>

      <H2 id="avoid-select-star">Avoid SELECT * in production</H2>
      <p>
        <code>SELECT *</code> is fine in the REPL. In production, it&apos;s
        a slow leak.
      </p>

      <KeyConcepts
        items={[
          {
            title: "Bandwidth",
            body: "You ship every column over the wire even if your app uses three. Cheap on a laptop, expensive at scale.",
          },
          {
            title: "Index efficiency",
            body: "The planner can't use covering indexes if it has to fetch every column from the heap.",
          },
          {
            title: "Schema fragility",
            body: "Add a column tomorrow and every consumer that did SELECT * sees it, ready or not.",
          },
          {
            title: "Hidden coupling",
            body: "Stored views and ORM models that splat columns make ALTER TABLE a 30-PR change.",
          },
        ]}
      />

      <Callout variant="pro" title="Use SELECT *, but consciously">
        In ad-hoc analysis, <code>SELECT *</code> saves time. In stored
        queries, ORM models, and views, name your columns. Future-you
        thanks present-you.
      </Callout>

      <H2 id="expressions-and-aliases">Expressions and aliases</H2>
      <p>
        Anything that returns a value can sit in <code>SELECT</code>.
        Combine column references, function calls, arithmetic, and{" "}
        <code>CASE</code> expressions freely.
      </p>

      <CodeBlock
        language="sql"
        code={`SELECT
  name,
  UPPER(country)        AS country_code,
  LENGTH(email)         AS email_length,
  amount * 0.85         AS net,
  CASE
    WHEN amount > 100 THEN 'high'
    ELSE 'low'
  END                   AS bucket
FROM orders
JOIN users ON users.id = orders.user_id;`}
      />

      <p>
        Aliases use <code>AS</code> and are just labels. They show up in
        the result set and can be referenced in <code>ORDER BY</code> —
        but not in <code>WHERE</code> or <code>GROUP BY</code> (lesson
        1.3).
      </p>

      <H2 id="distinct">DISTINCT — when to reach for it</H2>
      <p>
        <code>DISTINCT</code> de-duplicates rows. Useful, but often a
        sign you&apos;re asking the wrong question.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Every country with at least one user.
SELECT DISTINCT country FROM users;

-- Often what you actually want: count, not list.
SELECT country, COUNT(*) AS n
FROM   users
GROUP  BY country;`}
      />

      <Callout variant="warn">
        If you find yourself reaching for <code>DISTINCT</code> after a
        <code>JOIN</code>, the join condition is probably wrong. Fix the
        join first; <code>DISTINCT</code> is the painkiller, not the
        cure.
      </Callout>

      <Recap
        items={[
          "SELECT specifies columns and expressions. Pair it with FROM, always.",
          "Avoid SELECT * outside the REPL — bandwidth, indexing, and schema evolution all suffer.",
          "Aliases (AS) are visible in ORDER BY but not in WHERE or GROUP BY.",
          "DISTINCT is a code smell after a JOIN — fix the join first.",
        ]}
      />
    </>
  ),
};
