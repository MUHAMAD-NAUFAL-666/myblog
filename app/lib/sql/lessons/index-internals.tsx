import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "index-internals",
  number: "07.02",
  title: "Index internals — B+ trees and the buffer pool",
  description:
    "How InnoDB actually stores indexes, why bookmark lookups are expensive, and what the buffer pool does for you.",
  duration: "12 min",
  tags: ["btree", "innodb", "buffer-pool"],
  headings: [
    { id: "the-b-plus-tree", text: "The B+ tree, briefly", depth: 2 },
    { id: "clustered-vs-secondary", text: "Clustered vs secondary indexes", depth: 2 },
    { id: "bookmark-lookups", text: "Bookmark lookups", depth: 2 },
    { id: "the-buffer-pool", text: "The buffer pool", depth: 2 },
    { id: "page-splits-and-fillfactor", text: "Page splits and fill factor", depth: 2 },
    { id: "index-condition-pushdown", text: "Index condition pushdown", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        You don&apos;t need to be a database engineer. You do need a
        rough mental picture of how InnoDB lays bytes on disk — enough
        to predict why <em>this</em> query is fast and{" "}
        <em>that</em> one isn&apos;t. Twenty minutes of internals saves
        a year of guessing.
      </p>

      <Prerequisites
        items={[
          "EXPLAIN from lesson 7.1.",
          "Index design from lesson 5.4.",
          "A willingness to sit with a tree diagram for a minute.",
        ]}
      />

      <H2 id="the-b-plus-tree">The B+ tree, briefly</H2>
      <p>
        InnoDB indexes are B+ trees: balanced trees where every
        non-leaf level holds &ldquo;routing&rdquo; values, every leaf
        level holds the actual data, and adjacent leaves are linked
        for fast range scans.
      </p>

      <CodeBlock
        language="text"
        code={`             [ root page: 1..1000 ]
              /     |       \\
       [1..50]  [51..600]   [601..1000]    ← internal pages (router)
        /  |  \\
   [leaf]  [leaf]  [leaf]                  ← data pages (sorted, doubly-linked)
   ↕         ↕        ↕`}
      />

      <KeyConcepts
        items={[
          {
            title: "Pages, not rows",
            body: "InnoDB reads 16 KB pages from disk. A leaf holds many rows; a single read fetches a chunk of nearby data 'for free'.",
          },
          {
            title: "Height matters more than size",
            body: "A B+ tree of 1B rows is typically 4 levels deep. Lookups cost 4 disk reads worst-case — and most of those pages are cached.",
          },
          {
            title: "Range scans walk leaves",
            body: "Once you find the first matching leaf, the linked-list pointers let you walk forward without going back up the tree.",
          },
          {
            title: "Sorted, always",
            body: "An index is the sorted version of its columns. ORDER BY that matches the index is free; sorting differently means a filesort.",
          },
        ]}
      />

      <H2 id="clustered-vs-secondary">Clustered vs secondary indexes</H2>

      <KeyConcepts
        items={[
          {
            title: "Clustered (primary) index = the table",
            body: "InnoDB stores rows in primary-key order, in the leaves of the primary B+ tree. The 'table' and 'PK index' are physically the same structure.",
          },
          {
            title: "Secondary index leaf = (indexed cols, PK value)",
            body: "Each secondary leaf holds the indexed columns plus the primary-key value. To fetch other columns, MySQL has to look them up in the clustered index.",
          },
          {
            title: "Big PK = bigger every secondary",
            body: "A 16-byte UUID PK adds 16 bytes per row, per secondary index. On a table with five secondaries, that's 80 bytes/row of overhead.",
          },
          {
            title: "Auto-increment writes go to the rightmost page",
            body: "Sequential PKs append at the end of the tree. Random PKs (UUIDv4) cause page splits across the whole tree.",
          },
        ]}
      />

      <H2 id="bookmark-lookups">Bookmark lookups</H2>
      <p>
        When a secondary index doesn&apos;t have every column the query
        needs, InnoDB does a &ldquo;bookmark lookup&rdquo; — read the
        index leaf, get the PK, jump back to the clustered index for
        the rest of the columns. One extra random read per matching row.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Index on (status). Query needs status + amount.
SELECT amount FROM orders WHERE status = 'paid';

-- Plan: walk the (status) index leaves to find matching rows,
-- then for each matching PK, fetch the row from the clustered index.

-- Covering index on (status, amount) — no bookmark lookup.
CREATE INDEX idx_orders_status_amount ON orders (status, amount);
-- 'Extra: Using index' means the query was answered entirely from the index.`}
      />

      <Callout variant="pro" title="When to cover, when not">
        Covering helps most when the query returns many rows from a
        small set of columns. Don&apos;t cover everything — wider
        indexes are slower to write and bigger to keep in cache.
      </Callout>

      <H2 id="the-buffer-pool">The buffer pool</H2>
      <p>
        The buffer pool is InnoDB&apos;s in-memory cache of pages. Reads
        check it first; misses pull from disk and evict the
        least-recently-used page. Writes go to the pool, marked dirty,
        flushed to disk asynchronously (with the redo log handling
        crash safety).
      </p>

      <KeyConcepts
        items={[
          {
            title: "innodb_buffer_pool_size",
            body: "The single most important InnoDB knob. 50–75% of system RAM on a dedicated database. Bigger pool = more pages cached = fewer disk reads.",
          },
          {
            title: "Working set",
            body: "If the hot pages of all your indexes fit in the pool, queries hit RAM. If not, you're disk-bound — buy more RAM or rethink your indexes.",
          },
          {
            title: "Cold cache",
            body: "After a restart, the pool is empty. The first hour is slower than steady state. Some tools dump and reload the pool to mitigate.",
          },
          {
            title: "Bigger isn't always better for writes",
            body: "Larger pool = more dirty pages = bigger flush spikes. innodb_io_capacity / innodb_max_dirty_pages_pct tune the smoothness.",
          },
        ]}
      />

      <H2 id="page-splits-and-fillfactor">Page splits and fill factor</H2>
      <p>
        When a row gets inserted into a full leaf page, InnoDB splits
        the page in half and creates a new one. Fast in isolation;
        catastrophic when it happens to thousands of pages at once.
      </p>

      <KeyConcepts
        items={[
          {
            title: "Sequential PKs avoid splits",
            body: "AUTO_INCREMENT inserts at the end. Pages fill in order. No splits in the middle of the tree.",
          },
          {
            title: "Random PKs cause splits everywhere",
            body: "UUIDv4 puts new rows in random pages. Each insert may split a different page. Index size bloats, write throughput drops.",
          },
          {
            title: "UUIDv7 — sequential UUIDs",
            body: "Time-prefixed UUIDs (v7, ULID) give you UUIDs that insert sequentially. Best of both worlds: globally unique + sequential layout.",
          },
          {
            title: "OPTIMIZE TABLE to reclaim",
            body: "Rebuilds a fragmented table into tightly-packed pages. Expensive; schedule for low traffic. InnoDB 8.0 does most of this online.",
          },
        ]}
      />

      <H2 id="index-condition-pushdown">Index condition pushdown (ICP)</H2>
      <p>
        When a multi-column index can&apos;t fully serve the
        predicate, ICP lets MySQL evaluate the parts it{" "}
        <em>can</em> on the index pages — before fetching the full row.
        Reduces bookmark lookups dramatically.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Index on (last_name, first_name)
SELECT * FROM people
WHERE  last_name = 'Schwartz'
  AND  first_name LIKE 'E%';

-- Without ICP: walk last_name = 'Schwartz', fetch each row, then filter.
-- With ICP: walk last_name = 'Schwartz', filter first_name on the index page,
--           only fetch rows that pass both predicates.`}
      />

      <p>
        ICP is on by default. <code>EXPLAIN</code> shows{" "}
        <code>Using index condition</code> in the Extra column.
      </p>

      <Recap
        items={[
          "InnoDB indexes are B+ trees with 16 KB pages and linked leaves.",
          "Primary index is the table itself; secondaries store (cols, PK).",
          "Bookmark lookups cost one extra random read per row — covering indexes skip them.",
          "Buffer pool is the cache; size it to fit your working set.",
          "Sequential PKs (auto-inc, UUIDv7) avoid page splits; UUIDv4 punishes the tree.",
          "Index condition pushdown filters on index pages before fetching rows.",
        ]}
      />
    </>
  ),
};
