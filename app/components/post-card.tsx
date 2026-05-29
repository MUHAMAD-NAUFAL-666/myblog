import Link from "next/link";
import type { PostMeta } from "@/app/lib/posts";
import { formatDate } from "@/app/lib/format";

type Variant = "default" | "compact" | "feature" | "feature-compact";

export function PostCard({
  post,
  variant = "default",
}: {
  post: PostMeta;
  variant?: Variant;
}) {
  if (variant === "feature") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-8 transition-all hover:border-border-strong hover:shadow-md sm:p-10"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
        />
        <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.16em] text-subtle">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
            <span className="size-1.5 rounded-full bg-accent" />
            Featured
          </span>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span className="text-border-strong">·</span>
          <span>{post.readingTime} min</span>
        </div>

        <h2 className="mt-6 font-serif text-3xl leading-[1.05] tracking-tight text-foreground sm:text-4xl md:text-5xl">
          <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
            {post.title}
          </span>
        </h2>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {post.excerpt}
        </p>

        <div className="mt-auto flex items-end justify-between pt-8">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground">
            Read essay
            <ArrowIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    );
  }

  if (variant === "feature-compact") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface p-7 transition-all hover:border-border-strong hover:shadow-sm"
      >
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-subtle">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 font-medium text-accent">
            <span className="size-1 rounded-full bg-accent" />
            Featured
          </span>
          <span>{post.readingTime} min</span>
        </div>

        <h3 className="mt-5 font-serif text-2xl leading-[1.1] tracking-tight text-foreground">
          {post.title}
        </h3>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
          {post.excerpt}
        </p>

        <div className="mt-auto pt-6">
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            Read essay
            <ArrowIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group flex items-baseline gap-4 border-b border-border py-5 transition-colors hover:border-border-strong"
      >
        <time
          dateTime={post.date}
          className="hidden w-28 shrink-0 font-mono text-[11px] uppercase tracking-wider text-subtle sm:block"
        >
          {formatDate(post.date, "short")}
        </time>
        <div className="flex-1">
          <h3 className="text-base font-medium text-foreground transition-colors group-hover:text-accent sm:text-lg">
            {post.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-sm text-muted">
            {post.excerpt}
          </p>
        </div>
        <ArrowIcon className="size-4 shrink-0 text-subtle transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    );
  }

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-border bg-surface p-6 transition-all hover:border-border-strong hover:shadow-sm"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-subtle">
        <time dateTime={post.date}>{formatDate(post.date)}</time>
        <span className="text-border-strong">·</span>
        <span>{post.readingTime} min</span>
      </div>
      <h3 className="font-serif text-2xl leading-[1.15] tracking-tight text-foreground">
        {post.title}
      </h3>
      <p className="line-clamp-2 text-sm leading-relaxed text-muted">
        {post.excerpt}
      </p>
      <div className="mt-auto flex items-center justify-between pt-2">
        <div className="flex flex-wrap gap-1.5">
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs text-subtle">
              #{tag}
            </span>
          ))}
        </div>
        <ArrowIcon className="size-4 text-subtle transition-all group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
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
