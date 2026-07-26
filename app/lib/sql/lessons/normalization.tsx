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
  slug: "normalization",
  number: "05.05",
  title: "Normalization (and when to break it)",
  description:
    "1NF, 2NF, 3NF — the rules every relational schema is judged by, and the deliberate denormalizations that earn their cost.",
  duration: "12 min",
  tags: ["normalization", "schema-design"],
  headings: [
    { id: "why-normalize", text: "Why normalize", depth: 2 },
    { id: "the-normal-forms", text: "The normal forms (in plain English)", depth: 2 },
    { id: "step-by-step", text: "Step-by-step: normalizing a schema", depth: 2 },
    { id: "denormalization", text: "When to denormalize", depth: 2 },
    { id: "common-anti-patterns", text: "Common anti-patterns", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Normalization is the discipline of removing redundancy from a
        schema. Done well, it prevents whole categories of bugs — update
        anomalies, contradictions, inconsistent state. Done dogmatically,
        it produces schemas that work but are tedious to query. Both
        extremes are wrong.
      </p>

      <Prerequisites
        items={[
          "Constraints from lesson 5.3 — primary keys and foreign keys carry the rules.",
          "Index design from lesson 5.4 — normalized schemas need joinable indexes.",
          "An example schema in your head you'd like to clean up.",
        ]}
      />

      <H2 id="why-normalize">Why normalize</H2>

      <KeyConcepts
        items={[
          {
            title: "No redundant data",
            body: "A user's name lives in one row. Renaming touches one place. No drift, no contradictions.",
          },
          {
            title: "Constraints become enforceable",
            body: "Foreign keys, uniques, and CHECKs only work when the data lives where it logically belongs.",
          },
          {
            title: "Inserts and deletes don't lie",
            body: "If a customer can only exist when they have an order, the schema is wrong. Separating concerns lets you represent customers without orders.",
          },
          {
            title: "Indexes earn their keep",
            body: "A narrow, single-purpose table indexes well. Wide denormalized tables fight the cache.",
          },
        ]}
      />

      <H2 id="the-normal-forms">The normal forms (in plain English)</H2>

      <KeyConcepts
        items={[
          {
            title: "1NF — atomic columns",
            body: "Each column holds one value, not a list. No 'tags = comma,separated'. No JSON arrays for things you'll filter on. Use a child table.",
          },
          {
            title: "2NF — no partial dependencies on a composite key",
            body: "Every non-key column depends on the WHOLE primary key, not just part of it. Mostly relevant when your PK is composite.",
          },
          {
            title: "3NF — no transitive dependencies",
            body: "Every non-key column depends on the key, the WHOLE key, and NOTHING but the key. If country_name is determined by country_code, country_code belongs in a country table.",
          },
          {
            title: "BCNF / 4NF / 5NF",
            body: "Stricter forms that mostly only matter in textbooks. 3NF + an honest review covers 95% of real-world cases.",
          },
        ]}
      />

      <H2 id="step-by-step">Step-by-step: normalizing a schema</H2>
      <p>
        Start from a flat, badly-shaped table. End with something that
        survives a code review.
      </p>

      <Steps>
        <Step
          title="The denormalized 'before'"
          summary="A single table is doing five jobs. Updates are nightmares."
        >
          <CodeBlock
            language="sql"
            code={`-- A 'kitchen sink' table. Every row repeats user info, country info, tags.
CREATE TABLE orders_flat (
  order_id      BIGINT UNSIGNED PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  user_name     VARCHAR(100) NOT NULL,    -- duplicated per order
  user_email    VARCHAR(320) NOT NULL,    -- duplicated per order
  country_code  CHAR(2) NOT NULL,
  country_name  VARCHAR(100) NOT NULL,    -- determined by country_code
  amount        DECIMAL(10, 2) NOT NULL,
  tags          VARCHAR(500)              -- 'urgent,gift,priority'
);`}
          />
          <p>
            Three problems immediately: renaming a user touches every
            order they&apos;ve ever placed, country_name can drift from
            country_code, and querying tags requires{" "}
            <code>LIKE &apos;%urgent%&apos;</code> — which can&apos;t use
            an index and matches &ldquo;non-urgent&rdquo;.
          </p>
        </Step>

        <Step
          title="Apply 1NF — atomize the tags column"
          summary="Move repeating values into a child table. One row per (order, tag)."
        >
          <CodeBlock
            language="sql"
            code={`CREATE TABLE order_tags (
  order_id  BIGINT UNSIGNED NOT NULL,
  tag       VARCHAR(40) NOT NULL,
  PRIMARY KEY (order_id, tag),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);`}
          />
        </Step>

        <Step
          title="Apply 3NF — extract the user"
          summary="user_name and user_email don't describe an order. They describe a user."
        >
          <CodeBlock
            language="sql"
            code={`CREATE TABLE users (
  id     BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  name   VARCHAR(100) NOT NULL,
  email  VARCHAR(320) NOT NULL UNIQUE
);

CREATE TABLE orders (
  id        BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id   BIGINT UNSIGNED NOT NULL,
  amount    DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`}
          />
        </Step>

        <Step
          title="Apply 3NF — extract the country"
          summary="country_name is determined by country_code. That's the textbook signal."
        >
          <CodeBlock
            language="sql"
            code={`CREATE TABLE countries (
  code  CHAR(2) PRIMARY KEY,
  name  VARCHAR(100) NOT NULL
);

ALTER TABLE users
  ADD COLUMN country_code CHAR(2) NULL,
  ADD CONSTRAINT fk_users_country
    FOREIGN KEY (country_code) REFERENCES countries(code);`}
          />
        </Step>

        <Step
          title="Verify the result"
          summary="Each table now has a single subject. Updates touch one row."
        >
          <ul>
            <li><strong>users</strong> — identity, contact, location.</li>
            <li><strong>orders</strong> — what was bought, by whom, for how much.</li>
            <li><strong>order_tags</strong> — many-to-many tag attribution.</li>
            <li><strong>countries</strong> — the canonical lookup.</li>
          </ul>
          <p>
            Renaming a country: one row. Renaming a user: one row.
            Filtering orders by tag: an indexed join.
          </p>
        </Step>
      </Steps>

      <H2 id="denormalization">When to denormalize</H2>
      <p>
        Sometimes 3NF makes a hot query absurdly expensive. Deliberate
        denormalization is fine — once you can articulate the trade.
      </p>

      <KeyConcepts
        items={[
          {
            title: "Computed totals",
            body: "Storing users.lifetime_revenue saves an aggregate per request. Trade-off: you must maintain it on every order change. Worth it for big traffic, not for analytics.",
          },
          {
            title: "Materialized views",
            body: "Pre-aggregated tables (orders_daily_summary). MySQL doesn't have native materialized views — emulate with scheduled jobs or triggers.",
          },
          {
            title: "Read-only replicas",
            body: "Heavy reporting queries on a replica with a denormalized schema. Primary stays normalized.",
          },
          {
            title: "Caching layer",
            body: "Often the right place to denormalize is Redis, not the database. Cheaper to invalidate, easier to tune.",
          },
        ]}
      />

      <Callout variant="pro" title="Normalize first, denormalize with receipts">
        Start fully normalized. Measure the queries that hurt. Denormalize
        the smallest amount that fixes the metric. Document why — the
        next engineer will thank you when they wonder why{" "}
        <code>users.country_name</code> exists.
      </Callout>

      <H2 id="common-anti-patterns">Common anti-patterns</H2>

      <KeyConcepts
        items={[
          {
            title: "Comma-separated IDs",
            body: "tags = '12,17,42' breaks 1NF and every JOIN you'd want to do. Use a join table.",
          },
          {
            title: "Numbered columns",
            body: "tag1, tag2, tag3 ... If the schema embeds a bound on the count, the count is wrong eventually. Use a child table.",
          },
          {
            title: "EAV (entity-attribute-value)",
            body: "A 'flexible' three-column table for arbitrary attributes. Sounds clever, queries badly. Use JSON if you really need schema-less, with discipline.",
          },
          {
            title: "Wide tables 'in case'",
            body: "100-column tables collected over a decade. Each column adds bytes to every row, every backup, every replication packet. Split or drop.",
          },
        ]}
      />

      <Recap
        items={[
          "1NF: atomic columns. 2NF / 3NF: no redundant dependencies on the key.",
          "Most schemas only need 3NF + good naming to be correct.",
          "Normalization simplifies updates, lets constraints work, and shrinks indexes.",
          "Denormalize deliberately, with measurements — never out of laziness.",
          "Avoid the classic anti-patterns: CSV columns, numbered columns, EAV, kitchen-sink tables.",
        ]}
      />
    </>
  ),
};
