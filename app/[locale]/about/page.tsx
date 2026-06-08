import type { Metadata } from "next";
import { Container } from "@/app/components/container";
import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "About" });
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}/about`]),
  );
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        ...languages,
        "x-default": `/${routing.defaultLocale}/about`,
      },
    },
  };
}

const stack = [
  "TypeScript",
  "React 19",
  "Next.js 16",
  "React Server Components",
  "Tailwind v4",
  "vanilla-extract",
  "Storybook",
  "Playwright",
  "Vitest",
  "PostgreSQL",
  "Drizzle ORM",
  "Figma",
  "Radix Primitives",
  "Node.js",
];

const principleKeys = ["durability", "a11y", "perf", "design"] as const;
const experienceKeys = ["lumen", "northwind", "halyard"] as const;

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("About");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-hero">
        <div aria-hidden className="absolute inset-0 bg-grain opacity-50" />
        <Container size="wide" className="relative py-20 sm:py-28">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-[80px]">
            {t("headlineMain")}{" "}
            <span className="italic text-muted">{t("headlineItalic")}</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            {t("intro")}
          </p>
        </Container>
      </section>

      {/* Short version */}
      <section className="py-20 sm:py-24">
        <Container size="narrow">
          <div className="prose">
            <h2>{t("shortVersionTitle")}</h2>
            <p>{t("shortVersionP1")}</p>
            <p>{t("shortVersionP2")}</p>
          </div>
        </Container>
      </section>

      {/* Principles bento */}
      <section className="border-t border-border bg-surface-muted/40 py-20 sm:py-24">
        <Container size="wide">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {t("principlesEyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            {t("principlesTitle")}
          </h2>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {principleKeys.map((key, i) => (
              <div
                key={key}
                className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-7 transition hover:border-border-strong"
              >
                <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-serif text-2xl leading-tight tracking-tight text-foreground">
                  {t(`principles.${key}_title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(`principles.${key}_body`)}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Experience timeline */}
      <section className="py-20 sm:py-24">
        <Container size="wide">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {t("experienceEyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            {t("experienceTitle")}
          </h2>

          <ol className="mt-10 divide-y divide-border border-y border-border">
            {experienceKeys.map((key) => (
              <li
                key={key}
                className="grid gap-3 py-8 sm:grid-cols-[200px_1fr] sm:gap-10"
              >
                <div className="flex items-start gap-3 font-mono text-xs uppercase tracking-wider text-subtle">
                  <span
                    aria-hidden
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                  />
                  {t(`experience.${key}_period`)}
                </div>
                <div>
                  <h3 className="font-serif text-xl tracking-tight text-foreground sm:text-2xl">
                    {t(`experience.${key}_role`)}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-foreground/80">
                    {t(`experience.${key}_company`)}
                  </p>
                  <p className="mt-3 max-w-2xl leading-relaxed text-muted">
                    {t(`experience.${key}_summary`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Toolbox */}
      <section className="border-t border-border bg-surface-muted/40 py-20 sm:py-24">
        <Container size="wide">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {t("toolboxEyebrow")}
          </p>
          <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
            {t("toolboxTitle")}
          </h2>
          <p className="mt-4 max-w-2xl text-muted">{t("toolboxText")}</p>

          <ul className="mt-10 flex flex-wrap gap-2">
            {stack.map((item) => (
              <li
                key={item}
                className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-sm text-foreground transition hover:border-border-strong hover:bg-background"
              >
                {item}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Contact */}
      <section className="border-t border-border py-20 sm:py-24">
        <Container size="narrow" className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-subtle">
            {t("contactEyebrow")}
          </p>
          <h2 className="mt-4 font-serif text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            {t("contactTitle")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">{t("contactText")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="mailto:hello@naufal.dev"
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
            >
              {t("contactCta")}
            </a>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-muted"
            >
              {t("readMyWriting")}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
