"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { chapters } from "@/app/lib/sql/lessons";
import { cn } from "@/app/lib/cn";

export function SqlSidebar({ className }: { className?: string }) {
  const t = useTranslations("Sql");
  const pathname = usePathname();
  const isOverview = pathname === "/docs/sql";

  return (
    <nav
      className={cn("text-sm", className)}
      aria-label="SQL course navigation"
    >
      <Link
        href="/docs/sql"
        className={cn(
          "block rounded-lg px-3 py-2 transition",
          isOverview
            ? "bg-surface-muted font-medium text-foreground"
            : "text-muted hover:bg-surface-muted hover:text-foreground",
        )}
      >
        {t("courseOverview")}
      </Link>

      <div className="mt-2 space-y-6">
        {chapters.map((ch) => (
          <section key={ch.slug}>
            <header className="px-3 pb-2 pt-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-subtle">
                {t("chapter", { number: ch.number })}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-foreground">
                {ch.title}
              </p>
            </header>
            <ol className="space-y-0.5">
              {ch.lessons.map((l) => {
                const href = `/docs/sql/${l.slug}`;
                const active = pathname === href;
                return (
                  <li key={l.slug}>
                    <Link
                      href={href}
                      className={cn(
                        "group flex items-baseline gap-3 rounded-lg px-3 py-1.5 transition",
                        active
                          ? "bg-surface-muted font-medium text-foreground"
                          : "text-muted hover:bg-surface-muted hover:text-foreground",
                      )}
                    >
                      <span
                        className={cn(
                          "font-mono text-[11px] tabular-nums",
                          active ? "text-accent" : "text-subtle",
                        )}
                      >
                        {l.number}
                      </span>
                      <span className="line-clamp-2 leading-snug">
                        {l.title}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>
    </nav>
  );
}
