import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/app/components/container";
import { PostCard } from "@/app/components/post-card";
import { formatDate } from "@/app/lib/format";
import { getAllPosts, getAllSlugs, getPost } from "@/app/lib/posts";
import { Link } from "@/i18n/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";

export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return routing.locales.flatMap((locale) =>
    slugs.map((slug) => ({ locale, slug })),
  );
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const post = getPost(slug);
  if (!post) return {};
  const languages = Object.fromEntries(
    routing.locales.map((l) => [l, `/${l}/blog/${slug}`]),
  );
  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/${locale}/blog/${slug}`,
      languages: {
        ...languages,
        "x-default": `/${routing.defaultLocale}/blog/${slug}`,
      },
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function PostPage(props: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await props.params;
  setRequestLocale(locale);

  const post = getPost(slug);
  if (!post) notFound();

  const t = await getTranslations("Blog");

  const related = getAllPosts()
    .filter((p) => p.slug !== post.slug)
    .filter((p) => p.tags.some((tag) => post.tags.includes(tag)))
    .slice(0, 2);

  return (
    <article>
      {/* Header */}
      <header className="border-b border-border">
        <Container size="narrow" className="py-16 sm:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition hover:text-foreground"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
              aria-hidden
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            {t("backToWriting")}
          </Link>

          <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs uppercase tracking-[0.14em] text-subtle">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span className="text-border-strong">·</span>
            <span>{t("minRead", { count: post.readingTime })}</span>
            <span className="text-border-strong">·</span>
            <span>{t("byNaufal")}</span>
          </div>

          <h1 className="mt-5 font-serif text-4xl leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {post.title}
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
            {post.excerpt}
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted"
              >
                #{tag}
              </span>
            ))}
          </div>
        </Container>
      </header>

      {/* Body */}
      <Container size="narrow" className="py-16 sm:py-20">
        <div className="prose">{post.content}</div>

        <hr className="my-16 border-border" />

        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-foreground text-background font-serif text-xl">
            N
          </span>
          <div>
            <p className="font-medium text-foreground">Naufal</p>
            <p className="text-sm text-muted">{t("authorRole")}</p>
          </div>
        </div>
      </Container>

      {/* Related */}
      {related.length > 0 && (
        <section className="border-t border-border bg-surface-muted/40 py-16">
          <Container size="wide">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">
              {t("keepReading")}
            </p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {related.map((p) => (
                <PostCard key={p.slug} post={p} variant="default" />
              ))}
            </div>
          </Container>
        </section>
      )}
    </article>
  );
}
