import { Container } from "@/app/components/container";
import { PostCard } from "@/app/components/post-card";
import { NewsletterForm } from "@/app/components/newsletter-form";
import { HeroTerminal } from "@/app/components/hero-terminal";
import { Marquee } from "@/app/components/marquee";
import { getAllPosts, getFeaturedPosts } from "@/app/lib/posts";
import { Link } from "@/i18n/navigation";
import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";

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

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Home");

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
                {t("nowWriting")}
              </div>

              <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-[80px]">
                {t("heroLine1")}
                <br />
                <span className="italic text-muted">{t("heroLine2Italic")}</span>{" "}
                {t("heroLine2Rest")}
                <br />
                {t("heroLine3")}
              </h1>

              <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
                {t("heroIntroPrefix")}{" "}
                <span className="text-foreground">{t("heroName")}</span>
                {t("heroIntroSuffix")}
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  href="/blog"
                  className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background shadow-sm transition hover:opacity-90"
                >
                  {t("ctaRead")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/docs/sql"
                  className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted"
                >
                  <DatabaseIcon className="size-4 text-accent" />
                  {t("ctaLearnSql")}
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
            <Stat label={t("stat_yearsShipping")} value="10+" />
            <Stat label={t("stat_designSystems")} value="4" />
            <Stat label={t("stat_engineersMentored")} value="60+" />
            <Stat label={t("stat_essaysPublished")} value={String(totalPosts)} />
          </div>
        </Container>
      </section>

      {/* ======================== Stack marquee ======================== */}
      <section className="border-b border-border py-10">
        <Container size="wide">
          <p className="mb-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {t("stack_eyebrow")}
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
            eyebrow={t("featured_eyebrow")}
            title={t("featured_title")}
            kicker={t("featured_kicker")}
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
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-background/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-background/80 ring-1 ring-background/15">
                  <span className="size-1.5 rounded-full bg-accent" />
                  {t("courseBadge")}
                </div>
                <h3 className="font-serif text-3xl leading-[1.05] tracking-tight">
                  {t("courseTitle")}
                </h3>
                <p className="text-sm leading-relaxed text-background/70">
                  {t("courseDescription")}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium">
                  {t("courseStart")}
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
                  {t("currently")}
                </p>
                <p className="mt-3 font-serif text-2xl leading-tight text-foreground">
                  {t("currentlyText")}
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
              eyebrow={t("recent_eyebrow")}
              title={t("recent_title")}
            />
            <Link
              href="/blog"
              className="hidden shrink-0 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-4 py-2 text-sm font-medium text-foreground transition hover:bg-background sm:inline-flex"
            >
              {t("viewArchive")}
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
              {t("viewArchive")}
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
                {t("newsletter_eyebrow")}
              </p>
              <h3 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
                {t("newsletter_titleStart")}{" "}
                <span className="italic text-muted">
                  {t("newsletter_titleItalic")}
                </span>
              </h3>
              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
                {t("newsletter_text")}
              </p>

              <NewsletterForm />

              <p className="mt-3 text-xs text-subtle">
                {t("newsletter_disclaimer")}
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
