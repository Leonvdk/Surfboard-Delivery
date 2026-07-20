---
name: organic-audit
description: Comprehensive audit of the site's organic-traffic surface — SEO (traditional Google), GEO (AI answer engines: ChatGPT / Claude / Perplexity / Google AI Overviews / Gemini), local search (GBP + citations), and technical health (CWV, schema, indexation). Produces a prioritized action list ranked by impact ÷ effort. Runs as a fan-out of specialist agents so no one lens dominates.
---

# Organic-traffic audit — SEO + GEO + Local + Technical

You are running a comprehensive audit of the organic-traffic surface
of Surf Rental Aljezur (or whichever site is at $CWD). Goal: a
ranked list of concrete, shippable interventions, not observations.

## Scope of the audit

Every audit covers **all six lenses** unless the user narrows it:

1. **AI answer engines / GEO** — is the site quotable by
   ChatGPT / Claude / Perplexity / AI Overviews?
2. **Traditional Google SEO** — head-term rankings, title/meta,
   internal linking, canonicals.
3. **Local SEO** — Google Business Profile, citations, review flow,
   NAP consistency, service-area schema.
4. **Content architecture** — pillar-and-cluster coverage, topical
   authority, cannibalization, thin content.
5. **Schema / structured data** — LocalBusiness depth, Service,
   Offer, FAQPage, HowTo, Article, GeoCircle.
6. **Technical health** — Core Web Vitals (LCP / INP / CLS),
   crawlability, sitemap, robots, freshness signals.

## Ground truths this audit assumes (2026)

Codify these into every recommendation. Do not re-derive them.

- **AI Overviews are in ~38% of local-service queries.** Optimizing
  only for the 10 blue links leaves visibility on the table.
- **Overlap between top-10 Google rankings and AI-cited URLs is
  <20%.** Ranking well is no longer sufficient.
- **The first 30% of a page carries 44% of LLM citations.** The
  first 200 words should completely answer the primary query.
- **Freshness is a hard threshold.** Content >3 months old drops
  sharply in AI citations. Perplexity cites <30d content at ~82%.
- **Original data / first-party research is cited by AI at 82% vs
  25% for generic blogs.** Statistics in-text lift AI visibility
  ~41%.
- **Question-shaped H2s ("How much does X cost?") beat statement
  H2s** for AI citation frequency.
- **Structured data lifts organic CTR 30-82%.** LocalBusiness +
  FAQPage schema is table-stakes.
- **Review recency > review volume** for local pack ranking.
- **CWV is domain-level** (since March 2026). Bad template pages
  drag down good pages. Thresholds: LCP <2.5s / INP <200ms /
  CLS <0.1.
- **Citations > backlinks for LLMs** — unlinked brand mentions
  correlate 3× more strongly with AI visibility than backlinks.

See `docs/seo-playbook-2026.md` for source citations. Numbers are
directional (secondary-blog claims, adversarial-verify unconfirmed);
qualitative patterns are high-confidence.

## Prerequisites

Before spawning any agents, gather ground truth:
- Read `docs/seo-playbook-2026.md` (canonical source of the 2026
  ground truths above).
- Read `apps/web/app/lib/metadata.ts`, `apps/web/app/lib/jsonld.ts`,
  `apps/web/app/lib/pricing.ts` — canonical facts.
- Read `apps/web/app/layout.tsx`, `apps/web/app/page.tsx` — root
  metadata and homepage.
- Read `apps/web/public/robots.txt` and `apps/web/public/llms.txt`.
- Skim `apps/web/app/sitemap.ts` for pages in scope.
- If GA/GSC data is available (via the google-analytics MCP or
  a paste from the user), pull top queries + impressions + CTR
  for the last 90 days. If not, flag it as "GSC data not
  provided — recommendations will be pattern-based, not
  data-driven."

## Execution model

Fan out **six specialist agents in parallel** via the Agent tool,
one per lens. Every agent gets:
- The audit brief (what to look at, what to report).
- Access to the site under $CWD (they read files, not the live
  URL — same as this repo).
- A strict output schema: `{finding, evidence, impact,
  effort, recommendation, category}`.

Agent brief template (fill in `{lens}` and `{focus}`):

> You are the {lens} lens on a comprehensive organic-audit of the
> site at $CWD.
>
> Read the ground truths at `docs/seo-playbook-2026.md`. Read the
> files listed under "Prerequisites" in `.claude/skills/organic-
> audit.md`.
>
> Your job: find every concrete, shippable improvement in {focus}.
> Not observations — actions.
>
> For each finding, return:
> - `finding`: what's wrong or missing, one sentence.
> - `evidence`: the file/line or the specific query where you saw
>   it. Cite `file:line` where relevant.
> - `impact`: H / M / L against the 2026 ground truths above. State
>   which one it maps to.
> - `effort`: S (<1h) / M (half-day) / L (1-2 days).
> - `recommendation`: the exact change to make. Names files, names
>   copy, names schema keys.
> - `category`: {lens}.
>
> Do not restate the ground truths in your output. Do not restate
> what the site is doing well — only what to change. Do not
> generalize; every recommendation must land on a specific file or
> URL or query. Skip if not applicable to {lens}.
>
> Cap: 12 findings. Rank most-impactful first.

**Six agents:**

1. **GEO lens** — `{focus}` = AI answer engines. Look for: first
   200 words don't answer primary query; H2s not in question form;
   missing statistics; no first-party data; unstructured prose
   where lists/quotes would win; missing/thin FAQ schema; missing
   `dateModified`; freshness gaps; llms.txt gaps.

2. **Google SEO lens** — `{focus}` = traditional Google. Look
   for: title/meta length + keyword coverage; missing H1 or
   multiple H1s; canonicals; internal linking depth; anchor-text
   diversity; cannibalization (multiple pages targeting same
   query); orphan pages in sitemap; head-term coverage.

3. **Local SEO lens** — `{focus}` = local pack + GBP + citations.
   Look for: missing service-area entities in content; NAP
   inconsistencies between site and public directories; missing
   `sameAs` in LocalBusiness; missing `openingHoursSpecification`,
   `geo`, `serviceArea`/`GeoCircle`; review count/recency signals;
   Portugal-specific citations gap (Páginas Amarelas, PAI.pt,
   TripAdvisor, Turismo de Portugal).

4. **Content architecture lens** — `{focus}` = topical authority
   + pillars + clusters. Look for: unclustered orphan blog posts;
   pillar pages missing; head-term with no dedicated landing
   page; cannibalization; internal-link depth from pillar to
   cluster; thin/dead content candidates for noindex.

5. **Schema lens** — `{focus}` = structured data depth. Look for:
   `LocalBusiness` sub-type specificity; `Offer` +
   `priceSpecification`; `Service` nodes; `FAQPage`, `HowTo`,
   `Article` coverage; `AggregateRating`/`Review`; breadcrumbs;
   Product schema on gear; `GeoCircle`/`GeoShape` service area.
   Run schema through the mental Google Rich Results test — is
   every claim in JSON also visible on the page?

6. **Technical lens** — `{focus}` = CWV, crawl, freshness.
   Look for: LCP culprits (hero image weight, blocking JS);
   INP risks (heavy hydration on the fold); CLS risks (images
   without dimensions, fonts without size-adjust); missing
   `dateModified`; robots.txt coverage; sitemap freshness;
   redirect chains; 404s in internal links; canonical
   inconsistencies.

## After the fan-out

1. **Deduplicate** across the six reports. Same file/change from
   two lenses = one finding.
2. **Rank** by impact ÷ effort. Print the ranked list with each
   item numbered. Group by lens for visual scan but keep the
   rank.
3. **Present a two-tier list** to the user:
   - **Ship now** (top 10-15) — cheap, unambiguous wins.
   - **Discuss** — items with tradeoffs or requiring product
     decisions.
4. **Do not implement anything without approval.** The user
   picks which to ship. This audit produces a menu, not a
   commit.

## Output format

Present in chat as a compact table. Each row:

```
#N [lens] [effort] impact — finding → recommendation (file:line)
```

Example:

```
#1 [schema] S H — LocalBusiness lacks GeoCircle serviceArea →
    add `serviceArea: {"@type":"GeoCircle", "geoMidpoint":..., "geoRadius":"15000"}` (apps/web/app/lib/jsonld.ts:60)
```

After the table, three-sentence executive summary: what the site
does well, what the biggest gap is, what the 30-day quick win is.

## Anti-patterns to avoid

- **Do not recommend "publish quality content."** Every rec must
  name a specific artifact.
- **Do not chase word count.** Answer quality > length in 2026.
- **Do not recommend backlink-only strategies.** Cite the 3:1
  advantage of unlinked mentions.
- **Do not miss the AI-answer-engine angle.** Every audit must
  include a GEO pass; a Google-only audit is 2020 thinking.
- **Do not invent stats.** If you cite a number, cite a source.
- **Do not recommend enterprise tooling.** Free tools first
  (GSC, Autocomplete, PAA, PageSpeed Insights, Rich Results Test).

## Tools / MCP integrations that help this skill

- `mcp__google-analytics__run_report` — pull real query + landing
  data if available.
- `mcp__Claude_Browser__*` or `mcp__plugin_playwright_playwright__*`
  — render the actual site to inspect what the user sees (and
  what an LLM crawler sees) rather than only the source.
- `WebFetch` / `WebSearch` — check current AI-answer-engine
  guidance if the playbook is >90 days stale.
- The `deep-research` skill — run a fresh evidence pass if the
  audit is being done in a new domain or the playbook has
  gone stale.

## When to refresh this skill

The 2026 ground truths at the top will drift. Rerun the deep-
research skill against the following seed query every 6 months
and refresh both this file and `docs/seo-playbook-2026.md`:

> "What have the highest-ROI changes been in SEO / GEO / local
> search / structured data / Core Web Vitals in the last 6
> months? What tactics that worked 6 months ago no longer work?
> What new AI answer engines / directories / schema types
> should a small local service business care about? Cite recent
> primary sources."
