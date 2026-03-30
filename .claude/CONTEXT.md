# Current Project

## What we are building

A marketing and booking website for Surf Rental Aljezur — a delivery-based surfboard and wetsuit rental service in Aljezur, Portugal. Customers browse boards and packages, then submit a booking request. Leon and his partner deliver gear to the accommodation and pick it up at checkout.

The site is built with Next.js 16 (App Router), TypeScript, Turborepo, Resend for email, and GA4 for analytics. There are 138 MDX blog posts for SEO. The design uses a neo-brutalist style with cream backgrounds, charcoal text, and a burnt orange accent (#C04419).

## What good looks like

- Fast, accessible, mobile-first pages that convert visitors into booking requests
- Clean TypeScript with no type hacks (`any`, non-null assertions without reason)
- New UI that fits the existing design system without introducing new primitives
- Blog posts and pages that are accurate to the real business (gear, prices, locations)
- Email flows via Resend that reliably deliver booking details to both customer and Leon
- GA4 events that track meaningful actions (form submits, CTA clicks, scroll depth)

## What to avoid

- Hardcoding prices or dates outside of `lib/pricing.ts`
- Adding new npm dependencies without a clear reason — the stack is intentionally lean
- Changing the visual design language (fonts, shadows, border radius, palette)
- Generating or modifying blog content without being asked — posts are SEO assets
- Creating wrapper components or abstractions for one-off UI
- Writing console.log statements or debug code into production files
- Making the booking form more complex — it already captures everything needed
