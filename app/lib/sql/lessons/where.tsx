import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import {
  AnimatedSpan,
  Terminal,
} from "@/app/components/terminal";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  Prerequisites,
  Recap,
  Step,
  Steps,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "where",
  number: "02.02",
  title: "WHERE — filtering rows",
  description:
    "Comparison, IN, BETWEEN, LIKE, and the NULL trap that breaks every newcomer's first queries.",
  duration: "12 min",
  tags: ["where", "fundamentals", "null"],
  headings: [
    { id: "how-where-runs", text: "How WHERE runs", depth: 2 },
    { id: "comparison-operators", text: "Comparison operators", depth: 2 },
    { id: "combining-conditions", text: "Combining conditions", depth: 2 },
    { id: "in-and-between", text: "IN and BETWEEN", depth: 2 },
    { id: "like-and-pattern-matching", text: "LIKE and pattern matching", depth: 2 },
    { id: "the-null-trap", text: "The NULL trap", depth: 2 },
    { id: "your-turn", text: "Your turn", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        <code>WHERE</code> drops rows that don&apos;t belong. It runs
        before grouping, before <code>SELECT</code>, before{" "}
        <code>ORDER BY</code>. Most query bugs live here.
      </p>

      <Prerequisites
        items={[
          "Comfort with the SELECT clause (lesson 2.1).",
          "Memory of the seven-step execution order (lesson 1.3).",
          "Playground database open in your terminal.",
        ]}
      />

      <H2 id="how-where-runs">How WHERE runs</H2>
      <p>
        <code>WHERE</code> is a row-level predicate. The database
        evaluates the expression for each candidate row and drops the
        rows that return <code>FALSE</code> or <code>NULL</code>. Only
        rows that return <code>TRUE</code> survive.
      </p>

      <Callout variant="info" title="Three-valued logic">
        SQL booleans have three values: <code>TRUE</code>,{" "}
        <code>FALSE</code>, and <code>NULL</code>. Anything compared with
        <code>NULL</code> is itself <code>NULL</code> — and{" "}
        <code>WHERE NULL</code> drops the row. We&apos;ll come back to
        this at the end of the lesson.
      </Callout>

      <H2 id="comparison-operators">Comparison operators</H2>
      <CodeBlock
        language="sql"
        code={`-- Equality
SELECT name FROM users WHERE country = 'JP';

-- Inequality (both forms work; <> is portable, != is common)
SELECT name FROM users WHERE country <> 'JP';
SELECT name FROM users WHERE country != 'JP';

-- Numeric comparisons
SELECT * FROM orders WHERE amount > 100;
SELECT * FROM orders WHERE amount >= 100 AND amount <= 500;`}
      />

      <H2 id="combining-conditions">Combining conditions</H2>
      <p>
        <code>AND</code> binds tighter than <code>OR</code>. Use parens
        when you mean it; reviewers will read your query faster.
      </p>

      <CodeBlock
        language="sql"
        code={`-- ❌ Probably not what you meant.
SELECT * FROM orders
WHERE  status = 'paid' OR status = 'pending' AND amount > 100;
-- evaluates as: paid OR (pending AND amount > 100)

-- ✅ Be explicit.
SELECT * FROM orders
WHERE  (status = 'paid' OR status = 'pending')
  AND  amount > 100;`}
      />

      <H2 id="in-and-between">IN and BETWEEN</H2>
      <p>Two pieces of syntactic sugar worth knowing.</p>

      <CodeBlock
        language="sql"
        code={`-- IN — equivalent to multiple = ... OR
SELECT name FROM users WHERE country IN ('JP', 'GB', 'US');

-- NOT IN — beware of NULLs in the list (we'll see why in 'The NULL trap')
SELECT name FROM users WHERE country NOT IN ('JP', 'GB');

-- BETWEEN is INCLUSIVE on both ends
SELECT * FROM orders WHERE amount BETWEEN 50 AND 100;
-- equivalent to: amount >= 50 AND amount <= 100`}
      />

      <H2 id="like-and-pattern-matching">LIKE and pattern matching</H2>
      <CodeBlock
        language="sql"
        code={`-- % matches zero or more chars; _ matches exactly one
SELECT email FROM users WHERE email LIKE '%@ex.com';
SELECT email FROM users WHERE email LIKE 'a%';
SELECT email FROM users WHERE email LIKE 'a__@%';

-- Postgres: ILIKE is case-insensitive
SELECT email FROM users WHERE email ILIKE '%@EX.com';`}
      />

      <Callout
        variant="warn"
        title="LIKE on prefix? Index. LIKE on suffix? Scan."
      >
        <code>WHERE name LIKE &apos;ana%&apos;</code> can use a B-tree
        index. <code>WHERE name LIKE &apos;%ana&apos;</code> cannot. Plan
        your indexes around your access patterns.
      </Callout>

      <H2 id="the-null-trap">The NULL trap</H2>
      <p>
        <code>NULL</code> is not equal to anything — including itself.
        This is the gotcha every newcomer hits exactly once. The five
        steps below internalize the rule for good.
      </p>

      <Steps>
        <Step
          title="See the bug"
          summary="A familiar-looking equality silently returns nothing."
        >
          <Terminal title="the null gotcha — sqlite3">
            <AnimatedSpan className="text-[#a89e8f]">
              <span>sqlite&gt; SELECT NULL = NULL;</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-amber-300">
              <span>(empty result — NULL, not true)</span>
            </AnimatedSpan>
          </Terminal>
        </Step>

        <Step
          title="Use IS / IS NOT"
          summary="There's a separate operator for testing NULL."
        >
          <CodeBlock
            language="sql"
            code={`SELECT name FROM users WHERE country IS NULL;
SELECT name FROM users WHERE country IS NOT NULL;`}
          />
        </Step>

        <Step
          title="Replace NULLs with COALESCE"
          summary="When you want a fallback value rather than a missing one."
        >
          <CodeBlock
            language="sql"
            code={`SELECT name, COALESCE(country, 'unknown') FROM users;`}
          />
        </Step>

        <Step
          title="Make a value NULL with NULLIF"
          summary="Two arguments. Returns NULL when they match, otherwise the first."
        >
          <CodeBlock
            language="sql"
            code={`-- Treat 'XX' as if it were missing.
SELECT name, NULLIF(country, 'XX') FROM users;`}
          />
        </Step>

        <Step
          title="Audit your NOT IN clauses"
          summary="A NULL in the IN list silently drops every row."
        >
          <CodeBlock
            language="sql"
            code={`-- ⚠️ If any value in (1, 2, NULL) is NULL, this matches NOTHING.
SELECT * FROM orders WHERE user_id NOT IN (1, 2, NULL);

-- ✅ Filter NULLs out, or use NOT EXISTS.
SELECT * FROM orders
WHERE  user_id NOT IN (
  SELECT id FROM users WHERE id IS NOT NULL
);`}
          />
        </Step>
      </Steps>

      <Callout variant="info">
        <code>NULL</code> means &ldquo;unknown.&rdquo; Two unknowns
        aren&apos;t equal — they&apos;re both unknown. Once you accept
        the philosophical horror, the rule sticks.
      </Callout>

      <H2 id="your-turn">Your turn</H2>
      <p>
        Run these against the playground database. Predict the row count
        before you press Enter.
      </p>

      <CodeBlock
        language="sql"
        code={`-- 1. All paid orders over $50.
SELECT * FROM orders WHERE status = 'paid' AND amount > 50;

-- 2. Users from EU countries.
SELECT name FROM users WHERE country IN ('ES', 'GB');

-- 3. Anyone whose email contains an underscore.
SELECT email FROM users WHERE email LIKE '%\\_%' ESCAPE '\\';`}
      />

      <Recap
        items={[
          "WHERE evaluates a predicate per row; only TRUE rows survive.",
          "AND binds tighter than OR — use parens whenever it could be ambiguous.",
          "IN, BETWEEN, and LIKE are sugar over comparisons — but each has gotchas.",
          "NULL is not equal to anything. Use IS / IS NOT, COALESCE, NULLIF.",
          "NOT IN with NULLs in the list silently returns no rows.",
        ]}
      />
    </>
  ),
};
