"use client";

import { useEffect, useState } from "react";
import { cn } from "@/app/lib/cn";
import type { LessonHeading } from "@/app/lib/sql/types";

/* ==================================================================
   OnThisPage — right-rail TOC with active-section tracking.
   Uses IntersectionObserver to highlight the heading currently in
   view. Falls back gracefully if the API is missing.
   ================================================================== */
export function OnThisPage({
  headings,
  className,
}: {
  headings: LessonHeading[];
  className?: string;
}) {
  const [active, setActive] = useState<string | null>(
    headings[0]?.id ?? null,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the heading nearest the top of the viewport that has
        // entered the observed band.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) =>
              a.boundingClientRect.top - b.boundingClientRect.top,
          );

        if (visible[0]) {
          setActive(visible[0].target.id);
        }
      },
      {
        // Track the upper portion of the viewport so a section becomes
        // "active" the moment it scrolls into the reading area.
        rootMargin: "-80px 0px -65% 0px",
        threshold: [0, 1],
      },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className={cn("text-sm", className)} aria-label="On this page">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
        On this page
      </p>
      <ul className="mt-3 space-y-1 border-l border-border">
        {headings.map((h) => {
          const isActive = h.id === active;
          return (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={cn(
                  "-ml-px block border-l-2 py-1 pl-3 transition-colors",
                  h.depth === 3 && "pl-6",
                  isActive
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {h.text}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
