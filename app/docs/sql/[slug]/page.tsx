import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  findChapterFor,
  findLesson,
  lessonNeighbours,
  sqlLessons,
} from "@/app/lib/sql/lessons";
import { OnThisPage } from "@/app/lib/sql/on-this-page";

export async function generateStaticParams() {
  return sqlLessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const lesson = findLesson(slug);
  if (!lesson) return {};
  return {
    title: `${lesson.title} — SQL course`,
    description: lesson.description,
  };
}

export default async function SqlLessonPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const lesson = findLesson(slug);
  if (!lesson) notFound();

  const chapter = findChapterFor(slug);
  const { prev, next, index } = lessonNeighbours(slug);
  const total = sqlLessons.length;
  const progress = ((index + 1) / total) * 100;
  const chapterIndex = chapter
    ? chapter.lessons.findIndex((l) => l.slug === slug) + 1
    : 0;

  return (
    <div className="grid gap-12 xl:grid-cols-[minmax(0,1fr)_220px] xl:gap-12">
      <article className="min-w-0">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-2 text-xs text-muted"
        >
          <Link href="/docs" className="hover:text-foreground">
            Docs
          </Link>
          <ChevronIcon className="size-3 text-subtle" />
          <Link href="/docs/sql" className="hover:text-foreground">
            SQL
          </Link>
          {chapter && (
            <>
              <ChevronIcon className="size-3 text-subtle" />
              <span className="text-muted">
                Chapter {chapter.number} · {chapter.title}
              </span>
            </>
          )}
          <ChevronIcon className="size-3 text-subtle" />
          <span className="text-foreground">Lesson {lesson.number}</span>
        </nav>

        {/* Progress */}
        <div className="mt-6 flex items-center gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
            {lesson.duration}
          </span>
        </div>

        {/* Header */}
        <header className="mt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            — Lesson {lesson.number}
            {chapter ? (
              <span className="ml-2 text-subtle">
                · {chapterIndex} of {chapter.lessons.length} in {chapter.title}
              </span>
            ) : null}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            {lesson.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {lesson.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-1.5">
            {lesson.tags.map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] text-muted"
              >
                #{t}
              </span>
            ))}
          </div>
        </header>

        {/* Mobile TOC */}
        {lesson.headings.length > 0 && (
          <details className="group mt-8 rounded-2xl border border-border bg-surface p-4 xl:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-medium text-foreground">
              <span>On this page</span>
              <ChevronIcon className="size-4 text-subtle transition-transform group-open:rotate-90" />
            </summary>
            <ul className="mt-3 space-y-1.5 text-sm">
              {lesson.headings.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className="text-muted hover:text-foreground"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        )}

        <hr className="my-10 border-border" />

        {/* Body */}
        <div className="prose">{lesson.content}</div>

        {/* Pager */}
        <nav
          aria-label="Lesson navigation"
          className="mt-16 grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
        >
          {prev ? (
            <Link
              href={`/docs/sql/${prev.slug}`}
              className="group flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5 transition hover:border-border-strong"
            >
              <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-subtle">
                <ChevronIcon className="size-3 rotate-180" />
                Previous · {prev.number}
              </span>
              <span className="font-medium text-foreground transition-colors group-hover:text-accent">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/docs/sql/${next.slug}`}
              className="group flex flex-col gap-1 rounded-2xl border border-border bg-surface p-5 text-right transition hover:border-border-strong"
            >
              <span className="inline-flex items-center justify-end gap-1.5 text-[11px] uppercase tracking-[0.14em] text-subtle">
                Next · {next.number}
                <ChevronIcon className="size-3" />
              </span>
              <span className="font-medium text-foreground transition-colors group-hover:text-accent">
                {next.title}
              </span>
            </Link>
          ) : (
            <Link
              href="/docs/sql"
              className="group flex flex-col gap-1 rounded-2xl border border-foreground bg-foreground p-5 text-right text-background transition hover:opacity-90"
            >
              <span className="inline-flex items-center justify-end gap-1.5 text-[11px] uppercase tracking-[0.14em] text-background/70">
                You finished the course
              </span>
              <span className="font-medium">Back to course overview</span>
            </Link>
          )}
        </nav>

        {/* Chapter index — quick jump within current chapter */}
        {chapter && chapter.lessons.length > 1 && (
          <section
            aria-labelledby="chapter-index"
            className="mt-12 rounded-2xl border border-border bg-surface-muted/40 p-6"
          >
            <p
              id="chapter-index"
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle"
            >
              Other lessons in this chapter
            </p>
            <ul className="mt-4 grid gap-1 sm:grid-cols-2">
              {chapter.lessons
                .filter((l) => l.slug !== slug)
                .map((l) => (
                  <li key={l.slug}>
                    <Link
                      href={`/docs/sql/${l.slug}`}
                      className="group flex items-baseline gap-3 rounded-lg px-3 py-2 text-sm transition hover:bg-surface"
                    >
                      <span className="font-mono text-[11px] text-subtle">
                        {l.number}
                      </span>
                      <span className="text-muted transition-colors group-hover:text-foreground">
                        {l.title}
                      </span>
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </article>

      {/* Right rail TOC (desktop only) */}
      <aside className="hidden xl:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          <OnThisPage headings={lesson.headings} />
        </div>
      </aside>
    </div>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
