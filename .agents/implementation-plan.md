# Agent Implementation Plan — SurfRental Aljezur SEO & Blog System

*This document provides step-by-step instructions for agents to implement the SEO strategy defined in `seo-strategy-and-content-calendar.md`.*

---

## Prerequisites

Before starting any task, agents must:

1. Read `.agents/product-marketing-context.md` for brand voice, audience, and positioning
2. Read `.agents/seo-strategy-and-content-calendar.md` for the full strategy
3. Follow the blog post template defined in the strategy document (Appendix)
4. Run `pnpm lint` after any code changes
5. Use Biome formatting (tabs, 100 char width) for all TypeScript/JavaScript

---

## Phase 0: Technical SEO Fixes (Do First)

### Task 0.1: Add Blog to Main Navigation *(PRIORITY: P1)*

**File:** `apps/web/app/components/nav.tsx`

**Instructions:**
1. Read the current nav component
2. Add a "Blog" or "Guides" link to the main navigation items (alongside Boards, Pricing, Process, Reviews)
3. Position it after "Reviews" and before the CTA button
4. Link to `/blog`
5. Ensure mobile menu also includes the new link

**Acceptance criteria:**
- Blog link visible in desktop and mobile navigation
- Links to `/blog`
- Styling matches existing nav items

---

### Task 0.2: Add Breadcrumbs Component *(PRIORITY: P1)*

**Instructions:**
1. Create a reusable `Breadcrumbs` component at `apps/web/app/components/breadcrumbs.tsx`
2. Accept props: `items: Array<{ label: string; href?: string }>`
3. Render as: `Home > Section > Current Page` (last item not linked)
4. Style with existing design system (small text, muted color, separator between items)
5. Add `BreadcrumbList` JSON-LD using the existing `breadcrumbJsonLd()` helper from `app/lib/jsonld.ts`
6. Add the Breadcrumbs component to these pages:
   - All blog post pages (`app/blog/[slug]/page.tsx`)
   - `/surf-gear`, `/pricing`, `/how-it-works`, `/surf-spots`, `/faq`
   - `/about`, `/reviews`, `/contact`
   - `/group-bookings`, `/gift-vouchers`, `/partners`, `/sustainability`

**Acceptance criteria:**
- Breadcrumbs visible on all subpages (not homepage)
- JSON-LD breadcrumb data rendered in `<head>`
- Breadcrumbs match URL hierarchy (e.g., Home > Blog > Post Title)

---

### Task 0.3: Create Blog Tag Archive Pages *(PRIORITY: P1)*

**Instructions:**
1. Create route `apps/web/app/blog/tag/[tag]/page.tsx`
2. Get all unique tags from `getAllPosts()` → extract unique tags from all posts
3. Add `generateStaticParams` to pre-render all tag pages
4. Display filtered list of posts matching the tag
5. Add proper metadata: `title: "Posts tagged [tag] | SurfRental Aljezur"`
6. Add these tag pages to the sitemap by updating `apps/web/app/sitemap.ts`
7. Add tag links to the blog index page (`apps/web/app/blog/page.tsx`)

**Existing tags to support:**
- comparison, Portugal, planning, surf spots, Arrifana, surf guide
- seasons, surf conditions, Aljezur, Costa Vicentina, beginner
- first time, gear, surfboards, itinerary, travel
- accommodation, family, kids, surf knowledge

**Acceptance criteria:**
- `/blog/tag/beginner` shows all posts tagged "beginner"
- All tag pages have proper metadata and are in the sitemap
- Blog index shows clickable tag filters

---

### Task 0.4: Add `updated` Field Support to Blog System *(PRIORITY: P2)*

**Instructions:**
1. Update `PostMeta` interface in `apps/web/app/lib/blog.ts` to include optional `updated: string`
2. Parse the `updated` field from MDX front matter
3. Update `apps/web/app/blog/[slug]/page.tsx` to:
   - Pass `dateModified` to `articleJsonLd()` when `updated` field exists
   - Display "Last updated: [date]" on blog posts when the `updated` field differs from `date`
4. Add `updated` field to all existing blog post front matter (set to same as `date` initially)

**Acceptance criteria:**
- Blog posts show "Last updated" date when present
- Article JSON-LD includes `dateModified`
- Existing posts have `updated` field in front matter

---

### Task 0.5: Fix Canonical URLs on All Pages *(PRIORITY: P2)*

**Instructions:**
1. Audit all page.tsx files for `alternates: { canonical: "..." }`
2. Every page must have its own canonical URL (not the homepage)
3. The canonical should be the full URL (using `SITE_URL` from metadata.ts)
4. Check: `/about`, `/reviews`, `/group-bookings`, `/gift-vouchers`, `/partners`, `/sustainability`, `/blog`, `/blog/[slug]`

**Acceptance criteria:**
- Every page has a unique canonical URL matching its path
- No page canonicals point to homepage (except homepage itself)

---

### Task 0.6: Add Default OG Image *(PRIORITY: P1)*

**Instructions:**
1. Create a default Open Graph image (1200x630px) showing the SurfRental brand, a surfboard, and the Costa Vicentina coastline
2. Save as `apps/web/public/images/og-default.jpg`
3. Update `apps/web/app/lib/metadata.ts` to include default `openGraph.images` and `twitter.images`:
   - `openGraph.images: [{ url: "/images/og-default.jpg", width: 1200, height: 630, alt: "SurfRental Aljezur — Surfboard & Wetsuit Rental" }]`
4. For blog posts: add optional `image` field to front matter, and override `openGraph.images` in `generateMetadata` when present

**Acceptance criteria:**
- Social shares of any page show a branded image
- Blog posts can optionally override with post-specific images

---

### Task 0.7: Fix Inventory Mismatch in Surfboard Blog Post *(PRIORITY: P1)*

**File:** `apps/web/content/blog/what-surfboard-should-i-rent.mdx`

**Issue:** The post describes boards not in actual stock — 8'0 soft tops, fibreglass funboards, shortboards 5'10-6'4, longboards 9'0-9'4. The actual quiver is: 6'6 shortboard, 7'0 funboard, 7'8 funboard, 8'6 longboard (all soft-top).

**Instructions:**
1. Rewrite board descriptions to match actual inventory from `.agents/product-marketing-context.md`
2. Update size references and comparison tables
3. Explain why soft-tops (not fibreglass) are the right choice for this coastline and rental context
4. Keep the general advice structure intact — just align specific boards with reality

**Acceptance criteria:**
- Every board size mentioned matches actual stock
- No references to fibreglass or hard boards as available rentals
- Content remains helpful for anyone renting boards, not just our customers

---

## Phase 1: Content Creation — Surf Spot Guides (April 2026)

### Task 1.1: Write Monte Clérigo Surf Guide

**File:** `apps/web/content/blog/monte-clerigo-surf-guide.mdx`

**Target keyword:** "monte clerigo surf"
**Secondary keywords:** "monte clerigo beach surf", "surfing monte clerigo portugal"

**Front matter:**
```yaml
title: "Monte Clérigo Surf Guide: A Beginner's Paradise on the Costa Vicentina"
description: "Everything you need to know about surfing Monte Clérigo — tides, conditions, skill level, seasonal changes, and why it's one of Aljezur's best beginner beaches."
date: "2026-04-07"
tags: ["surf spots", "Monte Clérigo", "beginner", "surf guide"]
```

**Content requirements:**
- First paragraph: Direct, extractable answer (40-60 words) about what Monte Clérigo is and who it's best for
- Sections: The beach layout, Best conditions (tide/swell/wind), Seasonal breakdown, Who should surf here, Facilities and parking, Compared to neighboring beaches
- Include comparison table: Monte Clérigo vs Arrifana vs Amoreira
- FAQ section (3-5 questions)
- Internal links to: `/surf-spots`, `/blog/arrifana-surf-guide`, `/blog/complete-guide-surfing-aljezur`, `/pricing`
- CTA linking to `/contact` or `/pricing`
- Reference actual local knowledge from `llms.txt` and existing blog content

**Brand voice:** Honest, knowledgeable, like a friend who surfs there daily. No hype.

---

### Task 1.2: Write Amoreira Surf Guide

**File:** `apps/web/content/blog/amoreira-surf-guide.mdx`

**Target keyword:** "amoreira surf" / "amoreira beach surfing"

**Front matter:**
```yaml
title: "Amoreira Surf Guide: Powerful Waves at the River Mouth"
description: "A detailed guide to surfing Amoreira — the river-mouth break near Aljezur. Conditions, currents, skill level required, and what makes it different from other Costa Vicentina spots."
date: "2026-04-21"
tags: ["surf spots", "Amoreira", "intermediate", "surf guide"]
```

**Content requirements:**
- Emphasize this is intermediate-to-advanced (strong currents, river mouth)
- Sections: The setup (river mouth dynamics), Best conditions, Seasonal guide, Safety (rip currents/river current), Who should surf here, Getting there
- Safety warnings about currents
- Internal links: `/surf-spots`, `/blog/monte-clerigo-surf-guide`, `/blog/arrifana-surf-guide`, `/blog/surf-safety-portugal`
- FAQ section

---

### Task 1.3: Write Vale Figueiras Surf Guide

**File:** `apps/web/content/blog/vale-figueiras-surf-guide.mdx`

**Target keyword:** "vale figueiras surf"

**Front matter:**
```yaml
title: "Vale Figueiras Surf Guide: Uncrowded Waves on the Costa Vicentina"
description: "A guide to surfing Vale Figueiras — one of the most consistent and uncrowded surf spots near Aljezur. Conditions, access, and what to expect."
date: "2026-05-05"
tags: ["surf spots", "Vale Figueiras", "intermediate", "surf guide"]
```

**Content requirements:**
- Emphasis on consistency and lack of crowds
- Sections: The beach, Why it's uncrowded, Best conditions, Seasonal guide, Access and parking, Who should surf here
- Internal links to hub and neighboring spot guides
- FAQ section

---

### Task 1.4: Write Surf Safety Guide

**File:** `apps/web/content/blog/surf-safety-portugal.mdx`

**Target keyword:** "surf safety" / "rip current safety surfing"

**Front matter:**
```yaml
title: "Surf Safety in Portugal: Rip Currents, Priority Rules, and Knowing Your Limits"
description: "A practical guide to staying safe while surfing in Portugal. How to identify and escape rip currents, right-of-way rules, and when it's smarter not to paddle out."
date: "2026-04-14"
tags: ["safety", "beginner", "surf knowledge"]
```

**Content requirements:**
- Must be genuinely helpful safety content — this builds trust and E-E-A-T
- Sections: Rip currents (how to spot, how to escape), Right of way rules (with diagrams/descriptions), When not to paddle out, Equipment safety, Beach flags, Emergency contacts for Aljezur area
- Include specific Costa Vicentina context (which beaches have stronger currents)
- Internal links to spot guides, first-time surfing post
- FAQ section

---

### Task 1.5 through 1.8: Continue with Content Calendar Phase 1

Follow the Phase 1 calendar in `seo-strategy-and-content-calendar.md` section 4. Each post should:
- Follow the MDX template from the Appendix
- Include all required internal links
- Have proper front matter with tags
- Include FAQ section for AI extractability
- Include at least one comparison table where applicable
- End with a CTA to `/pricing` or `/contact`

---

## Phase 2: Surf Spot Pages (Programmatic SEO)

### Task 2.1: Create Surf Spot Detail Page Template

**Instructions:**
1. Create route `apps/web/app/surf-spots/[spot]/page.tsx`
2. Create data file `apps/web/app/lib/surf-spots.ts` with structured data for each spot:

```typescript
interface SurfSpot {
  slug: string;
  name: string;
  level: string;
  description: string;
  bestTide: string;
  bestSwell: string;
  bestWind: string;
  hazards: string[];
  facilities: string[];
  parking: string;
  coordinates: { lat: number; lng: number };
  relatedBlogPost?: string;
}
```

3. Populate with data for: Arrifana, Monte Clérigo, Amoreira, Vale Figueiras, Bordeira, Carrapateira
4. Each page should render:
   - Spot name + level badge
   - Quick-reference stats table
   - Detailed description
   - Seasonal conditions table
   - Related blog post link (if exists)
   - Nearby spots section
   - CTA: "Rent a board — we deliver to your accommodation near [spot name]"
5. Add `generateStaticParams` for all spots
6. Add `generateMetadata` with spot-specific title, description, canonical
7. Add all spot URLs to sitemap
8. Add `Place` (or `TouristAttraction`) JSON-LD per spot, linked to the main `LocalBusiness` via `@id` reference — do NOT create separate `LocalBusiness` entities per spot

**Acceptance criteria:**
- `/surf-spots/arrifana` renders a rich, data-driven spot page
- All spots have proper metadata, JSON-LD, sitemap entries
- Hub page `/surf-spots` links to all individual spot pages
- Each spot page links back to the hub

---

### Task 2.2: Update Surf Spots Hub Page

**File:** `apps/web/app/surf-spots/page.tsx`

**Instructions:**
1. Update to link to individual `/surf-spots/[spot]` pages
2. Display a card grid of all spots with: name, level, one-line description, link
3. Add a map overview if possible (embed or static)
4. Ensure hub page has strong internal linking to all spot detail pages

---

## Phase 3: Blog Infrastructure Improvements

### Task 3.1: Add Related Posts Component

**Instructions:**
1. Create `apps/web/app/components/related-posts.tsx`
2. Accept current post's tags and slug
3. Find 3 posts with the most overlapping tags (excluding current post)
4. Render as cards at the bottom of every blog post
5. Add to `apps/web/app/blog/[slug]/page.tsx`

**Acceptance criteria:**
- Every blog post shows 3 related posts at the bottom
- Related posts are based on tag overlap
- Links work and render as attractive cards

---

### Task 3.2: Add Blog RSS Feed

**Instructions:**
1. Create `apps/web/app/blog/feed.xml/route.ts`
2. Generate RSS 2.0 XML from `getAllPosts()`
3. Include: title, description, link, pubDate for each post
4. Add `<link rel="alternate" type="application/rss+xml">` to root layout
5. Reference in `llms.txt`

---

### Task 3.3: Add "Last Updated" Display to Blog Posts

**Instructions:**
1. After Task 0.4 is complete
2. Add a subtle "Last updated: March 24, 2026" line below the post title/date
3. Only show when `updated` differs from `date`
4. Style: small, muted text

---

## Phase 4: Ongoing Content Production

For each new blog post, agents should:

1. **Check the content calendar** in `seo-strategy-and-content-calendar.md` section 4
2. **Read the product marketing context** in `.agents/product-marketing-context.md`
3. **Follow the MDX template** from the strategy doc Appendix
4. **Research the topic** using existing blog posts for internal linking opportunities
5. **Write the post** following brand voice guidelines (honest, knowledgeable, unpretentious)
6. **Add internal links** to/from existing content:
   - At least 1 link to the pillar page for its cluster
   - 2-3 links to related blog posts
   - 1 link to a commercial page (/pricing, /surf-gear, /contact)
7. **Include FAQ section** with 3-5 natural-language questions
8. **Include comparison tables** where applicable
9. **Add the post** to the appropriate place in the content/ directory
10. **Update internal links** in 2-3 existing posts to link to the new post
11. **Verify** the post appears in the sitemap (automatic via `getAllPosts()`)

### Content Quality Checklist

Before publishing any post, verify:

- [ ] Title under 60 characters, includes primary keyword
- [ ] Meta description 150-160 chars, compelling, includes keyword
- [ ] First paragraph is a direct answer extractable by AI (40-60 words)
- [ ] H2 headings match how people phrase search queries
- [ ] At least one comparison table or structured data element
- [ ] Statistics cited with sources where possible
- [ ] FAQ section with 3-5 questions
- [ ] Internal links: 1 pillar, 2-3 related posts, 1 commercial page
- [ ] CTA to /contact or /pricing
- [ ] Tags in front matter match existing taxonomy
- [ ] "Last updated" field matches publication date
- [ ] Brand voice: honest, practical, no hype
- [ ] No AI-sounding phrases: avoid "dive into," "moreover," "it's important to note," "in conclusion"

---

## Implementation Order

```
Week 1:  Tasks 0.1, 0.2, 0.3 (nav, breadcrumbs, tags)
Week 2:  Tasks 0.4, 0.5 (dateModified, canonicals)
Week 3:  Task 1.1 (Monte Clérigo guide) + Task 1.4 (Surf Safety)
Week 4:  Task 1.2 (Amoreira guide) + remaining Phase 1 content
Week 5:  Task 2.1, 2.2 (surf spot pages infrastructure)
Week 6:  Task 3.1, 3.2 (related posts, RSS)
Week 7+: Continue Phase 1/2 content calendar, begin Phase 2 content
```

---

## Files Modified by This Plan

*Last verified: March 26, 2026*

| File | Change |
|------|--------|
| `apps/web/app/sitemap.ts` | DONE — includes all pages + dynamic blog posts, uses `SITE_URL`, safe date fallback |
| `apps/web/app/robots.ts` | DONE — explicit AI bot allow rules (GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended) |
| `apps/web/app/lib/jsonld.ts` | DONE — `dateModified` in articleJsonLd, `logo`/`image`/`contactPoint` in LocalBusiness, removed invalid `SearchAction`, empty reviews guard |
| `apps/web/app/page.tsx` | DONE — fixed Wavebreak → SurfRental brand in metadata |
| `apps/web/app/surf-gear/page.tsx` | DONE — fixed Wavebreak → SurfRental brand in OpenGraph |
| `apps/web/app/globals.css` | DONE — fixed Wavebreak → SurfRental in CSS comment |
| `apps/web/app/api/contact/route.ts` | DONE — fixed Wavebreak → SurfRental in both email templates |
| `apps/web/public/llms.txt` | DONE — added WhatsApp, blog/about/reviews URLs, language declaration |
| `apps/web/app/components/nav.tsx` | DONE — added Blog link to main navigation |
| `apps/web/app/components/breadcrumbs.tsx` | DONE — reusable Breadcrumbs component, added to all 16 subpages |
| `apps/web/app/blog/tag/[tag]/page.tsx` | DONE — tag archive pages with generateStaticParams, metadata, breadcrumbs |
| `apps/web/app/blog/[slug]/page.tsx` | DONE — breadcrumbs, dateModified in JSON-LD + OG, "Last updated" display. TODO — related posts |
| `apps/web/app/lib/blog.ts` | DONE — `updated` field in PostMeta, `getAllTags()`, `getPostsByTag()` |
| `apps/web/app/lib/metadata.ts` | DONE — default OG image (`/images/open-graph.jpg`) in openGraph.images + twitter.images |
| `apps/web/app/surf-spots/[spot]/page.tsx` | TODO — create spot detail pages (use `Place` schema, not `LocalBusiness` per spot) |
| `apps/web/app/lib/surf-spots.ts` | TODO — create spot data |
| `apps/web/app/components/related-posts.tsx` | TODO — create related posts component |
| `apps/web/app/blog/feed.xml/route.ts` | TODO — create RSS feed |
| `apps/web/content/blog/what-surfboard-should-i-rent.mdx` | DONE — fixed inventory to match actual quiver (6'6, 7'0, 7'8, 8'6 soft tops only) |
| `apps/web/content/blog/*.mdx` | TODO — new posts per content calendar |
