import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "json",
  number: "10.01",
  title: "JSON in MySQL",
  description:
    "Native JSON storage, the path syntax, and how to index inside a JSON document with generated columns.",
  duration: "14 min",
  tags: ["json", "schema-less", "indexing"],
  headings: [
    { id: "when-to-use-json", text: "When to use JSON", depth: 2 },
    { id: "storing-and-validating", text: "Storing and validating", depth: 2 },
    { id: "extracting-values", text: "Extracting values", depth: 2 },
    { id: "modifying-json", text: "Modifying JSON in place", depth: 2 },
    { id: "indexing-json", text: "Indexing JSON", depth: 2 },
    { id: "json-table", text: "JSON_TABLE — query as rows", depth: 2 },
    { id: "common-mistakes", text: "Common mistakes", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        MySQL has a real <code>JSON</code> type, not just{" "}
        <code>TEXT</code> with extra parsing. Values are stored in a
        binary form for fast access; functions let you extract,
        modify, and index nested fields. It&apos;s the right answer
        for sparse, schema-less attributes — and the wrong answer for
        anything you&apos;ll need to <code>JOIN</code> on.
      </p>

      <Prerequisites
        items={[
          "Data types from lesson 5.1 — JSON is one of them.",
          "Generated columns concept (covered lightly here, deeply in lesson 10.3).",
          "MySQL 5.7+ for JSON; 8.0+ for JSON_TABLE and most modern features.",
        ]}
      />

      <H2 id="when-to-use-json">When to use JSON</H2>

      <KeyConcepts
        items={[
          {
            title: "Use it",
            body: "Sparse, schema-less attributes — feature flags, integration metadata, audit payloads, anything where the shape varies per row.",
          },
          {
            title: "Don't use it",
            body: "Data you'll JOIN, GROUP BY, or filter on hot paths. JOIN-on-JSON is the most expensive thing you can do in MySQL.",
          },
          {
            title: "When in doubt, columns",
            body: "If a JSON field becomes a 'hot' query path, promote it to a real column. JSON is for the long tail of attributes, not the head.",
          },
          {
            title: "Validate the shape",
            body: "JSON Schema validation (8.0.17+) lets you reject malformed payloads at write time. Use it on inputs you don't control.",
          },
        ]}
      />

      <H2 id="storing-and-validating">Storing and validating</H2>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE events (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  kind       VARCHAR(40) NOT NULL,
  payload    JSON NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

  -- 8.0.17+ — reject payloads that don't match a JSON Schema.
  CONSTRAINT chk_payload_shape CHECK (
    JSON_SCHEMA_VALID(
      '{
         "type": "object",
         "required": ["source"],
         "properties": {
           "source":  { "type": "string" },
           "amount":  { "type": "number" },
           "tags":    { "type": "array", "items": { "type": "string" } }
         }
      }',
      payload
    )
  )
);

INSERT INTO events (user_id, kind, payload) VALUES
  (1, 'order_paid',
   '{"source":"web","amount":49.00,"tags":["promo","first-order"]}'),
  (1, 'profile_view',
   '{"source":"mobile","page":"settings"}');`}
      />

      <Callout variant="info" title="JSON is binary internally">
        MySQL parses JSON on insert and stores it as a binary
        representation. Reading nested values doesn&apos;t re-parse the
        whole document — it walks the binary tree. That&apos;s why
        path operations are O(log N) instead of O(text length).
      </Callout>

      <H2 id="extracting-values">Extracting values</H2>

      <CodeBlock
        language="sql"
        code={`-- The two extract operators (synonyms in most cases).
SELECT id,
       JSON_EXTRACT(payload, '$.source')   AS source_quoted,
       payload->'$.source'                 AS source_quoted_2,
       payload->>'$.source'                AS source_unquoted
FROM   events;

-- $ is the document root. Path syntax:
SELECT payload->>'$.source'           AS source,        -- root.source
       payload->>'$.tags[0]'          AS first_tag,     -- first array element
       JSON_LENGTH(payload, '$.tags') AS tag_count,     -- number of tags
       JSON_KEYS(payload)             AS top_keys       -- top-level keys
FROM   events;`}
      />

      <KeyConcepts
        items={[
          {
            title: "-> returns JSON",
            body: "payload->'$.name' returns a JSON string with quotes. Useful when chaining further JSON operations.",
          },
          {
            title: "->> returns the unquoted scalar",
            body: "payload->>'$.name' returns 'Ana' instead of '\"Ana\"'. What you want for direct comparison and display.",
          },
          {
            title: "Type with JSON_TYPE",
            body: "JSON_TYPE(payload, '$.amount') returns DOUBLE / STRING / ARRAY / OBJECT / NULL. Useful when documents are heterogeneous.",
          },
          {
            title: "JSON_CONTAINS for membership",
            body: "JSON_CONTAINS(payload, '\"promo\"', '$.tags') — true if the array contains 'promo'.",
          },
        ]}
      />

      <H2 id="modifying-json">Modifying JSON in place</H2>

      <CodeBlock
        language="sql"
        code={`-- Add or replace a field.
UPDATE events
SET    payload = JSON_SET(payload, '$.reviewed_at', NOW())
WHERE  id = 42;

-- JSON_SET — overwrite if exists, add if missing.
-- JSON_INSERT — only if missing.
-- JSON_REPLACE — only if exists.

-- Append to an array.
UPDATE events
SET    payload = JSON_ARRAY_APPEND(payload, '$.tags', 'reviewed')
WHERE  id = 42;

-- Remove a path.
UPDATE events
SET    payload = JSON_REMOVE(payload, '$.tags[0]', '$.deprecated_field')
WHERE  id = 42;

-- Merge with an existing object (8.0+).
UPDATE events
SET    payload = JSON_MERGE_PATCH(payload, '{"source": "api", "v": 2}')
WHERE  id = 42;`}
      />

      <Callout variant="warn" title="In-place updates rewrite the value">
        Even though MySQL has a 'partial update' optimization for
        JSON in 8.0+, it only kicks in when the new value fits in the
        space the old one used. Big edits rewrite the whole document.
        Replication and binlog see the full new value either way.
      </Callout>

      <H2 id="indexing-json">Indexing JSON</H2>
      <p>
        JSON columns themselves can&apos;t be indexed directly. The
        idiomatic answer is a generated column that extracts the
        value, with an index on it.
      </p>

      <CodeBlock
        language="sql"
        filename="indexed-json.sql"
        code={`ALTER TABLE events
  ADD COLUMN source VARCHAR(40) AS (payload->>'$.source') STORED,
  ADD INDEX  idx_events_source (source);

-- Now this query uses the index, even though the data lives in JSON.
SELECT * FROM events WHERE source = 'web';

-- 8.0.13+ — multi-valued index on a JSON array.
ALTER TABLE events
  ADD INDEX idx_events_tags ((CAST(payload->'$.tags' AS CHAR(40) ARRAY)));

-- Use MEMBER OF (8.0.17+) for indexed array membership.
SELECT * FROM events WHERE 'promo' MEMBER OF (payload->'$.tags');`}
      />

      <KeyConcepts
        items={[
          {
            title: "STORED vs VIRTUAL",
            body: "STORED writes the extracted value to disk; VIRTUAL recomputes on read. Index on a VIRTUAL column is allowed; it stores the indexed value, just not the column.",
          },
          {
            title: "Multi-valued indexes",
            body: "Index every element of a JSON array — perfect for tag lookups. Up to 1024 entries per row.",
          },
          {
            title: "Functional indexes (8.0.13+)",
            body: "Index expression directly without a generated column. Slightly less verbose; same plan.",
          },
          {
            title: "Don't index everything",
            body: "Each indexed JSON path costs writes. Pick the 1–3 paths that drive most queries; leave the rest unindexed.",
          },
        ]}
      />

      <H2 id="json-table">JSON_TABLE — query as rows</H2>
      <p>
        <code>JSON_TABLE</code> (8.0+) projects a JSON document into a
        relational result set. Useful for exploding arrays into rows.
      </p>

      <CodeBlock
        language="sql"
        code={`-- One event with three tags → three rows, one per tag.
SELECT e.id, t.tag
FROM   events e,
       JSON_TABLE(
         e.payload,
         '$.tags[*]' COLUMNS (
           tag VARCHAR(40) PATH '$'
         )
       ) AS t
WHERE  e.id = 1;`}
      />

      <H2 id="common-mistakes">Common mistakes</H2>

      <KeyConcepts
        items={[
          {
            title: "Joining on JSON",
            body: "JOIN ... ON other.id = JSON_EXTRACT(t.payload, '$.user_id') is a full table scan. Promote the field to a column or generated column.",
          },
          {
            title: "Storing relational data in JSON",
            body: "Customers' addresses, order line items, anything you'll need to filter or aggregate. JSON is the cellar; relational is the kitchen.",
          },
          {
            title: "Inconsistent shapes",
            body: "If documents have different structures, queries break in surprising ways. Use JSON Schema validation, or split into separate kinds.",
          },
          {
            title: "Forgetting -> vs ->>",
            body: "WHERE payload->'$.source' = 'web' fails because the left side is a JSON string with quotes. Use ->>.",
          },
        ]}
      />

      <Recap
        items={[
          "JSON is a real binary type — not TEXT — with O(log N) path access.",
          "Use it for sparse, schema-less attributes; columns for anything you query hot.",
          "-> returns JSON; ->> returns the unquoted scalar — almost always what you want.",
          "JSON_SET / JSON_REMOVE / JSON_MERGE_PATCH for in-place edits.",
          "Index JSON via generated columns or functional indexes; multi-valued indexes for arrays.",
        ]}
      />
    </>
  ),
};
