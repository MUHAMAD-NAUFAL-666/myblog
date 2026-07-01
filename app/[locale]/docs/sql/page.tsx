import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { chapters, sqlLessons } from "@/app/lib/sql/lessons";
import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/app/components/terminal";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Sql" });
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}/docs/sql`]),
  );
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/docs/sql`,
      languages: {
        ...languages,
        "x-default": `/${routing.defaultLocale}/docs/sql`,
      },
    },
  };
}

const learnKeys = [
  "mentalModel",
  "joins",
  "agg",
  "schema",
  "tx",
  "index",
  "prog",
  "ops",
  "modern",
] as const;

export default async function SqlOverviewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Sql");
  const totalLessons = sqlLessons.length;

  return (
    <article>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
        {t("eyebrow")}
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-[64px]">
        {t("titleLine1")}
        <br />
        <span className="italic text-muted">{t("titleLine2Italic")}</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
        {t("intro", { chapters: chapters.length, lessons: totalLessons })}
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-muted">
          <span className="size-1.5 rounded-full bg-emerald" />
          {t("availableNow")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-muted">
          {t("chaptersBadge", { count: chapters.length })}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-muted">
          {t("lessonsBadge", { count: totalLessons })}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-muted">
          {t("totalHours")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1 text-muted">
          {t("playground")}
        </span>
      </div>

      {/* Demo terminal */}
      <div className="mt-12">
        <Terminal
          title="example — sqlite3"
          copyText={`> sqlite3 playground.db
SQLite version 3.43 — Enter ".help" for usage hints.
sqlite> SELECT u.country, SUM(o.amount) AS revenue
   ...> FROM   users u
   ...> JOIN   orders o ON o.user_id = u.id
   ...> WHERE  o.status = 'paid'
   ...> GROUP  BY u.country
   ...> ORDER  BY revenue DESC;

country  revenue
-------  -------
US       999.00
GB       79.00
ES       68.00`}
        >
          <TypingAnimation>{"> sqlite3 playground.db"}</TypingAnimation>
          <AnimatedSpan className="text-emerald-400">
            <span>{`SQLite version 3.43 — Enter ".help" for usage hints.`}</span>
          </AnimatedSpan>
          <AnimatedSpan className="text-[#a89e8f]">
            <span>{`sqlite> SELECT u.country, SUM(o.amount) AS revenue`}</span>
            <span>{`   ...> FROM   users u`}</span>
            <span>{`   ...> JOIN   orders o ON o.user_id = u.id`}</span>
            <span>{`   ...> WHERE  o.status = 'paid'`}</span>
            <span>{`   ...> GROUP  BY u.country`}</span>
            <span>{`   ...> ORDER  BY revenue DESC;`}</span>
          </AnimatedSpan>
          <AnimatedSpan className="text-[#d8d1c2]">
            <span>country  revenue</span>
            <span>-------  -------</span>
            <span>US       999.00</span>
            <span>GB       79.00</span>
            <span>ES       68.00</span>
          </AnimatedSpan>
          <TypingAnimation className="text-amber-300" duration={28}>
            {t("demoClosing")}
          </TypingAnimation>
        </Terminal>
      </div>

      {/* What you'll learn */}
      <section className="mt-16">
        <h2 className="font-serif text-2xl leading-tight tracking-tight text-foreground sm:text-3xl">
          {t("whatYouLearn")}
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {learnKeys.map((key) => (
            <div
              key={key}
              className="rounded-2xl border border-border bg-surface p-5"
            >
              <p className="font-medium text-foreground">
                {t(`learn.${key}_title`)}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {t(`learn.${key}_body`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Curriculum — chapter by chapter */}
      <section className="mt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-serif text-2xl leading-tight tracking-tight text-foreground sm:text-3xl">
            {t("curriculum")}
          </h2>
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            {t("curriculumMeta", {
              chapters: chapters.length,
              lessons: totalLessons,
            })}
          </p>
        </div>

        <ol className="mt-8 space-y-6">
          {chapters.map((ch) => (
            <li
              key={ch.slug}
              className="overflow-hidden rounded-2xl border border-border bg-surface"
            >
              <header className="flex items-baseline justify-between gap-6 border-b border-border bg-surface-muted/40 px-6 py-5">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                    {t("chapter", { number: ch.number })}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl leading-tight tracking-tight text-foreground">
                    {ch.title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                    {ch.summary}
                  </p>
                </div>
                <span className="hidden shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-subtle sm:inline">
                  {t("lessonsCount", { count: ch.lessons.length })}
                </span>
              </header>

              <ol className="divide-y divide-border">
                {ch.lessons.map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/docs/sql/${l.slug}`}
                      className="group flex items-start gap-5 px-6 py-4 transition hover:bg-surface-muted/40"
                    >
                      <span className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted font-mono text-[11px] font-medium tabular-nums text-foreground transition group-hover:bg-foreground group-hover:text-background">
                        {l.number}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground transition-colors group-hover:text-accent">
                          {l.title}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                          {l.description}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.14em] text-subtle">
                          <span>{l.duration}</span>
                          {l.tags.slice(0, 3).map((tag) => (
                            <span key={tag}>· {tag}</span>
                          ))}
                        </div>
                      </div>
                      <ArrowIcon className="mt-2 hidden size-5 shrink-0 text-subtle transition-all group-hover:translate-x-0.5 group-hover:text-foreground sm:block" />
                    </Link>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>

        <div className="mt-10">
          <Link
            href={`/docs/sql/${sqlLessons[0].slug}`}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
          >
            {t("startLesson", { number: sqlLessons[0].number })}
            <ArrowIcon className="size-4" />
          </Link>
        </div>
      </section>
    </article>
  );
}

function ArrowIcon({ className }: { className?: string }) {
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
