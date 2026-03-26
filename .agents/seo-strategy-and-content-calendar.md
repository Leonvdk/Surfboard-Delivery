# SEO Strategy & Content Calendar — SurfRental Aljezur

*Last updated: March 2026*

---

## Table of Contents

1. [SEO Audit Summary](#1-seo-audit-summary)
2. [Keyword Strategy](#2-keyword-strategy)
3. [Content Pillars](#3-content-pillars)
4. [Content Calendar](#4-content-calendar)
5. [Technical SEO Fixes](#5-technical-seo-fixes)
6. [Local SEO Strategy](#6-local-seo-strategy)
7. [AI Search Optimization](#7-ai-search-optimization)
8. [Programmatic SEO Opportunities](#8-programmatic-seo-opportunities)
9. [Internal Linking Architecture](#9-internal-linking-architecture)
10. [Monitoring & Measurement](#10-monitoring--measurement)

---

## 1. SEO Audit Summary

### What's Working Well
- Strong JSON-LD structured data (LocalBusiness, FAQPage, Article, breadcrumbs, reviews, Organization, WebSite)
- `llms.txt` for AI crawler discovery
- Clean URL structure (`/blog/slug`, `/surf-spots`, etc.)
- Robots.txt allows all crawlers
- Good base metadata with keywords, Open Graph, Twitter cards
- 10 high-quality blog posts covering core topics
- All content is ungated (accessible to AI crawlers)

### Resolved Issues

| Issue | Resolution |
|-------|-----------|
| Sitemap missing 11+ pages | FIXED — `sitemap.ts` now includes all 16 static pages + dynamic blog posts |
| "Wavebreak" brand name in metadata/emails | FIXED — replaced with "SurfRental Aljezur" across homepage, surf-gear, CSS, email templates |
| No `dateModified` on articles | FIXED — `articleJsonLd()` now accepts optional `dateModified` |
| No explicit AI bot rules in robots.txt | FIXED — explicit allow rules for GPTBot, ChatGPT-User, PerplexityBot, ClaudeBot, Google-Extended |
| Invalid `SearchAction` in WebSite JSON-LD | FIXED — removed misleading search action (no search endpoint exists) |
| LocalBusiness JSON-LD missing image/logo/contactPoint | FIXED — added logo, image, and contactPoint |
| `llms.txt` missing blog/WhatsApp/language | FIXED — added WhatsApp, blog URL, about, reviews, language declaration |

### Remaining Issues to Fix

| Issue | Impact | Priority |
|-------|--------|----------|
| **Blog not in main navigation** — only in footer | MEDIUM — signals low importance to crawlers, reduces blog discoverability | P1 |
| **No blog categories/tag pages** — tags exist in front matter but no filterable archive | MEDIUM — missed topical clustering signal | P1 |
| **No breadcrumbs in UI** — JSON-LD helpers exist but no visible breadcrumb component | MEDIUM — missed UX and structured data opportunity | P1 |
| **No default OG image** — `summary_large_image` Twitter card but no fallback image | MEDIUM — social shares show no image | P1 |
| **No hreflang tags** — site serves English content about Portugal; no multilingual signals | MEDIUM — potential for Portuguese/German/Dutch/French versions | P2 |
| **Inventory mismatch** — `what-surfboard-should-i-rent.mdx` describes boards not in actual stock (8'0, fibreglass) | HIGH — E-E-A-T / trust issue; AI systems aggregate conflicting pages | P1 |
| **Phone number is Dutch (+31)** — consider adding PT number for local SEO signals | LOW — works for WhatsApp, but GBP may prefer local number | P3 |

---

## 2. Keyword Strategy

### Primary Keywords (Transactional — Direct Revenue)

| Keyword | Monthly Search Vol (est.) | Difficulty | Current Status |
|---------|:--:|:--:|---|
| surf rental aljezur | 100-200 | Low | Homepage targets this |
| surfboard rental aljezur | 50-100 | Low | Homepage + surf-gear |
| surfboard rental algarve | 200-400 | Medium | Partially covered |
| wetsuit rental aljezur | 30-50 | Low | Covered in pricing |
| surfboard hire portugal | 300-500 | Medium | Not specifically targeted |
| surf equipment rental costa vicentina | 20-50 | Low | Homepage metadata |
| surfboard delivery aljezur | 10-30 | Very Low | How-it-works page |
| surf rental arrifana | 50-100 | Low | Needs dedicated landing content |
| surf gear rental portugal | 100-200 | Medium | Not targeted |
| weekly surfboard rental portugal | 30-50 | Low | Pricing page |

### Secondary Keywords (Informational — Trip Planning)

| Keyword | Monthly Search Vol (est.) | Difficulty | Blog Post Status |
|---------|:--:|:--:|---|
| surfing aljezur | 500-800 | Medium | Complete guide exists |
| best time to surf aljezur | 100-200 | Low | Covered |
| arrifana surf | 300-500 | Medium | Covered |
| surf spots aljezur | 200-300 | Low | Dedicated page exists |
| aljezur surf guide | 100-200 | Low | Complete guide exists |
| surfing costa vicentina | 200-400 | Medium | Partially covered |
| monte clerigo surf | 100-200 | Low | **GAP — needs dedicated guide** |
| vale figueiras surf | 50-100 | Low | **GAP — needs dedicated guide** |
| amoreira surf | 50-100 | Low | **GAP — needs dedicated guide** |
| where to stay aljezur surf | 100-200 | Low | Covered |
| aljezur vs peniche | 50-100 | Low | Covered |
| surf portugal beginner | 500-800 | Medium | Covered |
| surfing with kids portugal | 100-200 | Low | Covered |
| how to read surf forecast | 500-1000 | Medium-High | Covered |

### Long-Tail Keywords (Low Competition, High Intent)

| Keyword | Content to Create |
|---------|---|
| rent surfboard aljezur delivery | How it Works page optimization |
| family surf holiday aljezur | Surfing with Kids post + Family landing page |
| aljezur surf trip cost | New: "How Much Does a Surf Trip to Aljezur Cost?" |
| best beginner surf beach aljezur | Covered across posts, needs dedicated section |
| surf camp vs rental aljezur | New: Comparison post |
| digital nomad aljezur surf | New: Extended stay content |
| aljezur surf in winter | Seasonal content from best-time post |
| carrapateira vs aljezur surf | New: Comparison post |
| bordeira surf | New: Spot guide |
| surf road trip algarve | New: Road trip itinerary |
| portugal surf holiday planning | New: Planning hub page |

### Portuguese & Multilingual Keywords

These are lower competition and capture domestic tourists, Portuguese residents, and Brazilians:

| Keyword (PT) | English Equivalent | Action |
|--------------|---|---|
| aluguer prancha surf aljezur | surfboard rental aljezur | Target with future PT page or FAQ section |
| alugar prancha surf algarve | rent surfboard algarve | Target with future PT page |
| material surf aljezur | surf equipment aljezur | Include in PT metadata |
| surf aljezur aluguer | surf aljezur rental | Include in PT metadata |
| fato neoprene aluguer algarve | wetsuit rental algarve | Future PT content |

**Phase A (now):** Keep the site in English. Add `lang="en"` to `<html>` tag. No hreflang until translated pages exist.

**Phase B (when resources allow):** Translate 4 key pages to PT: `/pt/`, `/pt/precos`, `/pt/como-funciona`, `/pt/contacto`. Add proper hreflang tags.

**Phase C (later):** Consider Dutch or German as second language based on GA4 geo data.

### Delivery & Accommodation Keywords

Your main differentiator (delivery to holiday homes) deserves explicit keyword targeting:

| Keyword | Target Page |
|---------|---|
| surfboard delivery algarve | /how-it-works |
| rent surfboard airbnb aljezur | Homepage + /how-it-works |
| surf rental holiday home aljezur | Homepage |
| surf hire delivered algarve | /how-it-works |
| surfboard rental delivered portugal | Homepage meta |

### Seasonal Search Patterns

```
Peak search volume:    January → April (planning summer trips)
Secondary peak:        August → September (last-minute autumn trips)
Low season:            November → December
```

Content publication should lead search intent by 2-3 months:
- **Publish summer content:** January-March
- **Publish autumn content:** June-August
- **Publish winter content:** September-October
- **Evergreen content:** Any time, refresh before peak season

---

## 3. Content Pillars

### Pillar 1: Surf Spot Guides (Location Authority)
**Goal:** Become the definitive online resource for every surf beach in the Aljezur / Costa Vicentina area.

**Hub page:** `/surf-spots` (exists)
**Spokes:**

| Post | Status | Priority |
|------|--------|----------|
| Arrifana Surf Guide | Done | — |
| Monte Clérigo Surf Guide | **TO CREATE** | P1 |
| Amoreira Surf Guide | **TO CREATE** | P1 |
| Vale Figueiras Surf Guide | **TO CREATE** | P1 |
| Bordeira Surf Guide | **TO CREATE** | P2 |
| Carrapateira Surf Guide | **TO CREATE** | P2 |
| Costa Vicentina Surf Spots Map (comprehensive) | **TO CREATE** | P2 |

**Internal linking pattern:** Each spot guide links to `/surf-spots` hub. Hub links to every guide. Cross-link between neighboring spots. Every guide includes a CTA to rent gear.

---

### Pillar 2: Trip Planning & Logistics
**Goal:** Capture surfers during the 1-4 month planning window before their trip.

**Hub page:** `/blog/complete-guide-surfing-aljezur` (exists, serves as pillar)
**Spokes:**

| Post | Status | Priority |
|------|--------|----------|
| Complete Guide to Surfing in Aljezur | Done (pillar) | — |
| Best Time to Surf in Aljezur | Done | — |
| Where to Stay in Aljezur | Done | — |
| One Week Aljezur Itinerary | Done | — |
| Aljezur vs Peniche vs Ericeira | Done | — |
| How Much Does a Surf Trip to Aljezur Cost? | **TO CREATE** | P1 |
| Getting to Aljezur: Flights, Trains, and Driving | **TO CREATE** | P1 |
| Two-Week Aljezur Surf Trip Itinerary | **TO CREATE** | P2 |
| Aljezur for Digital Nomads: Surf, Work, Repeat | **TO CREATE** | P2 |
| Surf Camp vs Board Rental: What's Right for You? | **TO CREATE** | P1 |
| Aljezur vs Sagres: Which is Better for Surfing? | **TO CREATE** | P2 |
| Carrapateira vs Aljezur: Comparing the Two | **TO CREATE** | P3 |
| Best Restaurants in Aljezur (A Surfer's Guide) | **TO CREATE** | P2 |
| Aljezur Off-Season: Why Autumn and Spring Are the Best Kept Secret | **TO CREATE** | P1 |

---

### Pillar 3: Surf Education & Skills
**Goal:** Help beginners and intermediates improve, building trust and positioning SurfRental as knowledgeable experts.

**Hub page:** New — `/blog/learn-to-surf` or keep under blog with strong interlinking
**Spokes:**

| Post | Status | Priority |
|------|--------|----------|
| First Time Surfing in Portugal | Done | — |
| What Surfboard Should I Rent? | Done | — |
| How to Read Surf Conditions | Done | — |
| Surfing with Kids in Aljezur | Done | — |
| Surf Etiquette: The Unwritten Rules Every Surfer Should Know | **TO CREATE** | P1 |
| How to Improve Your Popup: Drills You Can Do at Home | **TO CREATE** | P2 |
| Beginner Surf Mistakes (and How to Avoid Them) | **TO CREATE** | P2 |
| When to Upgrade from a Foamie to a Hard Board | **TO CREATE** | P3 |
| Wetsuit Guide: Thickness, Fit, and What You Need for Portugal | **TO CREATE** | P1 |
| Surf Safety: Rip Currents, Priority Rules, and When Not to Paddle Out | **TO CREATE** | P1 |
| How to Surf Bigger Waves (Intermediate Progression Guide) | **TO CREATE** | P3 |

---

### Pillar 4: Local Life & Culture
**Goal:** Rank for lifestyle queries, attract non-surfers traveling with surfers, build emotional connection.

| Post | Status | Priority |
|------|--------|----------|
| Best Restaurants in Aljezur | **TO CREATE** | P2 |
| Non-Surf Activities in Aljezur and the Costa Vicentina | **TO CREATE** | P2 |
| The Rota Vicentina: Hiking the Fisherman's Trail | **TO CREATE** | P3 |
| A Guide to Aljezur's Saturday Market | **TO CREATE** | P3 |
| Surfing and Yoga in Aljezur: Where to Practice | **TO CREATE** | P3 |
| Wild Camping, Vanlife, and Surf on the Costa Vicentina | **TO CREATE** | P3 |

---

### Pillar 5: Seasonal & Timely Content
**Goal:** Capture seasonal search intent, provide reasons to visit year-round.

| Post | Status | Priority |
|------|--------|----------|
| Best Time to Surf in Aljezur (month-by-month) | Done | — |
| Aljezur Off-Season: Autumn and Spring Surfing | **TO CREATE** | P1 |
| Winter Surfing in Aljezur: What to Expect | **TO CREATE** | P2 |
| Summer in Aljezur: Surfing, Crowds, and How to Beat Both | **TO CREATE** | P2 |
| Surf Forecast for This Week (recurring/dynamic) | **CONSIDER** | P3 |

---

## 4. Content Calendar

### Phase 1: Foundation (April–May 2026)
*Focus: Fill critical gaps, fix technical SEO, complete spot guides*

| Week | Content | Type | Target Keyword | Pillar |
|------|---------|------|----------------|--------|
| Apr W1 | Monte Clérigo Surf Guide | Spot Guide | monte clerigo surf | 1 |
| Apr W2 | Surf Safety: Rip Currents and Priority Rules | Education | surf safety portugal | 3 |
| Apr W3 | Amoreira Surf Guide | Spot Guide | amoreira surf | 1 |
| Apr W4 | How Much Does a Surf Trip to Aljezur Cost? | Planning | aljezur surf trip cost | 2 |
| May W1 | Vale Figueiras Surf Guide | Spot Guide | vale figueiras surf | 1 |
| May W2 | Surf Etiquette: The Unwritten Rules | Education | surf etiquette rules | 3 |
| May W3 | Wetsuit Guide: What You Need for Portugal | Education | wetsuit guide portugal | 3 |
| May W4 | Getting to Aljezur: Flights, Trains, Driving | Planning | how to get to aljezur | 2 |

### Phase 2: Growth (June–August 2026)
*Focus: Comparison posts, lifestyle content, capture autumn planners*

| Week | Content | Type | Target Keyword | Pillar |
|------|---------|------|----------------|--------|
| Jun W1 | Surf Camp vs Board Rental: What's Right for You? | Comparison | surf camp vs rental portugal | 2 |
| Jun W2 | Bordeira Surf Guide | Spot Guide | bordeira surf | 1 |
| Jun W3 | Beginner Surf Mistakes (and How to Avoid Them) | Education | beginner surf mistakes | 3 |
| Jun W4 | Aljezur Off-Season: Autumn and Spring Surfing | Seasonal | aljezur surfing autumn | 5 |
| Jul W1 | Carrapateira Surf Guide | Spot Guide | carrapateira surf | 1 |
| Jul W2 | Best Restaurants in Aljezur (Surfer's Guide) | Lifestyle | best restaurants aljezur | 4 |
| Jul W3 | Aljezur vs Sagres: Which is Better? | Comparison | aljezur vs sagres surf | 2 |
| Jul W4 | Non-Surf Activities in Aljezur | Lifestyle | things to do aljezur | 4 |
| Aug W1 | Two-Week Aljezur Itinerary | Planning | two weeks aljezur | 2 |
| Aug W2 | How to Improve Your Popup | Education | improve surf popup | 3 |
| Aug W3 | Winter Surfing in Aljezur | Seasonal | winter surf aljezur | 5 |
| Aug W4 | Costa Vicentina Surf Spots Map | Hub content | costa vicentina surf spots | 1 |

### Phase 3: Authority (September–December 2026)
*Focus: Long-tail, programmatic, local life, digital nomad content*

| Week | Content | Type | Target Keyword | Pillar |
|------|---------|------|----------------|--------|
| Sep W1 | Aljezur for Digital Nomads | Planning | digital nomad aljezur | 2 |
| Sep W2 | Surfing and Yoga in Aljezur | Lifestyle | yoga and surf aljezur | 4 |
| Sep W3 | Summer in Aljezur: Surfing and Crowds | Seasonal | summer aljezur surf | 5 |
| Sep W4 | Carrapateira vs Aljezur Comparison | Comparison | carrapateira vs aljezur | 2 |
| Oct W1 | Rota Vicentina: Hiking the Fisherman's Trail | Lifestyle | rota vicentina hiking | 4 |
| Oct W2 | When to Upgrade from Foamie to Hard Board | Education | when to stop using foam surfboard | 3 |
| Oct W3 | Aljezur Saturday Market Guide | Lifestyle | aljezur market | 4 |
| Oct W4 | Surf Road Trip: Aljezur to Sagres | Planning | algarve surf road trip | 2 |
| Nov W1 | Wild Camping and Vanlife on Costa Vicentina | Lifestyle | vanlife costa vicentina surf | 4 |
| Nov W2 | How to Surf Bigger Waves | Education | intermediate surf progression | 3 |
| Nov W3 | Content refresh: Update all 10 existing posts | Maintenance | — | All |
| Dec W1 | Year-end content audit and 2027 calendar planning | Maintenance | — | — |

### Ongoing Monthly Tasks

- [ ] Refresh 1-2 existing posts (update stats, add "Last updated" dates, improve structure)
- [ ] Check AI visibility for top 10 queries across ChatGPT, Perplexity, Google AI Overviews
- [ ] Review Search Console for new keyword opportunities
- [ ] Add internal links from new posts to existing content and vice versa
- [ ] Share new posts via WhatsApp status, Instagram, any social channels

---

## 5. Technical SEO Fixes

### P0 — Do Immediately

#### 5.1 Fix the Sitemap
The current `sitemap.ts` only includes 7 pages. It must include ALL indexable pages plus all blog posts.

**File:** `apps/web/app/sitemap.ts`

**Required changes:**
- Import `getAllPosts()` from blog lib
- Add all static pages: `/about`, `/reviews`, `/blog`, `/group-bookings`, `/gift-vouchers`, `/partners`, `/sustainability`, `/terms`, `/privacy`
- Dynamically add all `/blog/[slug]` URLs
- Set correct priorities (blog posts 0.6, legal pages 0.3)

#### 5.2 Add Blog to Main Navigation
Blog is currently only in the footer. Adding it to the header nav signals importance to crawlers and increases blog discoverability.

**File:** `apps/web/app/components/nav.tsx`

**Change:** Add "Blog" or "Guides" link to the main navigation items.

### P1 — Do This Week

#### 5.3 Add Blog Category/Tag Archive Pages
Tags exist in MDX front matter but there are no tag filter pages. Create:
- `/blog/tag/[tag]` — filtered blog listing by tag
- This creates topical clustering signals for Google

#### 5.4 Add Breadcrumbs Component
JSON-LD breadcrumb helper exists in `jsonld.ts` but no visible breadcrumb UI. Add:
- Breadcrumb component to all pages
- BreadcrumbList JSON-LD on every page
- Format: Home > Section > Page Title

#### 5.5 Add `dateModified` to Article JSON-LD
Update `articleJsonLd()` in `jsonld.ts` to accept and output `dateModified`. Display "Last updated" date on blog posts.

### P2 — Do This Month

#### 5.6 Fix "Wavebreak" in Surf-Gear Metadata
The `/surf-gear` page has "Wavebreak" in its OpenGraph metadata. Replace with "SurfRental Aljezur."

#### 5.7 Add Canonical URLs to All Pages
Ensure every page has a proper canonical tag. The base metadata sets canonical to the homepage, but individual pages need their own canonical URLs.

#### 5.8 Optimize Image Alt Text
Verify all product images have descriptive alt text including location context. Example: "7'8 soft-top funboard for rent in Aljezur, Portugal" rather than "picture(3)".

#### 5.9 Add `rel="noopener"` to External Links
Security and performance best practice for all external links.

### P3 — Nice to Have

#### 5.10 Explicit AI Bot Allow Rules in Robots.txt
While the current `*` allow covers all bots, explicitly allowing AI crawlers is a positive signal:

```
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: Google-Extended
Allow: /
```

#### 5.11 Add Blog RSS Feed
Create `/blog/feed.xml` — useful for content syndication and AI crawlers.

---

## 6. Local SEO Strategy

### 6.1 Google Business Profile (Critical)

**Status:** Unknown — needs to be created or claimed.

**Actions:**
- Create/claim Google Business Profile for "SurfRental Aljezur"
- Category: "Surfboard Rental Service" or "Surf Shop"
- Add all service areas (Aljezur, Arrifana, Vale da Telha, Monte Clérigo)
- Upload photos of boards, delivery process, beaches
- Add all pricing packages as services
- Enable messaging
- Post weekly updates (link to new blog posts, seasonal tips)
- Collect reviews from customers

### 6.2 NAP Consistency

Ensure Name, Address, Phone are identical everywhere:

```
Name: SurfRental Aljezur
Address: Aljezur, Faro, Portugal
Phone: +31613262259
Email: hello@surfrental-aljezur.com
Website: https://surfrental-aljezur.com
```

**Note:** The phone number is Dutch (+31). Consider adding a Portuguese number for local SEO signals.

### 6.3 Local Citations

Get listed on:
- [ ] Google Business Profile (service area business — no shop front)
- [ ] Apple Business Connect
- [ ] Bing Places for Business
- [ ] Facebook Business page
- [ ] TripAdvisor (category: equipment hire / watersports — not a shop)
- [ ] Yelp Portugal
- [ ] Páginas Amarelas (Portuguese yellow pages)
- [ ] Turismo de Portugal / VisitAlgarve / RT Algarve partner listings
- [ ] Câmara Municipal de Aljezur tourism page (if accepting listings)
- [ ] Algarve tourism directories
- [ ] Surf-specific directories (Wannasurf, Magicseaweed spot guides)
- [ ] Costa Vicentina tourism associations
- [ ] Booking.com experiences / GetYourGuide (only if margin and ops allow; document decision)

### 6.3b Partnership Link-Building

Your model is accommodation-first. Build relationships with:
- [ ] Vale da Telha / Arrifana property managers — offer "recommended for guests" page inclusion
- [ ] Airbnb hosts in delivery area — provide printed QR card + one-pager for villas
- [ ] Boutique hotels and guesthouses — reciprocal link from `/partners` page
- [ ] Surf schools (non-competitive — they teach, you rent) — cross-promote
- [ ] Local restaurants featured in blog content — request backlink from their site
- [ ] Surf travel blogs and aggregators — pitch unique data (delivery coverage map, spot conditions)

### 6.4 Location-Specific Content

Existing pages cover the delivery area, but consider creating dedicated landing pages:
- `/surf-rental-arrifana` — for "surf rental arrifana" searches
- `/surf-rental-vale-da-telha` — for accommodation-specific queries

These can be lightweight pages focusing on the specific area + CTA to contact.

### 6.5 Reviews Strategy

- Add review request to post-rental follow-up (email/WhatsApp)
- Make it easy: direct link to Google review
- Feature Google reviews on `/reviews` page with proper schema
- Target: 20+ reviews with 4.5+ average

---

## 7. AI Search Optimization

### 7.1 Current AI-Friendly Features
- `llms.txt` with structured business info (excellent)
- JSON-LD structured data on key pages
- Clean, extractable content structure in blog posts
- Ungated content accessible to all crawlers

### 7.2 Content Structure for AI Citation

Every blog post should follow this pattern for maximum AI extractability:

**First paragraph:** Direct definition/answer (40-60 words) that can be extracted standalone.

**Example for "What is the best time to surf in Aljezur?"**
> "The best time to surf in Aljezur is September through November. You get consistent 3-6ft swell from summer's Atlantic storms, warm water (18-20°C in September, dropping to 16°C by November), manageable winds, and fewer crowds than the July-August peak. Spring (March-May) is the next best option."

**Headings:** Match how people phrase queries (H2: "Best beaches for beginners in Aljezur", not "Beginner Beaches").

**Tables:** Use comparison tables for any "vs" or "best of" content — AI systems prefer structured data.

**Statistics with sources:** "Aljezur averages 300+ days of sunshine per year (IPMA)" gets cited; "Aljezur is sunny" does not.

### 7.3 AI Visibility Checklist for Every New Post

- [ ] First paragraph contains a direct, extractable answer
- [ ] All claims backed by specific numbers or sources
- [ ] Comparison tables for any evaluative content
- [ ] FAQ section at the bottom with 3-5 natural questions
- [ ] Author/brand attribution clear
- [ ] "Last updated: [date]" visible
- [ ] Heading structure matches query patterns (H2s are searchable questions)
- [ ] Article JSON-LD with datePublished and dateModified
- [ ] Internal links to product/pricing pages

### 7.4 Third-Party AI Presence

Build presence on platforms AI systems cite:
- [ ] Answer Aljezur surf questions on Reddit (r/surfing, r/portugal, r/PortugalExpats)
- [ ] Create/update Aljezur surf content on Wikipedia (Costa Vicentina article, Aljezur article)
- [ ] Answer questions on Quora about surfing in Portugal
- [ ] YouTube: consider short video guides for each surf spot
- [ ] Participate in surf forums (Magicseaweed, Surfline community)

---

## 8. Programmatic SEO Opportunities

### 8.1 Surf Spot Pages (Location Playbook)

Create individual, data-rich pages for every surf spot:

**URL pattern:** `/surf-spots/[spot-name]`

**Template:**
- Spot name + hero image
- Quick stats (level, best tide, best swell direction, best wind, parking, facilities)
- Detailed description with seasonal variations
- Conditions table (swell size → wave size at this spot)
- Map embed
- Related spots nearby
- CTA: "Rent a board and we'll deliver to your accommodation near [spot]"
- FAQ specific to this spot

**Spots to create:**
1. `/surf-spots/arrifana`
2. `/surf-spots/monte-clerigo`
3. `/surf-spots/amoreira`
4. `/surf-spots/vale-figueiras`
5. `/surf-spots/bordeira`
6. `/surf-spots/carrapateira`
7. `/surf-spots/odeceixe`

**Canonical strategy for blog vs spot pages:** Blog spot guides (e.g. `/blog/arrifana-surf-guide`) are narrative, E-E-A-T-rich, long-tail content. Programmatic `/surf-spots/[spot]` pages are structured quick-reference pages with stats tables, conditions data, and FAQ. Each links to the other. Never duplicate full body text between them.

### 8.2 Comparison Pages (Comparison Playbook)

**URL pattern:** `/blog/[spot-a]-vs-[spot-b]`

High-value comparisons:
- Aljezur vs Peniche vs Ericeira (done)
- Aljezur vs Sagres
- Carrapateira vs Aljezur
- Arrifana vs Monte Clérigo (for beginners)
- Portugal vs Morocco for surfing
- Portugal vs Canary Islands for surfing

### 8.3 "Surf Rental in [Location]" Pages (Personas + Location)

If demand warrants it, create location-specific rental pages:
- `/surf-rental-arrifana`
- `/surf-rental-vale-da-telha`
- `/surf-rental-monte-clerigo`

These only make sense if search volume exists — validate before building.

---

## 9. Internal Linking Architecture

### Current Structure

```
Homepage (/)
├── /surf-gear
├── /pricing
├── /how-it-works
├── /surf-spots (hub)
├── /contact
├── /faq
├── /blog (index)
│   ├── /blog/complete-guide-surfing-aljezur (pillar)
│   ├── /blog/arrifana-surf-guide
│   ├── /blog/best-time-to-surf-aljezur
│   └── ... (10 posts total)
├── /about
├── /reviews
├── /group-bookings
├── /gift-vouchers
├── /partners
├── /sustainability
├── /terms
└── /privacy
```

### Target Structure (with new content)

```
Homepage (/)
├── /surf-gear → links to board guides, wetsuit guide
├── /pricing → links to cost breakdown post, group bookings
├── /how-it-works → links to FAQ, contact
├── /surf-spots (hub) → links to ALL spot guides
│   ├── /surf-spots/arrifana (new page)
│   ├── /surf-spots/monte-clerigo (new page)
│   ├── /surf-spots/amoreira (new page)
│   ├── /surf-spots/vale-figueiras (new page)
│   ├── /surf-spots/bordeira (new page)
│   └── /surf-spots/carrapateira (new page)
├── /blog (index) → filterable by tag
│   ├── /blog/tag/[tag] (new — filtered views)
│   ├── Pillar 1: Spot Guides
│   │   ├── /blog/arrifana-surf-guide
│   │   ├── /blog/monte-clerigo-surf-guide (new)
│   │   ├── /blog/amoreira-surf-guide (new)
│   │   ├── /blog/vale-figueiras-surf-guide (new)
│   │   └── ... (more spot guides)
│   ├── Pillar 2: Trip Planning
│   │   ├── /blog/complete-guide-surfing-aljezur (pillar page)
│   │   ├── /blog/aljezur-surf-trip-cost (new)
│   │   ├── /blog/getting-to-aljezur (new)
│   │   └── ... (more planning content)
│   ├── Pillar 3: Surf Education
│   │   ├── /blog/first-time-surfing-portugal
│   │   ├── /blog/surf-etiquette (new)
│   │   ├── /blog/surf-safety (new)
│   │   └── ... (more education content)
│   └── Pillar 4: Local Life
│       ├── /blog/best-restaurants-aljezur (new)
│       └── ... (lifestyle content)
├── /contact
├── /faq → links to relevant blog posts per question
├── /about
├── /reviews
├── /group-bookings → links to group discount pricing
├── /gift-vouchers
├── /partners
└── /sustainability
```

### Linking Rules

1. **Every blog post** must link to at least:
   - The pillar/hub page for its cluster
   - 2-3 related blog posts
   - 1 commercial page (/pricing, /surf-gear, or /contact)

2. **Every spot guide** must link to:
   - `/surf-spots` hub
   - The complete Aljezur guide
   - Neighboring spot guides
   - `/pricing` or `/contact`

3. **Commercial pages** (/pricing, /surf-gear) should link to:
   - Relevant blog posts that support the buying decision
   - FAQ page

4. **FAQ page** should link to:
   - Blog posts that answer questions in depth

5. **"Related posts" section** at the bottom of every blog post:
   - 3 related posts based on shared tags or pillar

---

## 10. Monitoring & Measurement

### Tools Needed

| Tool | Purpose | Cost |
|------|---------|------|
| Google Search Console | Indexation, queries, clicks, impressions | Free |
| Google Analytics 4 | Traffic, user behavior, conversions | Free |
| Google Business Profile | Local SEO, reviews, visibility | Free |
| Bing Webmaster Tools | Bing/Copilot visibility | Free |
| PageSpeed Insights | Core Web Vitals | Free |

### KPIs to Track Monthly

| Metric | Baseline (Mar 2026) | 6-Month Target | 12-Month Target |
|--------|:--:|:--:|:--:|
| Indexed pages | ~17 | 35+ | 50+ |
| Monthly organic sessions | TBD (set baseline) | 2x baseline | 5x baseline |
| Blog posts published | 10 | 18 | 35+ |
| Keywords ranking top 10 | TBD | 20+ | 50+ |
| Google Business reviews | 0 | 10+ | 25+ |
| AI citation appearances | TBD | Present in top 5 queries | Present in top 15 queries |
| Contact form submissions | TBD | Track monthly | 2x baseline |

### Monthly SEO Checklist

- [ ] Check Google Search Console for crawl errors
- [ ] Review top queries and clicks — identify new opportunities
- [ ] Check indexation status of new pages
- [ ] Run PageSpeed Insights on 3 key pages
- [ ] Test 10 queries in ChatGPT / Perplexity — log citation status
- [ ] Post 2-4 updates on Google Business Profile
- [ ] Request reviews from recent customers
- [ ] Update 1-2 existing posts with fresh data and "Last updated" date
- [ ] Check for broken links
- [ ] Review competitor content for new opportunities

---

## Appendix: Blog Post Template

Every new blog post should follow this MDX structure:

```mdx
---
title: "[Keyword-Rich Title Under 60 Characters]"
description: "[Compelling meta description, 150-160 chars, includes primary keyword]"
date: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
tags: ["tag1", "tag2", "tag3"]
---

[Direct answer to the query in the first paragraph — 40-60 words, extractable by AI]

## [H2 matching a search query]

[Content with specific data, statistics, and sources]

## [H2 matching another query angle]

[Content with comparison tables where applicable]

...

## Practical tips

[Actionable advice tied to your product/service]

[CTA: "We deliver surfboards and wetsuits to your accommodation in Aljezur — [check our pricing](/pricing) or [get in touch](/contact)."]

## Frequently asked questions

### [Natural question 1]?
[Direct answer]

### [Natural question 2]?
[Direct answer]

### [Natural question 3]?
[Direct answer]
```
