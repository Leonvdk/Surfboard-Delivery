import type { BookingPerson } from "../db/schema";
import type { PackageTier } from "../pricing";

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
	/** Package tier for a per-person line, so the payment link can route it
	 * through the stable Stripe product a package-restricted discount targets.
	 * Absent on add-on / incomplete lines. The email itself ignores it. */
	packageTier?: PackageTier;
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
	/** Headline of the email, e.g. "You're almost booked, Anna! 🤙".
	 * Editable by Leon on the review-send screen. */
	greeting: string;
	/** Paragraph under the headline. Editable by Leon before sending. */
	intro: string;
	/** Extra free-text from Leon, rendered as a personal note. */
	note?: string;
}

/** Default copy for the review-send screen — adapts to link presence
 * ("hit pay" makes no sense in a pay-on-delivery email). */
export function defaultEmailCopy(
	firstName: string,
	hasPaymentLink: boolean,
): { greeting: string; intro: string } {
	return hasPaymentLink
		? {
				greeting: `You're almost booked, ${firstName}! 🤙`,
				intro:
					"Thanks for booking with us. Check the info below and hit the payment button — we'll get the boards to your accommodation. You just paddle out.",
			}
		: {
				greeting: `You're almost booked, ${firstName}! 🤙`,
				intro:
					"Thanks for booking with us. Check the info below — we'll get the boards to your accommodation and you pay on delivery. You just paddle out.",
			};
}

const PACKAGE_LABEL: Record<string, string> = {
	premium: "Premium (board + wetsuit + changing mat + roof rack)",
	full: "Full Package (board + wetsuit)",
	board: "Board Only",
	custom: "Custom package",
};

interface TripRange {
	checkin: string;
	checkout: string;
}

/** Rental days, counting both the delivery and the pickup day — the same
 * basis the price is calculated on, so dates and money always agree. */
function calcDays(checkin: string, checkout: string): number | null {
	const a = new Date(`${checkin}T00:00:00Z`);
	const b = new Date(`${checkout}T00:00:00Z`);
	if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
	const days = Math.round((b.getTime() - a.getTime()) / 86_400_000) + 1;
	return days > 0 ? days : null;
}

/** A person's real window: their own dates when they have them, otherwise
 * the booking's. */
function effectiveRange(p: BookingPerson, trip: TripRange): TripRange {
	return {
		checkin: p.checkin || trip.checkin,
		checkout: p.checkout || trip.checkout,
	};
}

/**
 * True when anyone in the party runs on their own window. Once that's the
 * case EVERY person gets explicit delivery/pickup dates in the email, not
 * just the ones who diverge — a booking where one line silently inherits
 * the top dates is exactly how a customer misreads when their board goes
 * back. Gear, dates and money are always stated in full together.
 */
function isStaggered(people: BookingPerson[], trip: TripRange): boolean {
	return people.some((p) => {
		if (!p.checkin || !p.checkout) return false;
		return p.checkin !== trip.checkin || p.checkout !== trip.checkout;
	});
}

function personRowsText(people: BookingPerson[], trip: TripRange): string {
	const staggered = isStaggered(people, trip);
	return people
		.map((p, i) => {
			const label = p.name || `Person ${i + 1}`;
			const lines = [`  ${label}:`, `    Package: ${PACKAGE_LABEL[p.package] ?? p.package}`];
			if (p.board) lines.push(`    Board: ${p.board}`);
			if (p.wetsuitSize) lines.push(`    Wetsuit size: ${p.wetsuitSize}`);
			if (staggered) {
				const eff = effectiveRange(p, trip);
				const days = calcDays(eff.checkin, eff.checkout);
				lines.push(`    Delivery: ${eff.checkin}`);
				lines.push(`    Pickup: ${eff.checkout}`);
				if (days) lines.push(`    Rental days: ${days}`);
			}
			return lines.join("\n");
		})
		.join("\n\n");
}

function personRowsHtml(people: BookingPerson[], trip: TripRange): string {
	const staggered = isStaggered(people, trip);
	const row = (rlabel: string, value: string) =>
		`<tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;">${rlabel}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${value}</td></tr>`;

	return people
		.map((p, i) => {
			const label = p.name || `Person ${i + 1}`;
			let html = `<tr><td colspan="2" style="padding:16px 0 8px;font-weight:800;font-size:15px;letter-spacing:-0.02em;border-bottom:1.5px solid #1A1A1A;">${escapeHtml(label)}</td></tr>`;
			html += row("Package", escapeHtml(PACKAGE_LABEL[p.package] ?? p.package));
			if (p.board) html += row("Board", escapeHtml(p.board));
			if (p.wetsuitSize) html += row("Wetsuit size", escapeHtml(p.wetsuitSize));
			if (staggered) {
				const eff = effectiveRange(p, trip);
				const days = calcDays(eff.checkin, eff.checkout);
				html += row("Delivery", eff.checkin);
				html += row("Pickup", eff.checkout);
				if (days) html += row("Rental days", String(days));
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
	const subject = `Your booking — Surf Rental Aljezur (${args.requestRef})`;
	const trip = { checkin: args.checkin, checkout: args.checkout };
	// With staggered dates the top-level range is the envelope — the first
	// board out and the last one back — not one shared window. Say so, or
	// it reads as everyone's rental period.
	const staggered = isStaggered(args.people, trip);
	const deliveryLabel = staggered ? "First delivery" : "Delivery";
	const pickupLabel = staggered ? "Last pickup" : "Pickup";

	const payText = args.paymentLinkUrl
		? `You can pay online here (secure Stripe checkout):\n${args.paymentLinkUrl}\n\nPrefer to pay on delivery? Send us an email or WhatsApp and we'll organise.`
		: `Payment: on delivery — cash or card when we drop off your gear. Easy.`;

	const text = `${args.greeting}

${args.intro}

  Reference: ${args.requestRef}
  ${deliveryLabel}: ${args.checkin}
  ${pickupLabel}: ${args.checkout}${staggered ? "\n  (each board has its own dates — see per person below)" : ""}
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
      <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">${escapeHtml(args.greeting)}</h2>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#1A1A1A;">${escapeHtml(args.intro)}</p>
      ${args.note ? `<p style="margin:0;font-size:15px;line-height:1.7;color:#1A1A1A;">${escapeHtml(args.note)}</p>` : ""}
    </div>

    <div style="background:#FFFFFF;border:1.5px solid #1A1A1A;box-shadow:4px 4px 0 #1A1A1A;padding:32px;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#C04419;margin-bottom:8px;">Confirmed booking</div>
      <h3 style="margin:0 0 20px;font-size:17px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">${args.requestRef}</h3>

      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;width:140px;">${deliveryLabel}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${args.checkin}</td></tr>
        <tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;">${pickupLabel}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${args.checkout}${staggered ? `<br/><span style="color:#888888;font-size:12px;">Each board has its own dates — see below</span>` : ""}</td></tr>
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
        <!-- Bulletproof button: bgcolor on the cell so the ember fill renders in
             every client (Outlook's Word engine ignores CSS background/padding on
             <a>, which collapsed this to plain text). box-shadow can't render in
             email, so the neo-brutal look is carried by the solid ink border. -->
        <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
          <tr>
            <td bgcolor="#C04419" style="background:#C04419;border:2px solid #1A1A1A;">
              <a href="${args.paymentLinkUrl}" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:15px;letter-spacing:-0.01em;text-decoration:none;">Pay online — €${args.totalEuros}</a>
            </td>
          </tr>
        </table>
        <p style="margin:12px 0 0;font-size:12px;color:#888888;">Secure checkout via Stripe. Prefer to pay on delivery? Send us an email or <a href="https://wa.me/351929244395" style="color:#888888;text-decoration:underline;">WhatsApp</a> and we'll organise.</p>
      </div>`
					: `
      <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:#1A1A1A;"><strong>Payment:</strong> on delivery — cash or card when we drop off your gear.</p>`
			}
    </div>

    <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1A1A1A;">Questions before your trip? Reply to this email or message us on <a href="https://wa.me/351929244395" style="color:#C04419;font-weight:600;text-decoration:none;">WhatsApp</a>.</p>

    <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#1A1A1A;">See you in the water!<br/><strong style="font-weight:800;">Leon</strong><br/><span style="color:#555555;">Surf Rental Aljezur</span></p>

    <hr style="margin:32px 0 16px;border:none;border-top:1.5px solid #1A1A1A;" />
    <p style="font-size:12px;color:#888888;line-height:1.5;">Surf Rental Aljezur · Aljezur, Arrifana & Vale da Telha<br/><a href="https://surfrental-aljezur.com" style="color:#C04419;text-decoration:none;">surfrental-aljezur.com</a></p>
  </div>
</div>`;

	return { subject, text, html };
}
