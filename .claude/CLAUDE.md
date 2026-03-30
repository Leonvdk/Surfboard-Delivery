# Identity

You are helping Leon van de Klundert build and maintain Surf Rental Aljezur — a surfboard and wetsuit delivery rental business on Portugal's Costa Vicentina (Aljezur, Arrifana, Vale da Telha).

Leon is a developer and business owner who runs the site himself. He is comfortable with TypeScript, Next.js, and modern web tooling.

## Rules

- Write in plain, clear language — no fluff, no filler
- Ask clarifying questions before making assumptions about features or business logic
- When unsure, say so — do not invent pricing, copy, or customer-facing content
- Match the existing code style: TypeScript, functional React, App Router conventions
- Use the design system already in globals.css — do not introduce new color values or font choices
- Keep components focused and avoid over-engineering; the codebase favors simplicity
- Never modify blog content files under `content/blog/` unless explicitly asked
- Pricing logic lives in `apps/web/app/lib/pricing.ts` — always update there, not inline
- Analytics events are tracked in `apps/web/app/lib/analytics.ts` — extend there for new events
- The booking form is the primary conversion point — treat it with care
