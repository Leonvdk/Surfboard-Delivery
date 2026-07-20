# Your TODO — organic traffic, next 30 days

Everything below needs your login, your face, your photos, or a
real-world decision. Ordered by impact ÷ time.

I've already shipped: schema depth (LocalBusiness → +
SportingGoodsStore, GeoCircle serviceArea, Service nodes, sameAs,
openingHours, five service areas incl. Carrapateira), AI-quotable
lead rewrites on /pricing, /how-it-works, /contact, /surf-gear,
CWV inspection (LCP 228 ms locally, no fixes needed).

---

## Priority 1 — Google Business Profile (blocks half the playbook)

**Time: 60 min setup + 30 min/week.**

Everything else in local search stacks on top of GBP. Without a
verified profile you can't win the Aljezur local pack.

1. **Claim / create profile** at business.google.com. Business
   name: `Surf Rental Aljezur` (exact, no suffix). Primary
   category: `Surfboard rental service`. If GBP won't let you
   pick that, use `Rental service` + add `Sporting goods store`
   as secondary.
2. **Fill all 9 secondary categories:**
   - Surf school
   - Sporting goods store
   - Delivery service
   - Rental service
   - Wetsuit rental (if available)
   - Water sport equipment supplier
   - Surfboard shop
   - Outdoor sports store
   - Tourist attraction
3. **Service area business:** Yes — hide your home address, but
   list serving `Aljezur, Arrifana, Vale da Telha, Monte Clérigo,
   Carrapateira`. Match exactly what's in `jsonld.ts`.
4. **Verification:** postcard by default (5-10 days). If offered
   video-call verification, take it — instant.
5. **Photos:** upload 20+ before publishing. Priority order:
   - Cover: your van with boards loaded
   - Logo: /images/logo.png
   - Interior: boards racked
   - Product: each of the 4 board sizes (individually)
   - Team: photo of you (Leon) delivering
   - At work: a delivery in progress at an Airbnb
   - Location: shots at Arrifana, Amado, Bordeira with our boards
6. **Hours:** 08:00–20:00 daily (matches schema).
7. **Services:** add each of the 3 packages with prices from
   `apps/web/app/lib/pricing.ts`.
8. **Q&A section — seed it yourself before customers do.**
   Copy-paste the 5 Q&As from the homepage FAQ block, then
   answer each one. Google gives huge weight to seeded Q&A.
9. **Once verified — put the GBP URL into `apps/web/app/lib/
   jsonld.ts` `sameAs` array.** Ping me when you have it.

### Weekly GBP ritual (30 min every Monday)

- Upload 1 new photo (any board, any delivery, any beach).
- Post 1 GBP Post (offer, story, "this week's conditions").
- Reply to all reviews and Q&A.
- Send review-request messages to every completed rental from
  the past week (template below).

---

## Priority 2 — Portugal citation build

**Time: 2 hours, one-shot.**

Complete in this order. Use identical NAP everywhere:

```
Name:    Surf Rental Aljezur
Address: Aljezur, 8670, Faro, Portugal    (service-area, not street)
Phone:   +31 6 1326 2259                   (WhatsApp)
Email:   hello@surfrental-aljezur.com
Website: https://surfrental-aljezur.com
Hours:   Mon-Sun 08:00-20:00
Cats:    Surfboard rental service, Delivery service
```

Priority list (paste-friendly):

- [ ] **Google Business Profile** — see Priority 1
- [ ] **Bing Places for Business** — mirrors GBP; 5 min if you
      have GBP done
- [ ] **Apple Business Connect** — critical for iPhone users;
      free at businessconnect.apple.com
- [ ] **TripAdvisor** — list as "Surfboard Rental / Tour
      Operator"; highest DA niche site
- [ ] **Facebook Business Page** — you already have one? Verify
      NAP matches
- [ ] **Instagram Business** — link surfrental-aljezur.com/contact
      in bio, category "Sports & Recreation"
- [ ] **Waze** — driver routing; use "Add a Place"
- [ ] **Foursquare / Yelp Portugal**
- [ ] **Páginas Amarelas** (paginasamarelas.pt) — Portugal's
      Yellow Pages, free listing
- [ ] **PAI.pt** — Portuguese Directory; free
- [ ] **PortalEmpresas.pt** — free
- [ ] **VisitAlgarve** — email them at info@visitalgarve.pt
      requesting listing under "Surf" activities
- [ ] **TurismodePortugal.pt** / **RTA (Região de Turismo do
      Algarve)** — RegistoNacionalTurismo.pt (RNT) mandatory
      registration if you don't already have one

**Log every URL** in `docs/citations.md` (already created empty
below) so we can audit consistency later.

---

## Priority 3 — Review-request automation

**Time: 15 min to review + reply "ship it".**

I've drafted the message templates below. What I need from you:

- [ ] Read the templates. Say yes / edit / no.
- [ ] Decide: SMS via Twilio, WhatsApp via Meta, or email via
      Resend? (I recommend WhatsApp — reply rate is ~4× email
      for tourism/rental.)
- [ ] Give me your GBP review URL (only available after
      verification). It looks like:
      `https://search.google.com/local/writereview?placeid=XXX`

Once those three are answered I'll wire the trigger: cron job
fires 24h after the rental `endDate`, sends the message in the
guest's language, single message, no follow-up. Draft templates
in `outreach/review-request-templates.md`.

---

## Priority 4 — Backlink outreach (start this week, compound over months)

**Time: 4 h setup + 30 min/week.**

Free tier only, no paid subscriptions.

### Journalist sourcing platforms (respond within 1 hour → 60%+ higher placement)

- [ ] **Source of Sources** (sourceofsources.com) — free, Peter
      Shankman's HARO replacement. Filter: "surf", "Portugal",
      "travel", "outdoor sports", "small business owner".
- [ ] **Featured.com** — free tier gives 1 expert profile.
- [ ] **Qwoted** — free tier for sources.

Set up Gmail filter: any email from these platforms → phone
notification. Reply from your phone within an hour.

### Local partnerships

- [ ] Ship `outreach/pitch-surf-schools.md` — email/walk-in the
      Aljezur & Arrifana surf schools. Already drafted.
- [ ] Draft + send similar pitches to these accommodations
      (owners are individuals, personal outreach works):
    - Amazigh Design Hostel, Aljezur
    - Casas do Moinho, Aljezur
    - Vicentina Hotel, Aljezur
    - Arrifana Sea Villas
    - Monte Clérigo Beach Village
  Angle: "You mention 'surf lessons available' on your
  activities page — add a surfboard rental option; we deliver."
  Ask for a link on their /things-to-do or /activities page.

### Guest post — one meaningful piece

- [ ] Pitch **one** long-form guest post to a real Portugal
      travel blog. Angle: "How to plan an Aljezur surf trip
      when your Airbnb isn't near a surf shop." Targets:
      Portugalist.com, Nomad Trip, We Blog the World. Real
      content, not a link farm. Budget: 1 evening writing.

---

## Priority 5 — Local pages (I can do this, but need your input first)

**Your time: 30 min. My time next session: 3-4 hours.**

Playbook item #8 — 8 unique location pages: 4 spot detail pages
(you already have /surf-spots — we might just deep-link into
sections) + 4 delivery-town pages (/deliver-to/aljezur,
/deliver-to/arrifana, /deliver-to/vale-da-telha,
/deliver-to/carrapateira).

What I need from you before I can write these well:

- [ ] **For each of the 4 towns**, tell me:
    - What kind of stays are typical there (Airbnb / hostel /
      guesthouse / campervan / villa)?
    - Where do you typically deliver in each town (a specific
      street / plaza / landmark)?
    - What's one *personal* thing about that town — a place you
      always stop, a shop you like, the road you take?
    - Which beach are their guests usually surfing?
- [ ] **1-2 photos per town** that we can use. Doesn't have to
      be pro — phone shots are better for authenticity.

Reply in Slack / here / in a text file — whichever's easiest.

---

## Priority 6 — First-party data posts

**Your time: 15 min per post to approve numbers. My time: 2h per
post.**

Playbook says this is the highest-ROI content type in 2026
(82% AI citation rate vs 25% for generic blogs). The catch:
only *you* have this data.

Once you're comfortable with the numbers, I'll draft:

- [ ] **Q3 2026 Aljezur Surf Season Report.** Anonymised
      aggregates from the bookings DB: total rentals, avg trip
      length, most-requested board size by month, wetsuit
      thickness breakdown, top 5 accommodation-area
      deliveries. No PII.
- [ ] **Costa Vicentina spot popularity index.** From our
      "which beach are you surfing?" freetext field.
- [ ] **The wrong-board rate.** Honest post on how often our
      level-match guarantee triggers, and why.

I'll build the SQL first, you eyeball the numbers, we publish.

Decision I need: is it OK to publish approximate aggregates
(e.g. "~180 boards delivered so far in 2026"), or do you want
me to round more heavily (e.g. "hundreds")?

---

## Priority 7 — GSC weekly ritual (yours; free tool, huge return)

**Time: 30 min every two weeks.**

- [ ] Confirm https://surfrental-aljezur.com is verified in
      Google Search Console (search.google.com/search-console).
      If not, add + verify (I can drop a DNS TXT record if you
      forward the code).
- [ ] Every second Monday: open GSC → Performance → Queries →
      Last 28 days. Sort by impressions descending. Look for
      queries with impressions > 5, clicks < 2, position 5-20.
      Those are near-misses.
- [ ] Copy the top 5 to a running Google Sheet or plain-text
      file (`docs/gsc-near-misses.md`). Every quarter, we'll
      write / update one page per near-miss.

If you want, I can build a `/admin/seo` view that surfaces
near-misses automatically via the GSC API. Say the word.

---

## Priority 8 — Real Google reviews (deferred item 22)

**Time: 5 min after every rental ends.**

Once GBP is verified, the review request automation (Priority 3)
handles this. Manual add for the first month:

- [ ] Message the last 30 happy renters personally. WhatsApp,
      one at a time, in their language. Script:
    > "Hey [name], hope your surf trip was good. If you had a
    > minute, a Google review would help us a lot — link:
    > [your GBP review URL]. Cheers, Leon."
- [ ] Do not use fake reviews. Do not incentivize with
      discounts (violates Google TOS + gets you delisted).
- [ ] Target: 8 → 30 reviews in 90 days. That's about 3/week,
      totally achievable given your booking volume.

Once you have 25+ reviews, we un-hardcode `AGGREGATE_RATING` in
`jsonld.ts` and swap it for GBP-derived numbers.

---

## Priority 9 — CWV production check

**Time: 5 min.**

- [ ] After the next deploy, run PageSpeed Insights on:
    - https://surfrental-aljezur.com
    - https://surfrental-aljezur.com/pricing
    - https://surfrental-aljezur.com/surf-gear
  Send me the "Diagnostics" screenshot. If anything's yellow /
  red I'll fix it. Currently local dev shows LCP 228 ms so
  production should be fine — this is a "trust but verify" step.

---

## Priority 10 — Ongoing: content refresh cadence

**Time: 4 h/quarter (I'll drive; you review).**

Every quarter I'll:

- Read the top 10 canonical pages.
- Update stats + a paragraph + a `dateModified` on the ones
  that need it.
- Ship as a single "Q3 refresh" PR for you to eyeball.

You just need to:

- [ ] Reply "ship" or "hold" on each refresh PR.

Playbook says content over 3 months old drops sharply in AI
citations, so this is defensive, not offensive.

---

## Not on the list (deliberately)

- Ahrefs / SEMrush subscription — we're using free tools (GSC,
  Autocomplete, PAA, PageSpeed Insights) which are enough at
  this scale.
- Programmatic pages beyond the 4 deliver-to pages — thin-
  content risk is real; keep it small.
- Newsletter — we agreed not to run one.
- Paid ads — that's a separate conversation.

---

## When to circle back

- **This week:** GBP claim + citation build + Priority 3
  decision (message channel + review URL).
- **This month:** Priorities 4, 5, 8 rolling.
- **Every 6 months:** rerun the deep-research skill against
  the 2026-SEO seed query and refresh
  `docs/seo-playbook-2026.md` + `.claude/skills/organic-audit.md`.
