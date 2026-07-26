import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "backup-restore",
  number: "09.02",
  title: "Backup and restore",
  description:
    "Logical and physical backups, point-in-time recovery, and the only thing that matters: a tested restore process.",
  duration: "14 min",
  tags: ["backup", "restore", "mysqldump", "xtrabackup", "binlog"],
  headings: [
    { id: "the-only-rule", text: "The only rule that matters", depth: 2 },
    { id: "logical-vs-physical", text: "Logical vs physical backups", depth: 2 },
    { id: "mysqldump", text: "mysqldump — the workhorse", depth: 2 },
    { id: "mysqlpump-mysqlsh", text: "mysqlpump and MySQL Shell dumps", depth: 2 },
    { id: "physical-backups", text: "Physical backups (XtraBackup)", depth: 2 },
    { id: "point-in-time-recovery", text: "Point-in-time recovery", depth: 2 },
    { id: "test-the-restore", text: "Test the restore", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Backups are easy. Restores are the hard part. The first time
        you run the restore in anger, you don&apos;t want to be
        reading the manual. This lesson is the practical guide to
        backing up MySQL — and, more importantly, to verifying you
        can put the data back.
      </p>

      <Prerequisites
        items={[
          "MySQL playground from lesson 1.2 (Docker path).",
          "A few hundred MB of free disk space for backup files.",
          "Permission to run shell commands (we'll use mysqldump and tar).",
        ]}
      />

      <H2 id="the-only-rule">The only rule that matters</H2>
      <p>
        <strong>An untested backup is not a backup.</strong> Plenty of
        teams discover after a disaster that the dump file is corrupt,
        the credentials don&apos;t work on the new host, or the binlog
        files were rotated before they could be replayed.
      </p>

      <Callout variant="pro" title="The 3-2-1 rule">
        Three copies of the data, on two different media, one of them
        offsite. For most modern setups: live database + same-region
        backup bucket + cross-region or different-provider archive.
      </Callout>

      <H2 id="logical-vs-physical">Logical vs physical backups</H2>

      <KeyConcepts
        items={[
          {
            title: "Logical — SQL statements",
            body: "mysqldump, mysqlpump, mysqlsh dump. Output is INSERT/CREATE statements. Portable, human-readable, slow to restore at scale.",
          },
          {
            title: "Physical — data files",
            body: "Percona XtraBackup. Copies InnoDB files directly. Fast to restore, but the destination must run the same MySQL version on a compatible OS.",
          },
          {
            title: "Snapshots — disk-level",
            body: "EBS snapshots, LVM snapshots, RDS snapshots. Effectively physical, with cloud-provider tooling. Fastest, but requires careful flushing or a running engine that handles it (RDS does).",
          },
          {
            title: "Replication is not a backup",
            body: "A replica protects against host failure. It does not protect against DROP TABLE or ransomware — both replicate. Always have actual backups in addition.",
          },
        ]}
      />

      <H2 id="mysqldump">mysqldump — the workhorse</H2>

      <CodeBlock
        language="bash"
        code={`# Full backup of one database — single transaction for InnoDB consistency.
mysqldump \\
  --host=127.0.0.1 \\
  --user=root \\
  --password \\
  --single-transaction \\
  --quick \\
  --routines \\
  --triggers \\
  --events \\
  --set-gtid-purged=OFF \\
  --databases playground \\
  | gzip -c > playground-$(date +%F).sql.gz

# Restore — note we recreate the database first.
gunzip -c playground-2025-01-15.sql.gz | mysql --user=root --password`}
      />

      <KeyConcepts
        items={[
          {
            title: "--single-transaction",
            body: "InnoDB-only. Takes a consistent snapshot via REPEATABLE READ. No table locks; safe on a live database.",
          },
          {
            title: "--quick + --skip-extended-insert",
            body: "Stream rows instead of buffering. Restore is slower with one INSERT per row but the dump file is friendlier to diff.",
          },
          {
            title: "--routines / --triggers / --events",
            body: "Default mysqldump skips these. Add the flags or your restore is missing stored procedures, triggers, and scheduled events.",
          },
          {
            title: "--set-gtid-purged",
            body: "Controls whether the dump records GTID info. OFF when restoring to a non-replication target; AUTO/ON when seeding a replica.",
          },
        ]}
      />

      <Callout variant="warn" title="mysqldump is slow at scale">
        Tens of millions of rows: minutes. Hundreds of millions:
        hours. Above that, switch to physical backups or per-table
        parallel dumping with <code>mysqlpump</code> /{" "}
        <code>mysqlsh dump</code>.
      </Callout>

      <H2 id="mysqlpump-mysqlsh">mysqlpump and MySQL Shell dumps</H2>

      <CodeBlock
        language="bash"
        code={`# mysqlpump — parallel dump (5.7+), deprecated in 8.0.34 in favor of mysqlsh.
mysqlpump --default-parallelism=4 --databases playground > dump.sql

# MySQL Shell — current best practice for fast logical dumps.
mysqlsh root@127.0.0.1 -- util dump-instance \\
  /backups/playground \\
  --threads=8 \\
  --compression=zstd

# Restore.
mysqlsh root@127.0.0.1 -- util load-dump \\
  /backups/playground \\
  --threads=8`}
      />

      <p>
        MySQL Shell&apos;s <code>util.dumpInstance</code> /{" "}
        <code>util.loadDump</code> is significantly faster than
        mysqldump for large databases — multi-threaded compression,
        chunked tables, and resumable. It&apos;s the modern default
        for logical backups.
      </p>

      <H2 id="physical-backups">Physical backups (XtraBackup)</H2>

      <CodeBlock
        language="bash"
        code={`# Full physical backup (Percona XtraBackup).
xtrabackup \\
  --backup \\
  --target-dir=/backups/full-$(date +%F) \\
  --user=backup \\
  --password=...

# Prepare (apply pending logs) — required before restore.
xtrabackup --prepare --target-dir=/backups/full-2025-01-15

# Restore — to a stopped MySQL with empty datadir.
systemctl stop mysql
xtrabackup --copy-back --target-dir=/backups/full-2025-01-15
chown -R mysql:mysql /var/lib/mysql
systemctl start mysql

# Incremental backups — chain off the full.
xtrabackup --backup \\
  --target-dir=/backups/inc-$(date +%F) \\
  --incremental-basedir=/backups/full-2025-01-15`}
      />

      <KeyConcepts
        items={[
          {
            title: "Faster than logical at scale",
            body: "Copies files directly. A 1 TB database backs up in minutes; mysqldump would take hours.",
          },
          {
            title: "Restore-time guarantees",
            body: "Restores in roughly the time it takes to copy the data files. No statement replay.",
          },
          {
            title: "Version-bound",
            body: "The XtraBackup version must match (or be newer than) the MySQL version. Restoring across major versions usually requires logical backup or upgrade-via-replica.",
          },
          {
            title: "Storage-only — no schema-only",
            body: "If you want 'schema without data,' logical backup is the only option. Physical is all-or-nothing.",
          },
        ]}
      />

      <H2 id="point-in-time-recovery">Point-in-time recovery (PITR)</H2>
      <p>
        Last night&apos;s backup is from 03:00. The accidental{" "}
        <code>DROP TABLE</code> happened at 14:32. PITR replays the
        binary log from 03:00 to 14:31 against a restored full
        backup — getting you to one statement before the disaster.
      </p>

      <CodeBlock
        language="bash"
        code={`# 1. Restore last night's backup to a recovery host.
gunzip -c playground-2025-01-15.sql.gz | mysql

# 2. Find the binlog files between then and the bad statement.
ls /var/lib/mysql/binlog.*

# 3. Replay them up to the moment before the disaster.
mysqlbinlog \\
  --stop-datetime='2025-01-15 14:32:00' \\
  /var/lib/mysql/binlog.000123 \\
  /var/lib/mysql/binlog.000124 \\
  | mysql

# Or stop at a specific GTID.
mysqlbinlog \\
  --exclude-gtids='aaaa...:1234567' \\
  /var/lib/mysql/binlog.000124 \\
  | mysql`}
      />

      <KeyConcepts
        items={[
          {
            title: "Binary logging must be ON",
            body: "log_bin = ON, server_id set, binlog_format = ROW. Without binlogs, PITR is impossible — only the latest backup is available.",
          },
          {
            title: "Binlogs must be retained",
            body: "binlog_expire_logs_seconds controls retention. 7 days is a reasonable floor; longer for regulated environments. Off-host copies for safety.",
          },
          {
            title: "GTID makes PITR easier",
            body: "With GTIDs, you can stop precisely at a transaction ID. Time-based recovery is approximate; transaction-based is exact.",
          },
          {
            title: "Restore-then-replay is slow",
            body: "PITR cost = backup restore time + binlog replay time. Optimize the backup so the replay is the only variable.",
          },
        ]}
      />

      <H2 id="test-the-restore">Test the restore</H2>

      <CodeBlock
        language="text"
        code={`Your restore drill (run quarterly, document the time):

  1. Pick a random recent backup file from cold storage.
  2. Spin up an empty MySQL instance (Docker is fine for this).
  3. Restore the backup. Time the operation.
  4. Spot-check critical tables: row counts, recent rows, schema integrity.
  5. If applicable, replay binlogs to a known checkpoint.
  6. Note: total time, any manual steps, anything that didn't work.
  7. File the runbook updates BEFORE you forget what you learned.`}
      />

      <Callout variant="pro" title="Automate it">
        A nightly job that restores yesterday&apos;s backup to a
        scratch instance and runs <code>SELECT COUNT(*)</code> per
        table is the cheapest insurance you&apos;ll ever buy. Failed
        restores then page someone the next morning, not at 3 a.m.
        during an outage.
      </Callout>

      <Recap
        items={[
          "Logical (mysqldump, mysqlsh) is portable and slow; physical (XtraBackup) is fast and version-bound.",
          "Replication is not a backup — DROP TABLE replicates too.",
          "Use --single-transaction, --routines, --triggers, --events with mysqldump; use mysqlsh for large databases.",
          "Point-in-time recovery requires binary logs — keep them and copy them off-host.",
          "Untested backups don't count. Drill the restore quarterly and time it.",
        ]}
      />
    </>
  ),
};
