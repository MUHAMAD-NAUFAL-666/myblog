import type { Metadata } from "next";
import { Container } from "@/app/components/container";
import { BlogIndex } from "@/app/blog/blog-index";
import { getAllPosts, getAllTags } from "@/app/lib/posts";

export const metadata: Metadata = {
  title: "Writing",
  description:
    "Essays on frontend architecture, design systems, performance, and engineering practice.",
};

export default function BlogPage() {
  const posts = getAllPosts();
  const tags = getAllTags();

  return (
    <>
      <section className="border-b border-border">
        <Container size="wide" className="py-16 sm:py-20">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">
            — Archive
          </p>
          <h1 className="mt-4 font-serif text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            Writing
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            Essays on the parts of frontend that don&apos;t make it into the
            release notes. Architecture decisions, design system tradeoffs,
            and the slower-burn lessons from a decade of shipping.
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
