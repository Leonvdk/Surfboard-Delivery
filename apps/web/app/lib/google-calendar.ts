import { createSign } from "node:crypto";
import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { getDb, schema } from "./db/client";
import type { Booking, CalendarSyncStatus } from "./db/schema";
import { bookingEvents } from "./ics";

/**
 * Writes real delivery/collection events into the hello@surfrental-aljezur.com
 * Google Calendar.
 *
 * Why not the subscribed .ics feed (which still exists, and still works):
 * a feed is a *subscription*, and subscriptions don't travel. Google
 * re-polls them on its own schedule — hours, not seconds — and Google's
 * CalDAV bridge doesn't expose "Other calendars" at all, so Apple Calendar
 * connected to the Google account never sees them. Notion Calendar reads
 * whatever Google exposes, so it inherits the same gaps. Events written
 * through the API are ordinary events on an owned calendar: every client
 * syncs them within seconds, and Leon can edit or drag them.
 *
 * Auth is a service account with the hello@ calendar shared to it ("Make
 * changes to events"). No domain-wide delegation needed, no OAuth refresh
 * token to expire. The JWT is signed here rather than pulling in
 * `googleapis`, which is ~50MB for the three REST calls we make.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://www.googleapis.com/calendar/v3";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";
const TZ = "Europe/Lisbon";
/** Google's per-event palette is fixed; 6 = Tangerine, the closest to our
 * burnt orange. Exact brand colour is set on the calendar itself, in the UI. */
const EVENT_COLOR_ID = "6";
/** Tags every event we own, so a resync can find and prune its own work
 * without touching anything Leon created by hand in the same calendar. */
const TAG_KEY = "srBookingId";

export interface CalendarConfig {
	calendarId: string;
	clientEmail: string;
	privateKey: string;
}

/**
 * Turn whatever ended up in the env var into a valid PEM. The JSON key's
 * `private_key` field trips people up in three ways when pasted into
 * Vercel, and we forgive all of them rather than making Leon re-paste:
 *   1. surrounding quotes copied along with the value ("-----BEGIN…")
 *   2. `\n` left as literal backslash-n (the JSON form)
 *   3. double-escaped `\\n` (some copy paths)
 * A malformed key surfaces as OpenSSL's opaque "DECODER unsupported", so
 * getting this right is the difference between a clear state and a
 * cryptic one.
 */
export function normalizePrivateKey(raw: string): string {
	let k = raw.trim();
	// Strip one layer of surrounding quotes if the whole value is wrapped.
	if (
		(k.startsWith('"') && k.endsWith('"')) ||
		(k.startsWith("'") && k.endsWith("'"))
	) {
		k = k.slice(1, -1);
	}
	// Restore newlines. Double-escaped first so we don't leave a stray
	// backslash behind, then the common single-escaped form.
	k = k.replace(/\\r\\n/g, "\n").replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");
	k = k.trim();

	if (looksLikePem(k)) return k;

	// Not a PEM yet — but a very common setup mistake is a base64 value,
	// either the whole PEM base64'd ("to avoid newline issues") or just the
	// key's base64 body with the -----BEGIN/END----- lines stripped. Both
	// are recoverable, so recover them rather than making Leon re-paste.
	const compact = k.replace(/\s+/g, "");
	if (compact.length > 100 && /^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
		// Case 1: base64 of a full PEM → decode reveals the BEGIN/END block.
		try {
			const decoded = Buffer.from(compact, "base64").toString("utf8");
			if (looksLikePem(decoded)) return decoded.trim();
		} catch {
			/* fall through */
		}
		// Case 2: bare base64 body (no armor). Google keys are PKCS#8, so
		// wrap it in the matching header at 64-char lines. If the guess is
		// wrong, signing throws the friendly DECODER message downstream.
		const wrapped = compact.match(/.{1,64}/g)?.join("\n") ?? compact;
		return `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n`;
	}

	return k;
}

/** True when the string at least looks like a PEM private key, so we can
 * fail with a useful message before OpenSSL fails with a useless one. */
export function looksLikePem(key: string): boolean {
	return /-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(key) &&
		/-----END [A-Z ]*PRIVATE KEY-----/.test(key);
}

/**
 * Name the actual mistake in GOOGLE_SERVICE_ACCOUNT_KEY without ever
 * echoing the secret. A private key is ~1700 chars starting with a PEM
 * header; anything else is a recognisable paste error, and saying which
 * one turns a red banner into a one-line fix.
 */
export function describeKeyProblem(key: string): string {
	const k = key.trim();
	const fix =
		"Fix: open the service-account JSON, copy ONLY the private_key value (the block from -----BEGIN PRIVATE KEY----- to -----END PRIVATE KEY-----, quotes not included), paste it into GOOGLE_SERVICE_ACCOUNT_KEY in Vercel, and redeploy.";
	if (!k) return `GOOGLE_SERVICE_ACCOUNT_KEY is empty. ${fix}`;
	if (k.startsWith("{")) {
		return `GOOGLE_SERVICE_ACCOUNT_KEY holds the whole JSON file, not just the key. ${fix}`;
	}
	if (/^[a-f0-9]{20,60}$/i.test(k)) {
		return `GOOGLE_SERVICE_ACCOUNT_KEY looks like the private_key_id (a short hex string), not the key itself. ${fix}`;
	}
	if (k.includes("PRIVATE KEY") && !looksLikePem(k)) {
		return `GOOGLE_SERVICE_ACCOUNT_KEY looks truncated — it mentions PRIVATE KEY but is missing the full BEGIN/END block. ${fix}`;
	}
	if (k.length < 200) {
		return `GOOGLE_SERVICE_ACCOUNT_KEY is too short (${k.length} chars) to be a private key — looks like the wrong field was pasted. ${fix}`;
	}
	// Safe to show a short prefix: this value is NOT a usable key (that's the
	// bug), so its first characters can't sign anything — but they tell us
	// what it actually is (MII…=DER, eyJ…=JSON, LS0…=base64 PEM).
	const prefix = k.slice(0, 10).replace(/[^\x20-\x7e]/g, "·");
	return `GOOGLE_SERVICE_ACCOUNT_KEY doesn't contain a PEM private-key block (${k.length} chars, starts "${prefix}…"). ${fix}`;
}

export function getCalendarConfig(): CalendarConfig | null {
	const calendarId = process.env.GOOGLE_CALENDAR_ID;
	const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
	if (!calendarId || !clientEmail || !rawKey) return null;
	return { calendarId, clientEmail, privateKey: normalizePrivateKey(rawKey) };
}

function b64url(input: string | Buffer): string {
	return Buffer.from(input)
		.toString("base64")
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

/** Cached across warm invocations — tokens last an hour, minting one per
 * request would double the latency of every booking save. */
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(cfg: CalendarConfig): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	if (cachedToken && cachedToken.expiresAt > now + 60) return cachedToken.token;

	const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
	const claim = b64url(
		JSON.stringify({
			iss: cfg.clientEmail,
			scope: SCOPE,
			aud: TOKEN_URL,
			iat: now,
			exp: now + 3600,
		}),
	);
	if (!looksLikePem(cfg.privateKey)) {
		throw new Error(describeKeyProblem(cfg.privateKey));
	}
	let signature: string;
	try {
		const signer = createSign("RSA-SHA256");
		signer.update(`${header}.${claim}`);
		signature = b64url(signer.sign(cfg.privateKey));
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		// OpenSSL's DECODER error is opaque; translate it to the actual fix.
		if (/DECODER|unsupported|bad base64|PEM/i.test(msg)) {
			throw new Error(
				`Private key couldn't be parsed (${msg}). Re-check GOOGLE_SERVICE_ACCOUNT_KEY in Vercel: paste the private_key value from the JSON with no surrounding quotes. The \\n sequences are fine — the app restores them.`,
			);
		}
		throw err;
	}
	const assertion = `${header}.${claim}.${signature}`;

	const res = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: new URLSearchParams({
			grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
			assertion,
		}),
	});
	const json = (await res.json()) as {
		access_token?: string;
		expires_in?: number;
		error_description?: string;
		error?: string;
	};
	if (!res.ok || !json.access_token) {
		throw new Error(
			`Google auth failed: ${json.error_description ?? json.error ?? res.status}`,
		);
	}
	cachedToken = {
		token: json.access_token,
		expiresAt: now + (json.expires_in ?? 3600),
	};
	return json.access_token;
}

/**
 * Google event ids are base32hex: lowercase a–v and 0–9 only. Derived from
 * the booking id, kind and date so a resync overwrites the same event
 * instead of creating a duplicate every time a booking is touched.
 */
function eventId(bookingId: number, kind: string, date: string): string {
	return `sr${bookingId}${kind}${date.replaceAll("-", "")}`;
}

interface GoogleEvent {
	id?: string;
	summary?: string;
	description?: string;
	location?: string;
	start?: { date?: string; dateTime?: string; timeZone?: string };
	end?: { date?: string; dateTime?: string; timeZone?: string };
	colorId?: string;
	source?: { title: string; url: string };
	extendedProperties?: { private?: Record<string, string> };
	status?: string;
}

/**
 * Translate Google's error JSON into a one-line fix. The raw body is a
 * nested blob that's useless on a phone; the reason code inside it maps
 * to a specific, actionable cause. Falls back to a trimmed raw body for
 * anything unrecognised so nothing is ever hidden.
 */
function friendlyGoogleError(op: string, status: number, body: string): string {
	if (/requiredAccessLevel|writer access/i.test(body)) {
		return `Calendar is shared with the service account but read-only. In Google Calendar → hello@ → Settings and sharing → the ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "service account"} row, set permission to "Make changes to events".`;
	}
	if (status === 404 || /notFound/i.test(body)) {
		return `Calendar not found for this service account — it isn't shared with ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "the service account"} yet, or GOOGLE_CALENDAR_ID is wrong (should be hello@surfrental-aljezur.com).`;
	}
	if (status === 401 || /invalid_grant|unauthorized/i.test(body)) {
		return "Google rejected the credentials — the service-account key is wrong or the account was disabled. Re-check GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY.";
	}
	if (status === 429 || /rateLimitExceeded|quotaExceeded/i.test(body)) {
		return "Google rate-limited the sync — transient; the nightly job will catch up.";
	}
	return `${op} failed (${status}): ${body.slice(0, 200)}`;
}

async function api(
	cfg: CalendarConfig,
	path: string,
	init: RequestInit = {},
): Promise<Response> {
	const token = await getAccessToken(cfg);
	return fetch(`${API}/calendars/${encodeURIComponent(cfg.calendarId)}${path}`, {
		...init,
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			...(init.headers ?? {}),
		},
	});
}

/** Local wall-clock + a timeZone, rather than a UTC instant — Google then
 * shows the right local time and handles DST itself. */
function timedEvent(date: string, time: string, minutes: number) {
	const start = `${date}T${time}:00`;
	const [h, m] = time.split(":").map(Number);
	const endMinutes = (h ?? 0) * 60 + (m ?? 0) + minutes;
	// A pickup late in the evening could roll past midnight; let Date do the
	// carry rather than emitting "25:15".
	const base = new Date(`${date}T00:00:00Z`);
	base.setUTCMinutes(endMinutes);
	const endDate = base.toISOString().slice(0, 10);
	const endTime = base.toISOString().slice(11, 16);
	return {
		start: { dateTime: start, timeZone: TZ },
		end: { dateTime: `${endDate}T${endTime}:00`, timeZone: TZ },
	};
}

function addDays(iso: string, n: number): string {
	const d = new Date(`${iso}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

/** Booking → the events it should have in Google, reusing the same
 * run-grouping the .ics feed uses so the two can never disagree. */
function desiredEvents(booking: Booking): GoogleEvent[] {
	return bookingEvents(booking).map((e) => {
		const kind = e.uid.includes("-deliver-") ? "deliver" : "collect";
		const timed = e.start
			? timedEvent(
					e.date,
					kind === "deliver"
						? (booking.deliveryTime ?? "09:00")
						: (booking.pickupTime ?? "09:00"),
					e.minutes,
				)
			: {
					start: { date: e.date },
					end: { date: addDays(e.date, 1) },
				};
		return {
			id: eventId(booking.id, kind, e.date),
			summary: e.summary,
			description: e.description,
			location: e.location || undefined,
			colorId: EVENT_COLOR_ID,
			source: { title: "Surf Rental admin", url: e.url ?? "" },
			extendedProperties: { private: { [TAG_KEY]: String(booking.id) } },
			...timed,
		};
	});
}

export interface SyncResult {
	ok: boolean;
	created: number;
	updated: number;
	deleted: number;
	error?: string;
}

/**
 * Make Google match the booking exactly: write the events it should have,
 * remove the ones it shouldn't. Stale events are found by our own tag, so
 * a date change (which changes the event id) can't leave an orphan run in
 * the calendar — driving to a pickup that moved is exactly the failure
 * this has to prevent.
 *
 * Cancelled and soft-deleted bookings resolve to zero desired events, so
 * the same path cleans them up.
 */
export async function syncBookingToCalendar(
	booking: Booking,
): Promise<SyncResult> {
	const cfg = getCalendarConfig();
	if (!cfg) return { ok: false, created: 0, updated: 0, deleted: 0, error: "not configured" };

	const gone = booking.deletedAt != null || booking.status === "cancelled";
	const desired = gone ? [] : desiredEvents(booking);
	const desiredIds = new Set(desired.map((e) => e.id));

	let created = 0;
	let updated = 0;
	let deleted = 0;

	try {
		// Everything we previously wrote for this booking, cancelled entries
		// included — Google keeps them listed until they're purged.
		const listRes = await api(
			cfg,
			`/events?privateExtendedProperty=${encodeURIComponent(`${TAG_KEY}=${booking.id}`)}&showDeleted=false&maxResults=250`,
		);
		if (!listRes.ok) {
			const body = await listRes.text();
			throw new Error(friendlyGoogleError("list", listRes.status, body));
		}
		const existing = ((await listRes.json()) as { items?: GoogleEvent[] }).items ?? [];

		for (const event of desired) {
			// PUT updates in place; a 404 means it's new. Doing it in this
			// order keeps the common case (an edit) to a single call.
			const put = await api(cfg, `/events/${event.id}`, {
				method: "PUT",
				body: JSON.stringify(event),
			});
			if (put.ok) {
				updated++;
				continue;
			}
			if (put.status === 404 || put.status === 410) {
				const post = await api(cfg, "/events", {
					method: "POST",
					body: JSON.stringify(event),
				});
				if (!post.ok) {
					const body = await post.text();
					throw new Error(friendlyGoogleError("insert", post.status, body));
				}
				created++;
				continue;
			}
			const body = await put.text();
			throw new Error(friendlyGoogleError("update", put.status, body));
		}

		for (const event of existing) {
			if (!event.id || desiredIds.has(event.id)) continue;
			const del = await api(cfg, `/events/${event.id}`, { method: "DELETE" });
			// 410 = already gone, which is the outcome we wanted anyway.
			if (del.ok || del.status === 410) deleted++;
		}

		return { ok: true, created, updated, deleted };
	} catch (err) {
		return {
			ok: false,
			created,
			updated,
			deleted,
			error: err instanceof Error ? err.message : String(err),
		};
	}
}

/**
 * Never let a calendar problem break a booking save. Google being down, a
 * rotated key or a revoked share should cost Leon a calendar entry, not
 * the booking he just took payment for — the nightly resync repairs it.
 *
 * A failure here still gets recorded to the health row, so an inline write
 * that quietly fails is visible on the dashboard rather than lost to logs.
 */
export async function syncBookingSafe(booking: Booking): Promise<void> {
	const cfg = getCalendarConfig();
	if (!cfg) return;
	try {
		const result = await syncBookingToCalendar(booking);
		if (!result.ok) {
			console.error(`[gcal] booking ${booking.id} sync failed: ${result.error}`);
			await recordInlineFailure(cfg.calendarId, result.error ?? "unknown");
		}
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error(`[gcal] booking ${booking.id} sync threw:`, err);
		await recordInlineFailure(cfg.calendarId, msg);
	}
}

/* ── Health tracking ─────────────────────────────────────────────────
 * The sync must never fail silently. Every full run stamps its outcome
 * here; the dashboard reads it, and the nightly cron pushes on failure.
 */

/** How long without a successful run before we treat the sync as stale.
 * The cron runs daily, so >26h means it stopped firing entirely. */
export const SYNC_STALE_MS = 26 * 60 * 60 * 1000;

export interface ForwardSyncSummary {
	configured: boolean;
	ok: boolean;
	bookings: number;
	created: number;
	updated: number;
	deleted: number;
	failures: Array<{ id: number; error: string }>;
}

/** Yesterday — a run that just happened still gets corrected if it drifted. */
function windowStartIso(): string {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() - 1);
	return d.toISOString().slice(0, 10);
}

async function writeStatus(
	calendarId: string,
	fields: {
		ok: boolean;
		lastError: string | null;
		bookings: number;
		created: number;
		updated: number;
		deleted: number;
		failureCount: number;
	},
): Promise<void> {
	const db = getDb();
	if (!db) return;
	const now = new Date();
	try {
		await db
			.insert(schema.calendarSyncStatus)
			.values({
				calendarId,
				lastRunAt: now,
				lastSuccessAt: fields.ok ? now : null,
				updatedAt: now,
				consecutiveFailures: fields.ok ? 0 : 1,
				...fields,
			})
			.onConflictDoUpdate({
				target: schema.calendarSyncStatus.calendarId,
				set: {
					lastRunAt: now,
					updatedAt: now,
					ok: fields.ok,
					lastError: fields.lastError,
					bookings: fields.bookings,
					created: fields.created,
					updated: fields.updated,
					deleted: fields.deleted,
					failureCount: fields.failureCount,
					// Reset the streak on success; otherwise bump it via SQL so we
					// don't need to read-then-write.
					...(fields.ok
						? { lastSuccessAt: now, consecutiveFailures: 0 }
						: {
								consecutiveFailures: sqlIncrement(),
							}),
				},
			});
	} catch (err) {
		console.error("[gcal] failed to write sync status:", err);
	}
}

// Drizzle raw increment expression, kept in one place.
function sqlIncrement() {
	return sql`${schema.calendarSyncStatus.consecutiveFailures} + 1`;
}

/** Record a failed inline write without a full run's counts. */
async function recordInlineFailure(calendarId: string, error: string): Promise<void> {
	await writeStatus(calendarId, {
		ok: false,
		lastError: error,
		bookings: 0,
		created: 0,
		updated: 0,
		deleted: 0,
		failureCount: 1,
	});
}

/**
 * Re-assert every forward-window booking against Google and record the
 * outcome to the health row. Shared by the nightly cron and the manual
 * "Sync now" button, so both report health identically.
 */
export async function syncForwardWindow(): Promise<ForwardSyncSummary> {
	const cfg = getCalendarConfig();
	if (!cfg) {
		return { configured: false, ok: false, bookings: 0, created: 0, updated: 0, deleted: 0, failures: [] };
	}
	const db = getDb();
	if (!db) {
		return { configured: true, ok: false, bookings: 0, created: 0, updated: 0, deleted: 0, failures: [{ id: 0, error: "db not configured" }] };
	}

	const rows = await db
		.select()
		.from(schema.bookings)
		.where(
			and(
				isNull(schema.bookings.deletedAt),
				gte(schema.bookings.checkout, windowStartIso()),
			),
		);

	let created = 0;
	let updated = 0;
	let deleted = 0;
	const failures: Array<{ id: number; error: string }> = [];

	for (const booking of rows) {
		const result = await syncBookingToCalendar(booking);
		if (result.ok) {
			created += result.created;
			updated += result.updated;
			deleted += result.deleted;
		} else {
			failures.push({ id: booking.id, error: result.error ?? "unknown" });
		}
	}

	const ok = failures.length === 0;
	await writeStatus(cfg.calendarId, {
		ok,
		lastError: ok ? null : failures.map((f) => `#${f.id}: ${f.error}`).join(" · ").slice(0, 500),
		bookings: rows.length,
		created,
		updated,
		deleted,
		failureCount: failures.length,
	});

	return { configured: true, ok, bookings: rows.length, created, updated, deleted, failures };
}

export interface SyncHealth {
	configured: boolean;
	status: CalendarSyncStatus | null;
	stale: boolean;
}

/** Read the health row plus a computed staleness flag, for the dashboard
 * and the calendar page. `stale` is true when a run hasn't succeeded
 * within the window — which catches the cron silently not firing. */
export async function getSyncHealth(): Promise<SyncHealth> {
	const cfg = getCalendarConfig();
	if (!cfg) return { configured: false, status: null, stale: false };
	const db = getDb();
	if (!db) return { configured: true, status: null, stale: false };
	const [status] = await db
		.select()
		.from(schema.calendarSyncStatus)
		.where(eq(schema.calendarSyncStatus.calendarId, cfg.calendarId))
		.limit(1);
	if (!status) return { configured: true, status: null, stale: false };
	const last = status.lastSuccessAt?.getTime() ?? 0;
	const stale = Date.now() - last > SYNC_STALE_MS;
	return { configured: true, status, stale };
}
