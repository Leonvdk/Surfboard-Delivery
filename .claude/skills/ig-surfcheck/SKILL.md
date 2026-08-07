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

**Do NOT ask the model for a scene.** The primary sticker style cannot draw one — measured
2026-08-07 over five generations, every landscape prompt ("a terracotta sea filling the frame",
"one wave peeling across the width", "the bay seen from the dunes") came back as abstract parallel
bands or an extreme close-up. `--mode banner`'s "fills the entire frame / reaches every edge"
suffix is what makes it zoom until nothing reads. **`--mode banner` is effectively dead for this
card; leave it alone.**

What the style does beautifully is **one well-drilled object on plain cream**. So the pipeline is:
generate the object with `--mode spot`, then build the full-bleed scene in code
(`compose_banner.py` puts it on a terracotta sea / sand / ink-strip background). The image still
has to fit *this* weekend, never generic brand art (sra-branding rule) — the fit now comes from
the **object choice plus the scene knobs**:

| Weekend read | Object prompt (`--mode spot`) | Knobs |
|---|---|---|
| flat / tiny | the delivery van, side view, board flat on the roof rack | `--waves 1 --sea 0.46` |
| small / clean / mellow | the van, or a single longboard standing on its tail in the sand | `--waves 2` |
| longboard day | one longboard lying flat on the sand, wide round nose | `--waves 2 --width 0.66` |
| building through weekend | the van, or a board leaning on a dune fence post | `--waves 3` |
| solid / powerful | a single shortboard planted nose-down in the sand | `--waves 5 --sea 0.60` |
| windy / messy | a wetsuit hanging from a line, seen from the back, sleeves blown sideways | `--waves 4 --sea 0.56` |

Spell out the standing sra-branding object rules in every prompt — the complete van bumper to
bumper with both wheels and the board lying flat and horizontal on the roof; the real surfboard
outline with its single centre stringer; the wetsuit from the BACK with one long vertical zip.
Add "a single object alone, no people, no figures, no animals" or the style invents company.
Keep the prompt under **1000 characters** — Recraft 400s above that, and `recraft_gen.py` appends
its suffix on top of what you pass.

## Step 4 — Generate the card
Write `data.json` (see `scripts/render_card.py` header for the exact shape), then run the three
steps from the scripts dir so the imports resolve:
```
cd .claude/skills/ig-surfcheck/scripts
python3 recraft_gen.py "<one object, standing rules spelled out>" /tmp/sc-obj.png --mode spot --seed <YYYYMMDD>
python3 compose_banner.py --obj /tmp/sc-obj.png --out /tmp/sc-art.png --seed <YYYYMMDD> --waves 3
python3 render_card.py --art /tmp/sc-art.png --data /tmp/sc-data.json --out /tmp/sc-card.png
```
- `recraft_gen.py` calls Recraft on the PRIMARY style (recraftv3), b64_json, no_text, palette
  locked, then quantizes to the 3 inks + adds deterministic wax grain.
- `compose_banner.py` keys the cream out with an edge flood-fill (never a luminance threshold —
  it would eat the brand cream), then pastes the object onto sea / sand / ink bands that reach
  every edge. **The banner's top edge must be terracotta and its bottom edge ink, never paper:**
  `fit_banner()` reads a cream sky as an emblem margin and crops *inside* the subject, which is
  what shredded the van on the first try. The band layout already guarantees this — don't
  "improve" it back to a cream sky.
- `render_card.py` composites 1080×1080: full-bleed art on top, ember seam, `WEEKEND SURF CHECK`
  kicker, the three-day ledger (big ember heights, the pick gets an ember pill), the payoff line,
  and an ink footer bar carrying the promise only — `data["foot"]`, e.g. `BOARDS + WETSUITS TO
  YOUR DOOR · ALJEZUR`. **No website/URL on the card** (it lives in the IG bio, not the art).
- One preview at ≤540px, check the object is complete and the pick pill + heights are legible,
  then stop. If the object itself came back wrong (van missing its board, wetsuit drawn front-on),
  re-roll `recraft_gen.py` with a different `--seed` — never re-roll to fix the *scene*, that's
  `compose_banner.py`'s job and costs nothing.

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

## Step 6 — Deliver to dispatch (phone-ready, copy-paste ready)
Léon posts this from his phone, so the **final message IS the deliverable** — it must be
copy-paste ready with nothing to edit and nothing to scroll past. Exactly four things, in this
order, and **nothing else** — no preamble, no summary of the forecast, no notes on how the card
was made, no "let me know if you'd like changes":

1. The **1080×1080 PNG** attached with `SendUserFile` (`/tmp/sc-card.png`).
2. The **caption** in its own fenced code block — the whole thing, hashtags included, so one tap
   copies it. Never put the caption in prose or in a bulleted list; it has to survive the copy.
3. The **alt text** in its own separate fenced code block (it pastes into a different IG field,
   so it must never be merged into the caption block).
4. **One line**: the pick day and post now / hold until Friday.

Anything worth reporting that doesn't fit those four — a re-roll, a Recraft credit failure, an
assumption made on the forecast — goes in that single last line or, if it's really a process
note, into `calibration.md`. Never into the dispatch message.

Archive the run to `~/work/surfcheck/<date>/` (card, art, data.json).

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
