import type { ReactNode } from "react";

export type PostMeta = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: number;
  tags: string[];
  featured?: boolean;
};

export type Post = PostMeta & {
  content: ReactNode;
};

const posts: Post[] = [
  {
    slug: "designing-component-apis-that-age-well",
    title: "Designing Component APIs That Age Well",
    excerpt:
      "After a decade of shipping component libraries, I've learned that the best APIs feel obvious in hindsight. Here is the mental model I use before naming a single prop.",
    date: "2026-05-12",
    readingTime: 9,
    tags: ["design-systems", "react", "architecture"],
    featured: true,
    content: (
      <>
        <p>
          Every component you ship is a contract. Once teams build on top of it,
          changing the contract gets expensive — sometimes politically, often
          technically. The job isn&apos;t to design the perfect API on day one.
          It&apos;s to design one that can evolve without breaking anyone.
        </p>

        <p>
          I&apos;ve maintained design systems used by hundreds of engineers, and
          the patterns below are what consistently survive the years.
        </p>

        <h2>1. Boolean props are a smell</h2>
        <p>
          A single <code>disabled</code> prop is fine. Five booleans
          (<code>loading</code>, <code>success</code>, <code>error</code>,{" "}
          <code>readonly</code>, <code>compact</code>) is a state machine in
          disguise. They will eventually combine in ways you didn&apos;t intend.
        </p>
        <p>
          Replace them with a single <code>state</code> or <code>variant</code>{" "}
          prop. Your future self will write fewer regression tests.
        </p>

        <pre>
          <code>{`// Before: ambiguous combinations
<Button loading success disabled />

// After: one source of truth
<Button state="loading" />`}</code>
        </pre>

        <h2>2. Make the common case the shortest path</h2>
        <p>
          If the most common usage requires four props, the API is wrong. Audit
          your library: which components have the longest typical call site?
          Those are your friction points.
        </p>

        <blockquote>
          The best component APIs feel like the language was bent slightly to
          accommodate them, not the other way around.
        </blockquote>

        <h2>3. Composition beats configuration</h2>
        <p>
          A <code>Card</code> with <code>title</code>,{" "}
          <code>subtitle</code>, <code>actions</code>, and{" "}
          <code>footer</code> props is a configuration trap. The day someone
          needs a badge between the title and subtitle, you&apos;re adding{" "}
          <code>titleSlot</code> — and the slippery slope begins.
        </p>
        <p>
          Expose <code>Card.Header</code>, <code>Card.Body</code>, and{" "}
          <code>Card.Footer</code>. Trust your consumers to compose. The
          surface area shrinks, the flexibility grows.
        </p>

        <h2>4. Name for intent, not implementation</h2>
        <p>
          <code>onValueChange</code> beats <code>onChange</code> when a value is
          what you mean. <code>isOpen</code> beats <code>visible</code> for a
          modal. The name should still make sense after a refactor.
        </p>

        <h2>5. Treat deprecation as a feature</h2>
        <p>
          Plan for the API to change. Ship a <code>@deprecated</code> JSDoc tag,
          a runtime warning in dev, and a codemod the same week you introduce
          the replacement. Teams that can&apos;t migrate quickly are teams that
          stop upgrading you.
        </p>

        <hr />

        <p>
          Good component APIs are an act of empathy for the engineer who will
          inherit them. Name carefully, deprecate openly, and let composition do
          the heavy lifting.
        </p>
      </>
    ),
  },
  {
    slug: "the-quiet-cost-of-client-components",
    title: "The Quiet Cost of Client Components",
    excerpt:
      "Server Components changed how we build, but the default reach for `'use client'` is still the most common performance regression I see in code reviews.",
    date: "2026-04-28",
    readingTime: 7,
    tags: ["next.js", "performance", "react"],
    featured: true,
    content: (
      <>
        <p>
          A pattern keeps showing up in code reviews. An engineer adds{" "}
          <code>&apos;use client&apos;</code> at the top of a page because they
          need a single dropdown to be interactive. The dropdown ships. The
          entire page now hydrates on the client. The bundle grows by 40 kB.
          Nobody notices until the Lighthouse report does.
        </p>

        <h2>The boundary is the budget</h2>
        <p>
          Every <code>&apos;use client&apos;</code> directive draws a line. Everything
          inside that line, plus everything it imports, ships to the browser.
          The directive isn&apos;t a switch on a component — it&apos;s a switch
          on a subtree.
        </p>

        <p>
          The fix is almost always the same: push the directive down, not up.
          Make the dropdown itself the client component. Let its parent stay on
          the server.
        </p>

        <pre>
          <code>{`// Anti-pattern: whole page becomes client
'use client'
export default function Page() {
  return <Article><Dropdown /></Article>
}

// Better: only the leaf is client
// app/page.tsx (server)
export default function Page() {
  return <Article><Dropdown /></Article>
}

// app/dropdown.tsx
'use client'
export function Dropdown() { /* ... */ }`}</code>
        </pre>

        <h2>Pass server data through children</h2>
        <p>
          Client components can render server-rendered children. This is the
          escape hatch that most teams underuse. A client{" "}
          <code>Tabs</code> wrapper can accept a server-rendered{" "}
          <code>TabPanel</code> as <code>children</code> and never bring that
          panel&apos;s code to the browser.
        </p>

        <h2>Audit your boundaries</h2>
        <p>
          Open the bundle analyzer once a quarter. Sort by size. The
          surprises are almost always at boundaries that drifted upward over
          time — usually because someone added{" "}
          <code>&apos;use client&apos;</code> to a layout instead of to the
          interactive piece itself.
        </p>

        <p>
          Server Components reward discipline. The directive is cheap to write
          and expensive to ship. Treat it like one.
        </p>
      </>
    ),
  },
  {
    slug: "a-pragmatic-approach-to-css-architecture",
    title: "A Pragmatic Approach to CSS Architecture in 2026",
    excerpt:
      "Tailwind, CSS Modules, vanilla-extract, Panda — the choice matters less than the conventions you wrap around it. Here is how I think about scale.",
    date: "2026-03-15",
    readingTime: 11,
    tags: ["css", "architecture", "tooling"],
    content: (
      <>
        <p>
          The CSS-in-something debate has been the most exhausting cycle in
          frontend over the last five years. I&apos;ve shipped production code
          in all of them. The honest answer: the tool matters less than the
          team&apos;s discipline around it.
        </p>

        <h2>Pick one, commit hard</h2>
        <p>
          The worst codebases I&apos;ve audited weren&apos;t the ones using the
          &quot;wrong&quot; tool. They were the ones using three. CSS Modules
          for the shell, Tailwind for forms, styled-components left over from
          two refactors ago. Every new engineer pays a tax.
        </p>

        <h2>Tokens before utilities</h2>
        <p>
          Whatever you choose, the layer below it must be a token system. Color,
          spacing, radii, motion — these belong in CSS custom properties or a
          generated source of truth. Utilities and components consume tokens.
          Tokens never reference utilities.
        </p>

        <h2>Style the boundary, not the implementation</h2>
        <p>
          Avoid letting consumers reach into your component with arbitrary
          class overrides. Expose <code>variant</code> and <code>size</code>{" "}
          props, or a <code>className</code> on the outermost element only.
          When everything is overridable, nothing is stable.
        </p>

        <h2>What I reach for today</h2>
        <p>
          For app product surfaces: Tailwind with a strict tokens layer and a
          small set of <code>cva</code>-style component primitives. For
          long-lived design systems: CSS Modules with token imports — the
          generated class names are easy to debug, the tooling is boring, and
          boring is what you want when the codebase outlives the framework.
        </p>
      </>
    ),
  },
  {
    slug: "interviewing-for-staying-power",
    title: "Interviewing for Staying Power",
    excerpt:
      "Most frontend interviews test what someone can build in 45 minutes. The signal I actually care about is what they would still believe in three years from now.",
    date: "2026-02-20",
    readingTime: 6,
    tags: ["career", "engineering-management"],
    content: (
      <>
        <p>
          I&apos;ve interviewed a few hundred frontend engineers over the past
          decade. The technical bar is easy to measure. The traits that
          actually predict whether someone will be a leverage multiplier in two
          years are harder.
        </p>

        <h2>Strong opinions, weakly held</h2>
        <p>
          I want to hear a candidate defend a decision they made — and then
          watch them update their position when given new information.
          Engineers who can&apos;t do the second half become liabilities the
          moment the stack changes.
        </p>

        <h2>Curiosity about the boring parts</h2>
        <p>
          The senior engineers who keep growing are the ones who got curious
          about something unglamorous: the build pipeline, browser caching,
          accessibility tree internals. The flashy things attract everyone. The
          boring things compound.
        </p>

        <h2>How they talk about past teammates</h2>
        <p>
          Listen carefully when a candidate describes a difficult collaborator.
          The story tells you everything about how they&apos;ll show up when
          things get hard. Generosity here is rare and predictive.
        </p>

        <p>
          You can teach a framework. You can&apos;t teach taste, humility, or
          the ability to disagree without making it personal. Hire for those.
          The rest follows.
        </p>
      </>
    ),
  },
  {
    slug: "shipping-accessibility-without-the-theater",
    title: "Shipping Accessibility Without the Theater",
    excerpt:
      "A11y isn't a checklist your linter passes. It's a set of decisions you make at the architecture level, before the first component is written.",
    date: "2026-01-08",
    readingTime: 8,
    tags: ["accessibility", "engineering-practice"],
    content: (
      <>
        <p>
          Most accessibility work I see in the wild is theater — an{" "}
          <code>aria-label</code> bolted onto a div that should have been a
          button, a contrast ratio fixed in the eleventh hour before launch. It
          ships. It technically passes. It also fails the people it was
          supposed to serve.
        </p>

        <h2>Use the right element</h2>
        <p>
          Eighty percent of accessibility is choosing the correct HTML element.
          A button is a button. A link goes somewhere. A form has labels. If
          you reach for ARIA before you&apos;ve exhausted semantic HTML,
          you&apos;re patching a decision you should reconsider.
        </p>

        <h2>Test with a keyboard, every time</h2>
        <p>
          Before you open a PR, navigate the feature using only{" "}
          <code>Tab</code>, <code>Shift+Tab</code>, <code>Enter</code>, and{" "}
          <code>Escape</code>. If you can&apos;t complete the flow, neither can
          anyone relying on assistive tech. This single habit catches more
          regressions than any automated tool.
        </p>

        <h2>Make it part of the design review</h2>
        <p>
          Accessibility is a design problem long before it&apos;s an
          implementation problem. Color choices, focus states, motion —
          these are decided in Figma. The earlier the conversation, the cheaper
          the outcome.
        </p>

        <p>
          The teams that ship genuinely accessible products treat it as a
          quality bar, not a compliance one. The work is quieter. The result
          is harder to fake.
        </p>
      </>
    ),
  },
];

export function getAllPosts(): PostMeta[] {
  return posts
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.excerpt,
      date: p.date,
      readingTime: p.readingTime,
      tags: p.tags,
      featured: p.featured,
    }))
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getFeaturedPosts(): PostMeta[] {
  return getAllPosts().filter((p) => p.featured);
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return posts.map((p) => p.slug);
}

export function getAllTags(): string[] {
  const set = new Set<string>();
  posts.forEach((p) => p.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort();
}
