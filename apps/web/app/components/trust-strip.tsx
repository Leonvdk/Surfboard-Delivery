/**
 * Five promises — the homepage trust signals, set as a hairline-divided
 * ledger: ember number, bold claim, quiet clause. The old five-card grid
 * carried four pieces of furniture per card (number + rule + icon, kicker,
 * headline, description) and stacked ~750px tall on mobile; the ledger
 * reads in one glance at a third of the height. Every promise is a place
 * where the deep-research pass found no local competitor offering the
 * same thing publicly.
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

				<ul className="trust-ledger">
					<Row
						index="01"
						before="No "
						accent="minimums"
						after="."
						desc="Order one board. Free delivery, always."
					/>
					<Row
						index="02"
						before="Right "
						accent="board"
						after=", guaranteed."
						desc="Wrong fit? Swap on day two — free."
					/>
					<Row
						index="03"
						before="We "
						accent="answer"
						after=". Fast."
						desc="Within 24h in EN · FR · DE · NL · PT."
					/>
					<Row
						index="04"
						before="Pay "
						accent="your"
						after=" way."
						desc="Card, Apple Pay, iDEAL, Wero, MB WAY — or cash on arrival."
					/>
					<Row
						index="05"
						before="Change "
						accent="your"
						after=" mind."
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

interface RowProps {
	index: string;
	before: string;
	accent: string;
	after: string;
	desc: string;
}

function Row({ index, before, accent, after, desc }: RowProps) {
	return (
		<li className="trust-ledger-row">
			<span className="trust-ledger-num" aria-hidden="true">
				{index}
			</span>
			<h3 className="trust-ledger-claim">
				{before}
				<em>{accent}</em>
				{after}
			</h3>
			<p className="trust-ledger-desc">{desc}</p>
		</li>
	);
}
