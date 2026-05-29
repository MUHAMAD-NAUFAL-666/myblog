"use client";

import { useState } from "react";
import { cn } from "@/app/lib/cn";

type Language = "sql" | "ts" | "tsx" | "bash" | "text";

type CodeBlockProps = {
  code: string;
  language?: Language;
  filename?: string;
  className?: string;
  showCopy?: boolean;
};

export function CodeBlock({
  code,
  language = "sql",
  filename,
  className,
  showCopy = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className={cn("code-shell", className)}>
      {(filename || showCopy) && (
        <div className="code-titlebar">
          <span className="flex items-center gap-2">
            {filename && (
              <>
                <FileIcon className="size-3.5" />
                <span>{filename}</span>
              </>
            )}
            {!filename && <span className="uppercase">{language}</span>}
          </span>
          {showCopy && (
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted transition hover:bg-background hover:text-foreground"
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
          )}
        </div>
      )}
      <pre>
        <code
          dangerouslySetInnerHTML={{ __html: highlight(code, language) }}
        />
      </pre>
    </div>
  );
}

/* -------------------------------------------------------------
   Tiny SQL highlighter — server-safe (string -> HTML)
   ------------------------------------------------------------- */
const SQL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "INSERT", "INTO", "VALUES", "UPDATE", "SET",
  "DELETE", "CREATE", "TABLE", "DROP", "ALTER", "ADD", "COLUMN", "PRIMARY",
  "KEY", "FOREIGN", "REFERENCES", "NOT", "NULL", "DEFAULT", "UNIQUE",
  "AND", "OR", "IN", "LIKE", "BETWEEN", "IS", "AS", "ON", "JOIN", "LEFT",
  "RIGHT", "INNER", "OUTER", "FULL", "CROSS", "GROUP", "BY", "HAVING",
  "ORDER", "ASC", "DESC", "LIMIT", "OFFSET", "DISTINCT", "UNION", "ALL",
  "CASE", "WHEN", "THEN", "ELSE", "END", "WITH", "RECURSIVE", "EXISTS",
  "INDEX", "VIEW", "BEGIN", "COMMIT", "ROLLBACK", "TRANSACTION",
  "INTEGER", "INT", "BIGINT", "VARCHAR", "TEXT", "BOOLEAN", "DATE",
  "TIMESTAMP", "DECIMAL", "NUMERIC", "SERIAL", "TRUE", "FALSE",
  "AUTO_INCREMENT", "CONSTRAINT", "CHECK", "CASCADE", "RESTRICT",
  "RETURNING", "USING", "IF", "EXTRACT",
]);

const SQL_FUNCTIONS = new Set([
  "COUNT", "SUM", "AVG", "MIN", "MAX", "COALESCE", "NULLIF", "CAST",
  "CONVERT", "ROUND", "FLOOR", "CEIL", "ABS", "UPPER", "LOWER", "LENGTH",
  "SUBSTRING", "TRIM", "CONCAT", "NOW", "CURRENT_DATE", "CURRENT_TIMESTAMP",
  "ROW_NUMBER", "RANK", "DENSE_RANK", "OVER", "PARTITION", "LAG", "LEAD",
]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function highlight(code: string, language: Language): string {
  if (language !== "sql") return escapeHtml(code);

  // Tokenize the input safely. Order matters.
  const out: string[] = [];
  let i = 0;
  const src = code;

  while (i < src.length) {
    const rest = src.slice(i);

    // Line comment --
    const line = rest.match(/^--[^\n]*/);
    if (line) {
      out.push(`<span class="sql-com">${escapeHtml(line[0])}</span>`);
      i += line[0].length;
      continue;
    }

    // Block comment /* */
    const block = rest.match(/^\/\*[\s\S]*?\*\//);
    if (block) {
      out.push(`<span class="sql-com">${escapeHtml(block[0])}</span>`);
      i += block[0].length;
      continue;
    }

    // String 'literal' or "ident"
    const str = rest.match(/^'(?:[^'\\]|\\.|'')*'/);
    if (str) {
      out.push(`<span class="sql-str">${escapeHtml(str[0])}</span>`);
      i += str[0].length;
      continue;
    }

    // Number
    const num = rest.match(/^\d+(?:\.\d+)?/);
    if (num) {
      out.push(`<span class="sql-num">${escapeHtml(num[0])}</span>`);
      i += num[0].length;
      continue;
    }

    // Identifier / keyword
    const word = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (word) {
      const w = word[0];
      const upper = w.toUpperCase();
      if (SQL_KEYWORDS.has(upper)) {
        out.push(`<span class="sql-kw">${escapeHtml(w)}</span>`);
      } else if (SQL_FUNCTIONS.has(upper)) {
        out.push(`<span class="sql-fn">${escapeHtml(w)}</span>`);
      } else {
        out.push(escapeHtml(w));
      }
      i += w.length;
      continue;
    }

    // Anything else (whitespace, punctuation)
    out.push(escapeHtml(src[i]));
    i += 1;
  }

  return out.join("");
}

/* Icons */
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

function FileIcon({ className }: { className?: string }) {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
