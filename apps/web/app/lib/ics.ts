import type { Booking, BookingPerson } from "./db/schema";

/**
 * iCalendar feed of every delivery and collection run, for Leon to
 * subscribe to from the hello@surfrental-aljezur.com Google Calendar.
 *
 * A subscribed feed (rather than the Calendar API) means no Google
 * credentials to hold, nothing to expire, and no way for a bug here to
 * write junk into a real calendar — the worst case is a stale feed. The
 * trade is refresh latency: Google re-polls subscribed URLs on its own
 * schedule, so a brand-new booking can take a few hours to appear.
 *
 * Times are booking-level wall-clock in Europe/Lisbon. They're emitted
 * as UTC instants (…Z) rather than TZID references so no VTIMEZONE block
 * is needed and every client agrees on the moment. Bookings with no time
 * set yet become all-day events — visible, but not pretending to a slot
 * that was never scheduled.
 */

const TZ = "Europe/Lisbon";
const DOMAIN = "surfrental-aljezur.com";
/** Brand burnt orange — same value as --accent in globals.css. */
export const BRAND_COLOR = "#C04419";
/** How long to block out for a run. Rough but useful in a day view. */
const DELIVERY_MINUTES = 45;
const PICKUP_MINUTES = 30;

/** Offset of `tz` from UTC at a given instant, in ms. */
function tzOffsetMs(instant: Date, tz: string): number {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: tz,
		hour12: false,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	}).formatToParts(instant);
	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
	const asUtc = Date.UTC(
		get("year"),
		get("month") - 1,
		get("day"),
		get("hour") % 24,
		get("minute"),
		get("second"),
	);
	return asUtc - instant.getTime();
}

/**
 * "2026-08-01" + "09:30" as Lisbon wall-clock → the real UTC instant.
 * Two passes so a time that lands near a DST switch resolves against the
 * offset actually in force, not the one before the jump.
 */
function lisbonToUtc(date: string, time: string): Date | null {
	const naive = new Date(`${date}T${time}:00Z`);
	if (Number.isNaN(naive.getTime())) return null;
	const first = tzOffsetMs(naive, TZ);
	let out = new Date(naive.getTime() - first);
	const second = tzOffsetMs(out, TZ);
	if (second !== first) out = new Date(naive.getTime() - second);
	return out;
}

function stampUtc(d: Date): string {
	return `${d.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

function dateOnly(iso: string): string {
	return iso.replaceAll("-", "");
}

function addDays(iso: string, n: number): string {
	const d = new Date(`${iso}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + n);
	return d.toISOString().slice(0, 10);
}

/** Escape per RFC 5545 §3.3.11 — backslash first or it double-escapes. */
function esc(value: string): string {
	return value
		.replaceAll("\\", "\\\\")
		.replaceAll(";", "\\;")
		.replaceAll(",", "\\,")
		.replaceAll(/\r?\n/g, "\\n");
}

/**
 * Fold to 75 octets per RFC 5545. Counted in UTF-8 bytes, not characters,
 * so an accented accommodation name can't push a line over the limit and
 * break parsing — and multi-byte characters are never split mid-sequence.
 */
function fold(line: string): string {
	const bytes = Buffer.from(line, "utf8");
	if (bytes.length <= 75) return line;
	const out: string[] = [];
	let start = 0;
	let limit = 75;
	while (start < bytes.length) {
		let end = Math.min(start + limit, bytes.length);
		// Don't split a UTF-8 continuation byte (10xxxxxx) from its lead.
		while (end > start && end < bytes.length && (bytes[end]! & 0xc0) === 0x80) {
			end--;
		}
		out.push(bytes.subarray(start, end).toString("utf8"));
		start = end;
		limit = 74; // continuation lines carry a leading space
	}
	return out.join("\r\n ");
}

export interface CalendarEvent {
	uid: string;
	summary: string;
	description: string;
	location: string;
	/** Null → all-day event on `date`. */
	start: Date | null;
	date: string;
	minutes: number;
	stamp: Date;
	url?: string;
}

function renderEvent(e: CalendarEvent): string[] {
	const lines = [
		"BEGIN:VEVENT",
		`UID:${e.uid}`,
		`DTSTAMP:${stampUtc(e.stamp)}`,
	];
	if (e.start) {
		lines.push(`DTSTART:${stampUtc(e.start)}`);
		lines.push(
			`DTEND:${stampUtc(new Date(e.start.getTime() + e.minutes * 60_000))}`,
		);
	} else {
		lines.push(`DTSTART;VALUE=DATE:${dateOnly(e.date)}`);
		lines.push(`DTEND;VALUE=DATE:${dateOnly(addDays(e.date, 1))}`);
	}
	lines.push(`SUMMARY:${esc(e.summary)}`);
	if (e.description) lines.push(`DESCRIPTION:${esc(e.description)}`);
	if (e.location) lines.push(`LOCATION:${esc(e.location)}`);
	if (e.url) lines.push(`URL:${e.url}`);
	lines.push("END:VEVENT");
	return lines;
}

/** A person's real window — their own dates, else the booking's. */
function effective(p: BookingPerson, b: Booking) {
	return { checkin: p.checkin || b.checkin, checkout: p.checkout || b.checkout };
}

function gearLine(p: BookingPerson, i: number): string {
	const who = p.name?.trim() || `Person ${i + 1}`;
	const bits = [p.package, p.board, p.wetsuitSize && `wetsuit ${p.wetsuitSize}`]
		.filter(Boolean)
		.join(" · ");
	return bits ? `${who}: ${bits}` : who;
}

/**
 * One booking → its runs. Distinct dates only: a party where three boards
 * arrive the same morning is one delivery, not three. With staggered
 * dates each distinct date gets its own run, listing exactly the gear
 * moving that day — which is the whole point of tracking them separately.
 */
export function bookingEvents(b: Booking): CalendarEvent[] {
	const people = b.people ?? [];
	const stamp = b.updatedAt ?? b.createdAt ?? new Date();
	const ref = `SR-${String(b.id).padStart(5, "0")}`;
	const base = [
		`Booking ${ref}`,
		b.phone ? `Phone: ${b.phone}` : "",
		b.accommodation ? `Address: ${b.accommodation}` : "",
	].filter(Boolean);

	const byDate = (kind: "deliver" | "collect") => {
		const map = new Map<string, BookingPerson[]>();
		if (people.length === 0) {
			map.set(kind === "deliver" ? b.checkin : b.checkout, []);
		}
		people.forEach((p) => {
			const eff = effective(p, b);
			const key = kind === "deliver" ? eff.checkin : eff.checkout;
			const list = map.get(key) ?? [];
			list.push(p);
			map.set(key, list);
		});
		return map;
	};

	// Deep link to the booking in the admin. Kept as a bare URL on its own
	// line so both Google and Apple auto-linkify it into a tap target — the
	// `url`/source field isn't reliably shown or tappable on mobile.
	const adminUrl = `https://${DOMAIN}/admin/bookings/${b.id}`;

	const events: CalendarEvent[] = [];
	for (const kind of ["deliver", "collect"] as const) {
		const time = kind === "deliver" ? b.deliveryTime : b.pickupTime;
		const minutes = kind === "deliver" ? DELIVERY_MINUTES : PICKUP_MINUTES;
		const verb = kind === "deliver" ? "Deliver" : "Collect";
		for (const [date, group] of byDate(kind)) {
			const gear = group.map((p) => gearLine(p, people.indexOf(p)));
			const count = group.length;
			events.push({
				uid: `sr-${b.id}-${kind}-${date}@${DOMAIN}`,
				summary: `${verb} · ${b.name}${count ? ` (${count})` : ""}`,
				description: [
					...base,
					gear.length ? `Gear:\n${gear.join("\n")}` : "",
					!time ? `No ${kind === "deliver" ? "delivery" : "pickup"} time set yet.` : "",
					`Open booking: ${adminUrl}`,
				]
					.filter(Boolean)
					.join("\n"),
				location: b.accommodation ?? "",
				start: time ? lisbonToUtc(date, time) : null,
				date,
				minutes,
				stamp,
				url: adminUrl,
			});
		}
	}
	return events;
}

export function buildCalendar(bookings: Booking[]): string {
	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		`PRODID:-//Surf Rental Aljezur//Admin Runs//EN`,
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"X-WR-CALNAME:Surf Rental — deliveries & pickups",
		`X-WR-TIMEZONE:${TZ}`,
		// Brand burnt orange. Honoured by Apple Calendar and anything else
		// reading the X-APPLE- extension. Google Calendar ignores calendar
		// colour from a feed entirely — it's set per-subscriber in their UI —
		// so the admin card hands Leon the hex to paste there. Deliberately
		// NOT emitting RFC 7986 COLOR: that property takes a CSS3 colour
		// *name*, and no name is our orange; an approximation would be worse
		// than leaving it to the one client that reads exact values.
		`X-APPLE-CALENDAR-COLOR:${BRAND_COLOR}`,
		// Hint for clients that honour it. Google ignores this and uses its
		// own polling interval, so don't read it as a guarantee.
		"REFRESH-INTERVAL;VALUE=DURATION:PT1H",
		"X-PUBLISHED-TTL:PT1H",
	];
	for (const b of bookings) {
		for (const e of bookingEvents(b)) lines.push(...renderEvent(e));
	}
	lines.push("END:VCALENDAR");
	return lines.map(fold).join("\r\n") + "\r\n";
}
