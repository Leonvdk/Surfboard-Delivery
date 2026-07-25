"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import type { Booking } from "../../lib/db/schema";
import { defaultEmailCopy } from "../../lib/emails/booking-confirmation";
import { calcPackagePrice, type PackageTier } from "../../lib/pricing";
import {
	type NewBookingPerson,
	sendBookingConfirmation,
	updateBookingDetails,
} from "../_new-booking-actions";

/**
 * Edit-and-send modal on the booking detail page. One flow covers three
 * jobs Leon needs:
 *   - resend a confirmation after fixing something,
 *   - send a payment request for a booking that came in through the
 *     website (no link yet — saving mints one),
 *   - correct client/gear/price details without sending at all.
 *
 * Saving is always a separate step from sending, so nothing reaches the
 * customer until the details on screen are right.
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
const WETSUIT_OPTIONS = ["", "XS", "S", "M", "L", "XL", "100-110", "110-120", "120-130", "130-140", "140-150", "150-160"];

function calcDays(checkin: string, checkout: string): number | null {
	if (!checkin || !checkout) return null;
	const nights = Math.round(
		(new Date(`${checkout}T00:00:00Z`).getTime() -
			new Date(`${checkin}T00:00:00Z`).getTime()) /
			86400000,
	);
	return nights >= 0 ? nights + 1 : null;
}

type Status =
	| { step: "editing" }
	| { step: "saving" }
	| { step: "sending" }
	| { step: "error"; message: string }
	| { step: "saved"; paymentLinkUrl: string | null; regenerated: boolean; linkError?: string };

export function BookingEditSendButton({ booking }: { booking: Booking }) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const [status, setStatus] = useState<Status>({ step: "editing" });

	const [name, setName] = useState(booking.name);
	const [email, setEmail] = useState(booking.email);
	const [phone, setPhone] = useState(booking.phone ?? "");
	const [accommodation, setAccommodation] = useState(booking.accommodation ?? "");
	const [checkin, setCheckin] = useState(booking.checkin);
	const [checkout, setCheckout] = useState(booking.checkout);
	const [people, setPeople] = useState<NewBookingPerson[]>(
		(booking.people ?? []).map((p) => ({
			name: p.name ?? "",
			sex: p.sex ?? "",
			experience: p.experience ?? "",
			package: p.package ?? "full",
			board: p.board ?? "",
			wetsuitSize: p.wetsuitSize ?? "",
			checkin: p.checkin ?? "",
			checkout: p.checkout ?? "",
			priceOverride: p.priceOverride ?? null,
		})),
	);
	const [note, setNote] = useState(booking.message ?? "");
	const [price, setPrice] = useState(
		String(booking.finalTotal ?? booking.estimatedTotal ?? ""),
	);

	// Live link state: starts from the booking, updated after a save that
	// mints or replaces one.
	const [linkUrl, setLinkUrl] = useState<string | null>(
		booking.stripePaymentLinkUrl,
	);

	const firstName = name.trim().split(" ")[0] || "there";
	const [greeting, setGreeting] = useState("");
	const [intro, setIntro] = useState("");

	useEffect(() => setMounted(true), []);

	// Seed the email copy from the defaults whenever the link state
	// changes (the wording differs with and without a pay button).
	useEffect(() => {
		const copy = defaultEmailCopy(firstName, Boolean(linkUrl));
		setGreeting((g) => g || copy.greeting);
		setIntro((i) => i || copy.intro);
	}, [firstName, linkUrl]);

	useEffect(() => {
		if (!open) return;
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", onEsc);
		return () => document.removeEventListener("keydown", onEsc);
	}, [open]);

	/** What this person's line costs: their override, else the tariff. */
	const linePrice = (p: NewBookingPerson): number => {
		if (p.priceOverride != null && p.priceOverride > 0) return p.priceOverride;
		const tier = PACKAGE_TIER_MAP[p.package];
		const days = calcDays(p.checkin || checkin, p.checkout || checkout);
		if (!tier || !days) return 0;
		return calcPackagePrice(tier, days);
	};

	/** Tariff price ignoring any override — shown as the "was" reference. */
	const tariffPrice = (p: NewBookingPerson): number => {
		const tier = PACKAGE_TIER_MAP[p.package];
		const days = calcDays(p.checkin || checkin, p.checkout || checkout);
		if (!tier || !days) return 0;
		return calcPackagePrice(tier, days);
	};

	const computed = people.reduce((sum, p) => sum + linePrice(p), 0);

	const updatePerson = (i: number, field: keyof NewBookingPerson, value: string) => {
		setPeople((prev) => {
			const next = [...prev];
			const cur = next[i];
			if (!cur) return prev;
			next[i] = { ...cur, [field]: value };
			// Keep the total in step with the lines — otherwise a changed
			// package would silently leave an Adjustment row on the bill.
			setPrice(String(next.reduce((s, q) => s + linePrice(q), 0)));
			return next;
		});
	};

	/** Empty clears the override, restoring the tariff price. */
	const updatePersonPrice = (i: number, raw: string) => {
		setPeople((prev) => {
			const next = [...prev];
			const cur = next[i];
			if (!cur) return prev;
			const parsed = Number.parseInt(raw, 10);
			next[i] = {
				...cur,
				priceOverride: raw.trim() === "" || !Number.isFinite(parsed) ? null : parsed,
			};
			setPrice(String(next.reduce((s, q) => s + linePrice(q), 0)));
			return next;
		});
	};

	const payload = () => ({
		name,
		email,
		phone,
		accommodation,
		checkin,
		checkout,
		people,
		finalTotal: Number.parseInt(price, 10) || 0,
		note,
	});

	const handleSave = async (): Promise<boolean> => {
		setStatus({ step: "saving" });
		const result = await updateBookingDetails(booking.id, payload());
		if (!result.ok) {
			setStatus({ step: "error", message: result.error ?? "Save failed." });
			return false;
		}
		setLinkUrl(result.paymentLinkUrl ?? null);
		setStatus({
			step: "saved",
			paymentLinkUrl: result.paymentLinkUrl ?? null,
			regenerated: Boolean(result.paymentLinkRegenerated),
			linkError: result.paymentLinkError,
		});
		router.refresh();
		return true;
	};

	const handleSaveAndSend = async () => {
		const saved = await handleSave();
		if (!saved) return;
		setStatus({ step: "sending" });
		const result = await sendBookingConfirmation(booking.id, {
			includePaymentLink: true,
			greeting,
			intro,
		});
		if (!result.ok) {
			setStatus({ step: "error", message: result.error ?? "Email failed." });
			return;
		}
		setOpen(false);
		setStatus({ step: "editing" });
		router.refresh();
	};

	const busy = status.step === "saving" || status.step === "sending";

	return (
		<>
			<button
				type="button"
				className="admin-btn"
				onClick={() => setOpen(true)}
			>
				✉️ Edit &amp; send email
			</button>

			{open &&
				mounted &&
				createPortal(
					<div className="modal-overlay" onClick={() => !busy && setOpen(false)}>
						<dialog
							className="modal admin-board-modal admin-send-modal"
							open
							onClick={(e) => e.stopPropagation()}
							aria-label="Edit booking and send email"
						>
							<div className="modal-header">
								<h3 className="modal-title">
									SR-{String(booking.id).padStart(5, "0")} · {booking.name}
								</h3>
								<button
									className="modal-close"
									onClick={() => setOpen(false)}
									aria-label="Close"
									type="button"
									disabled={busy}
								>
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
										<line x1="18" y1="6" x2="6" y2="18" />
										<line x1="6" y1="6" x2="18" y2="18" />
									</svg>
								</button>
							</div>

							<div className="modal-body admin-board-form">
								{status.step === "error" && (
									<div className="admin-board-error" role="alert">
										⚠️ {status.message}
									</div>
								)}
								{status.step === "saved" && (
									<div className="admin-save-note" role="status">
										✅ Saved.
										{status.regenerated
											? " Price changed — the old payment link was deactivated and a new one created."
											: status.paymentLinkUrl
												? " Payment link ready."
												: ""}
										{status.linkError ? ` Stripe said: ${status.linkError}` : ""}
									</div>
								)}

								<h4 className="admin-modal-section">Customer</h4>
								<div className="admin-board-form-grid">
									<label>
										Name
										<input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} />
									</label>
									<label>
										Email
										<input className="admin-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
									</label>
									<label>
										Phone
										<input className="admin-input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
									</label>
									<label>
										Accommodation
										<input className="admin-input" value={accommodation} onChange={(e) => setAccommodation(e.target.value)} />
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

								<h4 className="admin-modal-section">Gear</h4>
								{people.length === 0 && (
									<p className="admin-empty-inline">
										No per-person data on this booking.
									</p>
								)}
								{people.map((p, i) => (
									<div key={i} className="admin-person admin-new-person">
										<div className="admin-person-name">
											{p.name || `Person ${i + 1}`}
											{people.length > 1 && (
												<button
													type="button"
													className="admin-board-remove"
													onClick={() =>
														setPeople((prev) => prev.filter((_, j) => j !== i))
													}
												>
													remove
												</button>
											)}
										</div>
										<div className="admin-board-form-grid">
											<label>
												Name
												<input className="admin-input" value={p.name} onChange={(e) => updatePerson(i, "name", e.target.value)} />
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
												Custom dates
												<span className="admin-new-person-dates">
													<input className="admin-input" type="date" value={p.checkin ?? ""} onChange={(e) => updatePerson(i, "checkin", e.target.value)} aria-label={`Person ${i + 1} delivery`} />
													<input className="admin-input" type="date" value={p.checkout ?? ""} onChange={(e) => updatePerson(i, "checkout", e.target.value)} aria-label={`Person ${i + 1} pickup`} />
												</span>
											</label>
											<label>
												Price (€)
												<input
													className="admin-input"
													type="number"
													min="0"
													value={p.priceOverride ?? ""}
													placeholder={String(tariffPrice(p))}
													onChange={(e) => updatePersonPrice(i, e.target.value)}
													aria-label={`Person ${i + 1} price`}
												/>
												<span className="admin-line-price-hint">
													{p.priceOverride != null && p.priceOverride > 0
														? `tariff €${tariffPrice(p)} · clear to reset`
														: "tariff price — type to override"}
												</span>
											</label>
										</div>
									</div>
								))}
								<button
									type="button"
									className="admin-btn"
									onClick={() =>
										setPeople((prev) => [
											...prev,
											{
												name: "",
												sex: "",
												experience: "",
												package: "full",
												board: "",
												wetsuitSize: "",
												checkin: "",
												checkout: "",
											},
										])
									}
								>
									+ Add person
								</button>

								<h4 className="admin-modal-section">Price</h4>
								<div className="admin-board-form-grid">
									<label>
										Final price (€)
										<input
											className="admin-input"
											type="number"
											min="1"
											value={price}
											onChange={(e) => setPrice(e.target.value)}
										/>
									</label>
									<div className="admin-price-computed">
										<span className="admin-pl-label">Computed</span>
										<strong>€{computed}</strong>
										<button
											type="button"
											className="admin-board-remove"
											onClick={() => setPrice(String(computed))}
										>
											use this
										</button>
									</div>
								</div>
								{booking.paidAt && (
									<p className="admin-card-hint">
										Already paid — the payment link stays as it is, even if you
										change the price here.
									</p>
								)}

								<h4 className="admin-modal-section">Email</h4>
								<label>
									Headline
									<input className="admin-input" value={greeting} onChange={(e) => setGreeting(e.target.value)} />
								</label>
								<label>
									Intro text
									<textarea className="admin-textarea" rows={3} value={intro} onChange={(e) => setIntro(e.target.value)} />
								</label>
								<label>
									Personal note
									<textarea className="admin-textarea" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
								</label>
								<p className="admin-card-hint">
									{linkUrl
										? "The email will include the pay-online button."
										: "No payment link yet — saving creates one, unless Stripe is unavailable (then it says pay on delivery)."}{" "}
									A copy is BCC&apos;d to hello@surfrental-aljezur.com.
								</p>

								<div className="admin-send-actions">
									<button
										type="button"
										className="admin-btn admin-btn--primary"
										disabled={busy}
										onClick={handleSaveAndSend}
									>
										{status.step === "sending"
											? "Sending..."
											: status.step === "saving"
												? "Saving..."
												: "Save & send email"}
									</button>
									<button
										type="button"
										className="admin-btn"
										disabled={busy}
										onClick={handleSave}
									>
										Save only
									</button>
								</div>
							</div>
						</dialog>
					</div>,
					document.body,
				)}
		</>
	);
}
