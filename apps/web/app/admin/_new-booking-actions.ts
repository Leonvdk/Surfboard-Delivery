"use server";

import { eq } from "drizzle-orm";
import { revalidatePath, updateTag } from "next/cache";
import { Resend } from "resend";
import { getDb, schema } from "../lib/db/client";
import type { BookingPerson } from "../lib/db/schema";
import {
	buildBookingConfirmationEmail,
	type ConfirmationLine,
} from "../lib/emails/booking-confirmation";
import { calcPackagePrice, DAILY_MINIMUM_DAYS, type PackageTier } from "../lib/pricing";
import { createBookingPaymentLink } from "../lib/stripe-payment-link";
import { BOOKINGS_TAG } from "./_lib/bookings-cache";

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
		const amount = calcPackagePrice(tier, days);
		total += amount;
		lines.push({
			label: `${PACKAGE_SHORT[p.package]} · ${days} days — ${who}`,
			amountEuros: amount,
		});
	}
	return { lines, computedTotal: complete ? total : null };
}

export async function createAdminBooking(
	payload: NewBookingPayload,
): Promise<CreateBookingResult> {
	const db = getDb();
	if (!db) return { ok: false, error: "Database not configured." };

	const name = payload.name.trim();
	const email = payload.email.trim();
	if (!name || !/.+@.+\..+/.test(email)) {
		return { ok: false, error: "Name and a valid email are required." };
	}
	if (!ISO_DATE.test(payload.checkin) || !ISO_DATE.test(payload.checkout)) {
		return { ok: false, error: "Pick delivery and pickup dates." };
	}
	const tripDays = calcDays(payload.checkin, payload.checkout);
	if (!tripDays || tripDays < DAILY_MINIMUM_DAYS) {
		return {
			ok: false,
			error: `Minimum rental period is ${DAILY_MINIMUM_DAYS} days.`,
		};
	}
	if (payload.people.length === 0) {
		return { ok: false, error: "Add at least one person." };
	}
	for (let i = 0; i < payload.people.length; i++) {
		const p = payload.people[i]!;
		if (Boolean(p.checkin) !== Boolean(p.checkout)) {
			return { ok: false, error: `Person ${i + 1}: custom range needs both dates.` };
		}
		if (p.checkin && p.checkout) {
			const d = calcDays(p.checkin, p.checkout);
			if (!d || d < DAILY_MINIMUM_DAYS) {
				return {
					ok: false,
					error: `Person ${i + 1}: minimum rental period is ${DAILY_MINIMUM_DAYS} days.`,
				};
			}
		}
	}
	const finalTotal = Math.round(payload.finalTotal);
	if (!Number.isFinite(finalTotal) || finalTotal <= 0) {
		return { ok: false, error: "Final price must be a positive number." };
	}

	// Envelope for the indexed top-level columns, same rule as /api/contact.
	let minIn = payload.checkin;
	let maxOut = payload.checkout;
	for (const p of payload.people) {
		if (p.checkin && p.checkin < minIn) minIn = p.checkin;
		if (p.checkout && p.checkout > maxOut) maxOut = p.checkout;
	}

	const people: BookingPerson[] = payload.people.map((p) => ({
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
	}));

	const [row] = await db
		.insert(schema.bookings)
		.values({
			name,
			email,
			phone: payload.phone.trim() || null,
			checkin: minIn,
			checkout: maxOut,
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
			.set({ stripePaymentLinkUrl: linkResult.url })
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

export async function sendBookingConfirmation(
	bookingId: number,
	opts: { includePaymentLink: boolean },
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

	const emailContent = buildBookingConfirmationEmail({
		customerName: booking.name.split(" ")[0] || booking.name,
		requestRef: `SR-${String(booking.id).padStart(5, "0")}`,
		checkin: booking.checkin,
		checkout: booking.checkout,
		accommodation: booking.accommodation ?? "—",
		people: booking.people ?? [],
		lines,
		totalEuros: total,
		paymentLinkUrl: opts.includePaymentLink
			? (booking.stripePaymentLinkUrl ?? null)
			: null,
		note: booking.message ?? undefined,
	});

	try {
		const resend = new Resend(process.env.RESEND_API_KEY);
		const result = await resend.emails.send({
			from: FROM_EMAIL,
			to: booking.email,
			replyTo: BUSINESS_EMAIL,
			subject: emailContent.subject,
			text: emailContent.text,
			html: emailContent.html,
		});
		if (result.error) {
			console.error("Confirmation email error:", result.error);
			return { ok: false, error: `Email failed: ${result.error.message}` };
		}
	} catch (err) {
		console.error("Confirmation email error:", err);
		return { ok: false, error: "Email failed — check RESEND_API_KEY." };
	}

	revalidatePath(`/admin/bookings/${bookingId}`);
	return { ok: true };
}
