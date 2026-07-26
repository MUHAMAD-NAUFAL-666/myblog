import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "stored-procedures",
  number: "08.02",
  title: "Stored procedures and functions",
  description:
    "Procedural code that lives in the database — when it earns its place, the syntax that gets in the way, and why most teams use it sparingly.",
  duration: "12 min",
  tags: ["stored-procedure", "function", "delimiter"],
  headings: [
    { id: "the-honest-take", text: "The honest take", depth: 2 },
    { id: "delimiter", text: "DELIMITER and why you need it", depth: 2 },
    { id: "creating-a-procedure", text: "Creating a procedure", depth: 2 },
    { id: "stored-functions", text: "Stored functions", depth: 2 },
    { id: "control-flow", text: "Control flow", depth: 2 },
    { id: "error-handling", text: "Error handling", depth: 2 },
    { id: "when-to-reach-for-them", text: "When to reach for them", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Stored routines are procedural code (loops, conditionals,
        variables) that lives inside MySQL. They&apos;re powerful and
        underused — partly because the syntax is awkward, partly
        because most application teams prefer code in their main
        language. This lesson shows you what they do, when they earn
        their keep, and why you&apos;ll mostly use them sparingly.
      </p>

      <Prerequisites
        items={[
          "DDL from chapter 5.",
          "Transactions from lesson 6.4 — procedures often wrap multi-step writes.",
          "An mysql CLI session to run the DELIMITER examples.",
        ]}
      />

      <H2 id="the-honest-take">The honest take</H2>

      <KeyConcepts
        items={[
          {
            title: "Pros",
            body: "Reduce round-trips, run logic close to the data, enforce critical operations atomically. Useful for batch admin tasks.",
          },
          {
            title: "Cons",
            body: "Versioning is harder than application code. Debugging is painful. Logic is split across the app and the database. Tests are awkward.",
          },
          {
            title: "Where they shine",
            body: "Bulk data migrations, periodic maintenance jobs, stored-procedure-only access patterns where security demands it.",
          },
          {
            title: "Where they don't",
            body: "General application logic. The deploy story (migrate → deploy → migrate) is fragile compared to deploying app code.",
          },
        ]}
      />

      <H2 id="delimiter">DELIMITER and why you need it</H2>
      <p>
        MySQL ends statements at semicolons. A procedure body{" "}
        <em>contains</em> semicolons. The fix is the{" "}
        <code>DELIMITER</code> command — temporarily change the
        statement terminator while you define the routine.
      </p>

      <CodeBlock
        language="sql"
        code={`DELIMITER //

CREATE PROCEDURE archive_old_orders()
BEGIN
  UPDATE orders
  SET    archived = 1
  WHERE  created_at < NOW() - INTERVAL 1 YEAR
    AND  archived = 0;
END //

DELIMITER ;        -- restore the default`}
      />

      <Callout variant="info" title="Only in the CLI">
        <code>DELIMITER</code> is a client-side directive of the{" "}
        <code>mysql</code> command-line tool. It&apos;s not part of
        SQL. Most application drivers handle multi-statement procedures
        differently — usually by sending the whole CREATE block as a
        single statement.
      </Callout>

      <H2 id="creating-a-procedure">Creating a procedure</H2>

      <CodeBlock
        language="sql"
        filename="transfer.sql"
        code={`DELIMITER //

CREATE PROCEDURE transfer_funds(
  IN  from_id  BIGINT,
  IN  to_id    BIGINT,
  IN  amount   DECIMAL(10, 2),
  OUT new_from DECIMAL(10, 2),
  OUT new_to   DECIMAL(10, 2)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;
    UPDATE accounts SET balance = balance - amount WHERE id = from_id;
    UPDATE accounts SET balance = balance + amount WHERE id = to_id;
    SELECT balance INTO new_from FROM accounts WHERE id = from_id;
    SELECT balance INTO new_to   FROM accounts WHERE id = to_id;
  COMMIT;
END //

DELIMITER ;

-- Call it.
CALL transfer_funds(1, 2, 100.00, @from, @to);
SELECT @from, @to;`}
      />

      <KeyConcepts
        items={[
          {
            title: "IN, OUT, INOUT",
            body: "Parameter modes. IN: input only (default). OUT: returned to the caller. INOUT: both.",
          },
          {
            title: "Session variables (@x)",
            body: "Caller-visible variables, declared with @. Used to capture OUT parameters.",
          },
          {
            title: "Local variables (DECLARE)",
            body: "Inside the BEGIN/END block, DECLARE name TYPE [DEFAULT value]. Scoped to the block.",
          },
          {
            title: "INTO assigns query results",
            body: "SELECT col INTO local_var FROM ...; populates the variable. One row, or you get an error unless you LIMIT 1.",
          },
        ]}
      />

      <H2 id="stored-functions">Stored functions</H2>
      <p>
        Functions return a value and can be used inside a{" "}
        <code>SELECT</code>. The cost: they&apos;re harder to optimize
        and often cause query plans to fall back to row-by-row
        evaluation.
      </p>

      <CodeBlock
        language="sql"
        code={`DELIMITER //

CREATE FUNCTION usd_to_idr(usd DECIMAL(10, 2))
RETURNS DECIMAL(14, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE rate DECIMAL(10, 4);
  SELECT exchange_rate INTO rate
  FROM   currencies
  WHERE  code = 'USD'
  LIMIT  1;
  RETURN usd * rate;
END //

DELIMITER ;

-- Use it inline.
SELECT id, amount, usd_to_idr(amount) AS idr FROM orders;`}
      />

      <Callout variant="warn" title="Function modifiers matter">
        <code>DETERMINISTIC</code> tells MySQL the function returns the
        same output for the same input — required for replication
        safety with row-based binlog disabled. <code>READS SQL DATA</code>{" "}
        / <code>MODIFIES SQL DATA</code> declares side effects. Get
        these wrong and replication may refuse to apply the binlog.
      </Callout>

      <H2 id="control-flow">Control flow</H2>

      <CodeBlock
        language="sql"
        code={`DELIMITER //

CREATE PROCEDURE process_status_changes()
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE cur_id BIGINT;
  DECLARE cur CURSOR FOR
    SELECT id FROM orders WHERE status = 'pending';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO cur_id;
    IF done THEN
      LEAVE read_loop;
    END IF;

    -- Do something with cur_id.
    UPDATE orders SET reviewed_at = NOW() WHERE id = cur_id;
  END LOOP;
  CLOSE cur;
END //

DELIMITER ;`}
      />

      <KeyConcepts
        items={[
          {
            title: "IF / CASE",
            body: "Standard branching. CASE inside a procedure is the verb form (with WHEN ... THEN ... END CASE), not the SELECT-expression form.",
          },
          {
            title: "LOOP, REPEAT, WHILE",
            body: "Three loop forms. LEAVE label; exits a labelled loop early; ITERATE label; jumps to the next iteration.",
          },
          {
            title: "Cursors — last resort",
            body: "Iterating row-by-row is almost always slower than a single set-based SQL statement. Use cursors only when the work genuinely can't be expressed as a single query.",
          },
          {
            title: "Variables shadow column names",
            body: "DECLARE id INT; followed by SELECT id INTO id FROM ... is ambiguous. Prefix locals (l_id) or columns (t.id) to disambiguate.",
          },
        ]}
      />

      <H2 id="error-handling">Error handling</H2>

      <CodeBlock
        language="sql"
        code={`DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
  GET DIAGNOSTICS CONDITION 1
    @msg = MESSAGE_TEXT;
  ROLLBACK;
  RESIGNAL;     -- re-raise so the caller sees it
END;

-- Handle a specific SQLSTATE.
DECLARE CONTINUE HANDLER FOR SQLSTATE '23000' SET v_dup = 1;

-- Handle a specific MySQL error code.
DECLARE EXIT HANDLER FOR 1062 SET v_dup = 1;`}
      />

      <KeyConcepts
        items={[
          {
            title: "EXIT vs CONTINUE",
            body: "EXIT leaves the BEGIN/END block. CONTINUE keeps going after running the handler body.",
          },
          {
            title: "SQLEXCEPTION vs specific codes",
            body: "Catch SQLEXCEPTION as a fallback; specific codes for known recoverable errors (duplicate key, deadlock).",
          },
          {
            title: "RESIGNAL",
            body: "Re-throw the original error after cleanup. Without it, the caller sees success even though the handler ran.",
          },
          {
            title: "GET DIAGNOSTICS",
            body: "Pull error metadata (code, SQLSTATE, message) into local variables for logging.",
          },
        ]}
      />

      <H2 id="when-to-reach-for-them">When to reach for stored routines</H2>

      <KeyConcepts
        items={[
          {
            title: "Use them",
            body: "Bulk migrations, scheduled cleanup, security-critical operations where the app shouldn't have direct table access.",
          },
          {
            title: "Avoid them",
            body: "Per-request business logic, anything you'd want to unit test, anything that needs to be debugged with a regular IDE.",
          },
          {
            title: "Version them",
            body: "Treat the CREATE PROCEDURE statements as migrations — versioned, reviewed, deployed alongside schema changes.",
          },
          {
            title: "Don't over-rely on them",
            body: "If your app's business logic is mostly in stored procedures, you've built a database-resident application. Migrating off MySQL becomes very expensive.",
          },
        ]}
      />

      <Recap
        items={[
          "Stored routines are procedural SQL — useful for batch jobs, dangerous as primary business logic.",
          "DELIMITER lets the mysql CLI parse multi-statement bodies; app drivers handle this differently.",
          "Procedures (CALL) and functions (inline in SELECT) cover different use cases.",
          "Cursors exist; prefer set-based SQL whenever possible.",
          "Handlers + RESIGNAL give you the equivalent of try/catch with explicit propagation.",
        ]}
      />
    </>
  ),
};
