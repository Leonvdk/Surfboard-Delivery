import { Resend } from "resend";
import { NextResponse } from "next/server";
import { getDb, schema } from "../../lib/db/client";
import { calcPackagePrice, DAILY_MINIMUM_DAYS, type PackageTier } from "../../lib/pricing";

let _resend: Resend | null = null;

function getResend() {
	if (!_resend) {
		_resend = new Resend(process.env.RESEND_API_KEY);
	}
	return _resend;
}

const BUSINESS_EMAIL = "hello@surfrental-aljezur.com";
const FROM_EMAIL = "Surf Rental Aljezur <hello@surfrental-aljezur.com>";


interface PersonData {
	name: string;
	sex: string;
	experience: string;
	package: string;
	board: string;
	wetsuitSize: string;
	// Optional per-person date range. When null/absent the person runs
	// on the trip-level dates. When set, both must be present and >= the
	// 3-day minimum (validated server-side below).
	checkin?: string | null;
	checkout?: string | null;
}

interface BookingRequest {
	name: string;
	email: string;
	checkin: string;
	checkout: string;
	accommodation: string;
	peopleCount: number;
	people: PersonData[];
	message: string;
	estimatedTotal: number | null;
}

// Same rule as the client's calcDays: both delivery and pickup day are
// billable. Kept as a plain function here (rather than importing from
// the component) so the API has no client-only imports.
function calcDays(checkin: string, checkout: string): number | null {
	if (!checkin || !checkout) return null;
	const d1 = new Date(`${checkin}T00:00:00Z`);
	const d2 = new Date(`${checkout}T00:00:00Z`);
	const nights = Math.round((d2.getTime() - d1.getTime()) / 86400000);
	return nights >= 0 ? nights + 1 : null;
}

function personEffective(
	p: PersonData,
	trip: { checkin: string; checkout: string },
): { checkin: string; checkout: string; days: number | null; hasOverride: boolean } {
	const hasOverride = Boolean(p.checkin && p.checkout);
	const checkin = hasOverride ? p.checkin! : trip.checkin;
	const checkout = hasOverride ? p.checkout! : trip.checkout;
	return { checkin, checkout, days: calcDays(checkin, checkout), hasOverride };
}

const PACKAGE_TIER_MAP: Record<string, PackageTier | null> = {
	premium: "premium",
	full: "fullPackage",
	board: "boardOnly",
	custom: null,
};

// Recompute the total from pricing.ts using each person's own days.
// Returns null when any person picked "custom" or has no package yet —
// same "needs a quote" contract the emails and admin already show.
function recomputeTotal(data: BookingRequest): number | null {
	const trip = { checkin: data.checkin, checkout: data.checkout };
	let total = 0;
	for (const p of data.people) {
		const tier = PACKAGE_TIER_MAP[p.package];
		if (!tier) return null;
		const eff = personEffective(p, trip);
		if (!eff.days) return null;
		total += calcPackagePrice(tier, eff.days);
	}
	return total;
}

// Envelope: earliest arrival + latest departure across the party.
// Written to the top-level checkin/checkout columns so the admin
// calendar / dashboard buckets / delivery-reminder cron keep working
// against a single indexed pair.
function computeEnvelope(data: BookingRequest): { checkin: string; checkout: string } {
	let minIn = data.checkin;
	let maxOut = data.checkout;
	for (const p of data.people) {
		if (p.checkin && p.checkin < minIn) minIn = p.checkin;
		if (p.checkout && p.checkout > maxOut) maxOut = p.checkout;
	}
	return { checkin: minIn, checkout: maxOut };
}

function formatPerson(p: PersonData, i: number, trip: { checkin: string; checkout: string }): string {
	const label = p.name || `Person ${i + 1}`;
	const eff = personEffective(p, trip);
	const lines = [
		`  ${label}:`,
		`    Sex: ${p.sex}`,
		`    Experience: ${p.experience}`,
		`    Package: ${p.package}`,
		`    Board: ${p.board}`,
	];
	if (p.wetsuitSize) lines.push(`    Wetsuit size: ${p.wetsuitSize}`);
	if (eff.hasOverride) {
		lines.push(`    Delivery: ${eff.checkin}`);
		lines.push(`    Pickup: ${eff.checkout}`);
	}
	return lines.join("\n");
}

function formatPersonHtml(p: PersonData, i: number, trip: { checkin: string; checkout: string }): string {
	const label = p.name || `Person ${i + 1}`;
	const eff = personEffective(p, trip);
	const row = (rlabel: string, value: string) =>
		`<tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;">${rlabel}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${value}</td></tr>`;

	const heading = eff.hasOverride
		? `${label} <span style="font-weight:500;color:#D4501E;font-size:13px;">· custom dates</span>`
		: label;
	let html = `<tr><td colspan="2" style="padding:16px 0 8px;font-weight:800;font-size:15px;letter-spacing:-0.02em;border-bottom:1.5px solid #1A1A1A;">${heading}</td></tr>`;
	html += row("Sex", p.sex);
	html += row("Experience", p.experience);
	html += row("Package", p.package);
	html += row("Board", p.board);
	if (p.wetsuitSize) html += row("Wetsuit size", p.wetsuitSize);
	if (eff.hasOverride) {
		html += row("Delivery", eff.checkin);
		html += row("Pickup", eff.checkout);
	}
	return html;
}

function buildBusinessEmail(
	data: BookingRequest,
	total: number | null,
	envelope: { checkin: string; checkout: string },
): { subject: string; text: string; html: string } {
	const hasStagger = data.people.some((p) => p.checkin && p.checkout);
	const dateHeadline = hasStagger
		? `${envelope.checkin} → ${envelope.checkout} (staggered)`
		: `${data.checkin} → ${data.checkout}`;
	const subject = `New booking request from ${data.name} (${dateHeadline})`;

	const totalLine = total != null ? `Estimated total: €${total}` : "Estimated total: Not available (custom package selected)";

	const text = `New booking request

Name: ${data.name}
Email: ${data.email}
Delivery (party): ${data.checkin}
Pickup (party): ${data.checkout}${hasStagger ? `\nWindow envelope: ${envelope.checkin} → ${envelope.checkout} (some people have custom dates — see below)` : ""}
Accommodation: ${data.accommodation}
People: ${data.peopleCount}
${totalLine}

${data.people.map((p, i) => formatPerson(p, i, { checkin: data.checkin, checkout: data.checkout })).join("\n\n")}

${data.message ? `Message:\n${data.message}` : "(No additional message)"}

Reply directly to this email to reach the customer.`;

	const row = (label: string, value: string) =>
		`<tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;width:140px;">${label}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${value}</td></tr>`;

	const html = `
<div style="background:#FAFAF8;padding:32px 0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:0 16px;">
    <!-- Header -->
    <div style="margin-bottom:24px;">
      <span style="font-weight:800;font-size:18px;letter-spacing:-0.03em;color:#1A1A1A;">Surf Rental Aljezur</span>
    </div>

    <!-- Card -->
    <div style="background:#FFFFFF;border:1.5px solid #1A1A1A;box-shadow:4px 4px 0 #1A1A1A;padding:32px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#D4501E;margin-bottom:8px;">New booking request${hasStagger ? " · STAGGERED DATES" : ""}</div>
      <h2 style="margin:0 0 24px;font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">${data.name} — ${dateHeadline}</h2>

      <table style="width:100%;border-collapse:collapse;">
        ${row("Name", data.name)}
        ${row("Email", `<a href="mailto:${data.email}" style="color:#D4501E;text-decoration:none;">${data.email}</a>`)}
        ${row(hasStagger ? "Party delivery" : "Delivery", data.checkin)}
        ${row(hasStagger ? "Party pickup" : "Pickup", data.checkout)}
        ${hasStagger ? row("Window envelope", `${envelope.checkin} → ${envelope.checkout}`) : ""}
        ${row("Accommodation", data.accommodation)}
        ${row("People", String(data.peopleCount))}
        ${data.people.map((p, i) => formatPersonHtml(p, i, { checkin: data.checkin, checkout: data.checkout })).join("")}
      </table>

      <div style="margin-top:20px;padding:16px 20px;background:${total != null ? "#F0F0EE" : "#FFF8F5"};border-left:3px solid ${total != null ? "#1A1A1A" : "#D4501E"};">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#555555;margin-bottom:6px;">Estimated total${hasStagger ? " (per-person days)" : ""}</div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">${total != null ? `€${total}` : "Custom — needs quote"}</div>
      </div>

      ${data.message ? `
      <div style="margin-top:24px;padding:16px 20px;background:#F0F0EE;border-left:3px solid #D4501E;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#555555;margin-bottom:6px;">Message</div>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#1A1A1A;">${data.message.replace(/\n/g, "<br/>")}</p>
      </div>` : ""}
    </div>

    <p style="margin-top:16px;font-size:12px;color:#888888;">Reply directly to this email to reach ${data.name}.</p>
  </div>
</div>`;

	return { subject, text, html };
}

function buildCustomerEmail(
	data: BookingRequest,
	total: number | null,
): { subject: string; text: string; html: string } {
	const subject = "We received your booking request — Surf Rental Aljezur";

	const customerTotalLine = total != null
		? `Estimated total: €${total} (final pricing confirmed in our reply)`
		: "We'll include pricing in our personalized reply.";

	const text = `Hi ${data.name},

Thanks for your booking request! We've received your details and will get back to you with availability and a gear recommendation.

Your request summary:
  Delivery: ${data.checkin}
  Pickup: ${data.checkout}
  Accommodation: ${data.accommodation}
  People: ${data.peopleCount}
  ${customerTotalLine}

${data.people.map((p, i) => formatPerson(p, i, { checkin: data.checkin, checkout: data.checkout })).join("\n\n")}

If you have any questions in the meantime, reply to this email or reach us on WhatsApp at +351 929 244 395.

See you in the water!
— The Surf Rental team`;

	const summaryRow = (label: string, value: string) =>
		`<tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;width:140px;">${label}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${value}</td></tr>`;

	const html = `
<div style="background:#FAFAF8;padding:32px 0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:0 16px;">
    <!-- Header -->
    <div style="margin-bottom:32px;">
      <span style="font-weight:800;font-size:18px;letter-spacing:-0.03em;color:#1A1A1A;">Surf Rental Aljezur</span>
    </div>

    <!-- Personal message -->
    <div style="margin-bottom:32px;">
      <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">Hey ${data.name}!</h2>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#1A1A1A;">Thanks so much for reaching out — we're stoked you're planning a surf trip to Aljezur! We've received your request and are already looking into the best gear setup for you.</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#1A1A1A;">We'll personally review your booking and get back to you with availability, a tailored gear recommendation, and everything you need to know before your trip.</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1A1A1A;">In the meantime, the waves are looking good — you're going to have a great time.</p>
    </div>

    <!-- Summary card -->
    <div style="background:#FFFFFF;border:1.5px solid #1A1A1A;box-shadow:4px 4px 0 #1A1A1A;padding:32px;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#D4501E;margin-bottom:8px;">Your request</div>
      <h3 style="margin:0 0 20px;font-size:17px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">Booking summary</h3>

      <table style="width:100%;border-collapse:collapse;">
        ${summaryRow("Delivery", data.checkin)}
        ${summaryRow("Pickup", data.checkout)}
        ${summaryRow("Accommodation", data.accommodation)}
        ${summaryRow("People", String(data.peopleCount))}
        ${data.people.map((p, i) => formatPersonHtml(p, i, { checkin: data.checkin, checkout: data.checkout })).join("")}
      </table>

      ${total != null ? `
      <div style="margin-top:24px;padding:20px;background:#F0F0EE;border-left:3px solid #1A1A1A;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#555555;margin-bottom:6px;">Estimated total</div>
        <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;color:#1A1A1A;margin-bottom:4px;">€${total}</div>
        <div style="font-size:12px;color:#888888;">Final pricing confirmed in our personalized reply</div>
      </div>` : ""}

      ${data.message ? `
      <div style="margin-top:20px;padding:16px 20px;background:#F0F0EE;border-left:3px solid #D4501E;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#555555;margin-bottom:6px;">Your message</div>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#1A1A1A;">${data.message.replace(/\n/g, "<br/>")}</p>
      </div>` : ""}
    </div>

    <!-- What happens next -->
    <div style="background:#FFFFFF;border:1.5px solid #1A1A1A;padding:24px 32px;margin-bottom:32px;">
      <h3 style="margin:0 0 12px;font-size:15px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">What happens next?</h3>
      <table style="border-collapse:collapse;font-size:14px;line-height:1.7;color:#555555;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;color:#D4501E;vertical-align:top;">01</td><td style="padding:4px 0;">We review your request and check gear availability</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;color:#D4501E;vertical-align:top;">02</td><td style="padding:4px 0;">You receive a personalized confirmation with final pricing</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;color:#D4501E;vertical-align:top;">03</td><td style="padding:4px 0;">We deliver everything to your door — you just paddle out</td></tr>
      </table>
    </div>

    <!-- Contact -->
    <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1A1A1A;">Questions before we get back to you? Just reply to this email or send us a message on <a href="https://wa.me/351929244395" style="color:#D4501E;font-weight:600;text-decoration:none;">WhatsApp</a>.</p>

    <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#1A1A1A;">See you in the water!<br/><strong style="font-weight:800;">Leon</strong><br/><span style="color:#555555;">Surf Rental Aljezur</span></p>

    <!-- Footer -->
    <hr style="margin:32px 0 16px;border:none;border-top:1.5px solid #1A1A1A;" />
    <p style="font-size:12px;color:#888888;line-height:1.5;">Surf Rental Aljezur · Aljezur, Arrifana & Vale da Telha<br/><a href="https://surfrental-aljezur.com" style="color:#D4501E;text-decoration:none;">surfrental-aljezur.com</a></p>
  </div>
</div>`;

	return { subject, text, html };
}

export async function POST(request: Request) {
	try {
		const data: BookingRequest = await request.json();

		if (!data.name || !data.email || !data.checkin || !data.checkout) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Enforce the same 3-day minimum on any per-person override that the
		// client-side form does. Bad payloads (short overrides, half-filled
		// ranges) get rejected before we send an email that quotes a wrong price.
		for (let i = 0; i < data.people.length; i++) {
			const p = data.people[i]!;
			const oneSided = Boolean(p.checkin) !== Boolean(p.checkout);
			if (oneSided) {
				return NextResponse.json(
					{ error: `Person ${i + 1}: both checkin and checkout are required for a custom range.` },
					{ status: 400 },
				);
			}
			if (p.checkin && p.checkout) {
				const d = calcDays(p.checkin, p.checkout);
				if (d == null || d < DAILY_MINIMUM_DAYS) {
					return NextResponse.json(
						{ error: `Person ${i + 1}: minimum rental period is ${DAILY_MINIMUM_DAYS} days.` },
						{ status: 400 },
					);
				}
			}
		}

		// Server-authoritative total + envelope. The client-supplied
		// estimatedTotal is discarded — with per-person dates the client
		// could be out of sync with the pricing bracket table.
		const authoritativeTotal = recomputeTotal(data);
		const envelope = computeEnvelope(data);

		const businessEmail = buildBusinessEmail(data, authoritativeTotal, envelope);
		const customerEmail = buildCustomerEmail(data, authoritativeTotal);

		const client = getResend();

		const firstName = data.name.split(" ")[0] || data.name;

		const [businessResult, customerResult] = await Promise.all([
			client.emails.send({
				from: FROM_EMAIL,
				to: BUSINESS_EMAIL,
				replyTo: data.email,
				subject: businessEmail.subject,
				text: businessEmail.text,
				html: businessEmail.html,
			}),
			client.emails.send({
				from: FROM_EMAIL,
				to: data.email,
				replyTo: BUSINESS_EMAIL,
				subject: customerEmail.subject,
				text: customerEmail.text,
				html: customerEmail.html,
			}),
			client.contacts.create({
				email: data.email,
				firstName,
				unsubscribed: false,
				segments: [{ id: "f2615757-9791-466f-9ca2-061d884304ce" }],
			}).catch((err) => console.error("Contact create error:", err)),
		]);

		if (businessResult.error || customerResult.error) {
			const resendErr = businessResult.error || customerResult.error;
			console.error("Resend error:", JSON.stringify(resendErr));
			return NextResponse.json(
				{ error: "Failed to send email", details: resendErr },
				{ status: 500 },
			);
		}

		// Persist to DB best-effort. If DATABASE_URL isn't set yet, skip silently
		// — email delivery is the primary success path and should never be blocked
		// by a database that's still being provisioned.
		const db = getDb();
		let bookingId: number | null = null;
		if (db) {
			try {
				const [row] = await db
					.insert(schema.bookings)
					.values({
						name: data.name,
						email: data.email,
						// Store the envelope on the top-level columns so calendar,
						// dashboard buckets, and the delivery-reminder cron keep
						// working. Per-person dates live inside `people` below.
						checkin: envelope.checkin,
						checkout: envelope.checkout,
						accommodation: data.accommodation ?? null,
						peopleCount: data.peopleCount,
						people: data.people.map((p) => ({
							name: p.name,
							sex: p.sex,
							experience: p.experience,
							package: p.package,
							board: p.board,
							wetsuitSize: p.wetsuitSize,
							...(p.checkin ? { checkin: p.checkin } : {}),
							...(p.checkout ? { checkout: p.checkout } : {}),
						})),
						message: data.message ?? null,
						estimatedTotal: authoritativeTotal,
						status: "requested",
					})
					.returning({ id: schema.bookings.id });
				bookingId = row?.id ?? null;
			} catch (dbErr) {
				console.error("Booking DB insert error:", dbErr);
				// Do not fail the request — the customer already got their email.
			}
		}

		// Fire a push to Leon's installed admin PWA. Best-effort — don't block
		// the customer's success response on it.
		if (bookingId != null) {
			try {
				const { sendPushToAll } = await import("../../lib/push");
				const nights = Math.max(
					1,
					Math.round(
						(new Date(`${envelope.checkout}T00:00:00Z`).getTime() -
							new Date(`${envelope.checkin}T00:00:00Z`).getTime()) /
							86400000,
					),
				);
				const staggered = data.people.some((p) => p.checkin && p.checkout);
				await sendPushToAll({
					title: "New booking request",
					body: `${data.name} · ${data.peopleCount}p · ${nights}n from ${envelope.checkin}${staggered ? " (staggered)" : ""}`,
					url: `/admin/bookings/${bookingId}`,
					tag: `booking-${bookingId}`,
				});
			} catch (pushErr) {
				console.error("Push send error:", pushErr);
			}
		}

		// Friendly reference shown on the success screen so the customer can
		// quote it back on WhatsApp / email if we go silent. Falls back to
		// a timestamp-based code when there's no DB row (e.g. dev without
		// DATABASE_URL) so the screen never renders an empty ref.
		const requestRef =
			bookingId != null
				? `SR-${String(bookingId).padStart(5, "0")}`
				: `SR-${Date.now().toString(36).toUpperCase().slice(-6)}`;

		return NextResponse.json({ success: true, requestRef });
	} catch (err) {
		console.error("Contact API error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
