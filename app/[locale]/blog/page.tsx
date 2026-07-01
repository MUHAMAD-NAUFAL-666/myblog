import type { Metadata } from "next";
import { Container } from "@/app/components/container";
import { BlogIndex } from "@/app/components/blog-index";
import { getAllPosts, getAllTags } from "@/app/lib/posts";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Blog" });
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}/blog`]),
  );
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${locale}/blog`,
      languages: {
        ...languages,
        "x-default": `/${routing.defaultLocale}/blog`,
      },
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Blog");

  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      <section className="border-b border-border">
        <Container size="wide" className="py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {t("intro")}
          </p>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container size="wide">
          <BlogIndex posts={posts} tags={tags} />
        </Container>
      </section>
    </>
  );
}
