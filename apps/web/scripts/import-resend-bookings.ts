/**
 * Back-fill bookings from past Resend emails.
 *
 * Reads Resend's Emails API for the last N days (default 90 — Resend's max
 * retention), parses booking-request emails sent to hello@surfrental-aljezur.com,
 * and inserts one Booking row per email — skipping any that already exist
 * (matched on the exact createdAt timestamp).
 *
 * Usage (from apps/web):
 *   pnpm exec tsx scripts/import-resend-bookings.ts [--dry-run] [--days 90]
 *
 * Requires: DATABASE_URL, RESEND_API_KEY.
 */

import { and, eq } from "drizzle-orm";
import { Resend } from "resend";
import { getDb, schema } from "../app/lib/db/client";
import type { BookingPerson } from "../app/lib/db/schema";

const BUSINESS_EMAIL = "hello@surfrental-aljezur.com";

interface Args {
	dryRun: boolean;
	days: number;
	reparse: boolean;
}

function parseArgs(): Args {
	const argv = process.argv.slice(2);
	let dryRun = false;
	let days = 90;
	let reparse = false;
	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === "--dry-run") dryRun = true;
		else if (argv[i] === "--reparse") reparse = true;
		else if (argv[i] === "--days" && argv[i + 1]) {
			days = Number.parseInt(argv[i + 1]!, 10) || 90;
			i++;
		}
	}
	return { dryRun, days, reparse };
}

interface ParsedBooking {
	name: string;
	email: string;
	checkin: string;
	checkout: string;
	accommodation: string | null;
	peopleCount: number;
	people: BookingPerson[] | null;
	message: string | null;
	estimatedTotal: number | null;
	sentAt: Date;
}

/**
 * Parse per-person blocks out of the business booking email body. Each block
 * matches the format built by apps/web/app/api/contact/route.ts formatPerson:
 *
 *     {name}:
 *       Sex: {sex}
 *       Experience: {experience}
 *       Package: {package}
 *       Board: {board}
 *       Wetsuit size: {size}   (optional)
 */
function parsePeople(text: string): BookingPerson[] | null {
	const blockRe =
		/^ {2}([^\n]+):\n {4}Sex:\s*([^\n]*)\n {4}Experience:\s*([^\n]*)\n {4}Package:\s*([^\n]*)\n {4}Board:\s*([^\n]*)(?:\n {4}Wetsuit size:\s*([^\n]*))?/gm;
	const people: BookingPerson[] = [];
	let m: RegExpExecArray | null = blockRe.exec(text);
	while (m !== null) {
		const [, name, sex, experience, packageValue, board, wetsuit] = m;
		people.push({
			name: (name ?? "").trim(),
			sex: (sex ?? "").trim(),
			experience: (experience ?? "").trim(),
			package: (packageValue ?? "").trim(),
			board: (board ?? "").trim(),
			wetsuitSize: (wetsuit ?? "").trim(),
		});
		m = blockRe.exec(text);
	}
	return people.length > 0 ? people : null;
}

function parseBookingEmail(subject: string, text: string, createdAt: string): ParsedBooking | null {
	// Business email subject format:
	//   "New booking request from {name} ({checkin} → {checkout})"
	const subjMatch = subject.match(/^New booking request from (.+) \((\d{4}-\d{2}-\d{2}) → (\d{4}-\d{2}-\d{2})\)$/);
	if (!subjMatch) return null;
	const [, name, checkin, checkout] = subjMatch;

	const emailMatch = text.match(/^Email:\s*(\S+@\S+)$/m);
	const accommodationMatch = text.match(/^Accommodation:\s*(.+)$/m);
	const peopleMatch = text.match(/^People:\s*(\d+)$/m);
	const estimateMatch = text.match(/^Estimated total:\s*€(\d+)$/m);
	const messageMatch = text.match(/Message:\n([\s\S]*?)(?:\n\nReply directly|$)/);

	if (!emailMatch) return null;

	return {
		name: name!,
		email: emailMatch[1]!,
		checkin: checkin!,
		checkout: checkout!,
		accommodation: accommodationMatch?.[1]?.trim() ?? null,
		peopleCount: peopleMatch ? Number.parseInt(peopleMatch[1]!, 10) : 1,
		people: parsePeople(text),
		message: messageMatch?.[1]?.trim() ?? null,
		estimatedTotal: estimateMatch ? Number.parseInt(estimateMatch[1]!, 10) : null,
		sentAt: new Date(createdAt),
	};
}

async function main() {
	const { dryRun, days, reparse } = parseArgs();
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) throw new Error("RESEND_API_KEY not set");

	const db = getDb();
	if (!db) throw new Error("DATABASE_URL not set");

	const resend = new Resend(apiKey);
	const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

	console.log(
		`Importing bookings since ${since.toISOString()} (dry-run: ${dryRun}, reparse: ${reparse})`,
	);

	// Resend's list emails endpoint is paginated; loop until we've walked back
	// past the `since` cutoff or run out.
	let inserted = 0;
	let updated = 0;
	let skipped = 0;
	let parsed = 0;
	let scanned = 0;
	let after: string | undefined;

	while (true) {
		const list = await resend.emails.list({ limit: 100, ...(after ? { after } : {}) });
		if (list.error) throw new Error(`Resend list error: ${list.error.message}`);
		const items = list.data?.data ?? [];
		if (items.length === 0) break;

		for (const item of items) {
			scanned++;
			if (new Date(item.created_at) < since) return void (await finish());
			if (item.to?.[0] !== BUSINESS_EMAIL) continue;

			const detail = await resend.emails.get(item.id);
			if (detail.error || !detail.data) continue;

			const parsedBooking = parseBookingEmail(
				detail.data.subject ?? "",
				detail.data.text ?? "",
				item.created_at,
			);
			if (!parsedBooking) continue;
			parsed++;

			// Dedup on (email, checkin, checkout) — reasonably unique per booking
			const existing = await db
				.select({ id: schema.bookings.id })
				.from(schema.bookings)
				.where(
					and(
						eq(schema.bookings.email, parsedBooking.email),
						eq(schema.bookings.checkin, parsedBooking.checkin),
						eq(schema.bookings.checkout, parsedBooking.checkout),
					),
				)
				.limit(1);

			if (existing.length > 0) {
				if (!reparse) {
					skipped++;
					continue;
				}
				// Reparse mode: update the existing row with freshly parsed fields.
				const existingId = existing[0]!.id;
				if (dryRun) {
					console.log(
						`Would reparse: #${existingId} ${parsedBooking.name} · people=${parsedBooking.people?.length ?? 0}`,
					);
					updated++;
				} else {
					await db
						.update(schema.bookings)
						.set({
							accommodation: parsedBooking.accommodation,
							peopleCount: parsedBooking.peopleCount,
							people: parsedBooking.people,
							message: parsedBooking.message,
							estimatedTotal: parsedBooking.estimatedTotal,
							updatedAt: new Date(),
						})
						.where(eq(schema.bookings.id, existingId));
					updated++;
					console.log(
						`Reparsed: #${existingId} ${parsedBooking.name} · people=${parsedBooking.people?.length ?? 0}`,
					);
				}
				continue;
			}

			if (dryRun) {
				console.log("Would insert:", parsedBooking.name, parsedBooking.checkin);
				inserted++;
			} else {
				await db.insert(schema.bookings).values({
					name: parsedBooking.name,
					email: parsedBooking.email,
					checkin: parsedBooking.checkin,
					checkout: parsedBooking.checkout,
					accommodation: parsedBooking.accommodation,
					peopleCount: parsedBooking.peopleCount,
					people: parsedBooking.people,
					message: parsedBooking.message,
					estimatedTotal: parsedBooking.estimatedTotal,
					status: "completed",
					createdAt: parsedBooking.sentAt,
					importedFromResend: new Date(),
				});
				inserted++;
				console.log(`Imported: ${parsedBooking.name} · ${parsedBooking.checkin}`);
			}
		}

		after = items[items.length - 1]?.id;
		if (!after) break;
	}

	await finish();

	async function finish() {
		console.log("---");
		console.log(`Scanned emails: ${scanned}`);
		console.log(`Parsed booking emails: ${parsed}`);
		console.log(`Inserted: ${inserted}`);
		console.log(`Updated (reparse): ${updated}`);
		console.log(`Skipped (already in DB): ${skipped}`);
		console.log(`Dry-run: ${dryRun}`);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
