"use client";

import { useRouter } from "next/navigation";

/**
 * A table row that navigates to its booking on click/tap — mobile-first,
 * no edit button needed. Implemented in JS rather than a stretched-link
 * because an absolutely-positioned link inside a <tr> doesn't reliably
 * anchor to its own row across browsers (rows aren't positioning
 * containers), which made every row point at the same booking.
 *
 * Clicks that originate on a real control (the status <select>, a link, a
 * button) are ignored so those keep working.
 */
export function ClickableBookingRow({
	id,
	children,
}: {
	id: number;
	children: React.ReactNode;
}) {
	const router = useRouter();
	const href = `/admin/bookings/${id}`;

	function isInteractive(target: EventTarget | null): boolean {
		return Boolean(
			target instanceof Element &&
				target.closest(
					"button, a, select, input, textarea, label, [role='button'], .admin-cell-interactive",
				),
		);
	}

	return (
		<tr
			className="admin-row-clickable"
			onClick={(e) => {
				if (isInteractive(e.target)) return;
				router.push(href);
			}}
			onKeyDown={(e) => {
				if ((e.key === "Enter" || e.key === " ") && !isInteractive(e.target)) {
					e.preventDefault();
					router.push(href);
				}
			}}
			tabIndex={0}
			role="link"
			aria-label={`Open booking ${id}`}
		>
			{children}
		</tr>
	);
}
