import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "indexes-design",
  number: "05.04",
  title: "Designing indexes",
  description:
    "B-trees, primary vs secondary, composite columns, prefix indexes — the index design decisions that make or break query speed.",
  duration: "16 min",
  tags: ["indexes", "btree", "performance"],
  headings: [
    { id: "what-an-index-actually-is", text: "What an index actually is", depth: 2 },
    { id: "primary-vs-secondary", text: "Primary vs secondary indexes", depth: 2 },
    { id: "composite-indexes", text: "Composite indexes — order matters", depth: 2 },
    { id: "covering-indexes", text: "Covering indexes", depth: 2 },
    { id: "prefix-and-functional", text: "Prefix and functional indexes", depth: 2 },
    { id: "when-not-to-index", text: "When not to index", depth: 2 },
    { id: "design-checklist", text: "Index design checklist", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        An index is a sorted shortcut into your table. The right ones
        make queries hundreds of times faster; the wrong ones cost write
        throughput, disk space, and buffer pool memory. This lesson is
        about <em>designing</em> indexes — chapter 7 covers reading{" "}
        <code>EXPLAIN</code> to verify they&apos;re used.
      </p>

      <Prerequisites
        items={[
          "Constraints from lesson 5.3 — primary and unique keys are also indexes.",
          "Comfort reading CREATE TABLE statements.",
          "MySQL 8 playground; an InnoDB table.",
        ]}
      />

      <H2 id="what-an-index-actually-is">What an index actually is</H2>
      <p>
        InnoDB indexes are B+ trees: balanced trees whose leaves contain
        the indexed values, sorted, with pointers between siblings. Cost
        of looking up a single value is O(log N) page reads — millions
        of rows in 3-4 hops.
      </p>

      <KeyConcepts
        items={[
          {
            title: "Sorted",
            body: "Range scans (BETWEEN, >, <), prefix matches, and ORDER BY can all walk the index in order.",
          },
          {
            title: "Selective",
            body: "An index helps when matching rows are a small fraction of the table. Indexing a 'gender' column in a 50/50 split usually makes things worse.",
          },
          {
            title: "Costs writes",
            body: "Every INSERT, UPDATE, DELETE on indexed columns updates the tree. More indexes = slower writes. Keep only what queries earn.",
          },
          {
            title: "Lives in memory (when it fits)",
            body: "InnoDB caches hot index pages in the buffer pool. The smaller and more focused your indexes, the more of them stay hot.",
          },
        ]}
      />

      <H2 id="primary-vs-secondary">Primary vs secondary indexes</H2>

      <KeyConcepts
        items={[
          {
            title: "Primary index = the table",
            body: "InnoDB clusters row data on the primary key. The 'primary index' and 'the table' are the same B+ tree. Insert order matters.",
          },
          {
            title: "Secondary indexes hold the PK",
            body: "Each secondary index leaf stores the indexed columns and the primary-key value. Lookups follow that PK back to the row — a 'bookmark lookup'.",
          },
          {
            title: "Covering index avoids the lookup",
            body: "If a secondary index includes every column the query needs, the planner skips the bookmark lookup. The query never touches the table.",
          },
          {
            title: "Bigger PK = bigger every index",
            body: "BIGINT (8 bytes) vs UUID stored as BINARY(16) — every secondary index pays the size difference, repeatedly.",
          },
        ]}
      />

      <H2 id="composite-indexes">Composite indexes — order matters</H2>
      <p>
        A composite index on <code>(a, b, c)</code> is sorted by{" "}
        <code>a</code> first, then <code>b</code> within each <code>a</code>,
        then <code>c</code>. The leftmost prefix rule says the index can
        serve any query that filters on a leading subset of the columns.
      </p>

      <CodeBlock
        language="sql"
        filename="composite.sql"
        code={`CREATE INDEX idx_orders_user_status_created
  ON orders (user_id, status, created_at);

-- ✅ Uses the index — leftmost prefix.
SELECT * FROM orders WHERE user_id = 42;
SELECT * FROM orders WHERE user_id = 42 AND status = 'paid';
SELECT * FROM orders
WHERE  user_id = 42 AND status = 'paid'
ORDER  BY created_at DESC;

-- ❌ Skips user_id — index is useless.
SELECT * FROM orders WHERE status = 'paid';

-- ⚠️ Range on user_id stops the index helping with status.
SELECT * FROM orders WHERE user_id > 100 AND status = 'paid';`}
      />

      <Callout variant="pro" title="Equality first, range last">
        Order columns in a composite index by access pattern: equality
        predicates first, then the range, then ORDER BY columns. A
        leading range column &ldquo;closes&rdquo; the index — later
        columns can&apos;t be used for filtering.
      </Callout>

      <H2 id="covering-indexes">Covering indexes</H2>
      <p>
        When every column the query reads is in the index, MySQL skips
        the table entirely. <code>EXPLAIN</code> shows{" "}
        <code>Using index</code>.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Without a covering index, the query reads the index, then the table.
SELECT user_id, status FROM orders
WHERE  user_id = 42 AND status = 'paid';

-- With this index, the query reads only the index.
CREATE INDEX idx_orders_user_status
  ON orders (user_id, status);

-- A larger covering index — pays a write cost, but reads stay in the index.
CREATE INDEX idx_orders_dashboard
  ON orders (user_id, status, created_at, amount);`}
      />

      <Callout variant="warn" title="Don't cover everything">
        The temptation is to add every column to every hot index. Each
        addition costs storage and write throughput. Cover the
        narrowest, most-frequent reads. Profile before assuming.
      </Callout>

      <H2 id="prefix-and-functional">Prefix and functional indexes</H2>

      <CodeBlock
        language="sql"
        code={`-- Prefix index — index only the first N characters.
CREATE INDEX idx_users_email_prefix
  ON users (email(20));

-- Functional index (8.0.13+) — index the result of an expression.
CREATE INDEX idx_users_email_lower
  ON users ((LOWER(email)));

-- Use it: the predicate must match the expression exactly.
SELECT * FROM users WHERE LOWER(email) = 'ana@ex.com';`}
      />

      <KeyConcepts
        items={[
          {
            title: "Prefix indexes save space",
            body: "VARCHAR(320) emails with a (20) prefix often have the same selectivity. The index gets smaller and faster.",
          },
          {
            title: "Prefix limits ORDER BY",
            body: "The prefix can serve equality and range, but ORDER BY by the full column may still need a sort. Profile to verify.",
          },
          {
            title: "Functional indexes for case-insensitive lookups",
            body: "MySQL's _ci collations handle most cases — but for derived values (json_extract, expressions), functional indexes are the answer.",
          },
          {
            title: "Functional indexes constrain query shape",
            body: "The query expression must match the index expression character for character. Build helpers in your application layer.",
          },
        ]}
      />

      <H2 id="when-not-to-index">When not to index</H2>

      <KeyConcepts
        items={[
          {
            title: "Low-selectivity columns",
            body: "Booleans, status enums with one dominant value, anything where matching rows are >10–20% of the table. The planner picks a full scan anyway.",
          },
          {
            title: "Columns that change constantly",
            body: "An index on last_seen_at gets rewritten on every login. Sometimes worth it; usually not.",
          },
          {
            title: "Tables you only INSERT into",
            body: "Pure write-only logs benefit from minimal indexing. Add what you need at query time.",
          },
          {
            title: "Tiny tables",
            body: "Below ~1000 rows, the planner often ignores indexes — a full scan is cheaper than the bookkeeping.",
          },
        ]}
      />

      <H2 id="design-checklist">Index design checklist</H2>

      <CodeBlock
        language="text"
        code={`Before adding an index:

  ☐ Which queries does it serve? Name them.
  ☐ Are the leading columns equality-filtered?
  ☐ Will it reduce a sort or a bookmark lookup?
  ☐ Could an existing index cover this with one extra column?
  ☐ How much does it cost on writes? (Run a load test if it's hot path.)
  ☐ Have you measured the slow query before assuming?
  ☐ Will you remove it if metrics don't improve?`}
      />

      <Callout variant="pro" title="Audit indexes monthly">
        Query <code>sys.schema_unused_indexes</code> on production. Drop
        what hasn&apos;t been used in 30 days. Indexes accumulate like
        kitchen drawers.
      </Callout>

      <Recap
        items={[
          "InnoDB indexes are B+ trees; primary index is the table itself.",
          "Composite indexes obey the leftmost-prefix rule — equality first, range last.",
          "Covering indexes skip the bookmark lookup entirely; profile to confirm.",
          "Prefix and functional indexes solve niche problems but constrain query shape.",
          "Indexes cost writes — design for the queries that matter, drop what's unused.",
        ]}
      />
    </>
  ),
};
