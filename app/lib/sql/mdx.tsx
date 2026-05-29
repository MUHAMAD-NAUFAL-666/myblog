import { cn } from "@/app/lib/cn";

/**
 * Headings that double as TOC anchors. Match the slug used in the lesson's
 * `headings` array so the right-rail can scroll-to.
 */
export function H2({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2 id={id} className={cn("scroll-mt-28", className)}>
      <a href={`#${id}`} className="anchor-link">
        {children}
      </a>
    </h2>
  );
}

export function H3({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 id={id} className={cn("scroll-mt-28", className)}>
      <a href={`#${id}`} className="anchor-link">
        {children}
      </a>
    </h3>
  );
}

/**
 * Stripe/Vercel-style callout box. Use sparingly to highlight a tip,
 * gotcha, or pro-move within a lesson.
 */
export function Callout({
  variant = "info",
  title,
  children,
}: {
  variant?: "info" | "warn" | "tip" | "pro";
  title?: string;
  children: React.ReactNode;
}) {
  const styles = {
    info: {
      ring: "border-indigo/30 bg-indigo-soft",
      icon: "text-indigo",
      label: "Note",
      glyph: <InfoIcon className="size-4" />,
    },
    warn: {
      ring: "border-amber/40 bg-[color:var(--accent-soft)]",
      icon: "text-amber",
      label: "Heads up",
      glyph: <WarnIcon className="size-4" />,
    },
    tip: {
      ring: "border-emerald/30 bg-emerald-soft",
      icon: "text-emerald",
      label: "Tip",
      glyph: <SparkleIcon className="size-4" />,
    },
    pro: {
      ring: "border-rose/30 bg-rose-soft",
      icon: "text-rose",
      label: "Pro move",
      glyph: <BoltIcon className="size-4" />,
    },
  }[variant];

  return (
    <aside
      className={cn(
        "not-prose my-6 flex gap-3 rounded-xl border p-4 text-sm leading-relaxed",
        styles.ring,
      )}
    >
      <span className={cn("mt-0.5 shrink-0", styles.icon)}>{styles.glyph}</span>
      <div className="min-w-0 flex-1 text-foreground">
        <p
          className={cn(
            "font-mono text-[10px] font-semibold uppercase tracking-[0.16em]",
            styles.icon,
          )}
        >
          {title ?? styles.label}
        </p>
        <div className="mt-1.5 text-muted">{children}</div>
      </div>
    </aside>
  );
}

/* ---------------- Icons ---------------- */
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  );
}
function WarnIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
    </svg>
  );
}
function BoltIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  );
}
