import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
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
  slug: "setup",
  number: "01.02",
  title: "Setup — your playground database",
  description:
    "Get a working SQL environment in under a minute — SQLite for the early chapters, MySQL via Docker for everything that comes after.",
  duration: "10 min",
  tags: ["setup", "sqlite", "mysql", "tooling"],
  headings: [
    { id: "what-youll-build", text: "What you'll build", depth: 2 },
    { id: "pick-your-path", text: "Pick your path: SQLite or MySQL", depth: 2 },
    { id: "walkthrough-sqlite", text: "Path A: SQLite (fastest start)", depth: 2 },
    { id: "walkthrough-mysql", text: "Path B: MySQL via Docker", depth: 2 },
    { id: "alternative-postgres", text: "Alternative: Postgres locally", depth: 2 },
    { id: "troubleshooting", text: "Troubleshooting", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Theory without a keyboard is wasted. Before lesson 3 we need a real
        schema you can throw queries at. This lesson gives you a working
        environment in under a minute and seeds it with the data we&apos;ll
        use across the course.
      </p>

      <Prerequisites
        items={[
          "A terminal you're comfortable in (Terminal.app, iTerm2, or Windows Terminal).",
          "Roughly 5 MB of disk space for the playground database.",
          "No cloud account. No Docker required (Postgres path is optional).",
        ]}
      />

      <H2 id="what-youll-build">What you&apos;ll build</H2>

      <KeyConcepts
        items={[
          {
            title: "A local SQLite database",
            body: "A single file (playground.db) holding two tables — users and orders — that we'll grow over the course.",
          },
          {
            title: "A reusable seed script",
            body: "A copy-pasteable seed.sql you can re-run any time you want a clean slate.",
          },
          {
            title: "A REPL workflow",
            body: "Open the database in your terminal, configure pretty output, and run queries from your editor.",
          },
          {
            title: "A verified setup",
            body: "A small smoke test query that confirms everything works before lesson 3.",
          },
        ]}
      />

      <H2 id="pick-your-path">Pick your path: SQLite or MySQL</H2>
      <p>
        This course teaches portable SQL first, then dives into
        MySQL-specific topics from chapter 5 onwards. You have two viable
        ways to follow along — pick one now, you can switch later.
      </p>

      <KeyConcepts
        items={[
          {
            title: "SQLite — for chapters 1–4",
            body: "Single-file database, zero install on macOS/Linux. Use this if you want to start writing queries in 30 seconds.",
          },
          {
            title: "MySQL — for chapters 5–10",
            body: "The whole second half (DDL, indexes, transactions, replication) targets MySQL 8 specifically. Set it up once with Docker and forget it.",
          },
          {
            title: "Run both in parallel",
            body: "What I do at work. SQLite for quick playgrounds, a long-running MySQL container for anything realistic.",
          },
          {
            title: "No cloud accounts needed",
            body: "Everything runs locally. Total disk: under 500 MB even with both engines installed.",
          },
        ]}
      />

      <H2 id="walkthrough-sqlite">Path A: SQLite (fastest start)</H2>

      <p>
        SQLite ships with macOS and most Linux distros. It&apos;s a single
        binary, zero config, and behaves close enough to Postgres for
        learning purposes. Pick this path unless you already work with
        Postgres at your job.
      </p>

      <Steps>
        <Step
          title="Confirm SQLite is installed"
          summary="Almost every modern system has it. If not, install it from your package manager."
        >
          <CodeBlock
            language="bash"
            code={`# Check the version. Anything 3.30+ works for this course.
sqlite3 --version

# macOS — already installed.
# Linux — install if missing:
sudo apt install sqlite3   # Debian/Ubuntu
sudo dnf install sqlite    # Fedora/RHEL
# Windows — winget install SQLite.SQLite
#           or grab a binary from sqlite.org/download.html`}
          />
        </Step>

        <Step
          title="Open a fresh database"
          summary="The file is created the first time you connect to it."
        >
          <Terminal
            title="setup — bash"
            copyText={`> sqlite3 playground.db
SQLite version 3.43 — Enter ".help" for usage hints.
sqlite> .mode column
sqlite> .headers on`}
          >
            <TypingAnimation>{"> sqlite3 playground.db"}</TypingAnimation>
            <AnimatedSpan className="text-emerald-400">
              <span>{`SQLite version 3.43 — Enter ".help" for usage hints.`}</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-[#a89e8f]">
              <span>sqlite&gt; .mode column</span>
              <span>sqlite&gt; .headers on</span>
            </AnimatedSpan>
            <TypingAnimation className="text-amber-300" duration={28}>
              Two dot-commands worth memorising: column output, headers on.
            </TypingAnimation>
          </Terminal>

          <Callout variant="tip" title="Quality-of-life dot commands">
            Run <code>.help</code> any time to see them all. The two above
            (<code>.mode column</code>, <code>.headers on</code>) make output
            tabular and labelled — the difference between &ldquo;readable&rdquo;
            and &ldquo;a wall of pipes.&rdquo;
          </Callout>
        </Step>

        <Step
          title="Paste the seed schema"
          summary="Two tables, six users, six orders — enough for the next four lessons."
        >
          <CodeBlock
            language="sql"
            filename="seed.sql"
            code={`CREATE TABLE users (
  id         INTEGER PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  country    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (email, name, country) VALUES
  ('ana@ex.com',  'Ana Lopez',     'ES'),
  ('ben@ex.com',  'Ben Tanaka',    'JP'),
  ('cam@ex.com',  'Cam Williams',  'GB'),
  ('dee@ex.com',  'Dee Patel',     'IN'),
  ('eli@ex.com',  'Eli Schwartz',  'US'),
  ('fei@ex.com',  'Fei Chen',      'SG');

CREATE TABLE orders (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id),
  amount     DECIMAL(10, 2) NOT NULL,
  status     TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'refunded')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO orders (user_id, amount, status) VALUES
  (1, 49.00,  'paid'),
  (1, 19.00,  'paid'),
  (2, 129.00, 'pending'),
  (3, 79.00,  'paid'),
  (3, 29.00,  'refunded'),
  (5, 999.00, 'paid');
-- note: users 4 and 6 placed no orders — that's deliberate.`}
          />
          <p>
            Save the block above as <code>seed.sql</code> next to your
            database file, then load it from inside the <code>sqlite3</code>{" "}
            session:
          </p>
          <CodeBlock
            language="bash"
            code={`sqlite> .read seed.sql`}
          />
        </Step>

        <Step
          title="Verify it works"
          summary="Run a smoke-test query. If you see six rows, you're done."
        >
          <CodeBlock
            language="sql"
            code={`SELECT id, name, country FROM users ORDER BY id;`}
          />

          <Terminal title="result — sqlite3">
            <AnimatedSpan className="text-[#a89e8f]">
              <span>id  name           country</span>
              <span>--  -------------  -------</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-[#d8d1c2]">
              <span>1   Ana Lopez      ES</span>
              <span>2   Ben Tanaka     JP</span>
              <span>3   Cam Williams   GB</span>
              <span>4   Dee Patel      IN</span>
              <span>5   Eli Schwartz   US</span>
              <span>6   Fei Chen       SG</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-emerald-400">
              <span>(6 rows — chapter 2 is unlocked.)</span>
            </AnimatedSpan>
          </Terminal>
        </Step>
      </Steps>

      <H2 id="walkthrough-mysql">Path B: MySQL via Docker</H2>
      <p>
        From chapter 5 we use MySQL-only features —{" "}
        <code>AUTO_INCREMENT</code>, <code>ENUM</code>, storage engines,{" "}
        <code>EXPLAIN ANALYZE</code>, replication. Spinning up MySQL 8 in
        Docker takes about a minute and gives you a clean, disposable
        environment that matches the lessons exactly.
      </p>

      <Steps>
        <Step
          title="Start a MySQL 8 container"
          summary="One docker run command. The data lives in a named volume so it survives restarts."
        >
          <CodeBlock
            language="bash"
            code={`docker run --name mysql-playground \\
  -e MYSQL_ROOT_PASSWORD=dev \\
  -e MYSQL_DATABASE=playground \\
  -p 3306:3306 \\
  -v mysql-playground-data:/var/lib/mysql \\
  -d mysql:8.4

# Verify it's healthy (takes ~10 seconds on first boot)
docker logs mysql-playground 2>&1 | grep "ready for connections"`}
          />

          <Callout variant="info" title="Why MySQL 8.4">
            8.4 is the current LTS as of 2024. Window functions, CTEs, and
            JSON functions all work the same in 8.0+ — but 8.4 is what
            you&apos;ll most likely run in production for the next few
            years.
          </Callout>
        </Step>

        <Step
          title="Connect with the mysql CLI"
          summary="The official client. Ships in the same image, so you can run it from the container."
        >
          <Terminal
            title="connect — bash"
            copyText={`> docker exec -it mysql-playground mysql -uroot -pdev playground
mysql> SELECT VERSION();`}
          >
            <TypingAnimation>
              {"> docker exec -it mysql-playground mysql -uroot -pdev playground"}
            </TypingAnimation>
            <AnimatedSpan className="text-emerald-400">
              <span>{`Welcome to the MySQL monitor.  Commands end with ; or \\g.`}</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-[#a89e8f]">
              <span>{`mysql> SELECT VERSION();`}</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-[#d8d1c2]">
              <span>+-----------+</span>
              <span>| VERSION() |</span>
              <span>+-----------+</span>
              <span>| 8.4.0     |</span>
              <span>+-----------+</span>
            </AnimatedSpan>
          </Terminal>

          <Callout variant="tip" title="Install mysql locally instead">
            If you&apos;d rather not type <code>docker exec</code> every
            time, install the client on your host:
            <br />
            <code>brew install mysql-client</code> (macOS),{" "}
            <code>sudo apt install mysql-client</code> (Debian/Ubuntu).
            Then connect with{" "}
            <code>mysql -h 127.0.0.1 -uroot -pdev playground</code>.
          </Callout>
        </Step>

        <Step
          title="Load the MySQL seed schema"
          summary="Same shape as the SQLite seed, with MySQL-native types and an InnoDB engine."
        >
          <CodeBlock
            language="sql"
            filename="seed.mysql.sql"
            code={`CREATE TABLE users (
  id          INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email       VARCHAR(255) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  country     CHAR(2) NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (email, name, country) VALUES
  ('ana@ex.com',  'Ana Lopez',     'ES'),
  ('ben@ex.com',  'Ben Tanaka',    'JP'),
  ('cam@ex.com',  'Cam Williams',  'GB'),
  ('dee@ex.com',  'Dee Patel',     'IN'),
  ('eli@ex.com',  'Eli Schwartz',  'US'),
  ('fei@ex.com',  'Fei Chen',      'SG');

CREATE TABLE orders (
  id          INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  amount      DECIMAL(10, 2) NOT NULL,
  status      ENUM('paid','pending','refunded') NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO orders (user_id, amount, status) VALUES
  (1, 49.00,  'paid'),
  (1, 19.00,  'paid'),
  (2, 129.00, 'pending'),
  (3, 79.00,  'paid'),
  (3, 29.00,  'refunded'),
  (5, 999.00, 'paid');`}
          />

          <p>
            Save the block as <code>seed.mysql.sql</code> on your host,
            then load it. Two equivalent options:
          </p>

          <CodeBlock
            language="bash"
            code={`# Option 1: from your shell
docker exec -i mysql-playground mysql -uroot -pdev playground \\
  < seed.mysql.sql

# Option 2: from inside an interactive mysql session
mysql> SOURCE /path/to/seed.mysql.sql;`}
          />
        </Step>

        <Step
          title="Verify it works"
          summary="Same smoke test as the SQLite path."
        >
          <CodeBlock
            language="sql"
            code={`SELECT id, name, country FROM users ORDER BY id;`}
          />

          <Terminal title="result — mysql">
            <AnimatedSpan className="text-[#a89e8f]">
              <span>+----+--------------+---------+</span>
              <span>| id | name         | country |</span>
              <span>+----+--------------+---------+</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-[#d8d1c2]">
              <span>|  1 | Ana Lopez    | ES      |</span>
              <span>|  2 | Ben Tanaka   | JP      |</span>
              <span>|  3 | Cam Williams | GB      |</span>
              <span>|  4 | Dee Patel    | IN      |</span>
              <span>|  5 | Eli Schwartz | US      |</span>
              <span>|  6 | Fei Chen     | SG      |</span>
              <span>+----+--------------+---------+</span>
            </AnimatedSpan>
            <AnimatedSpan className="text-emerald-400">
              <span>6 rows in set (0.00 sec)</span>
            </AnimatedSpan>
          </Terminal>
        </Step>

        <Step
          title="Pick a GUI (optional)"
          summary="The CLI is enough for this course. A GUI helps once schemas grow."
        >
          <p>
            Three solid free options — pick whichever feels right:
          </p>
          <ul>
            <li>
              <strong>MySQL Workbench</strong> — official, heavyweight,
              great for ER diagrams.
            </li>
            <li>
              <strong>DBeaver</strong> — open-source, multi-engine. The
              one I keep installed.
            </li>
            <li>
              <strong>TablePlus</strong> — paid but cheap, slick UI,
              works on macOS/Windows.
            </li>
          </ul>
        </Step>
      </Steps>

      <Callout variant="pro" title="Stop and start without losing data">
        <code>docker stop mysql-playground</code> shuts it down.{" "}
        <code>docker start mysql-playground</code> brings it back. The
        named volume <code>mysql-playground-data</code> survives both.
        Only <code>docker rm -v</code> wipes it.
      </Callout>

      <H2 id="alternative-postgres">Alternative: Postgres locally</H2>
      <p>
        If you already work with Postgres at your job, run the local copy.
        The dialect differences are tiny and we&apos;ll call them out when
        they matter.
      </p>

      <CodeBlock
        language="bash"
        code={`# macOS
brew install postgresql@16
brew services start postgresql@16
createdb playground
psql playground

# Docker (any platform)
docker run --name pg -e POSTGRES_PASSWORD=dev \\
  -p 5432:5432 -d postgres:16
psql postgresql://postgres:dev@localhost:5432/postgres`}
      />

      <Callout variant="info" title="Pick one and stick with it">
        You&apos;ll learn faster if your environment matches the lessons. I
        write everything against SQLite first; switch to Postgres only if
        you&apos;re already comfortable.
      </Callout>

      <H2 id="troubleshooting">Troubleshooting</H2>

      <KeyConcepts
        items={[
          {
            title: "“sqlite3: command not found”",
            body: "Your PATH doesn't include the SQLite binary. Install via your package manager (see step 1) or open a new terminal session.",
          },
          {
            title: "“no such file: seed.sql”",
            body: "Run sqlite3 from the same directory as seed.sql, or pass an absolute path: .read /full/path/to/seed.sql",
          },
          {
            title: "Output looks like one long line",
            body: "You forgot .mode column and .headers on. Run them once per session — or save them in ~/.sqliterc to make them permanent.",
          },
          {
            title: "MySQL: “Can't connect — port 3306 in use”",
            body: "Another MySQL is already running. Stop it (brew services stop mysql) or change the host port: -p 3307:3306, then connect with -P 3307.",
          },
          {
            title: "MySQL: “Access denied for user 'root'”",
            body: "The container only sets the password on first boot. If you changed MYSQL_ROOT_PASSWORD after creation, recreate the container: docker rm -fv mysql-playground and rerun the docker run command.",
          },
          {
            title: "MySQL: “mysql: command not found”",
            body: "Either use docker exec -it mysql-playground mysql ..., or install the client locally (brew install mysql-client / apt install mysql-client).",
          },
          {
            title: "Postgres: permission denied",
            body: "On macOS, brew services start postgresql@16 must finish before createdb works. Re-run after a few seconds.",
          },
        ]}
      />

      <Recap
        items={[
          <>You have at least one working playground — SQLite, MySQL, or both.</>,
          <>SQLite covers chapters 1–4. MySQL is required for chapters 5+.</>,
          <>Two dot-commands keep SQLite output readable: <code>.mode column</code> and <code>.headers on</code>.</>,
          <>The MySQL container survives stop/start; only <code>docker rm -v</code> wipes the volume.</>,
          <>Smoke test passes — you&apos;re ready for chapter 1.3.</>,
        ]}
      />
    </>
  ),
};
