"use client";

import {
  Children,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/app/lib/cn";

/* -------------------------------------------------------------
   Terminal — macOS-style chrome with sequential reveal
   ------------------------------------------------------------- */
type TerminalProps = {
  title?: string;
  children: React.ReactNode;
  className?: string;
  /**
   * If provided, a copy button is rendered in the title bar that
   * copies this exact string to the clipboard.
   */
  copyText?: string;
};

export function Terminal({
  title = "~ /naufal — zsh",
  children,
  className,
  copyText,
}: TerminalProps) {
  // Auto-stagger children. Each child's reveal delay is computed from the
  // running cumulative duration of preceding children.
  const items = useMemo(() => {
    let cursor = 0;
    const arr: { node: React.ReactNode; delay: number }[] = [];

    Children.forEach(children, (child) => {
      let delay = cursor;
      let duration = 600;

      if (isValidElement(child)) {
        const props = child.props as {
          delay?: number;
          duration?: number;
          children?: React.ReactNode;
        };
        if (typeof props.delay === "number") delay = props.delay;
        if (typeof props.duration === "number") {
          duration = props.duration;
        } else if (typeof props.children === "string") {
          duration = Math.max(300, props.children.length * 35);
        }
      }

      arr.push({ node: child, delay });
      cursor = delay + duration + 120;
    });

    return arr;
  }, [children]);

  return (
    <div className={cn("terminal-shell group/terminal", className)}>
      <div className="terminal-titlebar">
        <div className="terminal-dots" aria-hidden>
          <span className="terminal-dot terminal-dot--close">
            <CloseGlyph />
          </span>
          <span className="terminal-dot terminal-dot--min">
            <MinGlyph />
          </span>
          <span className="terminal-dot terminal-dot--max">
            <MaxGlyph />
          </span>
        </div>
        <span className="terminal-title">{title}</span>
        {copyText ? (
          <TerminalCopyButton text={copyText} />
        ) : (
          <span className="terminal-titlebar-spacer" aria-hidden />
        )}
      </div>
      <div className="terminal-body">
        {items.map(({ node, delay }, i) => (
          <DelayedReveal key={i} delay={delay}>
            {node}
          </DelayedReveal>
        ))}
      </div>
    </div>
  );
}

function TerminalCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function handle() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1400);
    });
  }

  return (
    <button
      type="button"
      onClick={handle}
      className="terminal-copy"
      aria-label="Copy terminal contents"
    >
      {copied ? (
        <>
          <CheckIcon className="size-3" />
          Copied
        </>
      ) : (
        <>
          <CopyIcon className="size-3" />
          Copy
        </>
      )}
    </button>
  );
}

function DelayedReveal({
  delay,
  children,
}: {
  delay: number;
  children: React.ReactNode;
}) {
  const [shown, setShown] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!shown) return null;
  return <>{children}</>;
}

/* -------------------------------------------------------------
   AnimatedSpan — fades in
   ------------------------------------------------------------- */
type AnimatedSpanProps = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
};

export function AnimatedSpan({ children, className }: AnimatedSpanProps) {
  return (
    <div
      className={cn(
        "flex flex-col text-[#d8d1c2] animate-fade-up",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------
   TypingAnimation — char-by-char
   ------------------------------------------------------------- */
type TypingAnimationProps = {
  children: string;
  className?: string;
  duration?: number; // ms per character
  delay?: number;
  cursor?: boolean;
};

export function TypingAnimation({
  children,
  className,
  duration = 35,
  cursor = true,
}: TypingAnimationProps) {
  const text = String(children ?? "");
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!text) return;
    let n = 0;
    const id = setInterval(() => {
      n += 1;
      setI(n);
      if (n >= text.length) clearInterval(id);
    }, duration);
    return () => clearInterval(id);
  }, [text, duration]);

  const done = i >= text.length;

  return (
    <div className={cn("text-[#f5f0e6]", className)}>
      <span>{text.slice(0, i)}</span>
      {cursor && (
        <span
          className={cn(
            "ml-0.5 inline-block h-[1em] w-[0.5ch] -translate-y-[1px] bg-current align-middle",
            done ? "cursor-blink" : "",
          )}
          aria-hidden
        />
      )}
    </div>
  );
}

/* ---------------- Icons ---------------- */

function CloseGlyph() {
  return (
    <svg
      viewBox="0 0 10 10"
      className="terminal-dot__glyph"
      aria-hidden
    >
      <path
        d="M2.5 2.5l5 5M7.5 2.5l-5 5"
        stroke="#4d0000"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MinGlyph() {
  return (
    <svg
      viewBox="0 0 10 10"
      className="terminal-dot__glyph"
      aria-hidden
    >
      <path
        d="M2 5h6"
        stroke="#5b3500"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MaxGlyph() {
  return (
    <svg
      viewBox="0 0 10 10"
      className="terminal-dot__glyph"
      aria-hidden
    >
      <path
        d="M3.2 3.2 L6.8 6.8 M6.8 3.2 L3.2 6.8"
        stroke="#0a3d12"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
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
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
