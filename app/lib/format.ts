export function formatDate(
  date: string,
  variant: "long" | "short" = "long",
) {
  const d = new Date(date);
  if (variant === "short") {
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
