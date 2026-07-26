import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "update-delete",
  number: "06.02",
  title: "UPDATE and DELETE — changing rows safely",
  description:
    "WHERE clauses that match exactly what you mean, multi-table updates, soft deletes, and the safety net every senior engineer uses.",
  duration: "12 min",
  tags: ["update", "delete", "data-safety"],
  headings: [
    { id: "the-ritual", text: "The 'verify-then-execute' ritual", depth: 2 },
    { id: "update-basics", text: "UPDATE — the basics", depth: 2 },
    { id: "multi-table-updates", text: "Multi-table UPDATE / DELETE", depth: 2 },
    { id: "delete-basics", text: "DELETE — the basics", depth: 2 },
    { id: "soft-deletes", text: "Soft deletes", depth: 2 },
    { id: "limit-and-batching", text: "LIMIT and batching", depth: 2 },
    { id: "common-mistakes", text: "Common mistakes", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        <code>UPDATE</code> and <code>DELETE</code> are the easiest
        statements to get catastrophically wrong. The same{" "}
        <code>WHERE</code> that selects the right rows in a{" "}
        <code>SELECT</code> deletes them in a{" "}
        <code>DELETE</code> — and a missing predicate hits every row.
        This lesson is about the habits that prevent that.
      </p>

      <Prerequisites
        items={[
          "WHERE clauses from lesson 2.2.",
          "Joins from lesson 3.1 — multi-table UPDATE / DELETE leans on them.",
          "Transactions from lesson 6.4 — fold these into BEGIN / ROLLBACK.",
        ]}
      />

      <H2 id="the-ritual">The &lsquo;verify-then-execute&rsquo; ritual</H2>
      <p>
        The single best habit you&apos;ll ever build: write the{" "}
        <code>SELECT</code> first, then turn it into the{" "}
        <code>UPDATE</code>/<code>DELETE</code>.
      </p>

      <CodeBlock
        language="sql"
        code={`-- 1. Verify which rows match. Read the count and a sample.
SELECT id, email, name FROM users WHERE country = 'UK';
-- expected: 0 rows. (We use 'GB', not 'UK'.)

-- 2. Only after the SELECT looks right, run the destructive version.
UPDATE users SET country = 'GB' WHERE country = 'UK';`}
      />

      <Callout variant="pro" title="sql_safe_updates">
        <code>SET sql_safe_updates = 1</code> tells MySQL to refuse{" "}
        <code>UPDATE</code> and <code>DELETE</code> without a{" "}
        <code>WHERE</code> on a key column or a <code>LIMIT</code>. Add
        it to your <code>~/.my.cnf</code> in the <code>[mysql]</code>{" "}
        section. The first time it saves you, it pays for the
        five-second annoyance for the rest of your career.
      </Callout>

      <H2 id="update-basics">UPDATE — the basics</H2>

      <CodeBlock
        language="sql"
        code={`-- Single column.
UPDATE users SET country = 'ID' WHERE id = 7;

-- Multiple columns, expression-based.
UPDATE orders
SET    amount = amount * 1.10,           -- raise by 10%
       updated_at = CURRENT_TIMESTAMP(6)
WHERE  status = 'pending';

-- Conditional update with CASE.
UPDATE orders
SET    status = CASE
                  WHEN created_at < '2024-01-01' THEN 'archived'
                  ELSE status
                END;`}
      />

      <Callout variant="warn" title="No FROM clause in UPDATE">
        Postgres has <code>UPDATE ... FROM other_table</code>. MySQL
        uses the multi-table syntax (next section) instead. Don&apos;t
        copy-paste Postgres examples blindly.
      </Callout>

      <H2 id="multi-table-updates">Multi-table UPDATE / DELETE</H2>
      <p>
        MySQL extends both with join syntax — useful when the predicate
        depends on another table.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Sync orders.country from users.country.
UPDATE orders o
JOIN   users  u ON u.id = o.user_id
SET    o.country = u.country
WHERE  o.country IS NULL;

-- Multi-table DELETE — note WHICH table to delete from.
DELETE o
FROM   orders o
JOIN   users  u ON u.id = o.user_id
WHERE  u.is_test = 1;

-- Delete from BOTH tables in one statement.
DELETE u, o
FROM   users  u
JOIN   orders o ON o.user_id = u.id
WHERE  u.is_test = 1;`}
      />

      <H2 id="delete-basics">DELETE — the basics</H2>

      <CodeBlock
        language="sql"
        code={`-- Single row by primary key. The safest delete.
DELETE FROM orders WHERE id = 42;

-- Range delete.
DELETE FROM orders
WHERE  status = 'refunded'
  AND  created_at < '2023-01-01';

-- Delete EVERY row. Don't run unless you mean it.
DELETE FROM staging_imports;`}
      />

      <Callout variant="warn" title="DELETE vs TRUNCATE">
        Emptying a whole table? <code>TRUNCATE TABLE</code> is faster but
        DDL — implicit commit, can&apos;t roll back, resets
        AUTO_INCREMENT, fires no triggers, fails on FK references.{" "}
        <code>DELETE</code> is slower but reversible inside a
        transaction. Pick deliberately.
      </Callout>

      <H2 id="soft-deletes">Soft deletes</H2>
      <p>
        Many production systems never run <code>DELETE</code> at all.
        They flip a column instead.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Add the column once.
ALTER TABLE users
  ADD COLUMN deleted_at DATETIME(6) NULL,
  ADD INDEX  idx_users_deleted_at (deleted_at);

-- "Delete" by stamping.
UPDATE users SET deleted_at = NOW(6) WHERE id = 7;

-- Every read filters it out — usually via a view or repository helper.
SELECT * FROM users WHERE deleted_at IS NULL;`}
      />

      <KeyConcepts
        items={[
          {
            title: "Pro: undo + audit",
            body: "Mistakes recover with one UPDATE. The deleted row stays available for reporting and forensics.",
          },
          {
            title: "Pro: foreign keys keep working",
            body: "Existing FKs to a soft-deleted row don't break. Hard deletes force you to choose CASCADE or SET NULL upstream.",
          },
          {
            title: "Con: every query needs the predicate",
            body: "Forget WHERE deleted_at IS NULL once and the bug ships. Use a view, ORM scope, or repository pattern to enforce it.",
          },
          {
            title: "Con: privacy laws",
            body: "GDPR / CCPA right-to-erasure may require true deletion. Plan for both: soft-delete by default, hard-delete on request.",
          },
        ]}
      />

      <H2 id="limit-and-batching">LIMIT and batching</H2>
      <p>
        A 100M-row UPDATE locks rows for the duration. Break it into
        chunks to keep the transaction short and the lock surface
        small.
      </p>

      <CodeBlock
        language="sql"
        filename="batched-update.sql"
        code={`-- Loop in your driver / ORM until 0 rows are affected.
UPDATE orders
SET    archived = 1
WHERE  archived = 0
  AND  created_at < '2023-01-01'
LIMIT  10000;`}
      />

      <Callout variant="info" title="UPDATE/DELETE with ORDER BY + LIMIT">
        MySQL allows <code>UPDATE ... ORDER BY id LIMIT N</code> — it
        operates on the first N rows in primary-key order. Combined
        with a chunked loop, it&apos;s the safest way to back-fill or
        clean up huge tables without a maintenance window.
      </Callout>

      <H2 id="common-mistakes">Common mistakes</H2>

      <KeyConcepts
        items={[
          {
            title: "WHERE on the wrong column",
            body: "DELETE FROM orders WHERE status = 'paid' was supposed to be 'refunded'. Run the SELECT first, every time.",
          },
          {
            title: "Forgetting the WHERE clause entirely",
            body: "DELETE FROM users; — you've now deleted every user. sql_safe_updates blocks this. Use it.",
          },
          {
            title: "Joins that multiply the row count",
            body: "UPDATE orders JOIN bad_join — if the join produces duplicates, the same row is updated multiple times. Verify with SELECT first.",
          },
          {
            title: "Forgetting updated_at",
            body: "Schemas with ON UPDATE CURRENT_TIMESTAMP get the freshness for free. Hand-managed updated_at gets stale fast.",
          },
          {
            title: "Trying to UPDATE a CTE",
            body: "MySQL 8 supports CTEs in SELECT, INSERT, UPDATE, DELETE — but the CTE itself is read-only. The outer DML is what mutates rows.",
          },
        ]}
      />

      <Recap
        items={[
          "Always SELECT first to verify the WHERE matches what you expect.",
          "Enable sql_safe_updates locally — it costs nothing, prevents disasters.",
          "Multi-table UPDATE / DELETE uses join syntax; mind which alias you DELETE.",
          "Soft deletes preserve history but require discipline on every read.",
          "Big mutations need batching — short transactions, narrow lock surface.",
        ]}
      />
    </>
  ),
};
