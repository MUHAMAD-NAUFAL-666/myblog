import { useTranslations } from "next-intl";
import { Container } from "@/app/components/container";
import { Link } from "@/i18n/navigation";

export function SiteFooter() {
  const t = useTranslations("Footer");
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
              {t("tagline")}
            </p>
            <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              {t("builtWith")}
            </p>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              {t("explore")}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <FooterInternalLink href="/blog">
                {t("writing")}
              </FooterInternalLink>
              <FooterInternalLink href="/docs">{t("docs")}</FooterInternalLink>
              <FooterInternalLink href="/docs/sql">
                {t("sqlCourse")}
              </FooterInternalLink>
              <FooterInternalLink href="/about">
                {t("about")}
              </FooterInternalLink>
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-subtle">
              {t("elsewhere")}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              <FooterExternalLink href="https://github.com/MUHAMAD-NAUFAL-666">
                {t("github")}
              </FooterExternalLink>
              <FooterExternalLink href="https://twitter.com">
                {t("twitter")}
              </FooterExternalLink>
              <FooterExternalLink href="https://www.linkedin.com/in/muhamad-naufal-678474316/">
                {t("linkedin")}
              </FooterExternalLink>
              <FooterExternalLink href="mailto:@naufal.mhmd1106@gmail.com">
                {t("email")}
              </FooterExternalLink>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>{t("copyright", { year })}</span>
          <span className="font-mono uppercase tracking-[0.16em] text-subtle">
            {t("location")}
          </span>
        </div>
      </Container>
    </footer>
  );
}

function FooterInternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
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

function FooterExternalLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
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
