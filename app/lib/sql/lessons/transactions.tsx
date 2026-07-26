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
  Step,
  Steps,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "transactions",
  number: "06.04",
  title: "Transactions and isolation levels",
  description:
    "ACID, BEGIN/COMMIT, the four isolation levels, and the difference between dirty reads, non-repeatable reads, and phantoms.",
  duration: "16 min",
  tags: ["transactions", "acid", "isolation", "innodb"],
  headings: [
    { id: "the-acid-promise", text: "The ACID promise", depth: 2 },
    { id: "writing-a-transaction", text: "Writing a transaction", depth: 2 },
    { id: "the-anomalies", text: "The four anomalies", depth: 2 },
    { id: "isolation-levels", text: "The four isolation levels", depth: 2 },
    { id: "innodb-defaults", text: "InnoDB defaults and behavior", depth: 2 },
    { id: "select-for-update", text: "Locking reads: SELECT ... FOR UPDATE", depth: 2 },
    { id: "deadlocks", text: "Deadlocks", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        A transaction is a unit of work that either fully happens or
        fully doesn&apos;t. ACID is the contract; isolation levels are
        the dial that controls how much you pay for it. Most production
        bugs that look like &ldquo;impossible&rdquo; data corruption
        are isolation-level surprises in disguise.
      </p>

      <Prerequisites
        items={[
          "INSERT, UPDATE, DELETE from earlier in this chapter.",
          "InnoDB tables (the default in MySQL 8).",
          "Two terminals open — most examples need a second connection to demonstrate.",
        ]}
      />

      <H2 id="the-acid-promise">The ACID promise</H2>

      <KeyConcepts
        items={[
          {
            title: "Atomicity",
            body: "All statements in a transaction commit, or none do. Half-applied writes are impossible.",
          },
          {
            title: "Consistency",
            body: "Every transaction takes the database from one valid state to another. Constraints (PK, FK, CHECK) enforce 'valid'.",
          },
          {
            title: "Isolation",
            body: "Concurrent transactions don't see each other's in-flight writes. The level you pick controls how strict 'don't see' is.",
          },
          {
            title: "Durability",
            body: "Once COMMIT returns, the change survives a crash. InnoDB's redo log + fsync makes this true.",
          },
        ]}
      />

      <H2 id="writing-a-transaction">Writing a transaction</H2>

      <CodeBlock
        language="sql"
        filename="transfer.sql"
        code={`START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Check before committing — pure SQL audit.
SELECT id, balance FROM accounts WHERE id IN (1, 2);

COMMIT;
-- or:
-- ROLLBACK;`}
      />

      <KeyConcepts
        items={[
          {
            title: "BEGIN, START TRANSACTION",
            body: "Synonyms. Open a new transaction. MySQL auto-commits each statement otherwise.",
          },
          {
            title: "autocommit = 1 (default)",
            body: "Each statement is its own transaction. Disable temporarily with SET autocommit = 0; — but most app drivers manage this for you.",
          },
          {
            title: "DDL implicitly commits",
            body: "CREATE / ALTER / DROP run their own COMMIT before and after. You can't include them in a multi-step transaction.",
          },
          {
            title: "SAVEPOINT for partial rollback",
            body: "SAVEPOINT name; ... ROLLBACK TO name; — undo part of a transaction without aborting the whole thing.",
          },
        ]}
      />

      <H2 id="the-anomalies">The four anomalies</H2>
      <p>
        Three classic concurrency bugs, plus a fourth that&apos;s
        easy to miss. Isolation levels are graded by which they prevent.
      </p>

      <KeyConcepts
        items={[
          {
            title: "Dirty read",
            body: "Transaction A reads data written by transaction B before B commits. If B rolls back, A read fiction.",
          },
          {
            title: "Non-repeatable read",
            body: "A reads row X, B updates X and commits, A reads X again — different value within the same transaction.",
          },
          {
            title: "Phantom read",
            body: "A runs SELECT ... WHERE x > 5, B inserts a matching row and commits, A re-runs the same SELECT — new rows appear.",
          },
          {
            title: "Lost update",
            body: "A and B both read the same value, both compute a new one, both write back — one update is silently lost. Solved by SELECT ... FOR UPDATE or ON DUPLICATE KEY logic.",
          },
        ]}
      />

      <H2 id="isolation-levels">The four isolation levels</H2>

      <CodeBlock
        language="text"
        code={`Level                  Dirty   Non-repeat   Phantom
                       read    read         read
─────────────────────  ──────  ───────────  ────────
READ UNCOMMITTED       ✗       ✗            ✗
READ COMMITTED         ✓       ✗            ✗
REPEATABLE READ        ✓       ✓            ✓ (in InnoDB)
SERIALIZABLE           ✓       ✓            ✓

✓ = prevented   ✗ = possible`}
      />

      <CodeBlock
        language="sql"
        code={`-- Set for the next single transaction.
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;
-- ...
COMMIT;

-- Set for the rest of the session.
SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED;

-- Globally (DBA territory).
SET GLOBAL TRANSACTION ISOLATION LEVEL READ COMMITTED;`}
      />

      <Steps>
        <Step
          title="READ UNCOMMITTED — almost never use it"
          summary="Reads can see uncommitted writes from other transactions. Useful only for crude monitoring queries."
        />

        <Step
          title="READ COMMITTED — Postgres / Oracle default"
          summary="Reads only see committed data. Each statement gets a fresh snapshot. Phantoms and non-repeatable reads can occur."
        >
          <p>
            Often a better fit for OLTP than REPEATABLE READ — fewer
            gap locks, less contention, predictable behavior.
          </p>
        </Step>

        <Step
          title="REPEATABLE READ — MySQL default"
          summary="Each transaction sees a consistent snapshot taken at its start. InnoDB extends this to prevent phantoms via gap locks."
        >
          <p>
            The InnoDB twist: standard SQL allows phantoms here, but
            InnoDB&apos;s gap locks prevent them too. So InnoDB&apos;s
            REPEATABLE READ is closer to SERIALIZABLE in practice — at
            the cost of more locking.
          </p>
        </Step>

        <Step
          title="SERIALIZABLE — strict, slow"
          summary="Reads behave like SELECT ... FOR SHARE. Every read takes a lock. Use only when correctness can't compromise."
        />
      </Steps>

      <H2 id="innodb-defaults">InnoDB defaults and behavior</H2>

      <KeyConcepts
        items={[
          {
            title: "Default: REPEATABLE READ",
            body: "Set by tradition more than design. Some teams switch to READ COMMITTED for higher write throughput.",
          },
          {
            title: "MVCC under the hood",
            body: "Reads use snapshots, writes acquire row locks. Most reads don't block writes and vice versa.",
          },
          {
            title: "Gap locks under REPEATABLE READ",
            body: "InnoDB locks the gap between rows to prevent phantoms. Reduces concurrency, especially with range queries on indexed columns.",
          },
          {
            title: "Auto-rollback on deadlock",
            body: "When InnoDB detects a deadlock it picks a victim (usually the smaller transaction), rolls it back, and returns ERROR 1213. Your app must retry.",
          },
        ]}
      />

      <H2 id="select-for-update">Locking reads: SELECT ... FOR UPDATE</H2>
      <p>
        Sometimes a read is really &ldquo;reserve this row for me to
        update next.&rdquo; Two clauses for that.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Exclusive lock — blocks other readers/writers from changing it.
SELECT id, balance FROM accounts WHERE id = 1 FOR UPDATE;
UPDATE accounts SET balance = balance - 100 WHERE id = 1;

-- Shared lock — blocks writers, allows other shared readers.
SELECT id, balance FROM accounts WHERE id = 1 FOR SHARE;`}
      />

      <Callout variant="warn" title="Don't lock more than you must">
        <code>FOR UPDATE</code> on a non-indexed column locks the whole
        table&apos;s gap structure. Always lock through a primary or
        unique key with a tight predicate.
      </Callout>

      <H2 id="deadlocks">Deadlocks</H2>
      <p>
        Two transactions, two rows, opposite order. Classic deadlock:
      </p>

      <CodeBlock
        language="sql"
        code={`-- Session A
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 1;   -- locks row 1
UPDATE accounts SET balance = balance + 50 WHERE id = 2;   -- waits for B
COMMIT;

-- Session B
BEGIN;
UPDATE accounts SET balance = balance - 50 WHERE id = 2;   -- locks row 2
UPDATE accounts SET balance = balance + 50 WHERE id = 1;   -- waits for A
COMMIT;`}
      />

      <Terminal title="deadlock — mysql">
        <AnimatedSpan className="text-amber-300">
          <span>ERROR 1213 (40001): Deadlock found when trying to get lock;</span>
          <span>try restarting transaction</span>
        </AnimatedSpan>
      </Terminal>

      <KeyConcepts
        items={[
          {
            title: "Always lock in the same order",
            body: "Transfer between accounts? ORDER BY id ASC FOR UPDATE — both transactions lock low-id-first. Deadlock impossible.",
          },
          {
            title: "Keep transactions short",
            body: "Long transactions hold locks longer, multiplying deadlock probability. Move slow work (HTTP calls, file I/O) outside.",
          },
          {
            title: "Retry on 1213",
            body: "Deadlocks are part of normal operation. Wrap transactional code in a retry loop with backoff.",
          },
          {
            title: "SHOW ENGINE INNODB STATUS",
            body: "Prints the last detected deadlock with the SQL of both sides. The first thing to read when one fires.",
          },
        ]}
      />

      <Recap
        items={[
          "Transactions are atomic units; ACID is the contract InnoDB upholds.",
          "Four anomalies: dirty / non-repeatable / phantom reads, lost updates.",
          "Four isolation levels — MySQL defaults to REPEATABLE READ; consider READ COMMITTED for write-heavy OLTP.",
          "InnoDB uses MVCC + row + gap locks; SELECT ... FOR UPDATE reserves rows.",
          "Deadlocks happen — lock in consistent order, keep transactions short, retry on 1213.",
        ]}
      />
    </>
  ),
};
