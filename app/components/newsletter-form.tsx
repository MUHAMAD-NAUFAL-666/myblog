"use client";

import { useState } from "react";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="mx-auto mt-8 inline-flex max-w-md items-center gap-2 rounded-full border border-emerald/40 bg-emerald-soft px-5 py-3 text-sm font-medium text-emerald">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
          aria-hidden
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
        Thanks — you&apos;re on the list.
      </div>
    );
  }

  return (
    <form
      className="mx-auto mt-8 flex max-w-md flex-col gap-2 rounded-full border border-border bg-background p-1 shadow-xs sm:flex-row sm:items-center"
      onSubmit={handleSubmit}
    >
      <div className="flex flex-1 items-center gap-2 px-4">
        <MailIcon className="size-4 shrink-0 text-subtle" />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@domain.com"
          aria-label="Email address"
          className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-subtle focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="group inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-90"
      >
        Subscribe
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3.5 transition-transform group-hover:translate-x-0.5"
          aria-hidden
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}
