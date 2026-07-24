"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
	calcPackagePrice,
	DAILY_MINIMUM_DAYS,
	type PackageTier,
} from "../../lib/pricing";
import {
	createAdminBooking,
	type NewBookingPerson,
	sendBookingConfirmation,
} from "../_new-booking-actions";

/**
 * Admin "create a booking" form. Live price preview uses the same
 * pricing.ts the server recomputes from — the preview is a convenience,
 * the server's numbers are authoritative. Final price is editable so
 * Leon can round, discount, or charge for extras.
 *
 * Send flow is two-step by design: create (DB row + Stripe link attempt)
 * → explicit send. When Stripe produced no link, a confirm dialog warns
 * before the email goes out without a payment button.
 */

const PACKAGE_TIER_MAP: Record<string, PackageTier | null> = {
	premium: "premium",
	full: "fullPackage",
	board: "boardOnly",
	custom: null,
};

const PACKAGE_OPTIONS = [
	{ value: "full", label: "Full Package (board + wetsuit)" },
	{ value: "premium", label: "Premium (+ mat + roof rack + swap)" },
	{ value: "board", label: "Board Only" },
	{ value: "custom", label: "Custom (no auto price)" },
];

const BOARD_OPTIONS = ["", "6'6", "7'0", "7'8", "8'6"];
const SEX_OPTIONS = ["", "male", "female", "kid"];
const WETSUIT_OPTIONS = ["", "XS", "S", "M", "L", "XL", "100-110", "110-120", "120-130", "130-140", "140-150", "150-160"];

function emptyPerson(): NewBookingPerson {
	return {
		name: "",
		sex: "",
		experience: "",
		package: "full",
		board: "",
		wetsuitSize: "",
		checkin: "",
		checkout: "",
	};
}

function calcDays(checkin: string, checkout: string): number | null {
	if (!checkin || !checkout) return null;
	const nights = Math.round(
		(new Date(`${checkout}T00:00:00Z`).getTime() -
			new Date(`${checkin}T00:00:00Z`).getTime()) /
			86400000,
	);
	return nights >= 0 ? nights + 1 : null;
}

type Phase =
	| { step: "form" }
	| { step: "creating" }
	| {
			step: "confirm-send";
			bookingId: number;
			requestRef: string;
			paymentLinkUrl: string | null;
			paymentLinkError: string | null;
	  }
	| { step: "sending"; bookingId: number }
	| { step: "error"; message: string };

export function NewBookingForm() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [accommodation, setAccommodation] = useState("");
	const [checkin, setCheckin] = useState("");
	const [checkout, setCheckout] = useState("");
	const [people, setPeople] = useState<NewBookingPerson[]>([emptyPerson()]);
	const [note, setNote] = useState("");
	const [priceOverride, setPriceOverride] = useState<string>("");
	const [phase, setPhase] = useState<Phase>({ step: "form" });

	const priceBreakdown = useMemo(() => {
		const rows: Array<{ label: string; amount: number | null }> = [];
		let total = 0;
		let complete = people.length > 0;
		people.forEach((p, i) => {
			const tier = PACKAGE_TIER_MAP[p.package];
			const days = calcDays(p.checkin || checkin, p.checkout || checkout);
			const who = p.name.trim() || `Person ${i + 1}`;
			if (!tier || !days) {
				rows.push({ label: `${who} — needs dates${tier ? "" : " / custom price"}`, amount: null });
				complete = false;
				return;
			}
			const amount = calcPackagePrice(tier, days);
			total += amount;
			rows.push({ label: `${who} · ${days} days`, amount });
		});
		return { rows, total, complete };
	}, [people, checkin, checkout]);

	const effectiveTotal =
		priceOverride.trim() !== ""
			? Number.parseInt(priceOverride, 10) || 0
			: priceBreakdown.complete
				? priceBreakdown.total
				: 0;

	const updatePerson = (
		index: number,
		field: keyof NewBookingPerson,
		value: string,
	) => {
		setPeople((prev) => {
			const next = [...prev];
			const current = next[index];
			if (!current) return prev;
			next[index] = { ...current, [field]: value };
			return next;
		});
	};

	const handleCreate = async () => {
		setPhase({ step: "creating" });
		const result = await createAdminBooking({
			name,
			email,
			phone,
			accommodation,
			checkin,
			checkout,
			people,
			finalTotal: effectiveTotal,
			note,
		});
		if (!result.ok || result.bookingId == null) {
			setPhase({ step: "error", message: result.error ?? "Something went wrong." });
			return;
		}
		setPhase({
			step: "confirm-send",
			bookingId: result.bookingId,
			requestRef: result.requestRef ?? "",
			paymentLinkUrl: result.paymentLinkUrl ?? null,
			paymentLinkError: result.paymentLinkError ?? null,
		});
	};

	const handleSend = async (bookingId: number, includePaymentLink: boolean) => {
		setPhase({ step: "sending", bookingId });
		const result = await sendBookingConfirmation(bookingId, {
			includePaymentLink,
		});
		if (!result.ok) {
			setPhase({ step: "error", message: result.error ?? "Email failed." });
			return;
		}
		router.push(`/admin/bookings/${bookingId}`);
	};

	if (phase.step === "confirm-send" || phase.step === "sending") {
		const sending = phase.step === "sending";
		const info = phase.step === "confirm-send" ? phase : null;
		return (
			<article className="admin-card admin-send-confirm">
				<h2>
					{info?.requestRef ? `${info.requestRef} created` : "Booking created"}
				</h2>
				{info?.paymentLinkUrl ? (
					<>
						<p>
							Stripe payment link is ready. Send {name.split(" ")[0] || "the customer"} the
							confirmation email with the <strong>€{effectiveTotal}</strong> pay-online button?
						</p>
						<p className="admin-card-hint admin-send-link">{info.paymentLinkUrl}</p>
						<div className="admin-send-actions">
							<button
								type="button"
								className="admin-btn admin-btn--primary"
								disabled={sending}
								onClick={() => info && handleSend(info.bookingId, true)}
							>
								{sending ? "Sending..." : "Send confirmation + payment link"}
							</button>
							<button
								type="button"
								className="admin-btn"
								disabled={sending}
								onClick={() => info && router.push(`/admin/bookings/${info.bookingId}`)}
							>
								Don&apos;t send yet
							</button>
						</div>
					</>
				) : (
					<>
						<p>
							⚠️ <strong>No payment link.</strong> The email will say{" "}
							<em>pay on delivery</em> — no pay-online button. Send anyway?
						</p>
						{info?.paymentLinkError && (
							<p className="admin-card-hint admin-send-link">
								Stripe said: {info.paymentLinkError}
							</p>
						)}
						<div className="admin-send-actions">
							<button
								type="button"
								className="admin-btn admin-btn--primary"
								disabled={sending}
								onClick={() => info && handleSend(info.bookingId, false)}
							>
								{sending ? "Sending..." : "Send without payment link"}
							</button>
							<button
								type="button"
								className="admin-btn"
								disabled={sending}
								onClick={() => info && router.push(`/admin/bookings/${info.bookingId}`)}
							>
								Don&apos;t send yet
							</button>
						</div>
					</>
				)}
			</article>
		);
	}

	return (
		<div className="admin-new-booking">
			{phase.step === "error" && (
				<div className="admin-board-error" role="alert">
					⚠️ {phase.message}{" "}
					<button
						type="button"
						className="admin-board-remove"
						onClick={() => setPhase({ step: "form" })}
					>
						dismiss
					</button>
				</div>
			)}

			<article className="admin-card">
				<h2>Customer</h2>
				<div className="admin-board-form">
					<div className="admin-board-form-grid">
						<label>
							Name
							<input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
						</label>
						<label>
							Email
							<input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="client@email.com" />
						</label>
						<label>
							Phone / WhatsApp
							<input className="admin-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 170..." />
						</label>
						<label>
							Accommodation
							<input className="admin-input" value={accommodation} onChange={(e) => setAccommodation(e.target.value)} placeholder="Casa Sol, Vale da Telha" />
						</label>
						<label>
							Delivery
							<input className="admin-input" type="date" value={checkin} onChange={(e) => setCheckin(e.target.value)} />
						</label>
						<label>
							Pickup
							<input className="admin-input" type="date" value={checkout} onChange={(e) => setCheckout(e.target.value)} />
						</label>
					</div>
				</div>
			</article>

			<article className="admin-card">
				<h2>Gear</h2>
				{people.map((p, i) => (
					<div key={i} className="admin-person admin-new-person">
						<div className="admin-person-name">
							Person {i + 1}
							{people.length > 1 && (
								<button
									type="button"
									className="admin-board-remove"
									onClick={() => setPeople((prev) => prev.filter((_, j) => j !== i))}
								>
									remove
								</button>
							)}
						</div>
						<div className="admin-board-form-grid">
							<label>
								Name
								<input className="admin-input" value={p.name} onChange={(e) => updatePerson(i, "name", e.target.value)} placeholder={`Person ${i + 1}`} />
							</label>
							<label>
								Package
								<select className="admin-input" value={p.package} onChange={(e) => updatePerson(i, "package", e.target.value)}>
									{PACKAGE_OPTIONS.map((o) => (
										<option key={o.value} value={o.value}>{o.label}</option>
									))}
								</select>
							</label>
							<label>
								Board
								<select className="admin-input" value={p.board} onChange={(e) => updatePerson(i, "board", e.target.value)}>
									{BOARD_OPTIONS.map((o) => (
										<option key={o} value={o}>{o || "TBD"}</option>
									))}
								</select>
							</label>
							<label>
								Wetsuit
								<select className="admin-input" value={p.wetsuitSize} onChange={(e) => updatePerson(i, "wetsuitSize", e.target.value)}>
									{WETSUIT_OPTIONS.map((o) => (
										<option key={o} value={o}>{o || "None / TBD"}</option>
									))}
								</select>
							</label>
							<label>
								Sex
								<select className="admin-input" value={p.sex} onChange={(e) => updatePerson(i, "sex", e.target.value)}>
									{SEX_OPTIONS.map((o) => (
										<option key={o} value={o}>{o || "—"}</option>
									))}
								</select>
							</label>
							<label>
								Custom dates
								<span className="admin-new-person-dates">
									<input className="admin-input" type="date" value={p.checkin ?? ""} onChange={(e) => updatePerson(i, "checkin", e.target.value)} aria-label={`Person ${i + 1} delivery`} />
									<input className="admin-input" type="date" value={p.checkout ?? ""} onChange={(e) => updatePerson(i, "checkout", e.target.value)} aria-label={`Person ${i + 1} pickup`} />
								</span>
							</label>
						</div>
					</div>
				))}
				<button
					type="button"
					className="admin-btn"
					onClick={() => setPeople((prev) => [...prev, emptyPerson()])}
				>
					+ Add person
				</button>
			</article>

			<article className="admin-card">
				<h2>Price</h2>
				<div className="admin-price-breakdown">
					{priceBreakdown.rows.map((r, i) => (
						<div key={i} className="admin-price-line">
							<span>{r.label}</span>
							<span>{r.amount != null ? `€${r.amount}` : "—"}</span>
						</div>
					))}
					<div className="admin-price-line admin-price-line--total">
						<span>Computed total</span>
						<span>{priceBreakdown.complete ? `€${priceBreakdown.total}` : "incomplete"}</span>
					</div>
				</div>
				<label className="admin-price-override">
					Final price (€) — edit to adjust
					<input
						className="admin-input"
						type="number"
						min="1"
						value={priceOverride !== "" ? priceOverride : priceBreakdown.complete ? String(priceBreakdown.total) : ""}
						onChange={(e) => setPriceOverride(e.target.value)}
						placeholder={priceBreakdown.complete ? String(priceBreakdown.total) : "Set a price"}
					/>
				</label>
				<label>
					Personal note in the email <span className="form-optional">(optional)</span>
					<textarea
						className="admin-textarea"
						rows={2}
						value={note}
						onChange={(e) => setNote(e.target.value)}
						placeholder="e.g. Great chatting on WhatsApp — see you Saturday morning!"
					/>
				</label>
			</article>

			<button
				type="button"
				className="admin-btn admin-btn--primary admin-new-booking-submit"
				disabled={phase.step === "creating" || effectiveTotal <= 0 || !name.trim() || !email.trim()}
				onClick={handleCreate}
			>
				{phase.step === "creating"
					? "Creating..."
					: `Create booking — €${effectiveTotal} → review send`}
			</button>
			<p className="admin-card-hint">
				Minimum {DAILY_MINIMUM_DAYS} days per person. Creating doesn&apos;t email
				anyone yet — you review the send on the next step.
			</p>
		</div>
	);
}
