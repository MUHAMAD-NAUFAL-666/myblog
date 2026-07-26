import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "constraints",
  number: "05.03",
  title: "Constraints — making bad data impossible",
  description:
    "PRIMARY KEY, UNIQUE, FOREIGN KEY, NOT NULL, CHECK, DEFAULT — the schema-level guards that catch bugs before they reach production.",
  duration: "12 min",
  tags: ["constraints", "foreign-key", "check"],
  headings: [
    { id: "the-five-constraints", text: "The five constraints", depth: 2 },
    { id: "primary-key", text: "PRIMARY KEY", depth: 2 },
    { id: "unique", text: "UNIQUE", depth: 2 },
    { id: "foreign-key", text: "FOREIGN KEY", depth: 2 },
    { id: "not-null-default", text: "NOT NULL and DEFAULT", depth: 2 },
    { id: "check", text: "CHECK", depth: 2 },
    { id: "naming-and-deferring", text: "Naming and managing constraints", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Constraints are guardrails. They tell the database which states
        of the world are impossible — and the database refuses to enter
        those states. Every constraint you add is a class of bug your
        application no longer has to check for.
      </p>

      <Prerequisites
        items={[
          "DDL basics from lesson 5.2.",
          "InnoDB tables (the default in MySQL 8).",
          "An understanding that 'we'll validate in the app' is famous last words.",
        ]}
      />

      <H2 id="the-five-constraints">The five constraints</H2>

      <KeyConcepts
        items={[
          {
            title: "PRIMARY KEY",
            body: "One per table. Uniquely identifies a row. NOT NULL implied. InnoDB clusters storage on it.",
          },
          {
            title: "UNIQUE",
            body: "A value (or combination) appears at most once. NULL counts as 'unknown' — multiple NULLs are allowed.",
          },
          {
            title: "FOREIGN KEY",
            body: "References must point to a real row in another table. The database enforces it on every INSERT/UPDATE/DELETE.",
          },
          {
            title: "NOT NULL / DEFAULT",
            body: "Field-level: a column must have a value. DEFAULT supplies one when the INSERT omits it.",
          },
          {
            title: "CHECK",
            body: "An arbitrary boolean predicate that must be true for every row. Native in MySQL 8.0.16+.",
          },
        ]}
      />

      <H2 id="primary-key">PRIMARY KEY</H2>

      <CodeBlock
        language="sql"
        code={`-- Single-column, the common case.
CREATE TABLE users (
  id    BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(320) NOT NULL UNIQUE
);

-- Composite, when the natural key is two columns.
CREATE TABLE order_items (
  order_id   BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity   INT UNSIGNED NOT NULL,
  PRIMARY KEY (order_id, product_id)
);`}
      />

      <Callout variant="info" title="InnoDB clusters by primary key">
        Rows are stored in primary-key order on disk. Inserts at the end
        (auto-increment) are cheap; inserts in the middle (random UUIDs)
        cause page splits. Use UUIDv7 or sequential integers when write
        volume is high.
      </Callout>

      <H2 id="unique">UNIQUE</H2>

      <CodeBlock
        language="sql"
        code={`-- Single-column.
CREATE TABLE users (
  id    BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(320) NOT NULL,
  UNIQUE KEY uq_users_email (email)
);

-- Multi-column — uniqueness over the combination.
ALTER TABLE memberships
  ADD UNIQUE KEY uq_memberships_user_org (user_id, org_id);`}
      />

      <Callout variant="warn" title="UNIQUE and NULL are weird friends">
        SQL treats two NULLs as &ldquo;both unknown,&rdquo; so a UNIQUE
        column allows multiple NULL rows. If you want at most one NULL,
        use a CHECK or store a sentinel — or in MySQL 8.0.31+, declare
        a functional index on{" "}
        <code>COALESCE(col, sentinel)</code>.
      </Callout>

      <H2 id="foreign-key">FOREIGN KEY</H2>

      <CodeBlock
        language="sql"
        filename="orders-fk.sql"
        code={`CREATE TABLE orders (
  id        BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id   BIGINT UNSIGNED NOT NULL,
  amount    DECIMAL(10, 2) NOT NULL,
  status    ENUM('paid', 'pending', 'refunded') NOT NULL,

  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE=InnoDB;`}
      />

      <KeyConcepts
        items={[
          {
            title: "ON DELETE RESTRICT (default)",
            body: "Block the delete if any row references the parent. Safe default — forces you to deal with orphans deliberately.",
          },
          {
            title: "ON DELETE CASCADE",
            body: "Delete the children too. Convenient — and dangerous. Comments under a deleted post: yes. Orders under a deleted user: probably not.",
          },
          {
            title: "ON DELETE SET NULL",
            body: "Children keep their row but lose the link. Requires the FK column to be nullable.",
          },
          {
            title: "ON UPDATE CASCADE",
            body: "If the parent's PK changes, propagate. Useful when keys aren't immutable — but immutable keys are usually the better design.",
          },
        ]}
      />

      <Callout variant="pro" title="MyISAM ignores foreign keys">
        Foreign-key constraints only work in InnoDB. The MyISAM engine
        accepts the syntax and silently ignores it. Always confirm{" "}
        <code>ENGINE=InnoDB</code> on tables you care about.
      </Callout>

      <H2 id="not-null-default">NOT NULL and DEFAULT</H2>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE invoices (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  number      VARCHAR(20) NOT NULL,
  status      ENUM('draft','sent','paid') NOT NULL DEFAULT 'draft',
  amount      DECIMAL(10, 2) NOT NULL DEFAULT 0,
  notes       TEXT NULL,
  created_at  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);`}
      />

      <KeyConcepts
        items={[
          {
            title: "NOT NULL by default",
            body: "Make NOT NULL the default; only allow NULL when the column genuinely means 'unknown' or 'absent.' Three-valued logic causes more bugs than it fixes.",
          },
          {
            title: "Defaults document expected values",
            body: "DEFAULT 0, DEFAULT 'draft', DEFAULT CURRENT_TIMESTAMP — they're free contract with the application.",
          },
          {
            title: "Defaults can be expressions (8.0.13+)",
            body: "DEFAULT (UUID()) for surrogate keys, DEFAULT (JSON_OBJECT()) for empty JSON. Wrap in parentheses for non-literal defaults.",
          },
          {
            title: "ON UPDATE CURRENT_TIMESTAMP",
            body: "Maintenance-free updated_at. Works for TIMESTAMP and DATETIME. Use sparingly — bulk updates trigger it for every row.",
          },
        ]}
      />

      <H2 id="check">CHECK</H2>
      <p>
        Native <code>CHECK</code> constraints arrived in MySQL 8.0.16.
        Before that, MySQL parsed them and silently ignored them.
      </p>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE products (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  price_cents BIGINT UNSIGNED NOT NULL,
  discount    DECIMAL(4, 2) NOT NULL DEFAULT 0,

  CONSTRAINT chk_products_price_positive
    CHECK (price_cents > 0),

  CONSTRAINT chk_products_discount_range
    CHECK (discount BETWEEN 0 AND 1)
);`}
      />

      <Callout variant="info" title="CHECKs encode invariants">
        Anything you find yourself asserting in application tests
        (&ldquo;the price is always positive&rdquo;) is a candidate for
        a CHECK. The database does it for free, on every write, even from
        misbehaving migrations or admin scripts.
      </Callout>

      <H2 id="naming-and-deferring">Naming and managing constraints</H2>

      <KeyConcepts
        items={[
          {
            title: "Name everything",
            body: "Auto-named constraints become orders_ibfk_1 — useless when an error fires. Convention: fk_<table>_<col>, uq_<table>_<cols>, chk_<table>_<rule>.",
          },
          {
            title: "Drop / re-add the same constraint",
            body: "ALTER TABLE orders DROP FOREIGN KEY fk_orders_user, ADD CONSTRAINT fk_orders_user ...; — useful when changing referenced columns or actions.",
          },
          {
            title: "Bulk-disable for migrations",
            body: "SET FOREIGN_KEY_CHECKS = 0; on a single session can speed up large data loads. Re-enable and reverify before the session ends — orphans are silent otherwise.",
          },
          {
            title: "MySQL doesn't support DEFERRABLE",
            body: "Postgres can defer FK checks until COMMIT. MySQL checks immediately. Plan inserts in topological order, or load with FK checks off and verify.",
          },
        ]}
      />

      <Recap
        items={[
          "Five constraints: PRIMARY KEY, UNIQUE, FOREIGN KEY, NOT NULL/DEFAULT, CHECK.",
          "InnoDB enforces foreign keys; MyISAM silently ignores them.",
          "UNIQUE + NULL allows multiple NULLs — use CHECK or sentinel for at-most-one.",
          "ON DELETE/UPDATE actions: RESTRICT, CASCADE, SET NULL — pick deliberately, not by habit.",
          "Name your constraints, encode invariants with CHECK, and let the database catch bugs the app might miss.",
        ]}
      />
    </>
  ),
};
