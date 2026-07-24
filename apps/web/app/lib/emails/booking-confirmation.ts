import type { BookingPerson } from "../db/schema";

/**
 * Confirmation email for admin-created bookings — the "Leon already
 * agreed with you" tone, unlike the /api/contact auto-reply which is a
 * request acknowledgement. Optionally carries a Stripe payment link;
 * without one it says pay on delivery, matching the site-wide promise.
 * Visual language mirrors the existing customer email (bordered card,
 * hard shadow, DM Sans, brand orange).
 */

export interface ConfirmationLine {
	label: string;
	amountEuros: number | null;
}

export interface BookingConfirmationArgs {
	customerName: string;
	requestRef: string;
	checkin: string;
	checkout: string;
	accommodation: string;
	people: BookingPerson[];
	lines: ConfirmationLine[];
	totalEuros: number;
	paymentLinkUrl: string | null;
	/** Extra free-text from Leon, rendered as a personal note. */
	note?: string;
}

const PACKAGE_LABEL: Record<string, string> = {
	premium: "Premium (board + wetsuit + changing mat + roof rack)",
	full: "Full Package (board + wetsuit)",
	board: "Board Only",
	custom: "Custom package",
};

function personRowsText(people: BookingPerson[], trip: { checkin: string; checkout: string }): string {
	return people
		.map((p, i) => {
			const label = p.name || `Person ${i + 1}`;
			const lines = [`  ${label}:`, `    Package: ${PACKAGE_LABEL[p.package] ?? p.package}`];
			if (p.board) lines.push(`    Board: ${p.board}`);
			if (p.wetsuitSize) lines.push(`    Wetsuit size: ${p.wetsuitSize}`);
			if (p.checkin && p.checkout && (p.checkin !== trip.checkin || p.checkout !== trip.checkout)) {
				lines.push(`    Delivery: ${p.checkin}`);
				lines.push(`    Pickup: ${p.checkout}`);
			}
			return lines.join("\n");
		})
		.join("\n\n");
}

function personRowsHtml(people: BookingPerson[], trip: { checkin: string; checkout: string }): string {
	const row = (rlabel: string, value: string) =>
		`<tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;">${rlabel}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${value}</td></tr>`;

	return people
		.map((p, i) => {
			const label = p.name || `Person ${i + 1}`;
			let html = `<tr><td colspan="2" style="padding:16px 0 8px;font-weight:800;font-size:15px;letter-spacing:-0.02em;border-bottom:1.5px solid #1A1A1A;">${escapeHtml(label)}</td></tr>`;
			html += row("Package", escapeHtml(PACKAGE_LABEL[p.package] ?? p.package));
			if (p.board) html += row("Board", escapeHtml(p.board));
			if (p.wetsuitSize) html += row("Wetsuit size", escapeHtml(p.wetsuitSize));
			if (p.checkin && p.checkout && (p.checkin !== trip.checkin || p.checkout !== trip.checkout)) {
				html += row("Delivery", p.checkin);
				html += row("Pickup", p.checkout);
			}
			return html;
		})
		.join("");
}

function escapeHtml(s: string): string {
	return s
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

export function buildBookingConfirmationEmail(args: BookingConfirmationArgs): {
	subject: string;
	text: string;
	html: string;
} {
	const subject = `Your booking is confirmed — Surf Rental Aljezur (${args.requestRef})`;
	const trip = { checkin: args.checkin, checkout: args.checkout };

	const payText = args.paymentLinkUrl
		? `You can pay online here (secure Stripe checkout):\n${args.paymentLinkUrl}\n\nPrefer to pay on delivery? That works too — cash or card when we drop off your gear.`
		: `Payment: on delivery — cash or card when we drop off your gear. Easy.`;

	const text = `Hi ${args.customerName},

Great news — your booking is confirmed! Here's everything we agreed on:

  Reference: ${args.requestRef}
  Delivery: ${args.checkin}
  Pickup: ${args.checkout}
  Accommodation: ${args.accommodation}
  Total: €${args.totalEuros}

${personRowsText(args.people, trip)}
${args.note ? `\n${args.note}\n` : ""}
${payText}

Questions? Just reply to this email or WhatsApp us at +351 929 244 395.

See you in the water!
— Leon, Surf Rental Aljezur`;

	const html = `
<div style="background:#FAFAF8;padding:32px 0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:0 16px;">
    <div style="margin-bottom:32px;">
      <span style="font-weight:800;font-size:18px;letter-spacing:-0.03em;color:#1A1A1A;">Surf Rental Aljezur</span>
    </div>

    <div style="margin-bottom:32px;">
      <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">You're booked, ${escapeHtml(args.customerName)}! 🤙</h2>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#1A1A1A;">Your gear is reserved. We'll deliver everything to your accommodation on your delivery day — you just paddle out.</p>
      ${args.note ? `<p style="margin:0;font-size:15px;line-height:1.7;color:#1A1A1A;">${escapeHtml(args.note)}</p>` : ""}
    </div>

    <div style="background:#FFFFFF;border:1.5px solid #1A1A1A;box-shadow:4px 4px 0 #1A1A1A;padding:32px;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#D4501E;margin-bottom:8px;">Confirmed booking</div>
      <h3 style="margin:0 0 20px;font-size:17px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">${args.requestRef}</h3>

      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;width:140px;">Delivery</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${args.checkin}</td></tr>
        <tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;">Pickup</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${args.checkout}</td></tr>
        <tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;">Accommodation</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${escapeHtml(args.accommodation)}</td></tr>
        ${personRowsHtml(args.people, trip)}
      </table>

      <div style="margin-top:24px;padding:20px;background:#F0F0EE;border-left:3px solid #1A1A1A;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#555555;margin-bottom:6px;">Total</div>
        <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;color:#1A1A1A;">€${args.totalEuros}</div>
      </div>

      ${
				args.paymentLinkUrl
					? `
      <div style="margin-top:24px;text-align:center;">
        <a href="${args.paymentLinkUrl}" style="display:inline-block;background:#D4501E;color:#FFFFFF;font-weight:800;font-size:15px;letter-spacing:-0.01em;padding:14px 32px;text-decoration:none;border:1.5px solid #1A1A1A;box-shadow:3px 3px 0 #1A1A1A;">Pay online — €${args.totalEuros}</a>
        <p style="margin:12px 0 0;font-size:12px;color:#888888;">Secure checkout via Stripe. Prefer to pay on delivery? That works too.</p>
      </div>`
					: `
      <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#1A1A1A;"><strong>Payment:</strong> on delivery — cash or card when we drop off your gear.</p>`
			}
    </div>

    <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1A1A1A;">Questions before your trip? Reply to this email or message us on <a href="https://wa.me/351929244395" style="color:#D4501E;font-weight:600;text-decoration:none;">WhatsApp</a>.</p>

    <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#1A1A1A;">See you in the water!<br/><strong style="font-weight:800;">Leon</strong><br/><span style="color:#555555;">Surf Rental Aljezur</span></p>

    <hr style="margin:32px 0 16px;border:none;border-top:1.5px solid #1A1A1A;" />
    <p style="font-size:12px;color:#888888;line-height:1.5;">Surf Rental Aljezur · Aljezur, Arrifana & Vale da Telha<br/><a href="https://surfrental-aljezur.com" style="color:#D4501E;text-decoration:none;">surfrental-aljezur.com</a></p>
  </div>
</div>`;

	return { subject, text, html };
}
