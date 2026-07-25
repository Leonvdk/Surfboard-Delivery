"use server";

import { and, eq, gte } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { Resend } from "resend";
import { getDb, schema } from "../lib/db/client";
import type { BookingPerson } from "../lib/db/schema";
import {
	buildBookingConfirmationEmail,
	type ConfirmationLine,
	defaultEmailCopy,
} from "../lib/emails/booking-confirmation";
import { calcPackagePrice, DAILY_MINIMUM_DAYS, type PackageTier } from "../lib/pricing";
import {
	createBookingPaymentLink,
	deactivatePaymentLink,
} from "../lib/stripe-payment-link";
import { BOOKINGS_TAG } from "./_lib/bookings-cache";
import { BOARDS_TAG } from "./_lib/boards-cache";

/**
 * Admin-created bookings: Leon fills the form, the server recomputes the
 * per-person prices from pricing.ts (the form's live numbers are a
 * preview, not trusted), stores the booking as confirmed with his final
 * total, tries to mint a Stripe payment link, and — as an explicit second
 * step so the client can confirm the no-link case — sends the customer
 * the confirmation email.
 */

const FROM_EMAIL = "Surf Rental Aljezur <hello@surfrental-aljezur.com>";
const BUSINESS_EMAIL = "hello@surfrental-aljezur.com";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const PACKAGE_TIER_MAP: Record<string, PackageTier | null> = {
	premium: "premium",
	full: "fullPackage",
	board: "boardOnly",
	custom: null,
};

const PACKAGE_SHORT: Record<string, string> = {
	premium: "Premium",
	full: "Full Package",
	board: "Board Only",
	custom: "Custom",
};

export interface NewBookingPerson {
	name: string;
	sex: string;
	experience: string;
	package: string;
	board: string;
	wetsuitSize: string;
	checkin?: string | null;
	checkout?: string | null;
	/** Overrides the computed package price for this person, in whole
	 * euros, so a discount lands on the line itself rather than as an
	 * "Adjustment" row on the customer's Stripe bill. */
	priceOverride?: number | null;
}

export interface NewBookingPayload {
	name: string;
	email: string;
	phone: string;
	accommodation: string;
	checkin: string;
	checkout: string;
	people: NewBookingPerson[];
	/** Leon's final price — may differ from the computed sum. */
	finalTotal: number;
	/** Personal note rendered in the email. */
	note: string;
}

export interface CreateBookingResult {
	ok: boolean;
	error?: string;
	bookingId?: number;
	requestRef?: string;
	paymentLinkUrl?: string | null;
	/** Why Stripe produced no link — shown in the review-send dialog. */
	paymentLinkError?: string;
}

function calcDays(checkin: string, checkout: string): number | null {
	if (!ISO_DATE.test(checkin) || !ISO_DATE.test(checkout)) return null;
	const nights = Math.round(
		(new Date(`${checkout}T00:00:00Z`).getTime() -
			new Date(`${checkin}T00:00:00Z`).getTime()) /
			86400000,
	);
	return nights >= 0 ? nights + 1 : null;
}

/** Per-person line labels + euro amounts from the canonical pricing. */
function computeLines(
	payload: NewBookingPayload,
): { lines: ConfirmationLine[]; computedTotal: number | null } {
	const lines: ConfirmationLine[] = [];
	let total = 0;
	let complete = true;
	for (let i = 0; i < payload.people.length; i++) {
		const p = payload.people[i]!;
		const tier = PACKAGE_TIER_MAP[p.package];
		const checkin = p.checkin || payload.checkin;
		const checkout = p.checkout || payload.checkout;
		const days = calcDays(checkin, checkout);
		const who = p.name || `Person ${i + 1}`;
		if (!tier || !days) {
			lines.push({ label: `${PACKAGE_SHORT[p.package] ?? p.package} — ${who}`, amountEuros: null });
			complete = false;
			continue;
		}
		// A per-line override IS the price — the customer's bill shows it
		// as the package cost, with no separate adjustment row.
		const override =
			p.priceOverride != null && Number.isFinite(p.priceOverride)
				? Math.round(p.priceOverride)
				: null;
		const amount = override != null && override > 0
			? override
			: calcPackagePrice(tier, days);
		total += amount;
		lines.push({
			label: `${PACKAGE_SHORT[p.package]} · ${days} days — ${who}`,
			amountEuros: amount,
		});
	}
	return { lines, computedTotal: complete ? total : null };
}

/** Shared payload validation — returns an error string, or null when ok. */
function validateBookingPayload(payload: NewBookingPayload): string | null {
	if (!payload.name.trim() || !/.+@.+\..+/.test(payload.email.trim())) {
		return "Name and a valid email are required.";
	}
	if (!ISO_DATE.test(payload.checkin) || !ISO_DATE.test(payload.checkout)) {
		return "Pick delivery and pickup dates.";
	}
	const tripDays = calcDays(payload.checkin, payload.checkout);
	if (!tripDays || tripDays < DAILY_MINIMUM_DAYS) {
		return `Minimum rental period is ${DAILY_MINIMUM_DAYS} days.`;
	}
	if (payload.people.length === 0) return "Add at least one person.";
	for (let i = 0; i < payload.people.length; i++) {
		const p = payload.people[i]!;
		if (Boolean(p.checkin) !== Boolean(p.checkout)) {
			return `Person ${i + 1}: custom range needs both dates.`;
		}
		if (p.checkin && p.checkout) {
			const d = calcDays(p.checkin, p.checkout);
			if (!d || d < DAILY_MINIMUM_DAYS) {
				return `Person ${i + 1}: minimum rental period is ${DAILY_MINIMUM_DAYS} days.`;
			}
		}
	}
	const finalTotal = Math.round(payload.finalTotal);
	if (!Number.isFinite(finalTotal) || finalTotal <= 0) {
		return "Final price must be a positive number.";
	}
	return null;
}

/** Earliest arrival / latest departure, for the indexed top-level columns. */
function computeEnvelope(payload: NewBookingPayload): {
	checkin: string;
	checkout: string;
} {
	let minIn = payload.checkin;
	let maxOut = payload.checkout;
	for (const p of payload.people) {
		if (p.checkin && p.checkin < minIn) minIn = p.checkin;
		if (p.checkout && p.checkout > maxOut) maxOut = p.checkout;
	}
	return { checkin: minIn, checkout: maxOut };
}

/** Payload people → stored BookingPerson[], stripping non-diverging dates. */
function toBookingPeople(payload: NewBookingPayload): BookingPerson[] {
	return payload.people.map((p) => ({
		name: p.name.trim(),
		sex: p.sex,
		experience: p.experience,
		package: p.package,
		board: p.board,
		wetsuitSize: p.wetsuitSize,
		...(p.checkin && p.checkin !== payload.checkin ? { checkin: p.checkin } : {}),
		...(p.checkout && p.checkout !== payload.checkout
			? { checkout: p.checkout }
			: {}),
		...(p.priceOverride != null &&
		Number.isFinite(p.priceOverride) &&
		p.priceOverride > 0
			? { priceOverride: Math.round(p.priceOverride) }
			: {}),
	}));
}

export async function createAdminBooking(
	payload: NewBookingPayload,
): Promise<CreateBookingResult> {
	const db = getDb();
	if (!db) return { ok: false, error: "Database not configured." };

	const invalid = validateBookingPayload(payload);
	if (invalid) return { ok: false, error: invalid };

	const finalTotal = Math.round(payload.finalTotal);
	const envelope = computeEnvelope(payload);
	const people: BookingPerson[] = toBookingPeople(payload);

	const [row] = await db
		.insert(schema.bookings)
		.values({
			name: payload.name.trim(),
			email: payload.email.trim(),
			phone: payload.phone.trim() || null,
			checkin: envelope.checkin,
			checkout: envelope.checkout,
			accommodation: payload.accommodation.trim() || null,
			peopleCount: people.length,
			people,
			message: payload.note.trim() || null,
			estimatedTotal: computeLines(payload).computedTotal,
			finalTotal,
			// Leon creates these after agreeing with the customer.
			status: "confirmed",
		})
		.returning({ id: schema.bookings.id });

	if (!row) return { ok: false, error: "Insert failed — try again." };
	const requestRef = `SR-${String(row.id).padStart(5, "0")}`;

	// Best-effort payment link. A null url = Stripe unavailable or refused —
	// the client shows the "send without payment link?" confirm with the
	// reason so key/permission problems are visible without log-digging.
	const { lines } = computeLines(payload);
	const linkResult = await createBookingPaymentLink({
		bookingId: row.id,
		requestRef,
		lines: lines
			.filter((l): l is { label: string; amountEuros: number } => l.amountEuros != null)
			.map((l) => ({ label: l.label, amountEuros: l.amountEuros })),
		finalTotalEuros: finalTotal,
	});

	if (linkResult.url) {
		await db
			.update(schema.bookings)
			.set({
				stripePaymentLinkUrl: linkResult.url,
				stripePaymentLinkId: linkResult.id ?? null,
			})
			.where(eq(schema.bookings.id, row.id));
	}

	updateTag(BOOKINGS_TAG);
	revalidatePath("/admin");
	revalidatePath("/admin/calendar");

	return {
		ok: true,
		bookingId: row.id,
		requestRef,
		paymentLinkUrl: linkResult.url,
		paymentLinkError: linkResult.error,
	};
}

export interface UpdateBookingResult {
	ok: boolean;
	error?: string;
	paymentLinkUrl?: string | null;
	paymentLinkError?: string;
	/** True when the price changed and a fresh link replaced the old one. */
	paymentLinkRegenerated?: boolean;
}

/**
 * Edit an existing booking from the admin: customer details, dates,
 * per-person gear, and the final price. Used by the resend flow so
 * Leon can fix what's wrong before the customer sees it again.
 *
 * Price changes are the dangerous case: the existing Stripe link still
 * charges the OLD amount, so when the total moves we deactivate the
 * stale link and mint a fresh one. Paid bookings keep their link (the
 * money already landed — reissuing would invite a double charge).
 */
export async function updateBookingDetails(
	bookingId: number,
	payload: NewBookingPayload,
): Promise<UpdateBookingResult> {
	const db = getDb();
	if (!db) return { ok: false, error: "Database not configured." };

	const [existing] = await db
		.select()
		.from(schema.bookings)
		.where(eq(schema.bookings.id, bookingId))
		.limit(1);
	if (!existing) return { ok: false, error: "Booking not found." };

	const invalid = validateBookingPayload(payload);
	if (invalid) return { ok: false, error: invalid };

	const finalTotal = Math.round(payload.finalTotal);
	const envelope = computeEnvelope(payload);
	const people: BookingPerson[] = toBookingPeople(payload);

	await db
		.update(schema.bookings)
		.set({
			name: payload.name.trim(),
			email: payload.email.trim(),
			phone: payload.phone.trim() || null,
			accommodation: payload.accommodation.trim() || null,
			checkin: envelope.checkin,
			checkout: envelope.checkout,
			peopleCount: people.length,
			people,
			message: payload.note.trim() || null,
			estimatedTotal: computeLines(payload).computedTotal,
			finalTotal,
			updatedAt: new Date(),
		})
		.where(eq(schema.bookings.id, bookingId));

	// Removing people orphans their board assignments (personIndex points
	// past the end of the array) — drop those so the fleet doesn't stay
	// blocked by gear nobody is renting.
	try {
		await db
			.delete(schema.boardAssignments)
			.where(
				and(
					eq(schema.boardAssignments.bookingId, bookingId),
					gte(schema.boardAssignments.personIndex, people.length),
				),
			);
	} catch (err) {
		console.error("Assignment prune error:", err);
	}

	let paymentLinkUrl = existing.stripePaymentLinkUrl;
	let paymentLinkError: string | undefined;
	let paymentLinkRegenerated = false;

	// Mint a link when the price moved (the old one charges a stale
	// amount) or when there simply isn't one yet — that second case is
	// how a website booking gets its payment request. Paid bookings keep
	// their link: the money already landed, reissuing invites a double
	// charge.
	const priceChanged = existing.finalTotal !== finalTotal;
	const needsLink =
		existing.paidAt == null &&
		(existing.stripePaymentLinkUrl == null || priceChanged);
	if (needsLink) {
		if (priceChanged && existing.stripePaymentLinkId) {
			await deactivatePaymentLink(existing.stripePaymentLinkId);
		}
		const { lines } = computeLines(payload);
		const fresh = await createBookingPaymentLink({
			bookingId,
			requestRef: `SR-${String(bookingId).padStart(5, "0")}`,
			lines: lines
				.filter((l): l is { label: string; amountEuros: number } => l.amountEuros != null)
				.map((l) => ({ label: l.label, amountEuros: l.amountEuros })),
			finalTotalEuros: finalTotal,
		});
		paymentLinkUrl = fresh.url;
		paymentLinkError = fresh.error;
		paymentLinkRegenerated = fresh.url != null && priceChanged;
		await db
			.update(schema.bookings)
			.set({
				stripePaymentLinkUrl: fresh.url,
				stripePaymentLinkId: fresh.id ?? null,
			})
			.where(eq(schema.bookings.id, bookingId));
	}

	updateTag(BOOKINGS_TAG);
	updateTag(BOARDS_TAG);
	revalidatePath("/admin");
	revalidatePath(`/admin/bookings/${bookingId}`);
	revalidatePath("/admin/calendar");

	return {
		ok: true,
		paymentLinkUrl,
		paymentLinkError,
		paymentLinkRegenerated,
	};
}

export async function sendBookingConfirmation(
	bookingId: number,
	opts: {
		includePaymentLink: boolean;
		/** Edited on the review-send screen; falls back to the defaults. */
		greeting?: string;
		intro?: string;
	},
): Promise<{ ok: boolean; error?: string }> {
	const db = getDb();
	if (!db) return { ok: false, error: "Database not configured." };

	const [booking] = await db
		.select()
		.from(schema.bookings)
		.where(eq(schema.bookings.id, bookingId))
		.limit(1);
	if (!booking) return { ok: false, error: "Booking not found." };

	const total = booking.finalTotal ?? booking.estimatedTotal;
	if (total == null) {
		return { ok: false, error: "Set a final price before sending." };
	}

	const { lines } = computeLines({
		name: booking.name,
		email: booking.email,
		phone: booking.phone ?? "",
		accommodation: booking.accommodation ?? "",
		checkin: booking.checkin,
		checkout: booking.checkout,
		people: booking.people ?? [],
		finalTotal: total,
		note: "",
	});

	const firstName = booking.name.split(" ")[0] || booking.name;
	const paymentLinkUrl = opts.includePaymentLink
		? (booking.stripePaymentLinkUrl ?? null)
		: null;
	const defaults = defaultEmailCopy(firstName, paymentLinkUrl != null);

	const emailContent = buildBookingConfirmationEmail({
		customerName: firstName,
		requestRef: `SR-${String(booking.id).padStart(5, "0")}`,
		checkin: booking.checkin,
		checkout: booking.checkout,
		accommodation: booking.accommodation ?? "—",
		people: booking.people ?? [],
		lines,
		totalEuros: total,
		paymentLinkUrl,
		greeting: opts.greeting?.trim() || defaults.greeting,
		intro: opts.intro?.trim() || defaults.intro,
		note: booking.message ?? undefined,
	});

	let emailId: string | null = null;
	try {
		const resend = new Resend(process.env.RESEND_API_KEY);
		const result = await resend.emails.send({
			from: FROM_EMAIL,
			to: booking.email,
			// Copy to the business inbox: Resend sends server-side, so
			// without this nothing lands in Leon's mail client and there's
			// no human-visible record of what the customer received.
			bcc: BUSINESS_EMAIL,
			replyTo: BUSINESS_EMAIL,
			subject: emailContent.subject,
			text: emailContent.text,
			html: emailContent.html,
		});
		if (result.error) {
			console.error("Confirmation email error:", result.error);
			return { ok: false, error: `Email failed: ${result.error.message}` };
		}
		emailId = result.data?.id ?? null;
	} catch (err) {
		console.error("Confirmation email error:", err);
		return { ok: false, error: "Email failed — check RESEND_API_KEY." };
	}

	// Record proof of send so the booking page can show it — Resend
	// accepted the message at this timestamp with this provider id.
	try {
		await db
			.update(schema.bookings)
			.set({
				confirmationSentAt: new Date(),
				confirmationEmailId: emailId,
				updatedAt: new Date(),
			})
			.where(eq(schema.bookings.id, bookingId));
		updateTag(BOOKINGS_TAG);
	} catch (dbErr) {
		// The email did go out; a failed bookkeeping write shouldn't
		// report failure to Leon.
		console.error("Confirmation stamp error:", dbErr);
	}

	revalidatePath(`/admin/bookings/${bookingId}`);
	return { ok: true };
}
