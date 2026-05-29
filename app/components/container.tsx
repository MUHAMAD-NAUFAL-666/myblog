import { cn } from "@/app/lib/cn";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "narrow" | "wide";
};

export function Container({
  children,
  className,
  size = "default",
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 sm:px-8",
        size === "narrow" && "max-w-2xl",
        size === "default" && "max-w-5xl",
        size === "wide" && "max-w-6xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
