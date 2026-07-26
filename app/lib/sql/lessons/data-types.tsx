import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "data-types",
  number: "05.01",
  title: "MySQL data types",
  description:
    "INT vs BIGINT, VARCHAR vs TEXT, DECIMAL vs FLOAT, and the type choices that haunt schemas for a decade.",
  duration: "16 min",
  tags: ["data-types", "schema", "mysql"],
  headings: [
    { id: "the-three-families", text: "The three families", depth: 2 },
    { id: "numeric-types", text: "Numeric types", depth: 2 },
    { id: "string-types", text: "String types", depth: 2 },
    { id: "date-and-time", text: "Date and time", depth: 2 },
    { id: "binary-and-json", text: "Binary, JSON, ENUM", depth: 2 },
    { id: "choosing-defaults", text: "Choosing sensible defaults", depth: 2 },
    { id: "common-mistakes", text: "Common mistakes", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Type choices are the foundation every other decision rests on.
        Pick wrong and you pay for it every query, every backup, every
        migration. Pick right and the database mostly disappears. This
        lesson covers the types you&apos;ll actually reach for in MySQL
        8.
      </p>

      <Prerequisites
        items={[
          "MySQL playground from lesson 1.2 — the examples assume MySQL 8 syntax.",
          "Comfort reading CREATE TABLE statements.",
          "An opinion that 'we'll fix it later' is rarely true.",
        ]}
      />

      <H2 id="the-three-families">The three families</H2>

      <KeyConcepts
        items={[
          {
            title: "Numeric",
            body: "Integers (TINYINT → BIGINT), exact decimals (DECIMAL), and approximate floats (FLOAT, DOUBLE).",
          },
          {
            title: "String",
            body: "Variable-length VARCHAR, fixed CHAR, large TEXT, raw BINARY/BLOB. Charsets matter here.",
          },
          {
            title: "Date/time",
            body: "DATE, DATETIME, TIMESTAMP, TIME, YEAR. Choose between DATETIME (no zone) and TIMESTAMP (UTC + zone).",
          },
          {
            title: "Special",
            body: "JSON, ENUM, SET, spatial, bit. Powerful but easy to misuse — covered later.",
          },
        ]}
      />

      <H2 id="numeric-types">Numeric types</H2>

      <CodeBlock
        language="sql"
        filename="numeric-cheatsheet.sql"
        code={`-- Integers — pick the smallest that fits your domain.
TINYINT      -- 1 byte,  -128 .. 127         (or 0..255 UNSIGNED)
SMALLINT     -- 2 bytes, ±32k                (±65k UNSIGNED)
MEDIUMINT    -- 3 bytes, ±8M                 (16M UNSIGNED)
INT          -- 4 bytes, ±2.1B               (4.2B UNSIGNED)
BIGINT       -- 8 bytes, ±9.2 quintillion

-- Exact decimals — money, anything where rounding is unacceptable.
DECIMAL(10, 2)   -- up to 10 digits, 2 after the decimal point
DECIMAL(38, 6)   -- analytics-scale precision

-- Approximate floats — coordinates, ML features, never money.
FLOAT            -- 4 bytes, ~7 decimal digits of precision
DOUBLE           -- 8 bytes, ~15 decimal digits`}
      />

      <Callout variant="warn" title="Never store money in FLOAT">
        <code>0.1 + 0.2 = 0.30000000000000004</code>. That bug ships in
        every accounting system that learned the hard way. Use{" "}
        <code>DECIMAL</code> for currency, <code>BIGINT</code> for
        cents — never floats.
      </Callout>

      <Callout variant="tip" title="UNSIGNED when negatives are impossible">
        <code>id INT UNSIGNED</code> doubles the positive range and
        documents intent: this column can&apos;t go below zero. Same
        story for ages, quantities, byte counts.
      </Callout>

      <H2 id="string-types">String types</H2>

      <CodeBlock
        language="sql"
        code={`CHAR(N)         -- fixed N characters, padded with spaces. Rare in practice.
VARCHAR(N)      -- up to N characters, length-prefixed. The default for short text.
TINYTEXT        -- ≤ 255 bytes
TEXT            -- ≤ 64 KB
MEDIUMTEXT      -- ≤ 16 MB
LONGTEXT        -- ≤ 4 GB

BINARY(N) / VARBINARY(N) / BLOB / LONGBLOB   -- raw bytes, no charset`}
      />

      <KeyConcepts
        items={[
          {
            title: "VARCHAR(N) — the default",
            body: "N is a max length, not a reservation. VARCHAR(255) and VARCHAR(64) cost the same for a 10-char value. Pick a meaningful upper bound, not a magic number.",
          },
          {
            title: "Why VARCHAR(255)?",
            body: "Historical: pre-5.0.3 stored the length in 1 byte. In modern MySQL there's no reason to default to it — VARCHAR(64) for emails, VARCHAR(100) for names is fine.",
          },
          {
            title: "TEXT vs VARCHAR",
            body: "TEXT can't have a default, can't be fully indexed without a prefix, and is stored off-page. Use it when content is genuinely unbounded.",
          },
          {
            title: "Always utf8mb4",
            body: "MySQL's old 'utf8' is 3-byte, missing emoji and a chunk of CJK. Use utf8mb4 everywhere — it's the actual UTF-8.",
          },
        ]}
      />

      <CodeBlock
        language="sql"
        code={`CREATE TABLE messages (
  id      BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  body    TEXT NOT NULL,
  author  VARCHAR(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;`}
      />

      <H2 id="date-and-time">Date and time</H2>

      <CodeBlock
        language="sql"
        code={`DATE          -- YYYY-MM-DD,                  3 bytes
TIME          -- HH:MM:SS[.fraction],         3+ bytes
YEAR          -- 4-digit year,                1 byte
DATETIME      -- YYYY-MM-DD HH:MM:SS,         5-8 bytes, 1000-01-01 to 9999
TIMESTAMP     -- like DATETIME but UTC,       4-7 bytes, 1970-01-01 to 2038

-- 8.0 supports up to 6 digits of fractional seconds for both:
created_at  DATETIME(6)`}
      />

      <Callout variant="info" title="DATETIME or TIMESTAMP?">
        <strong>TIMESTAMP</strong> auto-converts to UTC on write and to
        the session zone on read — convenient, but gone in 2038.{" "}
        <strong>DATETIME</strong> stores literal values without
        conversion. Most modern apps use <code>DATETIME(6)</code> and
        store everything in UTC explicitly. The 2038 problem is real.
      </Callout>

      <CodeBlock
        language="sql"
        code={`-- Defaulting to 'now' on insert and update.
created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP`}
      />

      <H2 id="binary-and-json">Binary, JSON, ENUM</H2>

      <CodeBlock
        language="sql"
        code={`-- BINARY / VARBINARY — raw bytes, no charset.
checksum  BINARY(32)               -- SHA-256

-- JSON — first-class in MySQL 5.7+. Detailed in lesson 10.1.
metadata  JSON

-- ENUM — fixed list of strings, stored as a small integer.
status    ENUM('paid', 'pending', 'refunded') NOT NULL`}
      />

      <Callout variant="warn" title="ENUM has sharp edges">
        ENUM saves bytes and reads nicely — but adding a value rewrites
        the table&apos;s metadata and can be painful at scale. For a
        stable list (status flags), it&apos;s great. For a moving list
        (categories the product team keeps adding), prefer a lookup
        table.
      </Callout>

      <H2 id="choosing-defaults">Choosing sensible defaults</H2>

      <KeyConcepts
        items={[
          {
            title: "Primary keys",
            body: "BIGINT UNSIGNED AUTO_INCREMENT for monolith apps. UUIDv7 (BINARY(16)) when IDs need to be globally unique or unguessable.",
          },
          {
            title: "Money",
            body: "DECIMAL(amount_digits + 2, 2). For under-$1B revenue, DECIMAL(11, 2). Banking systems use BIGINT cents.",
          },
          {
            title: "Short text",
            body: "VARCHAR(N) where N reflects a real upper bound. Emails: 320 (RFC). Names: 100. Slugs: 80.",
          },
          {
            title: "Long text",
            body: "TEXT for user-generated content, MEDIUMTEXT for posts/articles. LONGTEXT only when you know why.",
          },
          {
            title: "Timestamps",
            body: "DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) for created_at; same with ON UPDATE for updated_at.",
          },
          {
            title: "Booleans",
            body: "MySQL has no real BOOLEAN — TINYINT(1) is the convention. Pick a default (usually 0) and stick with it.",
          },
        ]}
      />

      <H2 id="common-mistakes">Common mistakes</H2>

      <KeyConcepts
        items={[
          {
            title: "INT for primary keys",
            body: "4.2B unsigned looks like a lot — until your audit_log table hits it after three years. BIGINT costs 4 extra bytes per row, and it's never the bottleneck.",
          },
          {
            title: "VARCHAR(255) everywhere",
            body: "Index size scales with declared length on certain operations. Match the type to the data — emails aren't 255 chars.",
          },
          {
            title: "FLOAT for prices",
            body: "Pennies disappear. Auditors find them. Use DECIMAL.",
          },
          {
            title: "DATE without a timezone strategy",
            body: "Pick UTC at the schema layer and convert in the app. Don't let some rows be local and others UTC.",
          },
          {
            title: "Reaching for JSON for relational data",
            body: "JSON is great for sparse, schema-less attributes. It's a bad place to put data you'll need to JOIN, GROUP BY, or index by.",
          },
        ]}
      />

      <Recap
        items={[
          "Three families: numeric, string, date/time — plus JSON, ENUM, binary.",
          "DECIMAL for money, BIGINT for IDs, VARCHAR(N) with N reflecting reality.",
          "DATETIME(6) for times you want to outlive 2038; everything in UTC.",
          "ENUM is great for stable lists, painful for moving ones.",
          "Pick types once, deliberately. Migrations get expensive fast.",
        ]}
      />
    </>
  ),
};
