import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "users-privileges",
  number: "09.01",
  title: "Users, roles, and privileges",
  description:
    "CREATE USER, GRANT, roles, and the principle-of-least-privilege defaults that prevent the next breach from being yours.",
  duration: "12 min",
  tags: ["users", "grant", "security", "rbac"],
  headings: [
    { id: "the-mental-model", text: "The mental model", depth: 2 },
    { id: "creating-users", text: "Creating users", depth: 2 },
    { id: "grant-and-revoke", text: "GRANT and REVOKE", depth: 2 },
    { id: "roles", text: "Roles (8.0+)", depth: 2 },
    { id: "least-privilege-defaults", text: "Least-privilege defaults", depth: 2 },
    { id: "auditing-access", text: "Auditing access", depth: 2 },
    { id: "common-mistakes", text: "Common mistakes", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        A MySQL user is identified by <code>user@host</code> — a name
        and the location they connect from. Privileges are stamped onto
        them; roles bundle privileges. Every production database needs
        a few service accounts, none of them <code>root</code>, and
        none with <code>ALL PRIVILEGES</code>.
      </p>

      <Prerequisites
        items={[
          "Admin access to your MySQL playground (root, or a user with GRANT OPTION).",
          "DDL from chapter 5 — privileges are bound to schemas, tables, and columns.",
          "An app or two whose access you'd like to lock down.",
        ]}
      />

      <H2 id="the-mental-model">The mental model</H2>

      <KeyConcepts
        items={[
          {
            title: "user@host",
            body: "Identity. ana@'%' (any host), ana@'10.0.%' (one subnet), ana@'localhost' (UNIX socket only). Restrict the host as tightly as you can.",
          },
          {
            title: "Privileges",
            body: "What this user can do. Granted at four scopes: global (*.*), database (db.*), table (db.t), column (db.t (col)).",
          },
          {
            title: "Roles (8.0+)",
            body: "Named bundles of privileges. Grant role to user; user inherits everything in the role. Reduces 100-line GRANT statements to one.",
          },
          {
            title: "Authentication plugins",
            body: "caching_sha2_password is the default in 8.0. mysql_native_password is the legacy compatibility option. Pick one consistently per service.",
          },
        ]}
      />

      <H2 id="creating-users">Creating users</H2>

      <CodeBlock
        language="sql"
        code={`-- App user, restricted to a subnet, modern auth.
CREATE USER 'app'@'10.0.%'
  IDENTIFIED WITH caching_sha2_password BY 'STRONG_RANDOM_HERE';

-- Read-only analytics user, all hosts.
CREATE USER 'readonly'@'%'
  IDENTIFIED BY 'ANOTHER_STRONG_RANDOM';

-- Inspect / drop.
SELECT user, host, plugin FROM mysql.user;
ALTER  USER 'app'@'10.0.%' IDENTIFIED BY 'NEW_PASSWORD';
DROP   USER 'app'@'10.0.%';`}
      />

      <Callout variant="warn" title="Don't put passwords in shell history">
        Use <code>mysql_config_editor</code> (binary login paths) or a
        secrets manager (HashiCorp Vault, AWS Secrets Manager). A
        password typed inline ends up in <code>.mysql_history</code>{" "}
        and your shell&apos;s history file.
      </Callout>

      <H2 id="grant-and-revoke">GRANT and REVOKE</H2>

      <CodeBlock
        language="sql"
        code={`-- App: read/write on its own schema.
GRANT SELECT, INSERT, UPDATE, DELETE
  ON   shop.*
  TO   'app'@'10.0.%';

-- Analytics: read-only across all schemas.
GRANT SELECT
  ON   *.*
  TO   'readonly'@'%';

-- Granular: only one column.
GRANT SELECT (id, email)
  ON   shop.users
  TO   'support'@'10.0.%';

-- Take it back.
REVOKE INSERT, UPDATE
  ON   shop.*
  FROM 'app'@'10.0.%';

-- Inspect what's granted.
SHOW GRANTS FOR 'app'@'10.0.%';`}
      />

      <KeyConcepts
        items={[
          {
            title: "DML privileges",
            body: "SELECT, INSERT, UPDATE, DELETE — what your app probably needs.",
          },
          {
            title: "DDL privileges",
            body: "CREATE, ALTER, DROP, INDEX, REFERENCES. Usually only for migration tooling and DBAs.",
          },
          {
            title: "Programmable privileges",
            body: "EXECUTE (procedures/functions), CREATE ROUTINE, TRIGGER. Match to who deploys what.",
          },
          {
            title: "Operational privileges",
            body: "PROCESS (see other connections), RELOAD (FLUSH commands), REPLICATION SLAVE, SUPER (now deprecated). Tightly scoped.",
          },
        ]}
      />

      <H2 id="roles">Roles (8.0+)</H2>

      <CodeBlock
        language="sql"
        filename="roles.sql"
        code={`-- Create roles and bundle privileges.
CREATE ROLE 'app_readonly', 'app_readwrite';

GRANT SELECT
  ON   shop.*
  TO   'app_readonly';

GRANT SELECT, INSERT, UPDATE, DELETE
  ON   shop.*
  TO   'app_readwrite';

-- Assign roles to users.
GRANT 'app_readwrite' TO 'app'@'10.0.%';
GRANT 'app_readonly'  TO 'readonly'@'%';

-- Activate them on session start (one-time setup).
SET DEFAULT ROLE ALL TO 'app'@'10.0.%';
SET DEFAULT ROLE ALL TO 'readonly'@'%';

-- See effective privileges.
SHOW GRANTS FOR 'app'@'10.0.%' USING 'app_readwrite';`}
      />

      <Callout variant="info" title="DEFAULT ROLE matters">
        Roles in MySQL aren&apos;t active until activated for the
        session. Set them as default roles, or app drivers must run{" "}
        <code>SET ROLE</code> after connecting. The first time you
        forget, the app gets &ldquo;permission denied&rdquo; for no
        apparent reason.
      </Callout>

      <H2 id="least-privilege-defaults">Least-privilege defaults</H2>

      <CodeBlock
        language="sql"
        filename="least-privilege.sql"
        code={`-- Service accounts (one per app, never share):
--   shop_app:    SELECT/INSERT/UPDATE/DELETE on shop.* only
--   shop_admin:  + DDL, used by the migration runner only
--   shop_ro:     SELECT, used by analytics & internal tooling
--   replication: REPLICATION SLAVE, REPLICATION CLIENT, used by replicas
--   backup:      RELOAD, LOCK TABLES, REPLICATION CLIENT, SELECT on the world

CREATE USER 'shop_app'@'10.0.%'  IDENTIFIED BY '...';
CREATE USER 'shop_admin'@'10.0.%' IDENTIFIED BY '...';
CREATE USER 'shop_ro'@'10.0.%'    IDENTIFIED BY '...';

GRANT SELECT, INSERT, UPDATE, DELETE   ON shop.* TO 'shop_app'@'10.0.%';
GRANT ALL PRIVILEGES                   ON shop.* TO 'shop_admin'@'10.0.%';
GRANT SELECT                           ON shop.* TO 'shop_ro'@'10.0.%';

-- Never let the app read other apps' schemas — lateral movement risk.`}
      />

      <KeyConcepts
        items={[
          {
            title: "One user per app",
            body: "Sharing a 'web' user across services means an exploit in any one of them gives access to all schemas. Per-app users + per-app schemas = blast radius is finite.",
          },
          {
            title: "Separate read and write paths",
            body: "Analytics and admin dashboards rarely need write. Issue read-only credentials by default; require justification for write access.",
          },
          {
            title: "Migration users have temporary DDL",
            body: "Your app's runtime user has no DDL. The migration runner gets ALTER / CREATE / DROP — and only during deploys.",
          },
          {
            title: "Rotate passwords",
            body: "Quarterly is the floor. Build the rotation into your deployment pipeline so it's not a human task.",
          },
        ]}
      />

      <H2 id="auditing-access">Auditing access</H2>

      <CodeBlock
        language="sql"
        code={`-- Who can do what?
SELECT user, host, plugin, password_expired, account_locked
FROM   mysql.user
ORDER  BY user;

-- Who's currently connected?
SELECT user, host, db, command, time, state
FROM   information_schema.processlist;

-- Per-user privilege snapshot.
SHOW GRANTS FOR 'shop_app'@'10.0.%';

-- Lock an account (no logins, can be restored).
ALTER USER 'shop_app'@'10.0.%' ACCOUNT LOCK;
ALTER USER 'shop_app'@'10.0.%' ACCOUNT UNLOCK;`}
      />

      <Callout variant="pro" title="Audit log plugins">
        MySQL Enterprise has an audit log plugin; Percona Server
        ships an open-source one. Both record every connection and
        statement to a file or syslog. For regulated workloads
        (PCI, HIPAA), this is non-negotiable.
      </Callout>

      <H2 id="common-mistakes">Common mistakes</H2>

      <KeyConcepts
        items={[
          {
            title: "GRANT ALL PRIVILEGES ON *.*",
            body: "The first thing to grep for in any new repo. Almost always wrong. Scope it down to the minimum the app actually needs.",
          },
          {
            title: "Wildcards on host",
            body: "user@'%' lets the user log in from anywhere on the network. Tighten to a subnet or specific host whenever possible.",
          },
          {
            title: "Sharing the root user",
            body: "Root has GRANT OPTION and SUPER privileges. App config files don't need that. Per-app users with the smallest set of grants.",
          },
          {
            title: "Forgetting REVOKE on departure",
            body: "When an engineer leaves, their SSH key gets removed. Their MySQL user often doesn't. Audit mysql.user quarterly.",
          },
        ]}
      />

      <Recap
        items={[
          "Identity is user@host; tighten the host whenever possible.",
          "Grant at the smallest scope that works: column < table < db < global.",
          "Roles (8.0+) bundle privileges; SET DEFAULT ROLE makes them active by default.",
          "One user per app, separate read/write/migration users, no app uses root.",
          "Audit mysql.user regularly and rotate credentials on a schedule.",
        ]}
      />
    </>
  ),
};
