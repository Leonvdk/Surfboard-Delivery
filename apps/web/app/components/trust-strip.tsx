/**
 * Five promises — the trust-signal section on the homepage. Editorial
 * stat-card grid on desktop, compact 2-col grid on mobile (descriptions
 * hidden so the section takes about 300px instead of 750px). Every
 * promise is a place where the deep-research pass found no local
 * competitor offering the same thing publicly.
 */
export function TrustStrip() {
	return (
		<section className="trust-strip" aria-labelledby="trust-strip-title">
			<div className="container">
				<header className="trust-strip-header">
					<p className="trust-strip-kicker">Five promises</p>
					<h2 id="trust-strip-title" className="trust-strip-title">
						Rented right. <em>Every board.</em> Every time.
					</h2>
				</header>

				<ul className="trust-strip-grid">
					<Card
						index="01"
						kicker="Delivery"
						icon={<TruckIcon />}
						headlineBefore="No "
						headlineAccent="minimums"
						headlineAfter="."
						desc="Order one board. Free delivery, always."
					/>
					<Card
						index="02"
						kicker="Level-match"
						icon={<ShieldIcon />}
						headlineBefore="Right "
						headlineAccent="board"
						headlineAfter=", guaranteed."
						desc="Wrong fit? Swap on day two — free."
					/>
					<Card
						index="03"
						kicker="Reply time"
						icon={<ChatIcon />}
						headlineBefore="We "
						headlineAccent="answer"
						headlineAfter=". Fast."
						desc="Within 24h in EN · FR · DE · NL · PT."
					/>
					<Card
						index="04"
						kicker="Payment"
						icon={<CardIcon />}
						headlineBefore="Pay "
						headlineAccent="your"
						headlineAfter=" way."
						desc="Card, Apple Pay, iDEAL, Wero, MB WAY — or cash on arrival."
					/>
					<Card
						index="05"
						kicker="Cancellation"
						icon={<ClockIcon />}
						headlineBefore="Change "
						headlineAccent="your"
						headlineAfter=" mind."
						desc="Cancel free within 72 hours of booking."
					/>
				</ul>

				<p className="trust-strip-signoff">
					<span>
						Written down. <em>Standing behind it.</em>
					</span>
					<span className="trust-strip-locale">
						Aljezur · Arrifana · Vale da Telha
					</span>
				</p>
			</div>
		</section>
	);
}

interface CardProps {
	index: string;
	kicker: string;
	icon: React.ReactNode;
	headlineBefore: string;
	headlineAccent: string;
	headlineAfter: string;
	desc: string;
}

function Card({
	index,
	kicker,
	icon,
	headlineBefore,
	headlineAccent,
	headlineAfter,
	desc,
}: CardProps) {
	return (
		<li className="trust-strip-card">
			<div className="trust-strip-mark">
				<span className="trust-strip-num">{index}</span>
				<span className="trust-strip-rule" aria-hidden="true" />
				<span className="trust-strip-icon" aria-hidden="true">
					{icon}
				</span>
			</div>
			<p className="trust-strip-card-kicker">{kicker}</p>
			<h3 className="trust-strip-card-headline">
				{headlineBefore}
				<em>{headlineAccent}</em>
				{headlineAfter}
			</h3>
			<p className="trust-strip-card-desc">{desc}</p>
		</li>
	);
}

const iconProps = {
	width: 22,
	height: 22,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.8,
	strokeLinecap: "square" as const,
	strokeLinejoin: "miter" as const,
	"aria-hidden": true,
};

function TruckIcon() {
	return (
		<svg {...iconProps}>
			<path d="M3 7h11v9H3z" />
			<path d="M14 10h4l3 3v3h-7" />
			<circle cx="7" cy="18" r="1.6" />
			<circle cx="17.5" cy="18" r="1.6" />
		</svg>
	);
}

function ShieldIcon() {
	return (
		<svg {...iconProps}>
			<path d="M12 3l8 3v6c0 4-3.5 7.5-8 9-4.5-1.5-8-5-8-9V6z" />
			<path d="M9 12l2 2 4-4" />
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
