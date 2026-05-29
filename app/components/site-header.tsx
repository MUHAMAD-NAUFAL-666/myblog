import Link from "next/link";
import { Container } from "@/app/components/container";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { NavLink } from "@/app/components/nav-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur-xl">
      <Container size="wide">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-medium tracking-tight"
          >
            <span className="relative flex size-8 items-center justify-center overflow-hidden rounded-lg bg-foreground text-background font-serif text-lg leading-none shadow-sm transition-transform group-hover:rotate-[-6deg]">
              <span className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/30 to-accent/0 opacity-0 transition-opacity group-hover:opacity-100" />
              <span className="relative">N</span>
            </span>
            <span className="hidden sm:inline">Naufal</span>
            <span
              aria-hidden
              className="hidden text-[11px] font-mono uppercase tracking-[0.18em] text-subtle sm:inline"
            >
              · dev
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/blog">Writing</NavLink>
            <NavLink href="/docs">Docs</NavLink>
            <NavLink href="/about">About</NavLink>
            <span className="mx-2 h-5 w-px bg-border" aria-hidden />
            <ThemeToggle />
          </nav>
        </div>
      </Container>
    </header>
  );
}
