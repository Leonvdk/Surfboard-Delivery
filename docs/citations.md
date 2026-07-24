# Citation tracker

One row per directory. Update after each submission so we can
audit NAP consistency later. Keep the "canonical NAP" block
below open in a browser tab while filling forms.

## Canonical NAP (paste-me exactly)

```
Business name : Surf Rental Aljezur
Address       : Aljezur, 8670, Faro, Portugal
              : (service-area only — do not list street address)
Phone         : +351 929 244 395  (WhatsApp)
Email         : hello@surfrental-aljezur.com
Website       : https://surfrental-aljezur.com
Hours         : Mon–Sun 08:00–20:00
Primary cat   : Surfboard rental service
Secondary cat : Delivery service, Sporting goods store,
                Rental service, Surf school, Water sport
                equipment supplier, Surfboard shop, Outdoor
                sports store, Tourist attraction
Founded       : (year — fill in)
Owner         : Leon van de Klundert
Description   : Surfboard and wetsuit rental with free delivery
                and pickup across Aljezur, Arrifana, Vale da
                Telha, Monte Clérigo, and Carrapateira on
                Portugal's Costa Vicentina. From €18/day
                board-only or €150/week board + wetsuit.
                Three-day minimum. Owner-operated by Leon van
                de Klundert.
```

## Progress

| Priority | Directory | Status | URL | Notes |
|---|---|---|---|---|
| 1 | Google Business Profile | ☐ | | Primary lever. |
| 2 | Bing Places for Business | ☐ | | |
| 3 | Apple Business Connect | ☐ | | businessconnect.apple.com |
| 4 | TripAdvisor | ☐ | | Category: Tour operator / Rental |
| 5 | Facebook Business Page | ☐ | | |
| 6 | Instagram Business | ☐ | | Link `/contact` in bio |
| 7 | Waze — Add a Place | ☐ | | |
| 8 | Foursquare | ☐ | | |
| 9 | Yelp Portugal | ☐ | | |
| 10 | Páginas Amarelas (paginasamarelas.pt) | ☐ | | PT-native |
| 11 | PAI.pt | ☐ | | PT-native |
| 12 | PortalEmpresas.pt | ☐ | | PT-native |
| 13 | VisitAlgarve | ☐ | | Email info@visitalgarve.pt |
| 14 | Turismo de Portugal (RNT) | ☐ | | RegistoNacionalTurismo.pt |
| 15 | Trustpilot | ☐ | | Optional — only if you'll ask for reviews here |

## After you finish

Once you have GBP, Facebook, Instagram, TripAdvisor URLs — tell
me and I'll wire them into `apps/web/app/lib/jsonld.ts` `sameAs`
array. That's the one place LLMs and Google look to confirm
"same business."

## Consistency rule

If any field of the canonical NAP changes (new phone, new
category, new area), update it here first, then apply everywhere.
Inconsistent NAP is worse than sparse NAP for local ranking.
