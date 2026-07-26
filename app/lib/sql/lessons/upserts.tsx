import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "upserts",
  number: "06.03",
  title: "Upserts — INSERT ... ON DUPLICATE KEY UPDATE",
  description:
    "Insert a row if it doesn't exist, update it if it does. The MySQL idiom for idempotent writes — and the gotchas that bite once a quarter.",
  duration: "10 min",
  tags: ["upsert", "on-duplicate-key", "idempotency"],
  headings: [
    { id: "the-problem", text: "The problem", depth: 2 },
    { id: "on-duplicate-key-update", text: "INSERT ... ON DUPLICATE KEY UPDATE", depth: 2 },
    { id: "values-and-aliases", text: "VALUES() and the new alias syntax", depth: 2 },
    { id: "batch-upserts", text: "Batch upserts", depth: 2 },
    { id: "alternatives", text: "Alternatives: REPLACE, INSERT IGNORE, MERGE", depth: 2 },
    { id: "gotchas", text: "Gotchas", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        An upsert is &ldquo;insert if missing, update if present.&rdquo;
        It&apos;s how you write idempotent ingestion pipelines, dedupe
        external feeds, and avoid race-condition bugs around{" "}
        <code>SELECT</code>-then-<code>INSERT</code>.
      </p>

      <Prerequisites
        items={[
          "INSERT from lesson 6.1.",
          "UNIQUE constraints from lesson 5.3 — upserts hinge on them.",
          "Awareness that 'check if exists, then insert' is broken under concurrency.",
        ]}
      />

      <H2 id="the-problem">The problem</H2>
      <p>
        The naive approach has a race condition:
      </p>

      <CodeBlock
        language="sql"
        code={`-- ❌ Not safe under concurrency.
SELECT id FROM users WHERE email = 'ana@ex.com';
-- (zero rows)
INSERT INTO users (email, name) VALUES ('ana@ex.com', 'Ana');

-- Two threads run the SELECT, both see zero rows, both INSERT.
-- One throws 'Duplicate entry' — only because of the UNIQUE constraint.
-- Without it, you'd silently have two rows.`}
      />

      <p>
        The fix is to push the &ldquo;does it exist?&rdquo; check into
        the database in a single statement.
      </p>

      <H2 id="on-duplicate-key-update">INSERT ... ON DUPLICATE KEY UPDATE</H2>

      <CodeBlock
        language="sql"
        filename="upsert.sql"
        code={`INSERT INTO users (email, name, country)
VALUES ('ana@ex.com', 'Ana Lopez', 'ES')
ON DUPLICATE KEY UPDATE
  name    = VALUES(name),
  country = VALUES(country),
  updated_at = CURRENT_TIMESTAMP(6);`}
      />

      <KeyConcepts
        items={[
          {
            title: "Triggered by any unique conflict",
            body: "PRIMARY KEY or any UNIQUE index. If the row matches multiple uniques, MySQL updates the first one it found and you get... interesting results.",
          },
          {
            title: "Atomic",
            body: "One statement, one round-trip, one write lock. No race condition. No client-side retry loop.",
          },
          {
            title: "VALUES(col) refers to the proposed insert value",
            body: "Inside ON DUPLICATE KEY UPDATE, VALUES(name) gives the value you'd have inserted. Reads naturally — 'set name to whatever I tried to insert'.",
          },
          {
            title: "Returns affected rows count",
            body: "1 for an insert, 2 for an update (yes, 2 — historical reason). 0 if no actual change. Useful for distinguishing the two outcomes.",
          },
        ]}
      />

      <H2 id="values-and-aliases">VALUES() and the new alias syntax</H2>
      <p>
        <code>VALUES(col)</code> works everywhere from MySQL 5.7+ but
        was deprecated in 8.0.20. The replacement is the row alias
        syntax — clearer, and recommended for new code.
      </p>

      <CodeBlock
        language="sql"
        code={`-- 8.0.20+ — alias the new row, then reference its columns.
INSERT INTO users (email, name, country)
VALUES ('ana@ex.com', 'Ana Lopez', 'ES') AS new_row
ON DUPLICATE KEY UPDATE
  name    = new_row.name,
  country = new_row.country,
  updated_at = CURRENT_TIMESTAMP(6);

-- You can alias columns individually too.
INSERT INTO users (email, name, country)
VALUES ('ana@ex.com', 'Ana Lopez', 'ES') AS new_row (e, n, c)
ON DUPLICATE KEY UPDATE name = n, country = c;`}
      />

      <Callout variant="info" title="Why the change">
        <code>VALUES(col)</code> is ambiguous in some grammar contexts
        with the table-value-constructor form{" "}
        <code>VALUES ROW(...), ROW(...)</code>. The new alias is
        explicit and cleaner.
      </Callout>

      <H2 id="batch-upserts">Batch upserts</H2>

      <CodeBlock
        language="sql"
        code={`INSERT INTO inventory (sku, qty) VALUES
  ('SKU-001', 10),
  ('SKU-002', 5),
  ('SKU-003', 0)
AS new_row
ON DUPLICATE KEY UPDATE
  qty = new_row.qty;`}
      />

      <p>
        For most ingestion pipelines this is the workhorse: 1000 rows
        per statement, runs in O(rows × log N) per index, idempotent if
        re-run.
      </p>

      <Callout variant="pro" title="Increment counters atomically">
        <CodeBlock
          language="sql"
          code={`-- Page-view counter, race-free.
INSERT INTO page_views (page_id, views) VALUES (?, 1)
AS new_row
ON DUPLICATE KEY UPDATE views = views + 1;`}
        />
        Reads and writes the running total in a single atomic step. No
        application-level locking required.
      </Callout>

      <H2 id="alternatives">Alternatives: REPLACE, INSERT IGNORE, MERGE</H2>

      <KeyConcepts
        items={[
          {
            title: "REPLACE INTO — almost always wrong",
            body: "Deletes the conflicting row, then inserts. Fires ON DELETE CASCADE, breaks foreign key chains, and bumps AUTO_INCREMENT. Almost never what you want.",
          },
          {
            title: "INSERT IGNORE — for 'first writer wins'",
            body: "Skips inserts that conflict with a unique key. Useful for de-duplication when the existing row is good enough. Don't use it as a general upsert — it swallows other errors too.",
          },
          {
            title: "MERGE — not in MySQL",
            body: "The SQL standard's upsert. Postgres, Oracle, SQL Server have it. MySQL doesn't, and likely won't — INSERT ... ON DUPLICATE KEY UPDATE covers the use cases.",
          },
          {
            title: "INSERT ... SELECT ... ON DUPLICATE KEY UPDATE",
            body: "Yes, you can combine. Useful for ETL: copy from a staging table, upsert into the canonical one.",
          },
        ]}
      />

      <H2 id="gotchas">Gotchas</H2>

      <KeyConcepts
        items={[
          {
            title: "AUTO_INCREMENT bumps on every attempted INSERT",
            body: "Even when ON DUPLICATE KEY UPDATE turns into an UPDATE, the AUTO_INCREMENT counter increments. Heavy upsert workloads exhaust BIGINT slowly but produce visible gaps in IDs.",
          },
          {
            title: "Multiple UNIQUE indexes",
            body: "If two unique constraints both conflict, MySQL picks one and updates it — not both. Result: subtle data corruption. Avoid having multiple uniques you'd want to upsert against.",
          },
          {
            title: "Trigger semantics",
            body: "Both BEFORE INSERT and BEFORE UPDATE triggers fire (in that order, when it becomes an UPDATE). Likewise AFTER. Keep trigger logic minimal.",
          },
          {
            title: "Replication & binlog row format",
            body: "ROW-based replication logs the actual UPDATE on replicas — same outcome. STATEMENT-based replication can desync if the trigger order matters. Default ROW since 8.0.",
          },
          {
            title: "AUTO_INCREMENT lock contention",
            body: "On heavy upsert workloads, innodb_autoinc_lock_mode = 2 (default in 8.0) is essential. Earlier modes serialize inserts.",
          },
        ]}
      />

      <Recap
        items={[
          "INSERT ... ON DUPLICATE KEY UPDATE is the MySQL idiom for atomic upserts.",
          "Triggered by ANY unique conflict — design with one canonical unique constraint per table.",
          "Use the row-alias syntax (8.0.20+); VALUES(col) still works but is deprecated.",
          "Avoid REPLACE — it deletes-then-inserts and breaks FK semantics.",
          "AUTO_INCREMENT bumps even on the UPDATE path — gaps in IDs are normal.",
        ]}
      />
    </>
  ),
};
