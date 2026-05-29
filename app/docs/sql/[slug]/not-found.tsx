import Link from "next/link";

export default function NotFound() {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-subtle">
        404
      </p>
      <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-foreground">
        That lesson isn&apos;t here.
      </h2>
      <p className="mt-3 text-muted">
        It may have been renamed. Head back to the overview to find what
        you&apos;re looking for.
      </p>
      <Link
        href="/docs/sql"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90"
      >
        Back to course overview
      </Link>
    </div>
  );
}
