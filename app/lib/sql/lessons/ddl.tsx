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
  slug: "ddl",
  number: "05.02",
  title: "CREATE, ALTER, DROP — DDL",
  description:
    "Designing tables, evolving schemas safely, and the operations that hold a write lock long enough to break a deploy.",
  duration: "14 min",
  tags: ["ddl", "alter", "schema-migration"],
  headings: [
    { id: "ddl-vs-dml", text: "DDL vs DML", depth: 2 },
    { id: "create-table", text: "CREATE TABLE — the structure", depth: 2 },
    { id: "alter-table", text: "ALTER TABLE — evolving safely", depth: 2 },
    { id: "online-ddl", text: "Online DDL in MySQL 8", depth: 2 },
    { id: "drop-and-truncate", text: "DROP and TRUNCATE", depth: 2 },
    { id: "schema-migrations", text: "Schema migrations in practice", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        DDL (Data Definition Language) is how you declare what your data
        looks like — <code>CREATE</code>, <code>ALTER</code>,{" "}
        <code>DROP</code>. The keywords are easy. The discipline around
        running them in a live system is what separates senior from
        junior.
      </p>

      <Prerequisites
        items={[
          "Data types from lesson 5.1.",
          "MySQL 8 playground container running.",
          "Awareness that 'just add a column' has bitten everyone at least once.",
        ]}
      />

      <H2 id="ddl-vs-dml">DDL vs DML</H2>

      <KeyConcepts
        items={[
          {
            title: "DDL — structure",
            body: "CREATE, ALTER, DROP, TRUNCATE, RENAME. Changes the schema. Most variants commit implicitly — they can't be rolled back inside a transaction.",
          },
          {
            title: "DML — data",
            body: "INSERT, UPDATE, DELETE. Lives inside transactions. Covered in chapter 6.",
          },
          {
            title: "DCL — access",
            body: "GRANT, REVOKE. Manage users and privileges. Covered in chapter 9.",
          },
          {
            title: "TCL — transactions",
            body: "BEGIN, COMMIT, ROLLBACK, SAVEPOINT. The control plane around DML.",
          },
        ]}
      />

      <Callout variant="warn" title="DDL is not transactional in MySQL">
        Unlike Postgres, MySQL implicitly <code>COMMIT</code>s before
        and after every DDL statement. You can&apos;t wrap a migration
        in <code>BEGIN/ROLLBACK</code>. Plan your migrations to be
        safe at every step.
      </Callout>

      <H2 id="create-table">CREATE TABLE — the structure</H2>

      <CodeBlock
        language="sql"
        filename="create.sql"
        code={`CREATE TABLE products (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  sku          VARCHAR(64)  NOT NULL,
  name         VARCHAR(200) NOT NULL,
  price_cents  BIGINT UNSIGNED NOT NULL,
  category_id  INT UNSIGNED NULL,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  metadata     JSON         NULL,
  created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                              ON UPDATE CURRENT_TIMESTAMP(6),

  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_category  (category_id),
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`}
      />

      <KeyConcepts
        items={[
          {
            title: "ENGINE=InnoDB",
            body: "Default since 5.5. Transactional, row-locking, foreign-key-aware. Don't pick MyISAM in 2024+.",
          },
          {
            title: "CHARSET / COLLATE",
            body: "utf8mb4 for the character set, utf8mb4_0900_ai_ci for case-insensitive accent-insensitive comparison. Set at the database level so you don't have to repeat per table.",
          },
          {
            title: "PRIMARY KEY first",
            body: "InnoDB stores rows clustered by primary key. Auto-increment integers pack densely; UUIDs need careful handling.",
          },
          {
            title: "NOT NULL DEFAULT '...'",
            body: "Columns are NULL-able by default. Make them NOT NULL whenever the value should always exist. Cheap correctness.",
          },
        ]}
      />

      <H2 id="alter-table">ALTER TABLE — evolving safely</H2>

      <CodeBlock
        language="sql"
        code={`-- Add a column.
ALTER TABLE products
  ADD COLUMN brand VARCHAR(100) NOT NULL DEFAULT '';

-- Rename a column (8.0+).
ALTER TABLE products
  RENAME COLUMN price_cents TO price_minor_units;

-- Change the type — read the manual first.
ALTER TABLE products
  MODIFY COLUMN brand VARCHAR(150) NOT NULL;

-- Drop a column.
ALTER TABLE products
  DROP COLUMN metadata;

-- Add an index.
ALTER TABLE products
  ADD INDEX idx_products_brand (brand);

-- Add a foreign key.
ALTER TABLE products
  ADD CONSTRAINT fk_products_brand
    FOREIGN KEY (brand_id) REFERENCES brands(id);`}
      />

      <Callout variant="pro" title="Combine related ALTERs">
        MySQL rewrites the table at most once per <code>ALTER TABLE</code>{" "}
        statement. Stack multiple changes:
        <CodeBlock
          language="sql"
          code={`ALTER TABLE products
  ADD COLUMN sku_suffix VARCHAR(8),
  MODIFY COLUMN name VARCHAR(255) NOT NULL,
  ADD INDEX idx_products_suffix (sku_suffix);`}
        />
      </Callout>

      <H2 id="online-ddl">Online DDL in MySQL 8</H2>
      <p>
        Online DDL means the alter happens without blocking writes (or
        with very short locks). Modern MySQL handles many alters online
        — but not all of them.
      </p>

      <KeyConcepts
        items={[
          {
            title: "Instant",
            body: "ADD COLUMN at the end (8.0.12+), DROP COLUMN (8.0.29+), RENAME COLUMN. Metadata-only — milliseconds.",
          },
          {
            title: "In-place, online",
            body: "ADD INDEX (non-unique), CHANGE column position, ADD/DROP foreign key. Concurrent reads and writes allowed; brief lock at start/end.",
          },
          {
            title: "In-place, locking",
            body: "Changing column type to a smaller size, ADD UNIQUE INDEX. Reads allowed, writes blocked.",
          },
          {
            title: "COPY (the slow one)",
            body: "Some changes still rebuild the table — converting between charsets, certain MODIFY COLUMNs. Schedule for a low-traffic window.",
          },
        ]}
      />

      <CodeBlock
        language="sql"
        code={`-- Tell MySQL exactly which strategy you want.
ALTER TABLE products
  ADD COLUMN flag TINYINT(1) NOT NULL DEFAULT 0,
  ALGORITHM=INSTANT,
  LOCK=NONE;`}
      />

      <Callout variant="warn" title="Always specify ALGORITHM and LOCK">
        Without these hints, MySQL picks the &ldquo;best available&rdquo;
        strategy — which can silently fall back to a copy on
        production-sized tables. Specifying both makes the statement
        fail loudly when your assumption is wrong, instead of running
        for two hours.
      </Callout>

      <H2 id="drop-and-truncate">DROP and TRUNCATE</H2>

      <Steps>
        <Step
          title="DROP TABLE — delete the table itself"
          summary="Schema and data, gone. Foreign keys referencing it must be dropped first."
        >
          <CodeBlock
            language="sql"
            code={`DROP TABLE products;
DROP TABLE IF EXISTS products;       -- no error if absent`}
          />
        </Step>

        <Step
          title="TRUNCATE — empty the table fast"
          summary="Logically equivalent to DELETE FROM but implemented as a table recreation."
        >
          <CodeBlock
            language="sql"
            code={`TRUNCATE TABLE products;`}
          />
          <ul>
            <li>Resets <code>AUTO_INCREMENT</code> to 1.</li>
            <li>Cannot be rolled back — DDL, remember.</li>
            <li>Bypasses triggers.</li>
            <li>Fails if other tables have foreign keys pointing at it.</li>
          </ul>
        </Step>

        <Step
          title="DELETE FROM — slower but safer"
          summary="Stays inside the transaction. Triggers fire. AUTO_INCREMENT preserved."
        >
          <CodeBlock
            language="sql"
            code={`BEGIN;
DELETE FROM products;
-- look around, change your mind
ROLLBACK;`}
          />
        </Step>
      </Steps>

      <H2 id="schema-migrations">Schema migrations in practice</H2>
      <p>
        At any non-trivial scale, applications and schemas deploy on
        different cadences. The schema must work for the{" "}
        <em>current</em> code <em>and</em> the next deploy.
      </p>

      <KeyConcepts
        items={[
          {
            title: "Backward-compatible adds",
            body: "Add the new column with a default. Deploy code that writes both old and new. Backfill. Switch reads. Drop the old column. Three deploys, never broken.",
          },
          {
            title: "Never rename in one step",
            body: "Add a new column. Mirror writes. Backfill. Switch reads. Drop the old. Same five steps as above. Pretend RENAME doesn't exist on shared tables.",
          },
          {
            title: "Migrations as code",
            body: "Use a tool — Liquibase, Flyway, Rails, Django, gh-ost, pt-online-schema-change. Hand-running ALTERs in production is how outages happen.",
          },
          {
            title: "Test on a snapshot",
            body: "Before any non-trivial ALTER, run it on a recent prod snapshot to time it. 'It took 2ms in dev' tells you nothing about a 200M-row table.",
          },
        ]}
      />

      <Recap
        items={[
          "DDL changes structure; commits implicitly in MySQL.",
          "CREATE TABLE: define types, primary key, indexes, foreign keys, charset — all in one statement.",
          "ALTER TABLE rewrites less than you'd think in MySQL 8 — but specify ALGORITHM and LOCK to be sure.",
          "DROP and TRUNCATE are not undoable. DELETE is, inside a transaction.",
          "Treat schema migrations as a multi-deploy choreography, not a single command.",
        ]}
      />
    </>
  ),
};
