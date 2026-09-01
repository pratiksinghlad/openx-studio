# SEO & LLM Agent Discoverability Lessons

## 1. Multi-Bot Permissive Robots.txt and LLMs.txt
- **Context**: Modern webapps require explicit indexing/scraping allowances for both traditional search engines (Google, Bing) and AI crawlers (GPTBot, ClaudeBot, Google-Extended, PerplexityBot, etc.).
- **Rule**:
  - Always place `robots.txt`, `llms.txt`, `llms-full.txt`, and `sitemap.xml` inside `public/` so they are copied directly to `dist/`.
  - Include explicit `Sitemap:` and `LLMs-Txt:` directives in `robots.txt`.
  - Provide both `/llms.txt` (structured summary for LLM context retrieval) and `/llms-full.txt` (full developer documentation, schemas, and coordinate mappings).
  - In `index.html`, include `<link rel="help" type="text/markdown" href="/llms.txt">` and Schema.org JSON-LD structured data (`WebApplication`, `WebSite`, `FAQPage`) alongside semantic crawler fallback content inside `<div id="root">` and `<noscript>` for non-JS scrapers.
