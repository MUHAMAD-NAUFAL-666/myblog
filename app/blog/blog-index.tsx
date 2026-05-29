"use client";

import { useMemo, useState } from "react";
import { PostCard } from "@/app/components/post-card";
import type { PostMeta } from "@/app/lib/posts";
import { cn } from "@/app/lib/cn";

export function BlogIndex({
  posts,
  tags,
}: {
  posts: PostMeta[];
  tags: string[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let out = posts;
    if (active) out = out.filter((p) => p.tags.includes(active));
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return out;
  }, [active, posts, query]);

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip
            label={`All (${posts.length})`}
            active={active === null}
            onClick={() => setActive(null)}
          />
          {tags.map((tag) => {
            const count = posts.filter((p) => p.tags.includes(tag)).length;
            return (
              <FilterChip
                key={tag}
                label={`${tag} (${count})`}
                active={active === tag}
                onClick={() => setActive(tag)}
              />
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search essays"
            aria-label="Search essays"
            className="h-10 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm text-foreground placeholder:text-subtle transition focus:border-border-strong focus:outline-none"
          />
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {filtered.map((post) => (
          <PostCard key={post.slug} post={post} variant="default" />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-16 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-muted">No essays match this filter.</p>
          <button
            type="button"
            onClick={() => {
              setActive(null);
              setQuery("");
            }}
            className="mt-4 text-sm font-medium text-accent hover:text-foreground"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-xs transition",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function SearchIcon({ className }: { className?: string }) {
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
