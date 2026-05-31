import Link from "next/link";
import { Container } from "@/app/components/container";
import { PostCard } from "@/app/components/post-card";
import { NewsletterForm } from "@/app/components/newsletter-form";
import { HeroTerminal } from "@/app/components/hero-terminal";
import { Marquee } from "@/app/components/marquee";
import { getAllPosts, getFeaturedPosts } from "@/app/lib/posts";

const stack = [
  "TypeScript",
  "React 19",
  "Next.js 16",
  "React Server Components",
  "Tailwind v4",
  "PostgreSQL",
  "Drizzle ORM",
  "Playwright",
  "Storybook",
  "Radix Primitives",
  "Vitest",
  "Figma",
];

export default function Home() {
  const featured = getFeaturedPosts();
  const recent = getAllPosts().filter((p) => !p.featured).slice(0, 4);
  const totalPosts = getAllPosts().length;

  return (
    <>
      {/* ======================== Hero ======================== */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-hero">
        <div
          aria-hidden
          className="absolute inset-0 bg-grain opacity-[0.6]"
        />
        <div
          aria-hidden
          className="absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-accent/10 blur-3xl"
        />
        <Container size="wide" className="relative py-20 sm:py-24 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-16">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1 text-xs text-muted backdrop-blur">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-70" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-accent" />
                </span>
                Now writing — SQL course just shipped
              </div>

              <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[80px]">
                Notes from the
                <br />
                <span className="italic text-muted">edges of</span> the
                <br />
                browser.
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                I&apos;m{" "}
                <span className="text-foreground">Naufal</span>, a senior
                frontend Developer with a decade of shipping interfaces that
                hold up under real load. This is where I think out loud about
                the craft.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/blog"
                  className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition hover:opacity-90"
                >
                  Read the writing
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/docs/sql"
                  className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted"
                >
                  <DatabaseIcon className="size-4 text-accent" />
                  Learn SQL
                </Link>
              </div>
            </div>

            <div className="relative">
              <div
                aria-hidden
                className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-accent/20 via-transparent to-transparent blur-2xl"
              />
              <div className="relative">
                <HeroTerminal />
              </div>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 gap-8 border-t border-border pt-10 text-sm sm:grid-cols-4">
            <Stat label="Years shipping" value="10+" />
            <Stat label="Design systems led" value="4" />
            <Stat label="Engineers mentored" value="60+" />
            <Stat label="Essays published" value={String(totalPosts)} />
          </div>
        </Container>
      </section>

      {/* ======================== Stack marquee ======================== */}
      <section className="border-b border-border py-10">
        <Container size="wide">
          <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            — A decade of shipping with —
          </p>
          <Marquee>
            {stack.map((s) => (
              <span
                key={s}
                className="font-serif text-2xl tracking-tight text-foreground/70 transition-colors hover:text-foreground sm:text-3xl"
              >
                {s}
              </span>
            ))}
          </Marquee>
        </Container>
      </section>

      {/* ======================== Bento ======================== */}
      <section className="py-20 sm:py-24">
        <Container size="wide">
          <SectionHeading
            eyebrow="Featured"
            title="Long-form essays I keep coming back to."
            kicker="Writing that took longer than a Saturday."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:grid-rows-[auto_auto]">
            {/* Big featured card */}
            {featured[0] && (
              <div className="lg:col-span-2 lg:row-span-2">
                <PostCard post={featured[0]} variant="feature" />
              </div>
            )}

            {/* SQL course CTA */}
            <Link
              href="/docs/sql"
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-foreground p-7 text-background transition hover:shadow-lg"
            >
              <div
                aria-hidden
                className="absolute inset-0 bg-grid opacity-[0.06]"
              />
              <div
                aria-hidden
                className="absolute -right-8 -top-8 size-40 rounded-full bg-accent/30 blur-3xl transition-transform group-hover:scale-110"
              />
              <div className="relative flex flex-col gap-5">
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-background/80 ring-1 ring-background/10">
                  <span className="size-1.5 rounded-full bg-accent" />
                  New course
                </div>
                <h3 className="font-serif text-3xl leading-[1.05] tracking-tight">
                  SQL for engineers who ship.
                </h3>
                <p className="text-sm leading-relaxed text-background/70">
                  Six lessons. Real schemas. The exact mental model I use when
                  someone hands me a slow query.
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
                  Start the course
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>

            {/* Second feature card if exists, else newsletter teaser */}
            {featured[1] ? (
              <div className="lg:col-start-3">
                <PostCard post={featured[1]} variant="feature-compact" />
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-surface p-7">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-subtle">
                  Currently
                </p>
                <p className="mt-3 font-serif text-2xl leading-tight text-foreground">
                  Writing on design systems and SQL fundamentals.
                </p>
              </div>
            )}
          </div>
        </Container>
      </section>

      {/* ======================== Recent ======================== */}
      <section className="border-t border-border bg-surface-muted/40 py-20 sm:py-24">
        <Container size="wide">
          <div className="flex items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Recent writing"
              title="Newer notes, in chronological order."
            />
            <Link
              href="/blog"
              className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background sm:inline-flex"
            >
              View archive
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="mt-10 divide-y divide-border border-y border-border">
            {recent.map((post) => (
              <PostCard key={post.slug} post={post} variant="compact" />
            ))}
          </div>

          <div className="mt-8 sm:hidden">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              View archive
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </Container>
      </section>

      {/* ======================== Newsletter ======================== */}
      <section className="py-20 sm:py-28">
        <Container size="narrow">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-surface p-8 text-center shadow-sm sm:p-14">
            <div
              aria-hidden
              className="absolute inset-x-0 -top-16 mx-auto size-72 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                Stay in the loop
              </p>
              <h3 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
                One essay every other week.{" "}
                <span className="italic text-muted">No fluff.</span>
              </h3>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
                Field notes from a decade in frontend, sent only when the
                writing is worth your inbox.
              </p>

              <NewsletterForm />

              <p className="mt-3 text-xs text-subtle">
                Unsubscribe in one click. I respect your inbox.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}

/* ---------------- helpers ---------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="font-serif text-3xl tracking-tight text-foreground sm:text-4xl">
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
        {label}
      </div>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  kicker,
}: {
  eyebrow: string;
  title: string;
  kicker?: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
        — {eyebrow}
      </p>
      <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      {kicker && (
        <p className="mt-3 text-sm text-muted sm:text-base">{kicker}</p>
      )}
    </div>
  );
}

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M5 12h14M13 5l7 7-7 7" />
    </svg>
  );
}

function DatabaseIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
      <path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" />
    </svg>
  );
}
