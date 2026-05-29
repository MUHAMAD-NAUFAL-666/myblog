"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/cn";

export function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active =
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "relative px-3 py-2 rounded-md transition-colors",
        active
          ? "text-foreground"
          : "text-muted hover:text-foreground",
      )}
    >
      {children}
      {active && (
        <span className="absolute inset-x-3 -bottom-px h-px bg-foreground" />
      )}
    </Link>
  );
}
