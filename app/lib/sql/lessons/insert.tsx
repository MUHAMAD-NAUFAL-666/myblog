import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "insert",
  number: "06.01",
  title: "INSERT — writing rows",
  description:
    "Single rows, batches, INSERT ... SELECT, RETURNING (sort of), and the gotchas around AUTO_INCREMENT and replication.",
  duration: "12 min",
  tags: ["insert", "auto-increment", "batch"],
  headings: [
    { id: "the-three-shapes", text: "The three shapes of INSERT", depth: 2 },
    { id: "single-row-inserts", text: "Single-row inserts", depth: 2 },
    { id: "multi-row-inserts", text: "Multi-row inserts", depth: 2 },
    { id: "insert-select", text: "INSERT ... SELECT", depth: 2 },
    { id: "auto-increment", text: "AUTO_INCREMENT and last_insert_id", depth: 2 },
    { id: "ignore-and-replace", text: "INSERT IGNORE and REPLACE", depth: 2 },
    { id: "common-mistakes", text: "Common mistakes", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        <code>INSERT</code> is one keyword and three different patterns:
        single rows, batches, and result-set copies. The shape you pick
        affects throughput, locking, and how AUTO_INCREMENT behaves.
      </p>

      <Prerequisites
        items={[
          "DDL from chapter 5 — you can CREATE the tables you'll insert into.",
          "Constraints from lesson 5.3 — you understand what UNIQUE / FK enforce.",
          "MySQL playground; an InnoDB table with an AUTO_INCREMENT primary key.",
        ]}
      />

      <H2 id="the-three-shapes">The three shapes of INSERT</H2>

      <KeyConcepts
        items={[
          {
            title: "VALUES — literal rows",
            body: "INSERT INTO t (col1, col2) VALUES (...). The default for app-level writes.",
          },
          {
            title: "SELECT — copy from another query",
            body: "INSERT INTO t (col1, col2) SELECT a, b FROM other. Bulk loads, ETL, materializing reports.",
          },
          {
            title: "SET — single-row alternative syntax",
            body: "INSERT INTO t SET col1 = 'a', col2 = 'b'. MySQL-specific, reads like UPDATE. Same plan as VALUES.",
          },
          {
            title: "DEFAULT VALUES",
            body: "INSERT INTO t () VALUES (). Empty insert; every column takes its default. Useful for placeholder rows.",
          },
        ]}
      />

      <H2 id="single-row-inserts">Single-row inserts</H2>

      <CodeBlock
        language="sql"
        code={`INSERT INTO users (email, name, country)
VALUES ('newuser@ex.com', 'New Name', 'ID');

-- Omitted columns take DEFAULT (or NULL where allowed).
INSERT INTO orders (user_id, amount, status)
VALUES (1, 49.00, 'paid');`}
      />

      <Callout variant="tip" title="Always list columns explicitly">
        <code>INSERT INTO t VALUES (...)</code> without a column list
        depends on column order. Add a column tomorrow and every insert
        breaks. List columns explicitly — it&apos;s slightly more typing,
        infinitely more stable.
      </Callout>

      <H2 id="multi-row-inserts">Multi-row inserts</H2>
      <p>
        Multiple <code>VALUES</code> tuples in one statement. Faster than
        N separate inserts because each row reuses the parsing, planning,
        and binlog overhead.
      </p>

      <CodeBlock
        language="sql"
        code={`INSERT INTO orders (user_id, amount, status) VALUES
  (1, 49.00,  'paid'),
  (1, 19.00,  'paid'),
  (2, 129.00, 'pending'),
  (3, 79.00,  'paid');`}
      />

      <KeyConcepts
        items={[
          {
            title: "Batch size sweet spot",
            body: "100–1000 rows per statement is usually optimal. Above that, max_allowed_packet and binlog size become factors.",
          },
          {
            title: "Single transaction",
            body: "All rows succeed or all fail. With single-row inserts in autocommit, you'd get partial state on errors.",
          },
          {
            title: "innodb_autoinc_lock_mode = 2",
            body: "Default since MySQL 8. Multiple inserts can interleave AUTO_INCREMENT values without blocking each other. Earlier versions serialize.",
          },
          {
            title: "Bulk load: LOAD DATA INFILE",
            body: "For 100k+ rows from a file, LOAD DATA INFILE beats any INSERT pattern — it parses CSV-style data and bypasses the SQL layer.",
          },
        ]}
      />

      <H2 id="insert-select">INSERT ... SELECT</H2>

      <CodeBlock
        language="sql"
        code={`-- Materialize a daily summary from orders.
INSERT INTO orders_daily_summary (day, country, revenue, order_count)
SELECT DATE(o.created_at)  AS day,
       u.country,
       SUM(o.amount)       AS revenue,
       COUNT(*)            AS order_count
FROM   orders o
JOIN   users  u ON u.id = o.user_id
WHERE  o.status = 'paid'
GROUP  BY day, u.country;`}
      />

      <Callout variant="warn" title="INSERT ... SELECT can lock the source">
        With the default <code>READ COMMITTED</code> or{" "}
        <code>REPEATABLE READ</code>, an{" "}
        <code>INSERT ... SELECT</code> can hold a long-lived shared
        lock on the source table. For large copies, run in batches with
        a primary-key range, or use{" "}
        <code>SET TRANSACTION ISOLATION LEVEL READ COMMITTED</code> and
        chunk the work.
      </Callout>

      <H2 id="auto-increment">AUTO_INCREMENT and last_insert_id</H2>

      <CodeBlock
        language="sql"
        code={`INSERT INTO users (email, name, country)
VALUES ('alex@ex.com', 'Alex', 'GB');

-- The ID just generated by your session.
SELECT LAST_INSERT_ID();   -- e.g. 7

-- Multi-row insert: returns the FIRST id.
INSERT INTO users (email, name, country) VALUES
  ('a@ex.com','A','US'),
  ('b@ex.com','B','US'),
  ('c@ex.com','C','US');
SELECT LAST_INSERT_ID();   -- e.g. 8 — the others are 9, 10`}
      />

      <KeyConcepts
        items={[
          {
            title: "Per-session, per-statement",
            body: "LAST_INSERT_ID() is scoped to your connection. Concurrent inserts in other sessions don't change yours.",
          },
          {
            title: "MySQL has no RETURNING",
            body: "Postgres has INSERT ... RETURNING. MySQL doesn't (yet). Use LAST_INSERT_ID() and a follow-up SELECT, or rely on the application driver to read it back.",
          },
          {
            title: "Restart resets the counter — kind of",
            body: "Until 8.0, AUTO_INCREMENT counter was in-memory and reset to 'max(id) + 1' on restart. 8.0 persists it. ID gaps from rollbacks are still normal.",
          },
          {
            title: "Don't expose AUTO_INCREMENT to users",
            body: "Sequential IDs are guessable and leak counts. For public URLs, use UUIDs or short random codes alongside the integer PK.",
          },
        ]}
      />

      <H2 id="ignore-and-replace">INSERT IGNORE and REPLACE</H2>

      <CodeBlock
        language="sql"
        code={`-- Skip the row instead of failing on duplicate key / FK violation.
INSERT IGNORE INTO users (id, email) VALUES (1, 'ana@ex.com');

-- Delete the conflicting row, then insert. AUTO_INCREMENT may bump.
REPLACE INTO users (id, email) VALUES (1, 'ana-renamed@ex.com');`}
      />

      <Callout variant="warn" title="Both have surprises">
        <code>INSERT IGNORE</code> swallows <em>all</em> errors, not just
        duplicates — typos in column names, FK violations, NULL into NOT
        NULL. <code>REPLACE</code> deletes-then-inserts, which fires{" "}
        <code>ON DELETE CASCADE</code> and skips{" "}
        <code>updated_at</code> semantics. For deliberate upserts, use
        <code> INSERT ... ON DUPLICATE KEY UPDATE</code> — covered in
        lesson 6.3.
      </Callout>

      <H2 id="common-mistakes">Common mistakes</H2>

      <KeyConcepts
        items={[
          {
            title: "INSERT without a column list",
            body: "Schema evolution silently breaks the insert. Always name the columns.",
          },
          {
            title: "Mismatched value count",
            body: "MySQL: 'Column count doesn't match value count'. Reading the error tells you which row in the batch is wrong.",
          },
          {
            title: "Ignoring duplicate-key errors with IGNORE",
            body: "If you actually meant 'update if exists', use ON DUPLICATE KEY UPDATE. IGNORE silently drops data.",
          },
          {
            title: "Inserting into AUTO_INCREMENT manually",
            body: "INSERT INTO users (id, ...) VALUES (1000, ...) works but bumps the counter. Mixing manual and auto IDs in the same table leads to gaps and surprises.",
          },
          {
            title: "Huge batches = huge transactions",
            body: "Inserting 10M rows in one statement holds a transaction long enough to bloat undo logs. Chunk it.",
          },
        ]}
      />

      <Recap
        items={[
          "Three shapes: VALUES, SELECT, SET — list columns explicitly in all of them.",
          "Multi-row inserts amortize parsing, planning, and binlog overhead.",
          "LAST_INSERT_ID() is per-session and returns the FIRST id of a multi-row batch.",
          "INSERT IGNORE swallows errors broadly; REPLACE deletes first. Prefer ON DUPLICATE KEY UPDATE.",
          "Big loads: chunk the work, or use LOAD DATA INFILE for files.",
        ]}
      />
    </>
  ),
};
