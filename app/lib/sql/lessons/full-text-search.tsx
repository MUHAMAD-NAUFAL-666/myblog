import type { Lesson } from "@/app/lib/sql/types";
import { CodeBlock } from "@/app/components/code-block";
import { Callout, H2 } from "@/app/lib/sql/mdx";
import {
  KeyConcepts,
  Prerequisites,
  Recap,
} from "@/app/lib/sql/docs-components";

export const lesson: Lesson = {
  slug: "full-text-search",
  number: "10.02",
  title: "Full-text search",
  description:
    "Built-in MATCH ... AGAINST for natural-language and boolean searches — and the line where you graduate to a real search engine.",
  duration: "12 min",
  tags: ["full-text", "search", "innodb"],
  headings: [
    { id: "what-it-does", text: "What full-text search does", depth: 2 },
    { id: "creating-the-index", text: "Creating a FULLTEXT index", depth: 2 },
    { id: "natural-language-mode", text: "Natural language mode", depth: 2 },
    { id: "boolean-mode", text: "Boolean mode", depth: 2 },
    { id: "tuning-for-real-text", text: "Tuning for real text", depth: 2 },
    { id: "when-to-graduate", text: "When to graduate to a real search engine", depth: 2 },
    { id: "recap", text: "Recap", depth: 2 },
  ],
  content: (
    <>
      <p>
        Full-text search lets you ask &ldquo;find rows whose text
        column matches these words&rdquo; without writing your own
        token index. InnoDB has done it natively since 5.6. It
        won&apos;t replace Elasticsearch — but for product search,
        article search, or admin tools, it&apos;s often more than
        enough.
      </p>

      <Prerequisites
        items={[
          "Index design from lesson 5.4 — full-text is just another index type.",
          "MySQL 5.6+ for InnoDB FULLTEXT (8.0 has more features).",
          "A text column or two you'd like to make searchable.",
        ]}
      />

      <H2 id="what-it-does">What full-text search does</H2>

      <KeyConcepts
        items={[
          {
            title: "Tokenizes the column",
            body: "Splits text into words on whitespace and punctuation, lowercases them, optionally drops stopwords ('the', 'and').",
          },
          {
            title: "Builds an inverted index",
            body: "For each token, stores the list of rows containing it. Lookups become 'find the rows for word A intersected with word B'.",
          },
          {
            title: "Returns relevance scores",
            body: "MATCH(...) AGAINST(...) returns a number representing how well the row matches. Sort or filter by it.",
          },
          {
            title: "Two query modes",
            body: "Natural language (TF-IDF-ish, fuzzy) and boolean (operators for required, excluded, prefix). Pick by use case.",
          },
        ]}
      />

      <H2 id="creating-the-index">Creating a FULLTEXT index</H2>

      <CodeBlock
        language="sql"
        code={`CREATE TABLE articles (
  id    BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  body  MEDIUMTEXT   NOT NULL,
  FULLTEXT KEY ft_articles_title_body (title, body)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Or add it later.
ALTER TABLE articles
  ADD FULLTEXT KEY ft_articles_title_body (title, body);

INSERT INTO articles (title, body) VALUES
  ('Indexes in MySQL', 'B-trees, hash indexes, and the buffer pool ...'),
  ('Replication 101',  'Binary logs are how MySQL streams changes ...'),
  ('JSON in MySQL',    'A native JSON type and how to index nested fields ...');`}
      />

      <Callout variant="info" title="One FULLTEXT index per query">
        A single <code>MATCH ... AGAINST</code> can only use one
        FULLTEXT index. Choose the column combination thoughtfully —
        if you need to search title and body together, index them
        together (as above), not separately.
      </Callout>

      <H2 id="natural-language-mode">Natural language mode</H2>

      <CodeBlock
        language="sql"
        code={`-- Default mode. Returns rows ordered by relevance score.
SELECT id, title,
       MATCH(title, body) AGAINST('mysql replication') AS score
FROM   articles
WHERE  MATCH(title, body) AGAINST('mysql replication')
ORDER  BY score DESC;`}
      />

      <KeyConcepts
        items={[
          {
            title: "TF-IDF-style scoring",
            body: "Words that are rare across the corpus contribute more to the score. Stopwords contribute nothing.",
          },
          {
            title: "50% threshold",
            body: "Words appearing in more than 50% of rows are ignored entirely. On small tables this can mean 'nothing matches' — flip to boolean mode in those cases.",
          },
          {
            title: "Score = 0 means no match",
            body: "WHERE MATCH ... AGAINST keeps only positive scores. The same expression in SELECT lets you display the score.",
          },
          {
            title: "MIN_WORD_LEN",
            body: "Words shorter than the threshold (default 3 for InnoDB) are ignored. Useful for SKU-like searches: lower it.",
          },
        ]}
      />

      <H2 id="boolean-mode">Boolean mode — the operator-rich one</H2>

      <CodeBlock
        language="sql"
        code={`SELECT id, title
FROM   articles
WHERE  MATCH(title, body)
       AGAINST('+mysql +replication -binlog' IN BOOLEAN MODE);

-- Operators:
--   +word    must contain the word
--   -word    must NOT contain
--   word*    prefix match (like word%, but indexed)
--   "phrase" exact phrase
--   >word    rank higher
--   <word    rank lower
--   (a b)    grouping`}
      />

      <KeyConcepts
        items={[
          {
            title: "Predictable on small datasets",
            body: "No 50% threshold, no stopword removal of single-letter terms. What you write is what you match.",
          },
          {
            title: "Prefix matching",
            body: "rep* matches replication, replicate, repository. Closest you'll get to LIKE 'rep%' that's actually fast on millions of rows.",
          },
          {
            title: "Phrase search",
            body: "\"binary log\" requires the words adjacent. Without quotes they can be anywhere.",
          },
          {
            title: "Returns relevance too",
            body: "Same MATCH expression in SELECT gives a relevance value. Combine with operators for fine-tuned ordering.",
          },
        ]}
      />

      <H2 id="tuning-for-real-text">Tuning for real text</H2>

      <KeyConcepts
        items={[
          {
            title: "Lower innodb_ft_min_token_size",
            body: "Default 3; SKUs and acronyms (CSS, AI, US) are 2 chars. Drop to 2 — but you must rebuild the index.",
          },
          {
            title: "Custom stopwords",
            body: "Replace the default English list with your own (or empty) by setting innodb_ft_server_stopword_table. Useful for domain language.",
          },
          {
            title: "ngram parser for CJK",
            body: "Whitespace tokenization fails for Chinese/Japanese/Korean. Use WITH PARSER ngram on the FULLTEXT index for character-based tokens.",
          },
          {
            title: "Rebuild after config changes",
            body: "min_token_size, stopwords, parser changes don't apply retroactively. Drop and recreate the FULLTEXT index after editing.",
          },
        ]}
      />

      <CodeBlock
        language="sql"
        code={`-- ngram for CJK content.
ALTER TABLE articles
  DROP INDEX  ft_articles_title_body,
  ADD FULLTEXT KEY ft_articles_title_body (title, body) WITH PARSER ngram;

-- After server config change (innodb_ft_min_token_size, stopwords).
ALTER TABLE articles DROP INDEX ft_articles_title_body;
ALTER TABLE articles ADD FULLTEXT KEY ft_articles_title_body (title, body);`}
      />

      <H2 id="when-to-graduate">When to graduate to a real search engine</H2>

      <KeyConcepts
        items={[
          {
            title: "When you need typo tolerance",
            body: "MySQL doesn't do fuzzy matching ('mysql' won't match 'mysq1'). Elasticsearch / OpenSearch / Meilisearch do.",
          },
          {
            title: "When you need facets and aggregations",
            body: "Counts by category/tag combined with text search are clunky in MySQL, native in search engines.",
          },
          {
            title: "When you need synonym expansion",
            body: "'sneakers' → 'trainers'. Possible with custom stopword work in MySQL, much easier with Elastic's analyzer chain.",
          },
          {
            title: "When latency matters",
            body: "MySQL FULLTEXT is fine to ~10s of millions of rows. Beyond that, dedicated engines outperform — at the cost of an extra system to run.",
          },
        ]}
      />

      <Callout variant="pro" title="Start with built-in, graduate when needed">
        For most internal tools and 90% of B2B products, MySQL
        FULLTEXT is enough. Adding Elasticsearch costs an ops team
        and a sync pipeline. Don&apos;t take that on until the
        feature gap is real.
      </Callout>

      <Recap
        items={[
          "FULLTEXT indexes tokenize text and build an inverted index inside InnoDB.",
          "Natural language mode is fuzzy and TF-IDF-ish; boolean mode gives you operators and prefix matching.",
          "Tune innodb_ft_min_token_size, stopwords, and the parser (ngram for CJK) for real-world text.",
          "Rebuild the index after config changes — they don't apply retroactively.",
          "Graduate to a search engine when you need typo tolerance, facets, or sub-100ms search at huge scale.",
        ]}
      />
    </>
  ),
};
