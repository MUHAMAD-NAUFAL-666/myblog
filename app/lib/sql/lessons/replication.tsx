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
  slug: "replication",
  number: "09.03",
  title: "Replication and high availability",
  description:
    "How a primary streams writes to replicas, how to fail over without losing data, and the trade-offs between async, semi-sync, and group replication.",
  duration: "16 min",
  tags: ["replication", "ha", "gtid", "binlog"],
  headings: [
    { id: "the-mental-model", text: "The mental model", depth: 2 },
    { id: "the-three-modes", text: "The three replication modes", depth: 2 },
    { id: "step-by-step", text: "Step-by-step: setting up a replica", depth: 2 },
    { id: "monitoring-replication", text: "Monitoring replication", depth: 2 },
    { id: "read-write-split", text: "Read/write split — and its trap", depth: 2 },
    { id: "failover", text: "Failover", depth: 2 },
    { id: "ha-options", text: "HA options at a glance", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Replication keeps one or more replicas in sync with a primary
        by streaming the binary log. It&apos;s how you scale reads,
        survive a host failure, and run reporting without burning the
        primary&apos;s buffer pool. Modern MySQL gives you several
        flavors — pick by the consistency vs latency trade you can
        accept.
      </p>

      <Prerequisites
        items={[
          "Backup/restore from lesson 9.2 — replicas are usually seeded from a backup.",
          "Two MySQL instances you control. Two Docker containers work fine for the demo.",
          "Comfort with the mysql CLI and editing my.cnf.",
        ]}
      />

      <H2 id="the-mental-model">The mental model</H2>

      <KeyConcepts
        items={[
          {
            title: "Binary log on the primary",
            body: "Every committed change writes a binlog entry. With binlog_format = ROW, entries describe the row before/after — replication-safe regardless of triggers and stored procedures.",
          },
          {
            title: "I/O thread pulls events",
            body: "On the replica, an I/O thread connects to the primary, reads new binlog events, and writes them to the local 'relay log'.",
          },
          {
            title: "SQL thread applies events",
            body: "Reads the relay log and replays the writes against the replica's data. Single-threaded by default; multi-threaded with parallel applier (8.0+).",
          },
          {
            title: "GTID — global transaction IDs",
            body: "Every transaction gets a globally-unique ID. Failover and recovery become much easier because the replica knows exactly what it has applied.",
          },
        ]}
      />

      <H2 id="the-three-modes">The three replication modes</H2>

      <KeyConcepts
        items={[
          {
            title: "Asynchronous (default)",
            body: "Primary commits immediately, then ships the binlog. Lowest latency for writes; replicas can lag arbitrarily. Failover may lose the last few transactions.",
          },
          {
            title: "Semi-synchronous",
            body: "Primary waits for at least one replica to acknowledge receipt before commit returns. Slightly higher write latency; failover loses far less data.",
          },
          {
            title: "Group replication / InnoDB Cluster",
            body: "Multi-primary or single-primary with consensus. All members agree on writes via Paxos-like protocol. Higher complexity, real high-availability primitives.",
          },
          {
            title: "Logical replication tools",
            body: "Tools like Debezium read the binlog and ship changes to Kafka, Postgres, search indexes — same primitive, different consumer.",
          },
        ]}
      />

      <H2 id="step-by-step">Step-by-step: setting up a replica</H2>

      <Steps>
        <Step
          title="Configure the primary"
          summary="Enable binary logging, set a server ID, turn on GTIDs."
        >
          <CodeBlock
            language="bash"
            filename="my.cnf — primary"
            code={`[mysqld]
server_id              = 1
log_bin                = binlog
binlog_format          = ROW
gtid_mode              = ON
enforce_gtid_consistency = ON
binlog_expire_logs_seconds = 604800   # 7 days`}
          />
        </Step>

        <Step
          title="Create a replication user"
          summary="Replicas authenticate as a dedicated user, locked to REPLICATION SLAVE."
        >
          <CodeBlock
            language="sql"
            code={`CREATE USER 'repl'@'10.0.%'
  IDENTIFIED WITH caching_sha2_password BY 'STRONG_RANDOM';
GRANT REPLICATION SLAVE ON *.* TO 'repl'@'10.0.%';

-- Sanity check.
SELECT user, host FROM mysql.user WHERE user = 'repl';`}
          />
        </Step>

        <Step
          title="Seed the replica from a backup"
          summary="A consistent snapshot — physical (XtraBackup) for big data, logical (mysqldump --all-databases) for small."
        >
          <CodeBlock
            language="bash"
            code={`# Logical seed — fine for small databases.
mysqldump --all-databases --single-transaction \\
          --triggers --routines --events \\
          --master-data=2 --set-gtid-purged=ON \\
          | gzip > seed.sql.gz

# Restore on the replica.
gunzip -c seed.sql.gz | mysql -uroot -p`}
          />

          <Callout variant="info" title="--master-data=2">
            Records the binlog file/position (or GTID set) at the
            moment of the dump as a comment in the SQL file. The
            replica uses this to know where to start streaming from.
          </Callout>
        </Step>

        <Step
          title="Configure the replica"
          summary="Different server_id; otherwise same logging settings."
        >
          <CodeBlock
            language="bash"
            filename="my.cnf — replica"
            code={`[mysqld]
server_id              = 2
relay_log              = relay-bin
log_bin                = binlog
binlog_format          = ROW
gtid_mode              = ON
enforce_gtid_consistency = ON
read_only              = ON
super_read_only        = ON`}
          />
        </Step>

        <Step
          title="Point the replica at the primary"
          summary="CHANGE REPLICATION SOURCE TO + START REPLICA."
        >
          <CodeBlock
            language="sql"
            code={`CHANGE REPLICATION SOURCE TO
  SOURCE_HOST     = '10.0.0.1',
  SOURCE_USER     = 'repl',
  SOURCE_PASSWORD = 'STRONG_RANDOM',
  SOURCE_AUTO_POSITION = 1;       -- use GTIDs

START REPLICA;
SHOW REPLICA STATUS\\G`}
          />

          <Callout variant="info" title="The renamed commands">
            8.0.22 renamed <code>CHANGE MASTER TO</code> →{" "}
            <code>CHANGE REPLICATION SOURCE TO</code>,{" "}
            <code>START SLAVE</code> → <code>START REPLICA</code>,{" "}
            etc. The old keywords still work; the new names match
            the modern terminology.
          </Callout>
        </Step>
      </Steps>

      <H2 id="monitoring-replication">Monitoring replication</H2>

      <CodeBlock
        language="sql"
        code={`-- The big one. Read both threads' state.
SHOW REPLICA STATUS\\G

-- Key fields to watch:
--   Replica_IO_Running      = Yes
--   Replica_SQL_Running     = Yes
--   Seconds_Behind_Source   = 0       (lag in seconds, primary clock)
--   Last_IO_Error           = ''
--   Last_SQL_Error          = ''
--   Retrieved_Gtid_Set      = ...
--   Executed_Gtid_Set       = ...

-- Performance schema view of replication lag.
SELECT * FROM performance_schema.replication_applier_status_by_worker;`}
      />

      <Callout variant="warn" title="Seconds_Behind_Source lies">
        It measures the timestamp of the last applied event vs the
        replica&apos;s clock — useless if replication is fully
        caught up but the primary went idle, and misleading if
        clocks drift. For real lag monitoring, use a heartbeat
        table the primary updates every second; the replica reads
        it and computes lag against its own clock.
      </Callout>

      <H2 id="read-write-split">Read/write split — and its trap</H2>
      <p>
        A common pattern: writes go to the primary, reads to a
        replica. Lower load on the primary, more read capacity. The
        trap is replication lag.
      </p>

      <CodeBlock
        language="text"
        code={`The classic bug:

  1. App POSTs an update — write goes to primary.
  2. App immediately GETs the same record — read goes to replica.
  3. Replica hasn't applied the write yet (10ms behind, say).
  4. The user sees their update missing.
  5. They refresh. Now it's there. They file a ticket about flaky data.`}
      />

      <KeyConcepts
        items={[
          {
            title: "Read-after-write consistency",
            body: "After a write, route reads from the same user/session to the primary for a short window — or until the GTID has been applied on the replica.",
          },
          {
            title: "Sticky sessions",
            body: "Same connection, same node. Crude but works for sessions that don't span requests.",
          },
          {
            title: "Read your own writes",
            body: "Drivers that support GTID can record the latest committed GTID and wait for replicas to reach it before issuing the read.",
          },
          {
            title: "Tolerate the lag",
            body: "Sometimes a few hundred ms of staleness is fine — analytics dashboards, recommendations. Make the trade explicit.",
          },
        ]}
      />

      <H2 id="failover">Failover</H2>

      <CodeBlock
        language="sql"
        code={`-- On the replica that's about to be promoted:
STOP REPLICA;
RESET REPLICA ALL;       -- forget it was a replica
SET GLOBAL read_only = OFF;
SET GLOBAL super_read_only = OFF;

-- Update DNS / proxy / load balancer to point at the new primary.
-- Re-target other replicas at the new primary.
CHANGE REPLICATION SOURCE TO
  SOURCE_HOST = '10.0.0.42',     -- new primary
  SOURCE_AUTO_POSITION = 1;
START REPLICA;`}
      />

      <KeyConcepts
        items={[
          {
            title: "Manual failover is risky",
            body: "Choosing the right replica, syncing GTIDs, redirecting traffic — every step has a window where data can be lost or split-brain happens. Automated tools help.",
          },
          {
            title: "Orchestrator / mysqlsh",
            body: "MySQL Shell's InnoDB ReplicaSet, GitHub's Orchestrator, ProxySQL with topology awareness. Battle-tested orchestration; do not write your own from scratch.",
          },
          {
            title: "Cloud managed services",
            body: "RDS, Aurora, Cloud SQL, PlanetScale all do failover for you with documented RTO/RPO. Often the right answer for teams without a dedicated DBA.",
          },
          {
            title: "Practice failover",
            body: "Once a quarter, fail over in a staging environment. Time it. Document it. The first prod failover should not be the first time you've done one.",
          },
        ]}
      />

      <H2 id="ha-options">HA options at a glance</H2>

      <KeyConcepts
        items={[
          {
            title: "Primary + async replicas",
            body: "Cheapest. Read scale-out + manual failover. RPO seconds-to-minutes; RTO depends on your runbook.",
          },
          {
            title: "Primary + semi-sync replicas",
            body: "Same shape, tighter durability. Writes wait for at least one replica to acknowledge. RPO close to zero with healthy network.",
          },
          {
            title: "InnoDB Cluster (Group Replication)",
            body: "Native multi-node consensus. Automatic failover, single-primary or multi-primary mode. More moving parts; documented RTO of seconds.",
          },
          {
            title: "Managed (RDS / Aurora / Cloud SQL)",
            body: "Provider handles replication, failover, and backups. You give up some control; you get back a paid-for SLA.",
          },
          {
            title: "Vitess / PlanetScale",
            body: "Sharded MySQL with automated reshards and online schema changes. Operational complexity worth it at scale; overkill for most apps.",
          },
        ]}
      />

      <Recap
        items={[
          "Replication ships binlog events from primary to replicas; GTIDs make tracking and failover sane.",
          "Async = lowest write latency, replicas can lag. Semi-sync = stronger durability, slightly slower writes.",
          "Read/write split helps capacity; replication lag breaks read-after-write unless you handle it.",
          "Failover is rehearsed: automate with InnoDB Cluster / Orchestrator, or use a managed service.",
          "Replication is not a backup. You still need backups, and you still need to test restores.",
        ]}
      />
    </>
  ),
};
