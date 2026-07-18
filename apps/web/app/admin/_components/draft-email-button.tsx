import type { Booking } from "../../lib/db/schema";
import { formatLongDate } from "../_lib/dates";
import { summariseGear } from "../_lib/booking-labels";

function buildConfirmationBody(b: Booking): string {
	const gear = summariseGear(b.people ?? null);
	const nights = Math.max(
		1,
		Math.round(
			(new Date(`${b.checkout}T00:00:00Z`).getTime() -
				new Date(`${b.checkin}T00:00:00Z`).getTime()) /
				86400000,
		),
	);

	const gearLines: string[] = [];
	if (gear) {
		if (gear.packages.length) {
			gearLines.push(
				"Packages: " + gear.packages.map((r) => `${r.count}× ${r.label}`).join(", "),
			);
		}
		if (gear.boards.length) {
			gearLines.push(
				"Boards: " + gear.boards.map((r) => `${r.count}× ${r.label}`).join(", "),
			);
		}
		if (gear.wetsuits.length) {
			gearLines.push(
				"Wetsuits: " + gear.wetsuits.map((r) => `${r.count}× ${r.label}`).join(", "),
			);
		}
	}

	const total =
		b.finalTotal ?? b.estimatedTotal ?? null;
	const totalLine = total
		? b.finalTotal
			? `Total: €${total}`
			: `Estimated total: ~€${total} (subject to final confirmation)`
		: "";

	const lines = [
		`Hi ${b.name.split(" ")[0] || b.name},`,
		"",
		`Thanks for your booking request. Confirming your trip:`,
		"",
		`• Delivery: ${formatLongDate(b.checkin)}`,
		`• Pickup:   ${formatLongDate(b.checkout)}`,
		`• ${nights} night${nights === 1 ? "" : "s"} · ${b.peopleCount} ${b.peopleCount === 1 ? "person" : "people"}`,
		b.accommodation ? `• Accommodation: ${b.accommodation}` : null,
		...gearLines.map((l) => `• ${l}`),
		totalLine ? `• ${totalLine}` : null,
		"",
		"Delivery: what time works best on your check-in day? Reply with a rough window and I'll confirm.",
		"",
		"Pay on arrival — MBWay, bank transfer, or cash.",
		"",
		"See you in the water,",
		"Leon",
		"Surf Rental Aljezur",
	].filter(Boolean) as string[];

	return lines.join("\n");
}

interface Props {
	booking: Booking;
}

export function DraftEmailButton({ booking }: Props) {
	const subject = `Your Surf Rental Aljezur booking (${booking.checkin} → ${booking.checkout})`;
	const body = buildConfirmationBody(booking);
	const href = `mailto:${encodeURIComponent(booking.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
	return (
		<a href={href} className="admin-btn">
			Draft confirmation email ↗
		</a>
	);
}
