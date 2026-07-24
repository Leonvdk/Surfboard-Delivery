# Board Inventory & Availability — Design Spec

Status: **draft for Leon's review** · Author: Claude · Date: 2026-07-24

The goal: the admin panel becomes the single source of truth for *which
physical boards exist, what they cost, which board is out on which booking,
and what's free for any date range* — including mid-booking swaps (the
Premium tier's headline feature).

---

## 1. Data model

Two new tables. Everything text-dates (`YYYY-MM-DD`), matching the existing
`bookings.checkin/checkout` convention.

### `boards` — the physical fleet

| column        | type      | notes                                                    |
|---------------|-----------|----------------------------------------------------------|
| id            | serial PK |                                                          |
| name          | text      | Leon's label, e.g. `7'8 Funboard — blue NSP`             |
| size          | text      | matches form values: `6'6`, `7'0`, `7'8`, `8'6`          |
| purchaseCost  | integer   | euros, what Leon paid                                    |
| purchaseDate  | text      | nullable                                                 |
| status        | enum      | `active` \| `repair` \| `retired`                        |
| notes         | text      | dings, repairs, quirks                                   |
| createdAt / updatedAt | timestamp |                                                  |

- Spend tracking = `SUM(purchaseCost)` grouped by size/status — no extra tables.
- `retired`/`repair` boards drop out of availability but keep history.

### `board_assignments` — which board is on which booking, when

| column        | type      | notes                                                    |
|---------------|-----------|----------------------------------------------------------|
| id            | serial PK |                                                          |
| bookingId     | int FK → bookings.id | cascade on delete                             |
| personIndex   | integer   | index into the booking's `people` jsonb array            |
| boardId       | int FK → boards.id |                                                 |
| startDate     | text      | ISO date — first day the board is out                    |
| endDate       | text      | ISO date — last day (inclusive, matches billing rule)    |
| swappedFromId | int FK → board_assignments.id, nullable | set when this assignment replaces another mid-booking |
| notes         | text      | e.g. "swapped down to 7'8, struggling on the 7'0"        |
| createdAt     | timestamp |                                                          |

**Why a separate assignments table (not a column on bookings):**
- One booking can have N boards (per person) with different windows (per-person dates just shipped).
- A swap = two assignment rows on the same person: the old one truncated, the new one starting at swap day. `swappedFromId` links them so the detail page can render "7'0 → 7'8 on Aug 12".
- History survives even if a board is later retired.

**Indexes:** `(boardId, startDate)` for availability scans; `(bookingId)` for detail-page lookups.

## 2. Core logic

### Availability

A board is **free for [from, to]** iff `status = 'active'` and no assignment
overlaps: `NOT (a.endDate < from OR a.startDate > to)`, excluding assignments
whose booking is `cancelled` or soft-deleted (join on bookings).

One `getAvailability(from, to)` helper in `apps/web/app/admin/_lib/` returns
per-board free/busy + which booking holds it. Everything else (dashboard
count, picker filtering) reuses it.

### Assigning

On the booking detail page, per person: a board `<select>` listing boards of
matching size first (others below, flagged), each option showing free/busy
for that person's effective window (`person.checkin ?? booking.checkin`).
Picking one creates the assignment with the person's window.

**Conflict rule: hard block.** Assigning a board that overlaps an existing
assignment fails with a clear message naming the conflicting booking. A board
can't physically be in two places; no override. (Leon can always shorten or
delete the other assignment first.)

### Swapping

"Swap board" button on an active assignment → picks swap date (default today)
+ new board (same availability check from swap date → assignment end):

1. Old assignment's `endDate` → swap date.
2. New assignment created: `startDate` = swap date, `endDate` = old end,
   `swappedFromId` = old assignment id.

Same-day double-count is fine (both boards touch Leon's van that day).

### Cancellations

No trigger logic — the availability query excludes cancelled bookings, so
cancelling a booking frees its boards automatically.

## 3. Admin surfaces

1. **`/admin/boards`** — fleet list: name, size, status, spend, "out now?"
   badge, next free date. Header stats: total boards, total invested, N free
   today. Add-board form inline.
2. **`/admin/boards/[id]`** — edit fields, status switch, assignment history
   (which bookings, revenue attribution later if wanted).
3. **Availability strip on `/admin/calendar`** — under the existing month
   grid, one row per board, colored bars for busy windows. Answers "do I
   have a 7'8 free Aug 10–17?" at a glance.
4. **Booking detail** — per-person board assignment select + swap button +
   swap history line.

All mutations = Server Actions in `_actions.ts` (repo convention — no REST
routes), each ending with `revalidatePath` for the touched pages.

## 4. What this does NOT do (v1)

- No customer-facing availability. The form keeps free-text board prefs;
  Leon confirms manually. (Automatic "sold out" on the website is a later
  phase — needs confidence in the data first.)
- No wetsuit inventory. Same pattern could extend later; boards are the
  constraint.
- No maintenance-cost ledger (only purchase cost + free-text notes).
- No automatic assignment on booking confirm — Leon assigns by hand; the
  picker just makes conflicts impossible.

## 5. Build plan (single session, ~4 commits)

1. Schema + migration (`pnpm db:generate`) + availability helper + unit
   sanity via script.
2. `/admin/boards` list + detail + server actions.
3. Booking-detail assignment + swap UI.
4. Calendar availability strip + polish + tsc/verify/push.

## 6. Open questions for Leon

1. **Wetsuits too, or boards only for v1?** (Spec assumes boards only.)
2. Does he want **quantity of identical boards** as separate rows (e.g. two
   7'8s = two rows)? Spec assumes yes — each physical board is one row, so
   each can have its own dings/history.
3. Should the **dashboard "attention needed" panel** flag confirmed bookings
   with unassigned boards? (Cheap to add, suggested yes.)
