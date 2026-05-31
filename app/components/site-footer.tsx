import Link from "next/link";
import { Container } from "@/app/components/container";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border bg-surface-muted/40">
      <Container size="wide">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 font-medium tracking-tight"
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background font-serif text-lg leading-none">
                N
              </span>
              <span>Naufal</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Senior frontend Developer writing about the craft. Essays, design
              system notes, and the slow lessons of a decade.
            </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Built with Next.js 16 · Tailwind v4
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <FooterLink href="/blog">Writing</FooterLink>
              <FooterLink href="/docs">Docs</FooterLink>
              <FooterLink href="/docs/sql">SQL course</FooterLink>
              <FooterLink href="/about">About</FooterLink>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              Elsewhere
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <FooterLink href="https://github.com/MUHAMAD-NAUFAL-666" external>
                GitHub
              </FooterLink>
              <FooterLink href="https://twitter.com" external>
                Twitter / X
              </FooterLink>
              <FooterLink href="https://www.linkedin.com/in/muhamad-naufal-678474316/" external>
                LinkedIn
              </FooterLink>
              <FooterLink href="mailto:@naufal.mhmd1106@gmail.com">Email</FooterLink>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>&copy; {year} Naufal.</span>
          <span className="font-mono uppercase tracking-[0.16em] text-subtle">
            Karawang · Anywhere
          </span>
        </div>
      </Container>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  external = false,
}: {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}) {
  if (external) {
    return (
      <li>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="text-muted transition-colors hover:text-foreground"
        >
          {children}
        </a>
      </li>
    );
  }
  return (
    <li>
      <Link
        href={href}
        className="text-muted transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
