import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "triggers",
  number: "08.03",
  title: "Triggers and events",
  description:
    "Code that fires automatically on row changes or schedules — the audit trails, denormalized counters, and the pitfalls of coupling logic to writes.",
  duration: "12 min",
  tags: ["triggers", "events", "audit"],
  headings: [
    { id: "what-a-trigger-is", text: "What a trigger is", depth: 2 },
    { id: "before-vs-after", text: "BEFORE vs AFTER", depth: 2 },
    { id: "audit-trail-example", text: "Example: audit trail", depth: 2 },
    { id: "maintained-counters", text: "Example: maintained counters", depth: 2 },
    { id: "scheduled-events", text: "Scheduled events", depth: 2 },
    { id: "the-trade-offs", text: "The trade-offs", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        A trigger fires automatically when an{" "}
        <code>INSERT</code>, <code>UPDATE</code>, or{" "}
        <code>DELETE</code> happens. An event fires on a schedule.
        Both let the database maintain invariants without the
        application&apos;s help — and both deserve careful thought
        before you reach for them.
      </p>

      <Prerequisites
        items={[
          "Stored procedures from lesson 8.2 — triggers share the syntax.",
          "Transactions from lesson 6.4 — triggers run inside the calling transaction.",
          "An idea you'd like to enforce automatically (audit, counter, derived field).",
        ]}
      />

      <H2 id="what-a-trigger-is">What a trigger is</H2>

      <KeyConcepts
        items={[
          {
            title: "Bound to a table + event",
            body: "BEFORE / AFTER × INSERT / UPDATE / DELETE — six possible trigger types per table.",
          },
          {
            title: "Runs in the same transaction",
            body: "If the trigger fails, the originating statement fails too. Same isolation level, same locks.",
          },
          {
            title: "Sees NEW and OLD rows",
            body: "INSERT triggers see NEW (the row being inserted). DELETE sees OLD. UPDATE sees both.",
          },
          {
            title: "Row-level only",
            body: "MySQL triggers fire once per row affected. No 'statement-level' triggers like Postgres has.",
          },
        ]}
      />

      <H2 id="before-vs-after">BEFORE vs AFTER</H2>

      <KeyConcepts
        items={[
          {
            title: "BEFORE",
            body: "Fires before the row is written. Can modify NEW.* — useful for normalization, default values, validation.",
          },
          {
            title: "AFTER",
            body: "Fires after the row is written. Can't modify the row anymore. Used for audit, cascading writes, derived values in other tables.",
          },
          {
            title: "FOR EACH ROW",
            body: "Required syntax. MySQL triggers always run row-by-row.",
          },
          {
            title: "Order across multiple triggers",
            body: "MySQL 5.7.2+ allows multiple triggers per event with FOLLOWS / PRECEDES to control order. Use sparingly — order-dependent triggers are hard to reason about.",
          },
        ]}
      />

      <H2 id="audit-trail-example">Example: audit trail</H2>

      <CodeBlock
        language="sql"
        filename="audit.sql"
        code={`CREATE TABLE order_audit (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  order_id     BIGINT UNSIGNED NOT NULL,
  changed_by   VARCHAR(64),
  action       ENUM('insert','update','delete') NOT NULL,
  old_status   VARCHAR(20),
  new_status   VARCHAR(20),
  changed_at   DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

DELIMITER //

CREATE TRIGGER trg_orders_audit_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF NEW.status <> OLD.status THEN
    INSERT INTO order_audit
      (order_id, changed_by, action, old_status, new_status)
    VALUES
      (OLD.id, USER(), 'update', OLD.status, NEW.status);
  END IF;
END //

CREATE TRIGGER trg_orders_audit_delete
AFTER DELETE ON orders
FOR EACH ROW
BEGIN
  INSERT INTO order_audit
    (order_id, changed_by, action, old_status)
  VALUES
    (OLD.id, USER(), 'delete', OLD.status);
END //

DELIMITER ;`}
      />

      <Callout variant="info" title="USER() and CURRENT_USER()">
        <code>USER()</code> returns the user as authenticated by the
        client (could be a definer chain). <code>CURRENT_USER()</code>{" "}
        returns the actually-authenticated identity. For audit, use{" "}
        <code>CURRENT_USER()</code> and consider passing an{" "}
        application-level user ID via session variable for finer-grained
        attribution.
      </Callout>

      <H2 id="maintained-counters">Example: maintained counters</H2>
      <p>
        A user&apos;s lifetime <code>order_count</code> kept in sync
        with the orders table — the canonical denormalized counter
        pattern.
      </p>

      <CodeBlock
        language="sql"
        code={`ALTER TABLE users
  ADD COLUMN order_count INT UNSIGNED NOT NULL DEFAULT 0;

DELIMITER //

CREATE TRIGGER trg_orders_after_insert
AFTER INSERT ON orders
FOR EACH ROW
BEGIN
  UPDATE users
  SET    order_count = order_count + 1
  WHERE  id = NEW.user_id;
END //

CREATE TRIGGER trg_orders_after_delete
AFTER DELETE ON orders
FOR EACH ROW
BEGIN
  UPDATE users
  SET    order_count = order_count - 1
  WHERE  id = OLD.user_id;
END //

CREATE TRIGGER trg_orders_after_update
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
  IF NEW.user_id <> OLD.user_id THEN
    UPDATE users SET order_count = order_count - 1 WHERE id = OLD.user_id;
    UPDATE users SET order_count = order_count + 1 WHERE id = NEW.user_id;
  END IF;
END //

DELIMITER ;`}
      />

      <Callout variant="warn" title="Don't trigger triggers">
        Triggers that update other tables can fire other triggers,
        which can fire others. The chain becomes a maze. Keep trigger
        logic shallow and one-hop; complex pipelines belong in
        application code or scheduled events.
      </Callout>

      <H2 id="scheduled-events">Scheduled events</H2>
      <p>
        MySQL has a built-in scheduler. Treat it like cron, embedded
        in the database — useful for housekeeping that doesn&apos;t
        belong in your app&apos;s deployment.
      </p>

      <CodeBlock
        language="sql"
        code={`-- Enable the scheduler globally (often off by default).
SET GLOBAL event_scheduler = ON;

DELIMITER //

CREATE EVENT ev_purge_audit_logs
ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 03:00:00'
DO
BEGIN
  DELETE FROM order_audit
  WHERE  changed_at < NOW() - INTERVAL 90 DAY;
END //

DELIMITER ;

-- Inspect / manage events.
SHOW EVENTS;
ALTER EVENT ev_purge_audit_logs DISABLE;
DROP EVENT ev_purge_audit_logs;`}
      />

      <KeyConcepts
        items={[
          {
            title: "ONE TIME or RECURRING",
            body: "ON SCHEDULE AT '2025-12-31 00:00:00' for one-shot. EVERY 1 DAY for recurring. Combine with STARTS / ENDS.",
          },
          {
            title: "Disabled by default in some configs",
            body: "Check event_scheduler. Cloud MySQL providers (RDS, Cloud SQL) often require explicit enabling.",
          },
          {
            title: "Replication aware",
            body: "Events run on the primary; replicas don't re-execute. Set ON COMPLETION PRESERVE if the event should survive after a one-shot run.",
          },
          {
            title: "Cron is often a better tool",
            body: "External cron / scheduler gives you logs, alerting, and visibility your app team already understands. MySQL events are tempting; reserve them for tasks that genuinely belong in the database.",
          },
        ]}
      />

      <H2 id="the-trade-offs">The trade-offs</H2>

      <KeyConcepts
        items={[
          {
            title: "Pro: invariants no app can break",
            body: "Triggers fire whether the write came from your app, an admin script, or a migration. The invariant survives.",
          },
          {
            title: "Pro: less round-tripping",
            body: "Audit logs and counters update in the same transaction without app coordination.",
          },
          {
            title: "Con: hidden behavior",
            body: "Reading the schema doesn't show what happens on write. New engineers find triggers by accident, usually during an outage.",
          },
          {
            title: "Con: harder to test",
            body: "Triggers run inside MySQL; unit tests can't easily mock them. Integration tests against a real database become mandatory.",
          },
          {
            title: "Con: replication and backup quirks",
            body: "mysqldump skips trigger code by default with --skip-triggers. Schema-only migrations need to handle triggers explicitly.",
          },
        ]}
      />

      <Recap
        items={[
          "Triggers fire BEFORE / AFTER × INSERT / UPDATE / DELETE — row-level, in the same transaction.",
          "BEFORE can modify NEW.*; AFTER is read-only on the row but can write to other tables.",
          "Common patterns: audit trails, maintained counters, derived fields.",
          "Events are MySQL's built-in cron — useful, but external schedulers are usually clearer.",
          "Triggers add hidden behavior; document them and prefer application logic when feasible.",
        ]}
      />
    </>
  ),
};
