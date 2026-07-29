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

export function getCalendarConfig(): CalendarConfig | null {
	const calendarId = process.env.GOOGLE_CALENDAR_ID;
	const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
	// Vercel stores the PEM with literal \n; restore real newlines or the
	// signature silently fails to verify.
	const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.replace(
		/\\n/g,
		"\n",
	);
	if (!calendarId || !clientEmail || !privateKey) return null;
	return { calendarId, clientEmail, privateKey };
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
	const signer = createSign("RSA-SHA256");
	signer.update(`${header}.${claim}`);
	const signature = b64url(signer.sign(cfg.privateKey));
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
			throw new Error(`list failed (${listRes.status}): ${body.slice(0, 200)}`);
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
					throw new Error(`insert failed (${post.status}): ${body.slice(0, 200)}`);
				}
				created++;
				continue;
			}
			const body = await put.text();
			throw new Error(`update failed (${put.status}): ${body.slice(0, 200)}`);
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
