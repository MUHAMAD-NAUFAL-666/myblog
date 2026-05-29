import { cn } from "@/app/lib/cn";

type MarqueeProps = {
  children: React.ReactNode;
  className?: string;
  reverse?: boolean;
  pauseOnHover?: boolean;
};

export function Marquee({
  children,
  className,
  reverse = false,
  pauseOnHover = true,
}: MarqueeProps) {
  return (
    <div
      className={cn(
        "group flex w-full overflow-hidden mask-fade-edges",
        className,
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center gap-10 pr-10 animate-marquee",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={cn(
          "flex shrink-0 items-center gap-10 pr-10 animate-marquee",
          reverse && "[animation-direction:reverse]",
          pauseOnHover && "group-hover:[animation-play-state:paused]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
