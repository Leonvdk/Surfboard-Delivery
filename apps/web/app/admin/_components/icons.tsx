/**
 * Admin icon set. Emojis are never used in Surf Rental branding — they
 * render differently per platform and read as clip-art next to the brand
 * type. These are line icons in the same language as the tab bar:
 * 24×24 grid, currentColor stroke, 1.8 weight, round caps.
 *
 * Size defaults to 1em so an icon sits on the text baseline of whatever
 * it labels; pass `size` to override.
 */

interface IconProps {
	size?: number | string;
	className?: string;
}

function base(size: number | string) {
	return {
		width: size,
		height: size,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.8,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
		"aria-hidden": true,
		focusable: false,
		// Nudge onto the cap height so inline icons align with their label.
		style: { verticalAlign: "-0.14em", flexShrink: 0 },
	};
}

/** Warnings, blocked actions, anything needing Leon's attention. */
export function WarningIcon({ size = "1.05em", className }: IconProps) {
	return (
		<svg {...base(size)} className={className}>
			<path d="M12 3.8 2.6 20h18.8L12 3.8z" />
			<path d="M12 10v4.2" />
			<path d="M12 17.4h.01" />
		</svg>
	);
}

/** Done — sent, saved, stage complete. */
export function CheckIcon({ size = "1.05em", className }: IconProps) {
	return (
		<svg {...base(size)} className={className}>
			<path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
		</svg>
	);
}

/** Edit / amend. */
export function PencilIcon({ size = "1.05em", className }: IconProps) {
	return (
		<svg {...base(size)} className={className}>
			<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z" />
			<path d="M14.5 6.5 17.5 9.5" />
		</svg>
	);
}

/** Money in — payments, revenue. */
export function EuroIcon({ size = "1.05em", className }: IconProps) {
	return (
		<svg {...base(size)} className={className}>
			<path d="M17.5 6.3a6.6 6.6 0 0 0-9.4 2.4 8 8 0 0 0 0 6.6 6.6 6.6 0 0 0 9.4 2.4" />
			<path d="M4.5 10.4h8" />
			<path d="M4.5 13.6h8" />
		</svg>
	);
}

/** Returning customer. */
export function RepeatIcon({ size = "1.05em", className }: IconProps) {
	return (
		<svg {...base(size)} className={className}>
			<path d="M3.5 9.5h13a4 4 0 0 1 4 4" />
			<path d="M6.5 6.5 3.5 9.5l3 3" />
			<path d="M20.5 14.5h-13a4 4 0 0 1-4-4" />
			<path d="M17.5 17.5l3-3-3-3" />
		</svg>
	);
}

/** Staggered / split date ranges. */
export function SplitDatesIcon({ size = "1.05em", className }: IconProps) {
	return (
		<svg {...base(size)} className={className}>
			<path d="M3.5 7.5h9" />
			<path d="M3.5 16.5h14" />
			<circle cx="15.5" cy="7.5" r="2.2" />
			<circle cx="20.5" cy="16.5" r="2.2" />
		</svg>
	);
}

/** Leaves the app — opens the mail client, Stripe, etc. */
export function ExternalIcon({ size = "1.05em", className }: IconProps) {
	return (
		<svg {...base(size)} className={className}>
			<path d="M14 4.5h5.5V10" />
			<path d="M19.5 4.5 11 13" />
			<path d="M18 14v5.5H4.5V6H10" />
		</svg>
	);
}
