"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/app/lib/cn";

type LocaleConfig = {
  code: (typeof routing.locales)[number];
  flag: string;
  labelKey: "english" | "indonesian";
};

const locales: LocaleConfig[] = [
  { code: "en", flag: "🇺🇸", labelKey: "english" },
  { code: "id", flag: "🇮🇩", labelKey: "indonesian" },
];

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;

    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = locales.find((l) => l.code === locale) ?? locales[0];

  function changeLocale(next: (typeof routing.locales)[number]) {
    if (next === locale) {
      setOpen(false);
      return;
    }
    setOpen(false);
    // Preserve the unlocalized pathname (next-intl strips the locale
    // prefix from `usePathname`) plus any query parameters, then let
    // the next-intl router add the new locale prefix.
    const query = searchParams?.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(href, { locale: next });
    });
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("label")}
        className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        <span aria-hidden className="text-base leading-none">
          {current.flag}
        </span>
        <span className="text-xs font-medium uppercase tracking-wider">
          {current.code}
        </span>
        <ChevronIcon
          className={cn(
            "size-3 text-subtle transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("label")}
          className="absolute right-0 top-full z-50 mt-2 min-w-[180px] overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg"
        >
          {locales.map((l) => {
            const active = l.code === locale;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => changeLocale(l.code)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-surface-muted text-foreground"
                      : "text-muted hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span aria-hidden className="text-base leading-none">
                      {l.flag}
                    </span>
                    <span className="font-medium">{t(l.labelKey)}</span>
                  </span>
                  {active && (
                    <CheckIcon
                      className="size-3.5 text-accent"
                      aria-label={t("current", { language: t(l.labelKey) })}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
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
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CheckIcon({
  className,
  ...rest
}: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
