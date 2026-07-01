import { Container } from "@/app/components/container";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("Blog");
  return (
    <Container size="narrow" className="py-32 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">
        {t("notFoundCode")}
      </p>
      <h1 className="mt-4 font-serif text-5xl leading-tight tracking-tight text-foreground">
        {t("notFoundTitle")}
      </h1>
      <p className="mt-4 text-muted">{t("notFoundText")}</p>
      <Link
        href="/blog"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
      >
        {t("browseArchive")}
      </Link>
    </Container>
  );
}
