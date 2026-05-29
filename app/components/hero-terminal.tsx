"use client";

import {
  AnimatedSpan,
  Terminal,
  TypingAnimation,
} from "@/app/components/terminal";

const SCRIPT = `> pnpm create essay --topic="design systems"
✔ Booting writer environment.
✔ Loading 10 years of opinions.
✔ Resolving outline.
✔ Calibrating tone (dry, generous, opinionated).
ℹ Drafted 5 essays:
   — component APIs that age well
   — the quiet cost of client components
   — pragmatic CSS architecture
   — interviewing for staying power
   — accessibility without theater
→ New course shipping: SQL for engineers.
Ready when you are.`;

export function HeroTerminal() {
  return (
    <Terminal
      title="naufal@studio: ~ — zsh"
      copyText={SCRIPT}
      className="w-full"
    >
      <TypingAnimation duration={32}>
        {"> pnpm create essay --topic=\"design systems\""}
      </TypingAnimation>
      <AnimatedSpan className="text-emerald-400">
        <span>✔ Booting writer environment.</span>
      </AnimatedSpan>
      <AnimatedSpan className="text-emerald-400">
        <span>✔ Loading 10 years of opinions.</span>
      </AnimatedSpan>
      <AnimatedSpan className="text-emerald-400">
        <span>✔ Resolving outline.</span>
      </AnimatedSpan>
      <AnimatedSpan className="text-emerald-400">
        <span>✔ Calibrating tone (dry, generous, opinionated).</span>
      </AnimatedSpan>
      <AnimatedSpan className="text-blue-400">
        <span>ℹ Drafted 5 essays:</span>
        <span className="pl-2">— component APIs that age well</span>
        <span className="pl-2">— the quiet cost of client components</span>
        <span className="pl-2">— pragmatic CSS architecture</span>
        <span className="pl-2">— interviewing for staying power</span>
        <span className="pl-2">— accessibility without theater</span>
      </AnimatedSpan>
      <AnimatedSpan className="text-amber-300">
        <span>→ New course shipping: SQL for engineers.</span>
      </AnimatedSpan>
      <TypingAnimation
        className="text-[#a89e8f]"
        duration={28}
      >
        Ready when you are.
      </TypingAnimation>
    </Terminal>
  );
}
