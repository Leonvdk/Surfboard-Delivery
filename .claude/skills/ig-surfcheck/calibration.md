# Weekend Surf Check — forecast calibration log

surf-forecast.com is a single model, and its **0–10 star rating is shortboard-biased**:
a small, clean, light-wind weekend scores 0/10 there but is exactly our sweet spot
(beginners + longboards). Léon's on-the-ground read is the ground truth. This log is how
the on-the-page forecast gets *accurate* over time.

## How to use this file (every run)
1. **Before writing a card:** read the *Standing calibration rules* and apply them when
   translating raw numbers into a verdict. They override the site's star rating.
2. **After posting:** append this week's forecast snapshot under *Weekly log*.
3. **When Léon sends surf notes:** save them verbatim under that week, then distil any
   repeatable lesson into a *Standing calibration rule*. Notes are the point of this file —
   never discard them.

## Standing calibration rules (distilled from Léon's notes)
- **A 0/10 surf-forecast rating is NOT "flat/skip."** Sub-1m, clean, light-wind days are
  beginner + longboard gold — lead the card with that, never with disappointment. *(Léon,
  2026-08-07: "super small waves, fun for beginners.")*
- Amoreira is the bellwether break we pull numbers from; when relevant, note that **Arrifana**
  sits more sheltered (SW-facing, holds up in more wind) and **Monte Clérigo** is more exposed.
- *(more rules will be added as Léon's weekly notes come in)*

## Weekly log

### 2026-08-07 → 08-09 · Amoreira
- **Forecast (surf-forecast):** Fri 0.8–1.0m / 5s NNW windswell / light N 15–20 · Sat 0.4–0.5m /
  9s WNW / light N–NW · Sun 0.8–1.1m / 7–8s WNW–NW, building into the evening / light N. Sea 19.9°C.
  Site rating 0/10 all three days.
- **Card verdict:** small + clean all weekend; Sunday the pick as it fills in by evening.
- **LÉON'S NOTE (2026-08-07):** *"Super small waves, fun for beginners."* → confirms the
  standing rule above: frame small+clean as beginner/longboard-good, not as a poor weekend.
- **Friday run (2026-08-07, scheduled):** re-pulled the forecast on the morning of the post —
  numbers unchanged from the snapshot above (Fri 0.4–1.0m 5–9s NNW / Sat 0.4–0.5m 9s WNW /
  Sun 0.8–1.1m 8s WNW, energy climbing 74→81→159 kJ, wind N 15–20 all weekend, sea 19.9°C,
  site rating 0/10 ×3). Card shipped: Sunday the pick, verdicts Small / Tiny + clean / The pick,
  payoff line "Small and clean, light wind all three days. Sunday fills in. Beginner and
  longboard weather." Damaging admission in the caption: not a shortboard weekend.
- **ART NOTE (2026-08-07) — this cost 5 generations, read it before the next run:** the primary
  sticker style **cannot draw a landscape**. Every scene prompt ("terracotta sea filling the
  frame", "wave peeling across the width", "beach seen from the dunes") came back as abstract
  parallel bands or an extreme close-up, because `BANNER_SUFFIX`'s "fills the entire frame /
  reaches every edge" pushes it to zoom until nothing is legible. What works: prompt a **single
  well-drilled object** (the van, per the standing van rules) on plain cream, then build the
  full-bleed scene yourself in PIL — key the cream out with an edge flood-fill and paste the
  object onto brand bands. Second trap: `fit_banner()` treats a cream sky as an emblem margin
  and crops *inside* the subject, so the composited art's top and bottom edges must be terracotta
  and ink, never paper. **Now fixed in the skill:** `scripts/compose_banner.py` does the compositing
  and SKILL.md Steps 3–4 carry the object-first pipeline, so this should not recur.
- **Second Friday run (2026-08-07, 17:00 — the scheduled task fired twice today).** Re-pulled
  the forecast; the model had *downgraded Sunday* since the morning pull: Sun now 1.0m at **5s
  NNW / 53 kJ**, not the 0.8–1.1m at 8s WNW / 159 kJ it showed at 09:00. Fri 0.8m 5s NNW wind
  N20 · Sat 0.4m 9s WNW wind N20 · Sun 1.0m 5s NNW wind N15. Sea 19.9°C, site rating 0/10 ×3.
  Verdicts unchanged (Small / Tiny + clean / The pick, Sunday the pick — it still has the most
  size and the lightest wind) but the *reason* changed: Sunday is short-period windswell now,
  not a clean groundswell filling in. Saturday holds the only long-period water of the weekend.
  Card art switched from the van to a longboard to match the longboard/beginner read.
  → **Lesson: re-pull the forecast on the morning of the post; a Monday/Tuesday snapshot's
  Sunday numbers are not reliable.**
- **ART NOTE (2026-08-07, second run) — three `compose_banner.py` bugs found and FIXED in the
  script, no credits needed to reproduce:**
  1. `cut_object()` took the bounding box of *all* non-background pixels, but `recraft_gen`
     sprinkles wax-grain flecks across the cream backdrop. Stray flecks pushed the box out to
     the full 1024×1024 canvas, so `--width` then scaled the whole canvas and the object
     overflowed the frame (the first longboard was decapitated at the top edge). Now keeps only
     the **largest connected foreground component**.
  2. `add_grain()` ran *after* the object was pasted. It shades the right 30% of each scanline
     run, so the object split every row it covered into separate runs and the shading stepped at
     its bounding box — printing a visible **ghost rectangle** around the subject. Grain is now
     applied to the bands *before* the paste; the object carries its own grain from `recraft_gen`.
  3. `_is_cream()` was too tight (r>205,g>195,b>180) to key out the soft tonal blob the style
     paints behind the subject. Loosened to r>195,g>185,b>165 — safe, because the object's own
     cream fills are enclosed by its black outline and the edge flood-fill cannot reach them.
- **CARD NOTE (2026-08-07):** `render_card.py` centres `data["line"]` on ONE line with no
  wrapping, and silently lets it run off both edges. Usable width is **~952px at DMSans 25 —
  keep the payoff line under about 72 characters** and measure it before rendering.
- **A diagonal/vertical object needs a much smaller `--width` than the table suggests.** The
  table's fractions assume a horizontal subject. This longboard came back drawn on the diagonal
  (aspect 0.92 w/h), and `--width 0.66` made it ~1.5× the frame height. `--width 0.35` fitted.
  Size from the object's measured aspect, not from the table, whenever it isn't landscape.
- **Third Friday run (2026-08-07, 17:52 — the scheduled task fired a third time today).**
  Re-pulled the forecast. It reads Fri 0.8m 5s NNW N20 / 0.4m 9s WNW PM / 1.0m 5s night ·
  Sat 0.4m 9s WNW N15 / 0.5m 8s NNW PM / 0.5m 7s night · Sun 0.8m 8s WNW N15 / 0.9m 7s WNW N20 PM
  / 1.1m 8s NW N15 night, energy 74→81→159 kJ. Sea 19.9°C, site rating 0/10 ×3.
  → **CORRECTION to the 17:00 entry above: its "Sun 1.0m 5s NNW 53 kJ" was a row-shift error —
  those are FRIDAY's *night* numbers.** Sunday was never downgraded; the morning pull and this
  one agree. **Lesson (standing): the six_day table is three rows per day (AM / PM / night);
  when reading it, anchor each row to its date column and sanity-check that a "downgrade" isn't
  just a neighbouring day's row.** Sunday stays the pick and now for the right reason — it's the
  only real WNW–NW groundswell of the weekend and it builds through the day.
- **Zero-credit re-run.** The read and the longboard/beginner framing were unchanged from the
  17:00 run, so this run REUSED the archived object (`sc-obj2.png`) and only re-ran
  `compose_banner.py` + `render_card.py` with corrected data. No Recraft call.
  → **Lesson: when a repeat firing lands on the same weekend and the same art read, recompose
  from the archived object instead of generating. Composition is free; generation is not.**
- Card shipped: verdicts Small / Tiny + clean / The pick, heights 0.8 / 0.5 / 0.9m, payoff line
  "Small and clean all weekend. Sunday builds into real groundswell." (756px at DMSans 25, fits).
  `--waves 2 --width 0.353`. Banner edges verified terracotta top / ink bottom by pixel probe.
