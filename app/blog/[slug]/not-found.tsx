import Link from "next/link";
import { Container } from "@/app/components/container";

export default function NotFound() {
  return (
    <Container size="narrow" className="py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">
        404
      </p>
      <h1 className="mt-4 font-serif text-5xl leading-tight tracking-tight text-foreground">
        This essay isn&apos;t here.
      </h1>
      <p className="mt-4 text-muted">
        It may have been moved or never existed. Either way, the archive is
        the next best place to land.
      </p>
      <Link
        href="/blog"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
      >
        Browse the archive
      </Link>
    </Container>
  );
}
