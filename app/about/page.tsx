import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/app/components/container";

export const metadata: Metadata = {
  title: "About",
  description:
    "Naufal is a senior frontend Developer with a decade of experience leading design systems and building durable interfaces.",
};

const experience = [
  {
    role: "Principal Frontend Developer",
    company: "Lumen Studio",
    period: "2022 — Present",
    summary:
      "Lead the design system and platform UI guild. Cut TTI 38% across the flagship app and shepherded the migration to React Server Components.",
  },
  {
    role: "Senior Frontend Developer",
    company: "Northwind",
    period: "2019 — 2022",
    summary:
      "Owned the component library used by 80+ Developer. Wrote the accessibility playbook still in use today.",
  },
  {
    role: "Frontend Developer",
    company: "Halyard Inc.",
    period: "2016 — 2019",
    summary:
      "Shipped the first dashboard rewrite from Backbone to React. Stayed long enough to clean up after my own tech debt.",
  },
];

const stack = [
  "TypeScript",
  "React 19",
  "Next.js 16",
  "React Server Components",
  "Tailwind v4",
  "vanilla-extract",
  "Storybook",
  "Playwright",
  "Vitest",
  "PostgreSQL",
  "Drizzle ORM",
  "Figma",
  "Radix Primitives",
  "Node.js",
];

const principles = [
  {
    title: "Durability over novelty",
    body: "The best frontend code is the code that's still readable in 2030.",
  },
  {
    title: "Accessibility as a quality bar",
    body: "Not a compliance checkbox bolted on at the end.",
  },
  {
    title: "Performance you can feel",
    body: "Numbers in a Lighthouse report are downstream of architectural decisions.",
  },
  {
    title: "Design and engineering, same conversation",
    body: "The earlier the meet, the cheaper the outcome.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-hero">
        <div aria-hidden className="absolute inset-0 bg-grain opacity-50" />
        <Container size="wide" className="relative py-20 sm:py-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            — About
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-[80px]">
            Engineer first.{" "}
            <span className="italic text-muted">Writer second.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            I&apos;ve spent the last ten years building interfaces that survive
            their own success — design systems that scale past their authors,
            apps that stay fast as the team grows, and codebases the next
            engineer can read without an introduction.
          </p>
        </Container>
      </section>

      {/* Short version */}
      <section className="py-20 sm:py-24">
        <Container size="narrow">
          <div className="prose">
            <h2>The short version</h2>
            <p>
              Senior frontend engineer based in Jakarta. I work at the
              intersection of design and engineering, with a strong bias toward
              the boring fundamentals: semantic HTML, accessible patterns,
              honest performance budgets, and APIs that age well.
            </p>
            <p>
              I&apos;ve led design systems at three companies, mentored more
              than sixty engineers, and shipped enough product to know which
              decisions matter and which are aesthetic preferences in disguise.
            </p>
          </div>
        </Container>
      </section>

      {/* Principles bento */}
      <section className="border-t border-border bg-surface-muted/40 py-20 sm:py-24">
        <Container size="wide">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            — Principles
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            What I care about, in four sentences.
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {principles.map((p, i) => (
              <div
                key={p.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-7 transition hover:border-border-strong"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-2xl leading-tight tracking-tight text-foreground">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Experience timeline */}
      <section className="py-20 sm:py-24">
        <Container size="wide">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            — Experience
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            Where I&apos;ve done the work.
          </h2>

          <ol className="mt-10 divide-y divide-border border-y border-border">
            {experience.map((item) => (
              <li
                key={item.company}
                className="grid gap-3 py-8 sm:grid-cols-[200px_1fr] sm:gap-10"
              >
                <div className="flex items-start gap-3 font-mono text-xs uppercase tracking-wider text-subtle">
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  {item.period}
                </div>
                <div>
                  <h3 className="font-serif text-xl tracking-tight text-foreground sm:text-2xl">
                    {item.role}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-foreground/80">
                    {item.company}
                  </p>
                  <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                    {item.summary}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Toolbox */}
      <section className="border-t border-border bg-surface-muted/40 py-20 sm:py-24">
        <Container size="wide">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            — Toolbox
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            What I reach for, today.
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            The list shifts, but the philosophy doesn&apos;t: pick boring tools
            with strong communities, then commit.
          </p>

          <ul className="mt-10 flex flex-wrap gap-2">
            {stack.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-foreground transition hover:border-border-strong hover:bg-background"
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Contact */}
      <section className="border-t border-border py-20 sm:py-24">
        <Container size="narrow" className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            — Get in touch
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            Working on something interesting?
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            I&apos;m selective about new work but always happy to talk shop.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:hello@naufal.dev"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              hello@naufal.dev
            </a>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted"
            >
              Read my writing
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
