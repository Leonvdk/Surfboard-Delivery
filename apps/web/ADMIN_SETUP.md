# Admin dashboard — setup

The `/admin` dashboard lets you see and manage bookings, view a booking calendar, and read Stripe revenue. It's a single-user tool — you're the only one who logs in.

## Prerequisites you need to do ONCE

### 1. Provision Neon (database)

1. Vercel dashboard → your `surf-rental-aljezur` project → **Storage** tab → **Create Database** → **Neon** → follow the flow. Free tier is enough for this business's volume.
2. Vercel automatically adds `DATABASE_URL` to Production, Preview, and Development env vars. Nothing else to set on the DB side.

### 2. Run the initial migration

Locally, with `DATABASE_URL` set (copy it from the Vercel dashboard env vars):

```bash
cd apps/web
pnpm db:push
```

That applies the `bookings` table to Neon. Idempotent — safe to run again.

If you prefer to keep migration files under source control (`drizzle/*.sql`), use `pnpm db:generate` + `pnpm db:migrate` instead.

### 3. Choose your admin password

Generate a bcrypt hash of the password you want to use:

```bash
pnpm exec tsx -e 'import("bcryptjs").then(({hash}) => hash(process.argv[1], 12).then(console.log))' 'the-password-you-want'
```

Copy the resulting `$2b$12$…` hash and add it to Vercel env vars as `ADMIN_PASSWORD_HASH` (Production + Preview).

### 4. Generate a session secret

```bash
openssl rand -base64 48
```

Add the output to Vercel env vars as `SESSION_SECRET`.

### 5. Create a Stripe restricted key

1. Stripe dashboard → **Developers → API Keys → Create restricted key**
2. Give it a name like `Admin dashboard read-only`
3. Set these permissions (leave everything else at None):
   - **Charges:** `Read`
   - **Customers:** `Read`
4. Save. Copy the `rk_live_…` (or `rk_test_…` for testing) key.
5. Add to Vercel env vars as `STRIPE_SECRET_KEY`.

### 6. Redeploy

Any push to master triggers a new build with the env vars in place. Or use the Vercel dashboard: **Deployments → three-dot → Redeploy latest**.

## Using it

Once deployed, visit `https://surfrental-aljezur.com/admin`. Log in with the password you set. You'll land on the Bookings list. Nav has three tabs:

- **Bookings** — reverse-chronological list. Filter counts across the top. Click Open to see detail.
- **Calendar** — month grid. Bookings are colour-coded by status. Click a chip to jump to that booking. Use the prev/next links to navigate months.
- **Revenue** — pulls charges from Stripe for the last 30 days by default (adjust via `?days=90` in the URL, capped at 180). Shows the daily net revenue trend and a recent charges table.

Each booking page lets you:
- Change status: `requested → confirmed → completed` (or `cancelled` at any point)
- Set the final price (once you've agreed the total with the customer)
- Write private owner notes (never shown to the customer)

## Back-fill past bookings from Resend

Resend keeps sent emails for 90 days. To import past booking-request emails from that window into the database:

```bash
cd apps/web

# Preview what would be inserted:
pnpm import:resend -- --dry-run --days 90

# Actually import:
pnpm import:resend -- --days 90
```

The script dedupes on `(email, checkin, checkout)` — running twice is safe. Imports get `status: "completed"` on the assumption they're past bookings; adjust manually if any need to become `cancelled`.

## Fresh bookings

New form submissions automatically write to the DB (in addition to sending the Resend emails). No action needed on your part — they'll show up as `requested` in `/admin`.

## Environment variables summary

| Variable | Where | Purpose |
|---|---|---|
| `DATABASE_URL` | Auto | Neon Postgres connection |
| `ADMIN_PASSWORD_HASH` | Vercel env | bcrypt hash of your admin password |
| `SESSION_SECRET` | Vercel env | Signs the admin session cookie |
| `STRIPE_SECRET_KEY` | Vercel env | Restricted key with charges:read + customers:read |
| `RESEND_API_KEY` | Already set | Also used by the import script |

`/admin` is disallowed in `robots.txt` and the pages emit `noindex, nofollow` — search engines will not index it.

## Troubleshooting

- **"Database not configured"** — `DATABASE_URL` isn't set in the running env. Check Vercel env vars for the current environment.
- **Login just refreshes** — `ADMIN_PASSWORD_HASH` or `SESSION_SECRET` isn't set. Check both.
- **"Stripe not configured"** — `STRIPE_SECRET_KEY` isn't set. Check Vercel env vars.
- **Stripe fetch error** — usually a wrong key type. You want a **Restricted Key** (`rk_live_...`), not a **Secret Key** (`sk_live_...`).
