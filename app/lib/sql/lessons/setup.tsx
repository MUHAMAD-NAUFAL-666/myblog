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
    "Get a working SQL environment in under a minute. No cloud accounts, no Docker (unless you want it), no excuses.",
  duration: "8 min",
  tags: ["setup", "sqlite", "tooling"],
  headings: [
    { id: "what-youll-build", text: "What you'll build", depth: 2 },
    { id: "walkthrough-sqlite", text: "Walkthrough: SQLite (recommended)", depth: 2 },
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

      <H2 id="walkthrough-sqlite">Walkthrough: SQLite (recommended)</H2>

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
            title: "Postgres: permission denied",
            body: "On macOS, brew services start postgresql@16 must finish before createdb works. Re-run after a few seconds.",
          },
        ]}
      />

      <Recap
        items={[
          <>You have a local <code>playground.db</code> with seeded data.</>,
          <>You can open it with <code>sqlite3 playground.db</code> any time.</>,
          <>You know the two dot-commands that make output readable: <code>.mode column</code> and <code>.headers on</code>.</>,
          <>You verified the setup with a six-row smoke test.</>,
        ]}
      />
    </>
  ),
};
