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
  slug: "ordering-and-limit",
  number: "02.03",
  title: "ORDER BY, LIMIT, and pagination",
  description:
    "Sorting, paging, and the difference between OFFSET and keyset pagination once your tables get real.",
  duration: "12 min",
  tags: ["order-by", "limit", "pagination"],
  headings: [
    { id: "order-by", text: "ORDER BY", depth: 2 },
    { id: "limit-and-offset", text: "LIMIT and OFFSET", depth: 2 },
    { id: "the-offset-problem", text: "The OFFSET problem at scale", depth: 2 },
    { id: "build-keyset-pagination", text: "Build keyset pagination", depth: 2 },
    { id: "when-to-use-which", text: "When to use which", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        <code>ORDER BY</code> sorts. <code>LIMIT</code> truncates. They
        look trivial — but how you combine them determines whether your
        list endpoints stay fast at a million rows.
      </p>

      <Prerequisites
        items={[
          "WHERE and SELECT from lessons 2.1 and 2.2.",
          "An index on (created_at, id) for the keyset section — we'll create it inline.",
          "A rough mental picture of B-tree traversal (skip if unfamiliar; the example still works).",
        ]}
      />

      <H2 id="order-by">ORDER BY</H2>
      <CodeBlock
        language="sql"
        code={`-- Newest first
SELECT * FROM orders ORDER BY created_at DESC;

-- Multi-column sort: country A→Z, then revenue high→low
SELECT name, country, amount
FROM   orders
JOIN   users ON users.id = orders.user_id
ORDER  BY country ASC, amount DESC;

-- Order by an expression
SELECT email FROM users
ORDER  BY LENGTH(email);`}
      />

      <Callout variant="warn">
        Without <code>ORDER BY</code>, the database is allowed to return
        rows in <em>any</em> order — including a different order on the
        next run. Don&apos;t rely on insertion order.
      </Callout>

      <H2 id="limit-and-offset">LIMIT and OFFSET</H2>
      <CodeBlock
        language="sql"
        code={`-- First page (10 rows)
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;

-- Second page (skip 10, take 10)
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10 OFFSET 10;`}
      />

      <H2 id="the-offset-problem">The OFFSET problem at scale</H2>
      <p>
        <code>OFFSET 10000</code> doesn&apos;t mean &ldquo;jump to row
        10000.&rdquo; The database still has to <em>compute and discard</em>{" "}
        the first 10000 rows. Page 1000 of an infinite scroll is much
        slower than page 1.
      </p>

      <Callout variant="info" title="When OFFSET is fine">
        For dashboards with a few hundred rows, <code>OFFSET</code> is
        fine. The pattern matters once tables grow into the millions.
      </Callout>

      <H2 id="build-keyset-pagination">Build keyset pagination</H2>
      <p>
        Instead of asking &ldquo;skip 10000 rows,&rdquo; remember the
        last row of the previous page and ask for everything after it.
        The database can use the index directly.
      </p>

      <Steps>
        <Step
          title="Pick a stable, unique sort key"
          summary="Sorting needs to be deterministic — ties must be broken by something unique like the primary key."
        >
          <CodeBlock
            language="sql"
            code={`-- created_at alone may have ties. Append id to break them.
ORDER BY created_at DESC, id DESC`}
          />
        </Step>

        <Step
          title="Add an index that matches"
          summary="A composite index lets the database walk pages in O(log n) per page."
        >
          <CodeBlock
            language="sql"
            code={`CREATE INDEX orders_created_at_id_idx
  ON orders (created_at DESC, id DESC);`}
          />
          <p>
            On Postgres this is exactly what you want. SQLite doesn&apos;t
            need the <code>DESC</code> on the index for keyset to work,
            but it doesn&apos;t hurt.
          </p>
        </Step>

        <Step
          title="Fetch page 1"
          summary="No cursor yet — just LIMIT, sorted by the unique key."
        >
          <CodeBlock
            language="sql"
            code={`SELECT id, created_at, amount
FROM   orders
ORDER  BY created_at DESC, id DESC
LIMIT  10;`}
          />
        </Step>

        <Step
          title="Fetch page 2 with the last row as cursor"
          summary="Tuple comparison reads naturally as 'everything that comes after the cursor'."
        >
          <CodeBlock
            language="sql"
            filename="keyset.sql"
            code={`-- Pass the last row's (created_at, id) from page 1.
SELECT id, created_at, amount
FROM   orders
WHERE  (created_at, id) < (:last_created_at, :last_id)
ORDER  BY created_at DESC, id DESC
LIMIT  10;`}
          />
          <p>
            The tuple comparison <code>(a, b) &lt; (x, y)</code> means{" "}
            <em>a &lt; x, or (a = x and b &lt; y)</em>. Combined with an
            index on <code>(created_at, id)</code>, this is constant-time
            per page no matter how deep you go.
          </p>
        </Step>

        <Step
          title="Encode the cursor"
          summary="Most APIs base64-encode the tuple so clients treat it as opaque."
        >
          <CodeBlock
            language="ts"
            code={`// Server -> client
const cursor = Buffer
  .from(JSON.stringify([row.created_at, row.id]))
  .toString("base64url");

// Client -> server, on next page request
const [createdAt, id] = JSON.parse(
  Buffer.from(cursor, "base64url").toString()
);`}
          />
        </Step>
      </Steps>

      <Callout variant="pro" title="Use this in your APIs">
        Cursor-based pagination in your REST or GraphQL layer is just
        keyset pagination underneath, with the cursor encoding the last
        row&apos;s sort key. Once you see this, every &ldquo;page=N&rdquo;
        endpoint feels like a missed opportunity.
      </Callout>

      <H2 id="when-to-use-which">When to use which</H2>

      <KeyConcepts
        items={[
          {
            title: "OFFSET",
            body: "Admin tables, dashboards under a few hundred rows, and exports where total count matters more than speed.",
          },
          {
            title: "Keyset",
            body: "Public lists, infinite scrolls, anything user-facing past a few thousand rows. Predictable cost per page.",
          },
          {
            title: "Both",
            body: "Some apps offer keyset for the feed and OFFSET for the admin view of the same table. That's fine.",
          },
          {
            title: "Total count",
            body: "Keyset doesn't give you a total. If you need one, run COUNT(*) separately and cache it — or accept 'show me more'.",
          },
        ]}
      />

      <Recap
        items={[
          "ORDER BY is required if you depend on row order — never assume insertion order.",
          "LIMIT/OFFSET is fine for small lists; it becomes O(N) at scale.",
          "Keyset pagination uses a stable composite key and an index that matches it.",
          "Tuple comparison is the readable way to write 'everything after the cursor'.",
          "Encode cursors as opaque base64url strings in your API.",
        ]}
      />
    </>
  ),
};
