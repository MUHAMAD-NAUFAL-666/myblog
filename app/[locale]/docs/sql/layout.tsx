import { Container } from "@/app/components/container";
import { SqlSidebar } from "@/app/components/sql-sidebar";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { chapters } from "@/app/lib/sql/lessons";

export default async function SqlLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("Sql");

  return (
    <Container size="wide" className="py-10 lg:py-14">
      <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14">
        <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
          <div className="rounded-2xl border border-border bg-surface p-3 lg:p-4">
            <p className="px-3 pt-2 font-serif text-lg leading-tight tracking-tight text-foreground">
              {t("sidebarTitle")}
            </p>
            <p className="px-3 pb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-subtle">
              {t("sidebarMeta", { count: chapters.length })}
            </p>
            <SqlSidebar />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </Container>
  );
}
