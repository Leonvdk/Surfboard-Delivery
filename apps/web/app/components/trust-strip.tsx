/**
 * Row of trust signals that appear right below the hero. Each item is a
 * concrete answer to a booking-friction question — "is there a minimum
 * order?", "how do I pay?", "how quickly do you reply?", "can I cancel?"
 * — and each is a place where the deep-research pass found no local
 * competitor offering the same thing publicly, so worth surfacing.
 */
export function TrustStrip() {
	const items: Array<{ icon: React.ReactNode; label: string }> = [
		{
			icon: <SparkIcon />,
			label: "No minimum order · Free delivery",
		},
		{
			icon: <SwapIcon />,
			label: "Wrong board? Swap on day 2, free",
		},
		{
			icon: <ChatIcon />,
			label: "Reply within 24h · EN · FR · DE · NL · PT",
		},
		{
			icon: <CardIcon />,
			label: "Card, Apple Pay, iDEAL, Wero, MB WAY — or cash on arrival",
		},
		{
			icon: <ClockIcon />,
			label: "Cancel free within 72h of booking",
		},
	];

	return (
		<section className="trust-strip" aria-label="What you can count on">
			<div className="container">
				<ul className="trust-strip-list">
					{items.map((item) => (
						<li key={item.label} className="trust-strip-item">
							<span className="trust-strip-icon" aria-hidden="true">
								{item.icon}
							</span>
							<span className="trust-strip-label">{item.label}</span>
						</li>
					))}
				</ul>
			</div>
		</section>
	);
}

const iconProps = {
	width: 18,
	height: 18,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.8,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
	"aria-hidden": true,
};

function SparkIcon() {
	return (
		<svg {...iconProps}>
			<path d="M12 3v4" />
			<path d="M12 17v4" />
			<path d="M3 12h4" />
			<path d="M17 12h4" />
			<path d="M5.6 5.6l2.8 2.8" />
			<path d="M15.6 15.6l2.8 2.8" />
			<path d="M5.6 18.4l2.8-2.8" />
			<path d="M15.6 8.4l2.8-2.8" />
		</svg>
	);
}

function ChatIcon() {
	return (
		<svg {...iconProps}>
			<path d="M4 5h16v11H8l-4 4Z" />
		</svg>
	);
}

function SwapIcon() {
	return (
		<svg {...iconProps}>
			<path d="M4 9h13l-3-3" />
			<path d="M20 15H7l3 3" />
		</svg>
	);
}

function CardIcon() {
	return (
		<svg {...iconProps}>
			<rect x="3" y="6" width="18" height="13" />
			<path d="M3 10h18" />
			<path d="M7 15h3" />
		</svg>
	);
}

function ClockIcon() {
	return (
		<svg {...iconProps}>
			<circle cx="12" cy="12" r="9" />
			<path d="M12 7v5l3 2" />
		</svg>
	);
}
