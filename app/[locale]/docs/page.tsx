import type { Metadata } from "next";
import { Container } from "@/app/components/container";
import { Link } from "@/i18n/navigation";
import { courses } from "@/app/lib/courses";
import { sqlLessons } from "@/app/lib/sql/lessons";
import { cn } from "@/app/lib/cn";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Docs" });
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}/docs`]),
  );
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/docs`,
      languages: {
        ...languages,
        "x-default": `/${routing.defaultLocale}/docs`,
      },
    },
  };
}

const accentMap = {
  amber: {
    border: "border-amber/40",
    bg: "bg-[color:var(--accent-soft)]",
    fg: "text-accent",
    chip: "bg-accent text-accent-fg",
    glow: "from-accent/30",
  },
  emerald: {
    border: "border-emerald/40",
    bg: "bg-emerald-soft",
    fg: "text-emerald",
    chip: "bg-emerald text-background",
    glow: "from-emerald/30",
  },
  indigo: {
    border: "border-indigo/40",
    bg: "bg-indigo-soft",
    fg: "text-indigo",
    chip: "bg-indigo text-background",
    glow: "from-indigo/30",
  },
  rose: {
    border: "border-rose/40",
    bg: "bg-rose-soft",
    fg: "text-rose",
    chip: "bg-rose text-background",
    glow: "from-rose/30",
  },
} as const;

export default async function DocsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Docs");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-hero">
        <div aria-hidden className="absolute inset-0 bg-grain opacity-50" />
        <Container size="wide" className="relative py-20 sm:py-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-[80px]">
            {t("heroLine1")}
            <br />
            <span className="italic text-muted">{t("heroLine2Italic")}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            {t("intro")}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/docs/sql"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              {t("startSql")}
              <ArrowIcon className="size-4" />
            </Link>
            <a
              href="#courses"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted"
            >
              {t("browseAll")}
            </a>
          </div>
        </Container>
      </section>

      {/* Courses grid */}
      <section id="courses" className="py-20 sm:py-24">
        <Container size="wide">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                {t("available_eyebrow")}
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
                {t("availableTitle", { count: courses.length })}
              </h2>
            </div>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {courses.map((course) => {
              const a = accentMap[course.accent];
              const isAvailable = course.status === "available";
              return (
                <Link
                  key={course.slug}
                  href={isAvailable ? course.href : "#courses"}
                  aria-disabled={!isAvailable}
                  className={cn(
                    "group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-7 transition-all",
                    isAvailable
                      ? "hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
                      : "cursor-not-allowed opacity-70",
                  )}
                >
                  <div
                    aria-hidden
                    className={cn(
                      "absolute -right-12 -top-12 size-44 rounded-full bg-gradient-to-br to-transparent blur-3xl transition-opacity",
                      a.glow,
                      "opacity-50 group-hover:opacity-90",
                    )}
                  />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em]",
                          a.bg,
                          a.fg,
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            "bg-[currentColor]",
                          )}
                        />
                        {course.level}
                      </span>
                      {!isAvailable && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-subtle">
                          {t("comingSoon")}
                        </span>
                      )}
                    </div>

                    <h3 className="mt-6 font-serif text-2xl leading-tight tracking-tight text-foreground">
                      {course.title}
                    </h3>

                    <p className="mt-2 text-sm font-medium text-muted">
                      {course.tagline}
                    </p>

                    <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">
                      {course.description}
                    </p>

                    <div className="mt-7 flex items-center justify-between border-t border-border pt-4">
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.14em] text-subtle">
                        <span>{t("lessons", { count: course.lessonCount })}</span>
                        <span className="text-border-strong">·</span>
                        <span>{course.duration}</span>
                      </div>
                      {isAvailable && (
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
                          {t("open")}
                          <ArrowIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      {/* SQL preview */}
      <section className="border-t border-border bg-surface-muted/40 py-20 sm:py-24">
        <Container size="wide">
          <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
                {t("featuredCourse")}
              </p>
              <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
                {t("featuredCourseTitle")}
              </h2>
              <p className="mt-4 max-w-lg text-muted">
                {t("featuredCourseTextStart")}{" "}
                <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">
                  SELECT
                </code>{" "}
                {t("featuredCourseTextMiddle")}{" "}
                <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-sm">
                  EXPLAIN
                </code>{" "}
                {t("featuredCourseTextEnd")}
              </p>
              <Link
                href="/docs/sql"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
              >
                {t("openCourse")}
                <ArrowIcon className="size-4" />
              </Link>
            </div>

            <ol className="space-y-2">
              {sqlLessons.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/docs/sql/${l.slug}`}
                    className="group flex items-baseline gap-4 rounded-xl border border-border bg-surface p-4 transition hover:border-border-strong hover:shadow-sm"
                  >
                    <span className="font-mono text-xs text-subtle">
                      {l.number}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground transition-colors group-hover:text-accent">
                        {l.title}
                      </p>
                      <p className="mt-1 line-clamp-1 text-sm text-muted">
                        {l.description}
                      </p>
                    </div>
                    <span className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-subtle sm:inline">
                      {l.duration}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </section>
    </>
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
