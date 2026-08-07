---
name: ig-surfcheck
description: Produce the weekly "Weekend Surf Check" Instagram post for Surf Rental Aljezur — pull the Fri/Sat/Sun forecast for Amoreira, translate it through Léon's calibration notes, generate an on-brand conditions card with Recraft, write an SEO/GEO-aware house-voice caption + alt text, and hand Léon a phone-ready image + copy. Runs every Friday (or on demand). Trigger words — weekend surf check, surfcheck, surf check, friday surf post, instagram surf, surf forecast post, ig-surfcheck.
---

# Weekend Surf Check — the weekly Instagram anchor post

This is the recurring **Friday** feed post from the Instagram content plan: a Fri/Sat/Sun
surf outlook for the Costa Vicentina, branded, useful enough to save. Its job is awareness +
trust at the top of the funnel → DM → WhatsApp → booking. Léon takes the real photos and
posts stories; **this skill produces the one reliable weekly graphic + caption for him.**

Instagram posts now surface in Google Search, so the caption is written to rank: real place
names, "surf forecast", "beginner surf", "board delivery" woven in naturally, plus alt text.

## Before you start — load the brand + creds
1. **Invoke the `anthropic-skills:sra-branding` skill.** It carries the Recraft token, the
   PRIMARY house style id, the palette, the voice calibration set, and the art-direction rules.
   This skill's scripts reuse that exact recipe — do not reinvent the style here.
2. Ensure the token file exists (sra-branding writes it): `~/work/.recraft_token`.
3. Everything below lives in this skill dir. Scripts are in `scripts/`, fonts in `fonts/`,
   the running memory in `calibration.md`.

## Step 1 — Pull the forecast
WebFetch **https://www.surf-forecast.com/breaks/Amoreira/forecasts/latest/six_day** and extract,
for **the coming Fri, Sat and Sun**, each day's wave height (m + ft), swell period (s), swell
direction, wind speed + direction, energy, and the day summary + sea temperature. Amoreira is our
bellwether break. (Confirm which dates are "this weekend" with `date -v+fri` / `+sat` / `+sun`.)

## Step 2 — Translate through calibration (the important step)
**Read `calibration.md` first** and apply the *Standing calibration rules*. They override
surf-forecast's star rating, which is shortboard-biased — a small, clean, light-wind weekend
scores 0/10 there but is our beginner/longboard sweet spot, and the card must say so with
confidence, not disappointment. Léon adds notes most weeks; those notes are what make the read
accurate. Decide:
- the **weekend story** in one honest line (building / dropping / clean / windy / the pick day),
- a short **verdict word** per day (e.g. `Small`, `Tiny + clean`, `The pick`, `Windy PM`, `Pumping`),
- **which single day is the pick** (gets the ember pill on the card),
- the **audience read** (beginner-good? shortboard-worthy? longboard day?).

Honesty is the brand. If it's junk for shortboards, say it plainly (a damaging admission is a
house move) — then point beginners/longboarders at the upside.

## Step 3 — Pick a fitting art subject
The image must fit *this* weekend, never generic brand art (sra-branding rule). The card's top
half is a **full-bleed banner** (`recraft_gen.py --mode banner`), so describe a *scene that fills
the whole frame edge to edge*, not an isolated object. Map conditions → scene:

| Weekend read | Full-bleed scene prompt seed |
|---|---|
| small / clean / mellow | a warm terracotta sea filling the frame, one small clean wave peeling in the foreground, high horizon, off-white sky with a low sun disc |
| building through weekend | a terracotta ocean edge to edge, one clean rising wave with a steeper shoulder, sun low on the horizon |
| solid / powerful | one powerful hollow wave curling right across the whole frame, thick lip throwing forward |
| windy / messy | a choppy wind-blown sea filling the frame, spray feathering off the crests |
| longboard day | a long mellow rolling wave across the frame, a longboard resting on the sand in the foreground |
| flat / tiny | the delivery van parked along the frame by a calm empty beach, flat glassy sea behind |

The house style still tends to draw a centered emblem/ring on cream — that's fine, because
`render_card.py` runs `fit_banner()`, which detects the ring + cream margin and crops the
artwork's *interior* to fill the banner. Keep to a single scene; the style invents company
otherwise.

## Step 4 — Generate the card
Write `data.json` (see `scripts/render_card.py` header for the exact shape), then:
```
cd .claude/skills/ig-surfcheck/scripts
python3 recraft_gen.py "<full-bleed scene prompt>" /tmp/sc-art.png --mode banner --seed <YYYYMMDD>
python3 render_card.py --art /tmp/sc-art.png --data /tmp/sc-data.json --out /tmp/sc-card.png
```
- `recraft_gen.py` calls Recraft on the PRIMARY style (recraftv3), b64_json, no_text, palette
  locked, then quantizes to the 3 inks + adds deterministic wax grain.
- `render_card.py` composites 1080×1080: full-bleed art on top, ember seam, `WEEKEND SURF CHECK`
  kicker, the three-day ledger (big ember heights, the pick gets an ember pill), the payoff line,
  and an ink footer bar carrying the promise only — `data["foot"]`, e.g. `BOARDS + WETSUITS TO
  YOUR DOOR · ALJEZUR`. **No website/URL on the card** (it lives in the IG bio, not the art).
- The style loves drawing an outer frame/ring — if it dominates, re-run with a different `--seed`.
  Check the pick day's pill and the heights are legible. Preview at ≤540px (token discipline).

## Step 5 — Write the caption + alt text
House voice = the person who drives the van, WhatsApp register (see sra-branding calibration set).
**Emoji: on** (Léon's call — a few, tasteful; this is the one place the no-emoji brand rule is
relaxed, for Instagram only). Structure:
- **Hook** spoken from where the reader stands (their week, their first paddle-out).
- **The read**: Fri/Sat/Sun in plain terms, sea temp, the pick day, who it suits. One damaging
  admission if the surf earns it.
- **CTA**: board + wetsuit to your Airbnb door → link in bio or DM. Name the service area
  (Aljezur · Arrifana · Vale da Telha), free both ways.
- **Geotag** the beach; note the forecast source.
- **Hashtags**: 8–12, local + niche only (no giant tags): `#aljezur #arrifana #costavicentina
  #surfportugal #algarve #surfforecast #beginnersurf #surfrental #vicentinacoast #amoreira …`
- **Alt text** (paste into IG's alt field — accessibility + SEO): describe the card's actual data
  and the brand line.

SEO/GEO: because IG posts rank on Google, make sure the caption contains the real search phrases
a traveller would type — "surf forecast Aljezur / Arrifana", "beginner surf Costa Vicentina",
"surfboard rental delivery" — without keyword-stuffing. Run the copy past the sra-branding
blacklist (no "seamless/curated", no staccato triplets, ≤1 em-dash per ~150 words).

## Step 6 — Hand it to Léon (phone-ready)
Deliver in one message so he can post from his phone:
- the **1080×1080 PNG** via SendUserFile,
- the **caption** in a copy block,
- the **alt text** in its own copy block,
- a one-line "post now / Friday" note and the pick day.
Optionally archive to `~/work/surfcheck/<date>/`.

## Step 7 — Log it (and absorb Léon's notes)
Append this week's forecast snapshot + card verdict to `calibration.md` under *Weekly log*.
When Léon replies with what the surf actually did, **save his words verbatim under that week**
and distil any repeatable lesson into a *Standing calibration rule*. This is how the forecast
read gets more accurate each week — treat the notes as the skill's memory, never drop them.

## Cadence
Friday, weekly. It's the anchor of the IG plan; other pillars (the van, the gear, spots, proof,
1% for the Planet) rotate around it and are separate posts. One reliable post a week beats three
then silence.

## Token discipline (from sra-branding)
Images are the expensive thing. One card per run, preview ≤540px, verify legibility by eye once,
don't re-view after a passed check. If Recraft returns `not_enough_credits`, tell Léon to top up —
don't retry. A fresh session is cheaper once the visual direction is settled.
