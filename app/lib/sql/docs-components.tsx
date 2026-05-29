import type { ReactNode } from "react";
import { cn } from "@/app/lib/cn";

/* ==================================================================
   Steps — numbered, chunked walkthrough.
   Each <Step> is a self-contained block with title, optional summary,
   and arbitrary body content (code blocks, terminals, callouts).
   ================================================================== */
export function Steps({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ol className={cn("steps not-prose", className)} role="list">
      {children}
    </ol>
  );
}

export function Step({
  title,
  summary,
  children,
}: {
  title: string;
  summary?: string;
  children?: ReactNode;
}) {
  return (
    <li className="step">
      <div className="step-marker" aria-hidden />
      <div className="step-body">
        <h3 className="step-title">{title}</h3>
        {summary ? <p className="step-summary">{summary}</p> : null}
        {children ? <div className="step-content">{children}</div> : null}
      </div>
    </li>
  );
}

/* ==================================================================
   Prerequisites — what the reader is expected to know / have set up
   before starting the lesson.
   ================================================================== */
export function Prerequisites({
  items,
  className,
}: {
  items: string[];
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "not-prose my-8 rounded-2xl border border-border bg-surface p-5",
        className,
      )}
      aria-labelledby="prereq-heading"
    >
      <p
        id="prereq-heading"
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle"
      >
        Before you start
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-foreground">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5">
            <CheckBadge />
            <span className="text-muted">{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ==================================================================
   KeyConcepts — small grid of "what you'll walk away knowing".
   ================================================================== */
export function KeyConcepts({
  items,
  className,
}: {
  items: { title: string; body: string }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "not-prose my-8 grid gap-3 sm:grid-cols-2",
        className,
      )}
    >
      {items.map((it) => (
        <div
          key={it.title}
          className="rounded-xl border border-border bg-surface p-4"
        >
          <p className="text-sm font-medium text-foreground">{it.title}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">{it.body}</p>
        </div>
      ))}
    </div>
  );
}

/* ==================================================================
   Recap — closing block with a bulleted summary.
   ================================================================== */
export function Recap({
  items,
  className,
}: {
  items: ReactNode[];
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "not-prose my-10 rounded-2xl border border-emerald/30 bg-emerald-soft p-5",
        className,
      )}
      aria-labelledby="recap-heading"
    >
      <p
        id="recap-heading"
        className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald"
      >
        Recap
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span
              aria-hidden
              className="mt-[7px] inline-block size-1.5 shrink-0 rounded-full bg-emerald"
            />
            <span className="text-muted">{item}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ==================================================================
   Internal icons
   ================================================================== */
function CheckBadge() {
  return (
    <span
      aria-hidden
      className="mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-2.5"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}
