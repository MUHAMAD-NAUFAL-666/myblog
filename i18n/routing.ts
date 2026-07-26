import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Supported locales
  locales: ["en", "id"] as const,

  // Default fallback when no match is found
  defaultLocale: "en",

  // Always show the locale prefix in the URL (e.g. /en/blog, /id/blog)
  localePrefix: "always",

  // Persist the chosen locale in a cookie so future visits to `/`
  // redirect to the user's last preferred language
  localeDetection: true,
  localeCookie: {
    name: "NEXT_LOCALE",
    // 1 year
    maxAge: 60 * 60 * 24 * 365,
  },
});

export type Locale = (typeof routing.locales)[number];
