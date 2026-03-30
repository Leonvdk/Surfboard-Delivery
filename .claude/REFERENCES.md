# References

## Business facts

- **Service area:** Aljezur, Arrifana, Vale da Telha (Costa Vicentina, Portugal)
- **Boards:** 6'6 Shortboard, 7'0 Funboard, 7'8 Funboard, 8'6 Longboard
- **Packages:** Board Only (€25/day), Full Package with wetsuit (€35/day), Premium (€45/day), discount on longer stays
- **Discounts:** Weekly and 2-week rates available; group discount 12% for 3–5 people
- **Contact:** hello@surfrental-aljezur.com | WhatsApp: +31 6 13262259
- **Rating:** 4.9/5.0 | Annual sessions: 2,400+
- **USP:** Free delivery and pickup to accommodation — no queues, no carrying boards

## Key files to know

- `apps/web/app/lib/pricing.ts` — all pricing data and calculation logic
- `apps/web/app/lib/analytics.ts` — GA4 event tracking helpers
- `apps/web/app/lib/blog.ts` — MDX blog post parsing and filtering
- `apps/web/app/components/booking-form.tsx` — multi-step booking form (primary conversion)
- `apps/web/app/globals.css` — full design system (colors, shadows, typography, layout)
- `apps/web/app/api/contact/route.ts` — Resend handler for booking emails
- `apps/web/app/api/newsletter/route.ts` — Resend handler for newsletter signups
- `apps/web/content/blog/` — 138 MDX blog posts (do not edit without being asked)

## Design system tokens (from globals.css)

- Background: `#FAFAF8` (cream)
- Text: `#1A1A1A` (charcoal)
- Accent: `#C04419` / `#D4501E` (burnt orange)
- Shadows: `4px 4px 0px #1A1A1A` (neo-brutalist drop shadow)
- Fonts: Sora (display headings), DM Sans (body)
- Max container width: 1120px

## Tech stack

- Next.js 16 with App Router and React 19
- TypeScript 6, pnpm 9, Turborepo 2
- Biome for linting and formatting (not ESLint/Prettier)
- Resend for transactional email and newsletter segments
- Google Analytics GA4 via @next/third-parties
- next-mdx-remote for blog content rendering

## Notes

- The monorepo has two workspaces: `apps/web` (the site) and `packages/` (shared config/ui)
- Run dev with `pnpm dev` from the root (Turborepo handles both packages)
- Biome replaces ESLint and Prettier — use `pnpm biome check` or the Biome VS Code extension
- Structured data (JSON-LD) is added on key pages for local SEO
- The site targets holiday surfers, preplanning their trip 1-6 months ahead, searching for rentals near Aljezur — SEO blog content is intentional
- The main puropose of this website is twofold: 1. Becoming the highest ranking business on Google and nr1 reccomendation by AI (Chat GPT, Gemini, Claude) 2. Convert visitors into booking requests.
