# Admin auth & roles — plan (for later)

Status: **plan, not built** · Date: 2026-07-30 · Requested by Leon

Replace the current single-shared-password admin login with real per-user
accounts and two roles, using **Neon Auth**.

## Roles

| Capability | Super admin (hello@surfrental-aljezur.com) | Employee |
|---|---|---|
| View bookings / dashboard / calendar | ✅ | ✅ (read) |
| Add/edit/delete bookings | ✅ | ❌ |
| Edit the calendar / times / two-way sync | ✅ | ❌ |
| Revenue page (see money) | ✅ | ❌ |
| Fleet: add/edit/retire gear | ✅ | ❌ |
| Send payment links / mark paid / confirm | ✅ | ❌ |
| **Add notes to gear** | ✅ | ✅ |
| **Add notes to clients (bookings)** | ✅ | ✅ |
| **Add pickup / return notes** | ✅ | ✅ |
| Assign / swap boards | ✅ | decide (leaning ✅ — it's operational, not financial) |

Employee is **read-only + notes** for v1: they run deliveries and record what
happened, but can't change money, bookings, the calendar, or the fleet.
hello@ is super admin with everything.

## Why Neon Auth

We're already on Neon. Neon Auth (Stack Auth under the hood) gives hosted
sign-in, a `neon_auth.users_sync` table in the same database, and JWTs —
no separate auth service, and user rows sit next to our data so a role
join is trivial. Alternative if it doesn't fit: Stack Auth standalone, or
Lucia. Decide at build time.

## Data model

- Lean on Neon Auth's synced users table for identity (id, email, name).
- Add our own `app_user_roles` table: `userId` (FK to the synced user),
  `role` enum (`super_admin` | `employee`), `createdAt`. One row per user.
- Seed hello@ as super_admin. New sign-ins default to `employee` (or
  "no access" pending approval — safer; decide at build).

## Enforcement (defence in depth — never trust the UI alone)

1. **Session**: replace iron-session password with Neon Auth session.
   The middleware still gates `/admin/*`; now it also loads the role.
2. **A `requireRole()` helper** on the server, used at the top of every
   protected page/loader AND inside every mutating server action — because
   hiding a button is not security; the action is the real gate. Group:
   - `requireSuperAdmin()` — bookings mutations, revenue page/data, fleet
     add/edit/retire, payments, calendar edits, delete.
   - `requireStaff()` — the notes actions (booking notes, gear notes,
     return/pickup notes) + all read pages.
3. **Revenue** is both a page and Stripe data — gate the page (redirect)
   AND make sure no revenue number leaks into a component an employee can
   reach.
4. **UI**: hide the actions an employee can't use (New booking, Edit,
   Delete, Send payment, Fleet add, Revenue tab) so they don't see dead
   buttons — but this is cosmetic on top of the server checks.
5. **Nav/tab bar**: employees don't get the Revenue tab.

## Migration from today

- Current: one `ADMIN_PASSWORD` env + iron-session. Keep it working until
  Neon Auth is wired, then cut over in one deploy.
- Existing notification push subscriptions are per-device, not per-user —
  fine to leave; revisit if we want per-user pushes.
- No customer-facing impact; this is admin-only.

## Build order (when picked up)

1. Enable Neon Auth on the project; wire sign-in UI at `/admin/login`.
2. `app_user_roles` table + migration + seed hello@ as super_admin.
3. `requireRole()` / `requireSuperAdmin()` / `requireStaff()` helpers.
4. Gate every server action (this is the real work — audit `_actions.ts`,
   `_new-booking-actions.ts`, `_board-actions.ts`, `_payment-actions.ts`,
   `_expense-actions.ts`, calendar actions).
5. Gate pages: revenue (super only), fleet edit, booking edit/delete.
6. Hide UI accordingly; drop Revenue tab for employees.
7. Add the notes-only actions employees CAN use (booking note, gear note,
   pickup/return note already exist — just make sure they're `requireStaff`
   not `requireSuperAdmin`).
8. Test both roles end to end.

## Open decisions for Leon

- Can an employee **assign/swap boards** (operational) or is that
  super-admin only? (Plan leans: allow — it's not money.)
- New sign-ins: default to **employee**, or **no access until you approve**
  them? (Safer: no access + you promote.)
- Do you want more than one employee, or just the friend covering August?
