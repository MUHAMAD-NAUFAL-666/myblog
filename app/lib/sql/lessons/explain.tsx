import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import {
  AnimatedSpan,
  Terminal,
} from "@/app/components/terminal";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "explain",
  number: "07.01",
  title: "Reading EXPLAIN",
  description:
    "The query plan is the truth. EXPLAIN, EXPLAIN ANALYZE, and the columns that tell you why a query is slow.",
  duration: "16 min",
  tags: ["explain", "performance", "query-plan"],
  headings: [
    { id: "what-explain-tells-you", text: "What EXPLAIN tells you", depth: 2 },
    { id: "the-columns-that-matter", text: "The columns that matter", depth: 2 },
    { id: "explain-analyze", text: "EXPLAIN ANALYZE", depth: 2 },
    { id: "json-format", text: "FORMAT=JSON for the full picture", depth: 2 },
    { id: "common-bad-plans", text: "Common bad plans", depth: 2 },
    { id: "the-debug-loop", text: "The debug loop", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Every <code>SELECT</code> goes through the optimizer. The
        optimizer&apos;s decision — which indexes to use, which join
        order, which algorithm — is the query plan.{" "}
        <code>EXPLAIN</code> shows you that plan without running the
        query. It&apos;s the difference between guessing and knowing.
      </p>

      <Prerequisites
        items={[
          "Index design from lesson 5.4 — EXPLAIN tells you whether your indexes are doing their job.",
          "MySQL playground with the seed data loaded.",
          "A query that's slower than you'd like — even better.",
        ]}
      />

      <H2 id="what-explain-tells-you">What EXPLAIN tells you</H2>

      <CodeBlock
        language="sql"
        code={`EXPLAIN
SELECT u.country, SUM(o.amount) AS revenue
FROM   users  u
JOIN   orders o ON o.user_id = u.id
WHERE  o.status = 'paid'
GROUP  BY u.country;`}
      />

      <Terminal title="explain — mysql">
        <AnimatedSpan className="text-[#a89e8f]">
          <span>+----+-------------+-------+--------+---------------+---------+---------+---------+------+----------+------------------------------+</span>
          <span>| id | select_type | table | type   | possible_keys | key     | key_len | ref     | rows | filtered | Extra                        |</span>
          <span>+----+-------------+-------+--------+---------------+---------+---------+---------+------+----------+------------------------------+</span>
        </AnimatedSpan>
        <AnimatedSpan className="text-[#d8d1c2]">
          <span>|  1 | SIMPLE      | u     | ALL    | PRIMARY       | NULL    | NULL    | NULL    |    6 |    100.0 | Using temporary; Using filesort |</span>
          <span>|  1 | SIMPLE      | o     | ref    | idx_user      | idx_user| 4       | u.id    |    1 |     50.0 | Using where                  |</span>
          <span>+----+-------------+-------+--------+---------------+---------+---------+---------+------+----------+------------------------------+</span>
        </AnimatedSpan>
      </Terminal>

      <H2 id="the-columns-that-matter">The columns that matter</H2>

      <KeyConcepts
        items={[
          {
            title: "type",
            body: "How rows are accessed. Best-to-worst: const, eq_ref, ref, range, index, ALL. ALL = full table scan. Aim for ref or better on hot paths.",
          },
          {
            title: "key",
            body: "Which index was actually chosen. NULL means no index — usually a problem on tables larger than a few thousand rows.",
          },
          {
            title: "rows",
            body: "Estimated rows the planner thinks it'll examine. A wildly inflated estimate means stale statistics; run ANALYZE TABLE.",
          },
          {
            title: "filtered",
            body: "Percent of rows estimated to survive the WHERE. Multiply rows × filtered / 100 for the row count after filtering.",
          },
          {
            title: "Extra",
            body: "Free-text hints. 'Using index' = covering. 'Using temporary' / 'Using filesort' = sorting in memory or on disk. 'Using index condition' = ICP, generally good.",
          },
        ]}
      />

      <H2 id="explain-analyze">EXPLAIN ANALYZE</H2>
      <p>
        <code>EXPLAIN</code> is the planner&apos;s estimate.{" "}
        <code>EXPLAIN ANALYZE</code> (8.0.18+) actually runs the query
        and returns real timings per node. The difference between
        estimate and actual is where bugs hide.
      </p>

      <CodeBlock
        language="sql"
        code={`EXPLAIN ANALYZE
SELECT u.country, SUM(o.amount) AS revenue
FROM   users  u
JOIN   orders o ON o.user_id = u.id
WHERE  o.status = 'paid'
GROUP  BY u.country;`}
      />

      <Terminal title="analyze — mysql">
        <AnimatedSpan className="text-[#d8d1c2]">
          <span>-&gt; Group aggregate: sum(o.amount)  (cost=4.7 rows=2)</span>
          <span>    (actual time=0.123..0.156 rows=3 loops=1)</span>
          <span>  -&gt; Sort: u.country  (cost=4.7 rows=2)</span>
          <span>      (actual time=0.108..0.111 rows=4 loops=1)</span>
          <span>    -&gt; Stream results  (cost=4.7 rows=2)</span>
          <span>        (actual time=0.063..0.083 rows=4 loops=1)</span>
        </AnimatedSpan>
      </Terminal>

      <Callout variant="pro" title="Read it bottom-up">
        Each node feeds the one above it. Start at the deepest node
        (where the query touches the disk) and trace upward. The
        slowest node is your bottleneck.
      </Callout>

      <H2 id="json-format">FORMAT=JSON for the full picture</H2>

      <CodeBlock
        language="sql"
        code={`EXPLAIN FORMAT=JSON
SELECT u.country, SUM(o.amount)
FROM   users u JOIN orders o ON o.user_id = u.id
WHERE  o.status = 'paid'
GROUP  BY u.country;`}
      />

      <p>
        JSON output has fields the table view hides — used columns,
        cost estimates per step, partition pruning, materialized
        results. Tools like MySQL Workbench&apos;s Visual Explain render
        this into the diagram you actually want.
      </p>

      <H2 id="common-bad-plans">Common bad plans and what they mean</H2>

      <KeyConcepts
        items={[
          {
            title: "type = ALL on a hot query",
            body: "Full table scan. Either no usable index exists, or your predicate isn't sargable (function on the column, leading wildcard in LIKE, type mismatch).",
          },
          {
            title: "Using filesort",
            body: "MySQL is sorting outside the index. Add an index that matches your ORDER BY, or rethink the query.",
          },
          {
            title: "Using temporary",
            body: "GROUP BY or DISTINCT couldn't be served by an index — MySQL builds an in-memory (or disk) temp table. Big GROUP BY without a matching index is the usual culprit.",
          },
          {
            title: "rows estimate is wildly off",
            body: "Statistics are stale. Run ANALYZE TABLE my_table; or, in 8.0+, monitor information_schema.innodb_table_stats.",
          },
          {
            title: "key = NULL, possible_keys = NULL",
            body: "No index covers the predicate. Add one, or accept the scan if the table is small.",
          },
          {
            title: "Same query, two plans on different rows",
            body: "Index dive cost varies by predicate value. The optimizer picks differently for selective vs non-selective values. Hint with FORCE INDEX as a last resort.",
          },
        ]}
      />

      <H2 id="the-debug-loop">The debug loop</H2>

      <CodeBlock
        language="text"
        code={`When a query is slow:

  1. EXPLAIN — what plan did MySQL choose?
  2. Is the type column 'ref' or better on the hot tables?
  3. Is the chosen 'key' the one you expected?
  4. Are 'rows' × 'filtered' close to the actual result size?
  5. Any 'Using filesort' / 'Using temporary' that surprises you?
  6. EXPLAIN ANALYZE — does the actual time match the estimate?
  7. ANALYZE TABLE if statistics look stale.
  8. Add or adjust an index. Re-run EXPLAIN.
  9. If nothing helps: rewrite the query (CTE, EXISTS, derived table).
 10. Hint as a last resort: USE INDEX, FORCE INDEX, IGNORE INDEX.`}
      />

      <Callout variant="warn" title="Hints are the last resort">
        <code>FORCE INDEX</code> overrides the optimizer. Sometimes
        necessary, often a sign that statistics are stale or the
        schema is fighting you. Document why every hint exists — six
        months later, the next engineer will undo it.
      </Callout>

      <Recap
        items={[
          "EXPLAIN shows the planner's chosen plan; EXPLAIN ANALYZE shows real per-node timings.",
          "Watch type, key, rows, filtered, and Extra. Aim for ref/range, with the right key.",
          "'Using filesort' / 'Using temporary' usually mean a missing index for ORDER BY or GROUP BY.",
          "FORMAT=JSON exposes everything; Workbench's Visual Explain renders it nicely.",
          "Index dives + stale stats are the usual culprits when 'the same query is sometimes slow'.",
        ]}
      />
    </>
  ),
};
