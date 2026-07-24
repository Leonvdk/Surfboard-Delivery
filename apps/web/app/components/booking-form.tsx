"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
	trackBoardCalcOpened,
	trackBoardCalcResult,
	trackBookingAbandoned,
	trackBookingEstimateShown,
	trackBookingFieldFocused,
	trackBookingFormStart,
	trackBookingStep,
	trackBookingSubmitted,
	trackContactPageView,
	trackWetsuitCalcOpened,
	trackWetsuitCalcResult,
} from "../lib/analytics";
import { DateRangePicker } from "./date-range-picker";
import {
	calcPackagePrice,
	DAILY_MINIMUM_DAYS,
	formatDurationLabel,
	type PackageTier,
} from "../lib/pricing";

/* ── Board calculator logic ── */

type Level = "" | "never" | "few-times" | "intermediate" | "advanced";
type Sex = "" | "male" | "female" | "kid";

const BOARD_OPTIONS = [
	{ value: "", label: "Not sure \u2014 recommend one" },
	{ value: "6'6", label: "6\u20196 Shortboard" },
	{ value: "7'0", label: "7\u20190 Funboard" },
	{ value: "7'8", label: "7\u20198 Funboard" },
	{ value: "8'6", label: "8\u20196 Longboard" },
] as const;

const EXPERIENCE_OPTIONS = [
	{ value: "", label: "Not sure / skip" },
	{ value: "never", label: "Never surfed" },
	{ value: "few-times", label: "Surfed a few times" },
	{ value: "intermediate", label: "Intermediate" },
	{ value: "advanced", label: "Advanced" },
] as const;

const SEX_OPTIONS = [
	{ value: "", label: "Select" },
	{ value: "male", label: "Male" },
	{ value: "female", label: "Female" },
	{ value: "kid", label: "Kid" },
] as const;

/* ── Wetsuit sizes by sex ── */

const WETSUIT_MALE = [
	{ value: "", label: "Select size" },
	{ value: "XS", label: "XS" },
	{ value: "S", label: "S" },
	{ value: "M", label: "M" },
	{ value: "L", label: "L" },
	{ value: "XL", label: "XL" },
];

const WETSUIT_FEMALE = [
	{ value: "", label: "Select size" },
	{ value: "XS", label: "XS" },
	{ value: "S", label: "S" },
	{ value: "M", label: "M" },
	{ value: "L", label: "L" },
	{ value: "XL", label: "XL" },
];

const WETSUIT_KID = [
	{ value: "", label: "Select size" },
	{ value: "100-110", label: "100 – 110 cm" },
	{ value: "110-120", label: "110 – 120 cm" },
	{ value: "120-130", label: "120 – 130 cm" },
	{ value: "130-140", label: "130 – 140 cm" },
	{ value: "140-150", label: "140 – 150 cm" },
	{ value: "150-160", label: "150 – 160 cm" },
];

function getWetsuitOptions(sex: Sex) {
	if (sex === "male") return WETSUIT_MALE;
	if (sex === "female") return WETSUIT_FEMALE;
	if (sex === "kid") return WETSUIT_KID;
	return [{ value: "", label: "Select sex first" }];
}

/* ── Wetsuit size calculator ── */

function recommendWetsuitMale(height: number, weight: number): string {
	if (height <= 172 && weight <= 65) return "XS";
	if (height <= 178 && weight <= 72) return "S";
	if (height <= 183 && weight <= 82) return "M";
	if (height <= 190 && weight <= 92) return "L";
	return "XL";
}

function recommendWetsuitFemale(height: number, weight: number): string {
	if (height <= 163 && weight <= 55) return "XS";
	if (height <= 170 && weight <= 63) return "S";
	if (height <= 176 && weight <= 72) return "M";
	if (height <= 183 && weight <= 82) return "L";
	return "XL";
}

function recommendWetsuitKid(height: number): string {
	if (height < 110) return "100-110";
	if (height < 120) return "110-120";
	if (height < 130) return "120-130";
	if (height < 140) return "130-140";
	if (height < 150) return "140-150";
	return "150-160";
}

function recommendWetsuit(sex: Sex, height: number, weight: number): string | null {
	if (!sex || !height) return null;
	if (sex === "kid") return recommendWetsuitKid(height);
	if (!weight) return null;
	if (sex === "male") return recommendWetsuitMale(height, weight);
	if (sex === "female") return recommendWetsuitFemale(height, weight);
	return null;
}

/* ── Board calculator logic ── */

type BoardRec = {
	value: string;
	label: string;
	image: string;
};

const BOARD_RECS: Record<string, BoardRec> = {
	longboard: { value: "8'6", label: "8\u20196 Longboard", image: "/images/rentals/8'6/picture(1).jpg" },
	"funboard-78": { value: "7'8", label: "7\u20198 Funboard", image: "/images/rentals/7'8/picture(1).jpg" },
	"funboard-70": { value: "7'0", label: "7\u20190 Funboard", image: "/images/rentals/7'0/picture(1).jpg" },
	shortboard: { value: "6'6", label: "6\u20196 Shortboard", image: "/images/rentals/6'6/picture(1).jpg" },
};

function recommendBoard(level: Level, weight: number): BoardRec | "advanced" | null {
	if (!level || !weight) return null;
	if (level === "advanced") return "advanced";
	if (level === "never") {
		return weight >= 80 ? BOARD_RECS.longboard ?? null : BOARD_RECS["funboard-78"] ?? null;
	}
	if (level === "few-times") {
		if (weight >= 80) return BOARD_RECS.longboard ?? null;
		if (weight < 38) return BOARD_RECS["funboard-70"] ?? null;
		return BOARD_RECS["funboard-78"] ?? null;
	}
	if (level === "intermediate") {
		return weight >= 80 ? BOARD_RECS["funboard-78"] ?? null : BOARD_RECS["funboard-70"] ?? null;
	}
	return null;
}

/* ── Package logic based on duration ── */

type FormPackageInfo = {
	value: string;
	label: string;
	includesWetsuit: boolean;
	pricePerPerson: number | null;
	tier: PackageTier | null;
};

function getPackageOptions(days: number | null): FormPackageInfo[] {
	// Before dates are picked, price against 7 days as a placeholder.
	const priceDays = days ?? 7;
	const durationLabel = formatDurationLabel(days);
	const premiumPrice = calcPackagePrice("premium", priceDays);
	const fullPrice = calcPackagePrice("fullPackage", priceDays);
	const boardPrice = calcPackagePrice("boardOnly", priceDays);

	return [
		{
			value: "premium",
			label: `Premium (board + wetsuit + changing mat + roof rack) — €${premiumPrice} ${durationLabel}`,
			includesWetsuit: true,
			pricePerPerson: premiumPrice,
			tier: "premium",
		},
		{
			value: "full",
			label: `Full Package (board + wetsuit) — €${fullPrice} ${durationLabel}`,
			includesWetsuit: true,
			pricePerPerson: fullPrice,
			tier: "fullPackage",
		},
		{
			value: "board",
			label: `Board Only — €${boardPrice} ${durationLabel}`,
			includesWetsuit: false,
			pricePerPerson: boardPrice,
			tier: "boardOnly",
		},
		{
			value: "custom",
			label: "Not sure — recommend something",
			includesWetsuit: false,
			pricePerPerson: null,
			tier: null,
		},
	];
}

function calcEstimatedTotal(
	people: Person[],
	pkgOptions: FormPackageInfo[],
): { total: number; allSelected: boolean; selectedCount: number } {
	let total = 0;
	let selectedCount = 0;
	for (const person of people) {
		if (!person.package) continue;
		const opt = pkgOptions.find((o) => o.value === person.package);
		if (opt?.pricePerPerson != null) {
			total += opt.pricePerPerson;
			selectedCount++;
		}
	}
	const allSelected = selectedCount === people.length && people.length > 0;
	return { total, allSelected, selectedCount };
}

function calcDays(checkin: string, checkout: string): number | null {
	if (!checkin || !checkout) return null;
	const d1 = new Date(checkin);
	const d2 = new Date(checkout);
	const nights = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
	// Both the delivery day and the pickup day count as billable days —
	// customers use the gear across all of them. So Jul 21 → Jul 24 = 4 days,
	// not 3. A same-day return (checkin = checkout) is still 1 day.
	return nights >= 0 ? nights + 1 : null;
}

function packageIncludesWetsuit(pkg: string, options: FormPackageInfo[]): boolean {
	return options.find((o) => o.value === pkg)?.includesWetsuit ?? false;
}

/* ── Per-person state ── */

type Person = {
	name: string;
	sex: Sex;
	experience: string;
	package: string;
	board: string;
	wetsuitSize: string;
};

function emptyPerson(): Person {
	return { name: "", sex: "", experience: "", package: "", board: "", wetsuitSize: "" };
}

// Human-readable "we'll reply by X" string in Portugal time. During
// operating hours (08–20 Lisbon) → "by ~{HH:MM} today, usually within
// 3 hours". Outside those hours → "first thing tomorrow morning".
// The concrete window is the trust anchor that replaces "we'll get
// back within 24 hours" (a ceiling that reads like a stall).
function replyByLabel(submittedAt: Date): string {
	const parts = new Intl.DateTimeFormat("en-GB", {
		timeZone: "Europe/Lisbon",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(submittedAt);
	const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");

	if (hour >= 8 && hour < 17) {
		const target = new Date(submittedAt.getTime() + 3 * 60 * 60 * 1000);
		const hh = new Intl.DateTimeFormat("en-GB", {
			timeZone: "Europe/Lisbon",
			hour: "2-digit",
			minute: "2-digit",
			hour12: false,
		}).format(target);
		return `Reply expected by ~${hh} today (Portugal time, GMT+1). Usually within 3 hours.`;
	}
	if (hour >= 17 && hour < 20) {
		return "Reply expected by 20:00 Portugal time tonight (GMT+1). Usually within 3 hours.";
	}
	return "You're outside our reply hours (08:00–20:00 Portugal, GMT+1). Reply expected first thing tomorrow morning.";
}

/* ── Board calculator modal ── */

function BoardCalcModal({
	open,
	onClose,
	onSelect,
}: {
	open: boolean;
	onClose: () => void;
	onSelect: (boardValue: string) => void;
}) {
	const [level, setLevel] = useState<Level>("");
	const [weight, setWeight] = useState("");
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const w = Number.parseInt(weight, 10) || 0;
	const result = level && w > 0 ? recommendBoard(level, w) : null;

	const handleSelect = useCallback(
		(value: string) => {
			onSelect(value);
			setLevel("");
			setWeight("");
			onClose();
		},
		[onSelect, onClose],
	);

	if (!open || !mounted) return null;

	return createPortal(
		<div className="modal-overlay" onClick={onClose}>
			<dialog
				className="modal"
				open
				onClick={(e) => e.stopPropagation()}
			>
				<div className="modal-header">
					<h3 className="modal-title">Find the right board</h3>
					<button className="modal-close" onClick={onClose} aria-label="Close">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
				<div className="modal-body">
					<div className="calc-field">
						<label className="calc-label" htmlFor="modal-board-level">Surf experience</label>
						<select id="modal-board-level" className="calc-select" value={level} onChange={(e) => setLevel(e.target.value as Level)}>
							<option value="">Select your level</option>
							<option value="never">Never surfed before</option>
							<option value="few-times">Surfed a few times</option>
							<option value="intermediate">Intermediate</option>
							<option value="advanced">Advanced</option>
						</select>
					</div>
					<div className="calc-field">
						<label className="calc-label" htmlFor="modal-board-weight">Weight (kg)</label>
						<input id="modal-board-weight" className="calc-input" type="number" min="20" max="200" placeholder="e.g. 75" value={weight} onChange={(e) => setWeight(e.target.value)} />
					</div>
					{result && result !== "advanced" && (
						<div className="modal-result">
							<div className="modal-rec-card">
								<div className="modal-rec-img">
									<Image src={result.image} alt={result.label} width={300} height={225} />
								</div>
								<div className="modal-rec-body">
									<div className="modal-rec-name">{result.label}</div>
									<button type="button" className="btn btn-primary btn-sm" onClick={() => handleSelect(result.value)}>
										Select this board
									</button>
								</div>
							</div>
						</div>
					)}
					{result === "advanced" && (
						<div className="modal-result">
							<p className="modal-advanced-text">You can ride any of our boards! Pick the one that suits the conditions.</p>
							<div className="modal-advanced-options">
								{Object.values(BOARD_RECS).map((b) => (
									<button key={b.value} type="button" className="modal-board-btn" onClick={() => handleSelect(b.value)}>
										<div className="modal-board-btn-img">
											<Image src={b.image} alt={b.label} width={150} height={112} />
										</div>
										<span>{b.label}</span>
									</button>
								))}
							</div>
						</div>
					)}
				</div>
			</dialog>
		</div>,
		document.body,
	);
}

/* ── Wetsuit size calculator modal ── */

function WetsuitCalcModal({
	open,
	sex,
	onClose,
	onSelect,
}: {
	open: boolean;
	sex: Sex;
	onClose: () => void;
	onSelect: (size: string) => void;
}) {
	const [height, setHeight] = useState("");
	const [weight, setWeight] = useState("");
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const h = Number.parseInt(height, 10) || 0;
	const w = Number.parseInt(weight, 10) || 0;
	const result = recommendWetsuit(sex, h, w);

	const handleSelect = useCallback(
		(size: string) => {
			onSelect(size);
			setHeight("");
			setWeight("");
			onClose();
		},
		[onSelect, onClose],
	);

	if (!open || !mounted) return null;

	const isKid = sex === "kid";
	const sizeLabel = isKid && result
		? `${result.replace("-", " – ")} cm`
		: result;

	return createPortal(
		<div className="modal-overlay" onClick={onClose}>
			<dialog className="modal" open onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h3 className="modal-title">Find your wetsuit size</h3>
					<button className="modal-close" onClick={onClose} aria-label="Close">
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<line x1="18" y1="6" x2="6" y2="18" />
							<line x1="6" y1="6" x2="18" y2="18" />
						</svg>
					</button>
				</div>
				<div className="modal-body">
					<p className="modal-context">
						{sex === "male" && "Adult male wetsuit sizing"}
						{sex === "female" && "Adult female wetsuit sizing"}
						{sex === "kid" && "Kid wetsuit sizing (by height)"}
					</p>

					<div className="calc-field">
						<label className="calc-label" htmlFor="modal-ws-height">Height (cm)</label>
						<input id="modal-ws-height" className="calc-input" type="number" min={isKid ? 90 : 140} max={isKid ? 170 : 220} placeholder={isKid ? "e.g. 135" : "e.g. 178"} value={height} onChange={(e) => setHeight(e.target.value)} />
					</div>

					{!isKid && (
						<div className="calc-field">
							<label className="calc-label" htmlFor="modal-ws-weight">Weight (kg)</label>
							<input id="modal-ws-weight" className="calc-input" type="number" min="30" max="200" placeholder="e.g. 75" value={weight} onChange={(e) => setWeight(e.target.value)} />
						</div>
					)}

					{result && (
						<div className="modal-result">
							<div className="modal-ws-result">
								<div className="modal-ws-size">{sizeLabel}</div>
								<p className="modal-ws-note">
									{isKid
										? "Based on height. If between sizes, go one size up for room to grow."
										: "Based on your height and weight. Wetsuits should fit snug — if between sizes, go with the tighter fit."}
								</p>
								<button
									type="button"
									className="btn btn-primary btn-sm"
									onClick={() => handleSelect(result)}
								>
									Select this size
								</button>
							</div>
						</div>
					)}

					<div className="modal-size-table">
						<h4 className="modal-table-title">
							{isKid ? "Size guide (kids)" : sex === "male" ? "Size guide (men)" : "Size guide (women)"}
						</h4>
						<table className="ws-table">
							<thead>
								<tr>
									<th>Size</th>
									<th>Height</th>
									{!isKid && <th>Weight</th>}
								</tr>
							</thead>
							<tbody>
								{sex === "male" && (
									<>
										<tr><td>XS</td><td>165 – 172 cm</td><td>55 – 65 kg</td></tr>
										<tr><td>S</td><td>170 – 178 cm</td><td>60 – 72 kg</td></tr>
										<tr><td>M</td><td>175 – 183 cm</td><td>68 – 82 kg</td></tr>
										<tr><td>L</td><td>180 – 190 cm</td><td>78 – 92 kg</td></tr>
										<tr><td>XL</td><td>185 – 198 cm</td><td>88 – 105 kg</td></tr>
									</>
								)}
								{sex === "female" && (
									<>
										<tr><td>XS</td><td>155 – 163 cm</td><td>45 – 55 kg</td></tr>
										<tr><td>S</td><td>160 – 170 cm</td><td>52 – 63 kg</td></tr>
										<tr><td>M</td><td>167 – 176 cm</td><td>60 – 72 kg</td></tr>
										<tr><td>L</td><td>173 – 183 cm</td><td>68 – 82 kg</td></tr>
										<tr><td>XL</td><td>178 – 190 cm</td><td>78 – 95 kg</td></tr>
									</>
								)}
								{isKid && (
									<>
										<tr><td>100 – 110 cm</td><td>100 – 110 cm</td></tr>
										<tr><td>110 – 120 cm</td><td>110 – 120 cm</td></tr>
										<tr><td>120 – 130 cm</td><td>120 – 130 cm</td></tr>
										<tr><td>130 – 140 cm</td><td>130 – 140 cm</td></tr>
										<tr><td>140 – 150 cm</td><td>140 – 150 cm</td></tr>
										<tr><td>150 – 160 cm</td><td>150 – 160 cm</td></tr>
									</>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</dialog>
		</div>,
		document.body,
	);
}

/* ── Collapsed person summary helpers ── */

function personSummaryLabel(person: Person, pkgOptions: FormPackageInfo[]): string {
	const parts: string[] = [];
	const sexLabel = SEX_OPTIONS.find((o) => o.value === person.sex)?.label;
	if (sexLabel && person.sex) parts.push(sexLabel);
	const expLabel = EXPERIENCE_OPTIONS.find((o) => o.value === person.experience)?.label;
	if (expLabel && person.experience) parts.push(expLabel);
	const boardLabel = BOARD_OPTIONS.find((o) => o.value === person.board)?.label;
	if (boardLabel && person.board) parts.push(boardLabel);
	const pkgLabel = pkgOptions.find((o) => o.value === person.package);
	if (pkgLabel) parts.push(pkgLabel.label.split(" — ")[0]!);
	if (person.wetsuitSize) parts.push(`Wetsuit ${person.wetsuitSize}`);
	return parts.length > 0 ? parts.join(" · ") : "Not filled in yet";
}

function personDisplayName(person: Person, index: number): string {
	return person.name || `Person ${index + 1}`;
}

/* ── Main booking form ── */

type FormStatus = "idle" | "submitting" | "success" | "error";

const STORAGE_KEY = "sra-booking-draft";

type FormDraft = {
	checkin: string;
	checkout: string;
	people: Person[];
	name: string;
	email: string;
	accommodation: string;
	message: string;
};

function saveDraft(draft: Partial<FormDraft>) {
	try {
		const existing = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
		sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...existing, ...draft }));
	} catch { /* ignore */ }
}

function loadDraft(): FormDraft | null {
	try {
		const raw = sessionStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch { return null; }
}

function clearDraft() {
	try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function BookingForm() {
	const draft = useRef(loadDraft());

	const [checkin, setCheckin] = useState(draft.current?.checkin || "");
	const [checkout, setCheckout] = useState(draft.current?.checkout || "");
	const [peopleCount, setPeopleCount] = useState(draft.current?.people?.length || 1);
	const [people, setPeople] = useState<Person[]>(
		draft.current?.people?.length ? draft.current.people : [emptyPerson()],
	);
	const [expandedPerson, setExpandedPerson] = useState(0);
	const [editingName, setEditingName] = useState<number | null>(null);
	const [boardCalcOpen, setBoardCalcOpen] = useState<number | null>(null);
	const [wetsuitCalcOpen, setWetsuitCalcOpen] = useState<number | null>(null);
	const [status, setStatus] = useState<FormStatus>("idle");
	const [errorMsg, setErrorMsg] = useState("");
	// Shown on the success screen so the customer can quote it back on
	// WhatsApp / email if we go silent — closes the "did anything actually
	// happen?" gap the Swiss customers described.
	const [requestRef, setRequestRef] = useState<string>("");
	const [submittedAt, setSubmittedAt] = useState<Date | null>(null);

	const formRef = useRef<HTMLFormElement>(null);
	const formStartTime = useRef(Date.now());
	const trackedFields = useRef(new Set<string>());
	const lastField = useRef("");
	const prefilled = useRef(false);
	const didPrefill = useRef(false);
	const firedSteps = useRef(new Set<string>());
	const contactViewTracked = useRef(false);

	const fireStep = useCallback((step: string) => {
		if (firedSteps.current.has(step)) return;
		firedSteps.current.add(step);
		trackBookingStep(step);
	}, []);

	/* Restore uncontrolled fields on mount */
	useEffect(() => {
		const d = draft.current;
		if (!d || !formRef.current) return;
		const form = formRef.current;
		if (d.name) (form.elements.namedItem("name") as HTMLInputElement | null)?.setAttribute("value", d.name);
		if (d.email) (form.elements.namedItem("email") as HTMLInputElement | null)?.setAttribute("value", d.email);
		if (d.accommodation) (form.elements.namedItem("accommodation") as HTMLInputElement | null)?.setAttribute("value", d.accommodation);
		if (d.message) {
			const el = form.elements.namedItem("message") as HTMLTextAreaElement | null;
			if (el) el.value = d.message;
		}
	}, []);

	/* Save controlled state to sessionStorage */
	useEffect(() => {
		saveDraft({ checkin, checkout, people });
	}, [checkin, checkout, people]);

	const saveTextFields = useCallback(() => {
		if (!formRef.current) return;
		const form = formRef.current;
		const name = (form.elements.namedItem("name") as HTMLInputElement | null)?.value || "";
		const email = (form.elements.namedItem("email") as HTMLInputElement | null)?.value || "";
		saveDraft({
			name,
			email,
			accommodation: (form.elements.namedItem("accommodation") as HTMLInputElement | null)?.value || "",
			message: (form.elements.namedItem("message") as HTMLTextAreaElement | null)?.value || "",
		});
		if (name.trim() && /.+@.+\..+/.test(email)) fireStep("contact_details_filled");
	}, [fireStep]);

	const handleFieldFocus = useCallback(
		(e: React.FocusEvent<HTMLFormElement>) => {
			const target = e.target as HTMLElement;
			const name =
				(target as HTMLInputElement).name ||
				target.id ||
				target.closest(".form-group")?.querySelector("label")?.textContent ||
				"unknown";
			lastField.current = name;
			if (!trackedFields.current.has(name)) {
				trackedFields.current.add(name);
				trackBookingFieldFocused(name);
				if (trackedFields.current.size === 1) trackBookingFormStart();
			}
		},
		[],
	);

	useEffect(() => {
		const handleBeforeUnload = () => {
			if (
				status !== "success" &&
				trackedFields.current.size > 0
			) {
				trackBookingAbandoned({
					last_field: lastField.current,
					fields_completed: trackedFields.current.size,
					time_spent: Math.floor((Date.now() - formStartTime.current) / 1000),
				});
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [status]);

	/* Contact page arrival — where booking intent came from (once per mount) */
	useEffect(() => {
		if (contactViewTracked.current) return;
		contactViewTracked.current = true;
		let referrerPath = "";
		try {
			referrerPath = document.referrer
				? new URL(document.referrer).pathname
				: "(direct)";
		} catch {
			referrerPath = "(unknown)";
		}
		const search = window.location.search;
		trackContactPageView({
			referrer_path: referrerPath,
			query_params: search || "(none)",
			prefilled: /[?&](board|package|wetsuit|sex|experience)=/.test(search),
		});
	}, []);

	/* Pre-fill person 1 from URL params (e.g. /contact?board=7'8&package=full&wetsuit=M&sex=male) */
	useEffect(() => {
		if (prefilled.current) return;
		prefilled.current = true;

		const params = new URLSearchParams(window.location.search);
		const board = params.get("board");
		const pkgTier = params.get("package");
		const wetsuit = params.get("wetsuit");
		const sexParam = params.get("sex");
		const experience = params.get("experience");

		if (!board && !pkgTier && !wetsuit && !sexParam && !experience) return;
		didPrefill.current = true;

		setPeople((prev) => {
			const next = [...prev];
			const person = { ...next[0]! };
			if (board) person.board = board;
			if (experience) person.experience = experience;
			if (sexParam) person.sex = sexParam as Sex;
			if (pkgTier) {
				const tierMap: Record<string, string> = { full: "fullPackage", premium: "premium", board: "boardOnly" };
				const tier = tierMap[pkgTier];
				const defaultPkgOptions = getPackageOptions(null);
				const pkg = tier ? defaultPkgOptions.find((o) => o.tier === tier) : undefined;
				if (pkg) person.package = pkg.value;
			}
			if (wetsuit) person.wetsuitSize = wetsuit;
			next[0] = person;
			return next;
		});
	}, []);

	const days = useMemo(() => calcDays(checkin, checkout), [checkin, checkout]);
	const pkgOptions = useMemo(() => getPackageOptions(days), [days]);
	const estimate = useMemo(() => calcEstimatedTotal(people, pkgOptions), [people, pkgOptions]);

	/* Funnel milestones — each fires once via fireStep(). */
	useEffect(() => {
		if (checkin && checkout && days && days > 0) fireStep("dates_selected");
	}, [checkin, checkout, days, fireStep]);

	useEffect(() => {
		if (estimate.selectedCount > 0) fireStep("package_selected");
	}, [estimate.selectedCount, fireStep]);

	/* Live estimate became complete for the whole party. */
	useEffect(() => {
		if (estimate.allSelected && estimate.total > 0) {
			if (!firedSteps.current.has("estimate_shown")) {
				firedSteps.current.add("estimate_shown");
				trackBookingEstimateShown({
					value: estimate.total,
					all_selected: true,
					people_count: peopleCount,
				});
			}
		}
	}, [estimate.allSelected, estimate.total, peopleCount]);

	const handlePeopleChange = (count: number) => {
		setPeopleCount(count);
		setPeople((prev) => {
			if (count > prev.length) {
				return [...prev, ...Array.from({ length: count - prev.length }, emptyPerson)];
			}
			return prev.slice(0, count);
		});
		if (count > peopleCount) setExpandedPerson(count - 1);
		else if (expandedPerson >= count) setExpandedPerson(count - 1);
	};

	const handleAddPerson = () => {
		if (people.length >= 8) return;
		const newCount = people.length + 1;
		setPeopleCount(newCount);
		setPeople((prev) => [...prev, emptyPerson()]);
		setExpandedPerson(newCount - 1);
	};

	const handleRemovePerson = (index: number) => {
		if (people.length <= 1) return;
		setPeople((prev) => prev.filter((_, i) => i !== index));
		setPeopleCount((c) => c - 1);
		setExpandedPerson((prev) => prev >= index ? Math.max(0, prev - 1) : prev);
	};

	const updatePerson = (index: number, field: keyof Person, value: string) => {
		setPeople((prev) => {
			const next = [...prev];
			const current = next[index];
			if (!current) return prev;
			const updated: Person = { ...current, [field]: value };
			if (field === "sex") updated.wetsuitSize = "";
			next[index] = updated;
			return next;
		});
	};

	const wetsuitCalcSex = wetsuitCalcOpen !== null ? (people[wetsuitCalcOpen]?.sex as Sex) : ("" as Sex);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!checkin || !checkout) {
			setStatus("error");
			setErrorMsg("Please select your delivery and pickup dates.");
			return;
		}
		const ci = new Date(`${checkin}T00:00:00`);
		const co = new Date(`${checkout}T00:00:00`);
		const nights = Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
		// Both endpoints count as billable days (matches calcDays / picker).
		const days = nights + 1;
		if (days < DAILY_MINIMUM_DAYS) {
			setStatus("error");
			setErrorMsg(
				`Minimum rental period is ${DAILY_MINIMUM_DAYS} days. Please select a longer stay.`,
			);
			return;
		}

		setStatus("submitting");
		setErrorMsg("");

		const form = e.currentTarget;
		const formData = new FormData(form);

		const payload = {
			name: formData.get("name") as string,
			email: formData.get("email") as string,
			checkin,
			checkout,
			accommodation: formData.get("accommodation") as string,
			peopleCount,
			people: people.map((p, i) => ({
				name: p.name || `Person ${i + 1}`,
				sex: p.sex,
				experience: p.experience,
				package: p.package,
				board: p.board,
				wetsuitSize: p.wetsuitSize,
			})),
			message: formData.get("message") as string,
			estimatedTotal: estimate.allSelected ? estimate.total : null,
		};

		try {
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			if (!res.ok) {
				const data = await res.json().catch(() => null);
				throw new Error(data?.error || "Something went wrong");
			}

			const okData = (await res.json().catch(() => null)) as {
				requestRef?: string;
			} | null;
			setRequestRef(okData?.requestRef ?? "");
			setSubmittedAt(new Date());

			trackBookingSubmitted({
				people_count: peopleCount,
				nights: days,
				packages: people
					.map((p) => pkgOptions.find((o) => o.value === p.package)?.tier ?? "unset")
					.join(","),
				has_wetsuit: people.some((p) => packageIncludesWetsuit(p.package, pkgOptions)),
				prefilled: didPrefill.current,
				estimated_total: estimate.allSelected ? estimate.total : null,
			});
			clearDraft();
			setStatus("success");
		} catch (err) {
			setStatus("error");
			setErrorMsg(
				err instanceof Error ? err.message : "Something went wrong. Please try again.",
			);
		}
	};

	if (status === "success") {
		const packagesLabel = people
			.map((p, i) => {
				const opt = pkgOptions.find((o) => o.value === p.package);
				const label = opt ? opt.label.split(" — ")[0] : "TBD";
				return people.length > 1 ? `Person ${i + 1}: ${label}` : label;
			})
			.join(" · ");
		const submittedName =
			formRef.current?.querySelector<HTMLInputElement>(
				"input[name='name']",
			)?.value ?? "";
		const submittedAcc =
			formRef.current?.querySelector<HTMLInputElement>(
				"input[name='accommodation']",
			)?.value ?? "";
		const firstName = submittedName.split(" ")[0] || "there";

		const whatsappBase = "https://wa.me/351929244395";
		const whatsappMsg = requestRef
			? `Hi Leon — following up on my booking request ${requestRef} (${firstName}, ${checkin} → ${checkout}).`
			: `Hi Leon — following up on my booking request (${firstName}, ${checkin} → ${checkout}).`;
		const whatsappHref = `${whatsappBase}?text=${encodeURIComponent(whatsappMsg)}`;
		const reply = submittedAt ? replyByLabel(submittedAt) : "";

		return (
			<div className="form-success">
				<div className="form-success-icon">
					<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
						<polyline points="22 4 12 14.01 9 11.01" />
					</svg>
				</div>
				<h3 className="form-success-title">
					Thanks {firstName} — request logged.
				</h3>
				{requestRef && (
					<p className="form-success-ref">
						Reference:{" "}
						<strong className="form-success-ref-code">{requestRef}</strong>
					</p>
				)}

				<dl className="form-success-echo">
					<dt>Dates</dt>
					<dd>
						{checkin} → {checkout}
					</dd>
					<dt>People</dt>
					<dd>{peopleCount}</dd>
					<dt>Package</dt>
					<dd>{packagesLabel}</dd>
					{submittedAcc && (
						<>
							<dt>Delivery</dt>
							<dd>{submittedAcc}</dd>
						</>
					)}
					{estimate.allSelected && (
						<>
							<dt>Estimate</dt>
							<dd>&euro;{estimate.total}</dd>
						</>
					)}
				</dl>

				{reply && <p className="form-success-reply">{reply}</p>}

				<ol className="form-success-timeline">
					<li>
						<span className="form-success-step-num">1</span>
						<span>Leon reads your request and matches gear.</span>
					</li>
					<li>
						<span className="form-success-step-num">2</span>
						<span>You get a personal reply with confirmed price.</span>
					</li>
					<li>
						<span className="form-success-step-num">3</span>
						<span>You confirm — pay by link or on arrival.</span>
					</li>
					<li>
						<span className="form-success-step-num">4</span>
						<span>We deliver on your check-in day.</span>
					</li>
				</ol>

				<a
					href={whatsappHref}
					className="form-success-whatsapp"
					target="_blank"
					rel="noopener noreferrer"
				>
					<svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
						<path d="M16.003 3C9.373 3 3.998 8.375 3.998 15.006c0 2.117.556 4.184 1.61 6.005L4 29l8.198-2.148a12.03 12.03 0 0 0 3.805.62h.005c6.63 0 12.005-5.376 12.005-12.006C28.013 8.375 22.632 3 16.003 3zm0 21.808h-.004a9.98 9.98 0 0 1-3.617-.68l-.259-.104-4.867 1.274 1.302-4.746-.169-.271a9.951 9.951 0 0 1-1.52-5.276c.001-5.504 4.48-9.98 9.987-9.98 2.667 0 5.174 1.04 7.06 2.926a9.9 9.9 0 0 1 2.923 7.058c-.001 5.504-4.481 9.98-9.836 9.98zm5.474-7.472c-.3-.15-1.774-.876-2.048-.977-.275-.101-.475-.15-.674.15-.2.301-.774.977-.948 1.176-.174.2-.35.226-.649.075-.3-.15-1.266-.466-2.412-1.487-.891-.795-1.492-1.777-1.667-2.077-.174-.301-.019-.463.131-.612.135-.135.3-.351.45-.526.15-.176.2-.301.3-.502.1-.2.05-.376-.025-.526-.075-.15-.674-1.626-.923-2.226-.244-.585-.492-.505-.674-.514l-.575-.011a1.104 1.104 0 0 0-.798.376c-.275.301-1.048 1.024-1.048 2.5s1.073 2.899 1.222 3.099c.15.2 2.11 3.222 5.114 4.518.716.309 1.274.492 1.71.63.72.229 1.373.196 1.89.119.577-.087 1.774-.725 2.024-1.426.25-.7.25-1.301.174-1.426-.075-.125-.275-.2-.575-.35z" />
					</svg>
					Message Leon on WhatsApp{requestRef ? ` with ${requestRef}` : ""}
				</a>

				<p className="form-success-sub">
					You&apos;ll also get a confirmation email at the address you
					provided. If it doesn&apos;t arrive within a few minutes, WhatsApp
					us — we&apos;ll take it from there.
				</p>
			</div>
		);
	}

	return (
		<>
			<form
				ref={formRef}
				className="contact-form"
				onSubmit={handleSubmit}
				onFocusCapture={handleFieldFocus}
				onBlurCapture={saveTextFields}
			>
				<div className="form-group">
					<label htmlFor="name">Name</label>
					<input type="text" id="name" name="name" required autoComplete="name" />
				</div>
				<div className="form-group">
					<label htmlFor="email">Email</label>
					<input type="email" id="email" name="email" required autoComplete="email" />
				</div>
			<DateRangePicker
				checkin={checkin}
				checkout={checkout}
				onCheckinChange={setCheckin}
				onCheckoutChange={setCheckout}
			/>
				<div className="form-group">
					<label htmlFor="accommodation">Accommodation address or name</label>
					<input type="text" id="accommodation" name="accommodation" placeholder="e.g. Casa Sol, Vale da Telha" required />
				</div>

				<div className="form-group">
					<label htmlFor="people-count">Number of people</label>
					<select id="people-count" name="people_count" required value={peopleCount} onChange={(e) => handlePeopleChange(Number(e.target.value))}>
						{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
							<option key={n} value={n}>{n}</option>
						))}
					</select>
				</div>

				<div className="person-list">
					{people.map((person, i) => {
						const isOpen = expandedPerson === i;
						const showWetsuit = packageIncludesWetsuit(person.package, pkgOptions);
						const wetsuitOpts = getWetsuitOptions(person.sex as Sex);

						if (!isOpen) {
							return (
								<div key={i} className="person-fieldset person-fieldset--collapsed" onClick={() => setExpandedPerson(i)}>
									<div className="person-collapsed-header">
										<span className="person-legend">{personDisplayName(person, i)}</span>
										<svg className="person-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
											<polyline points="6 9 12 15 18 9" />
										</svg>
									</div>
									<p className="person-collapsed-summary">{personSummaryLabel(person, pkgOptions)}</p>
								</div>
							);
						}

						return (
							<fieldset key={i} className="person-fieldset">
								<div className="person-expanded-header">
									{editingName === i ? (
										<input
											className="person-name-input"
											type="text"
											value={person.name}
											placeholder={`Person ${i + 1}`}
											autoFocus
											onChange={(e) => updatePerson(i, "name", e.target.value)}
											onBlur={() => setEditingName(null)}
											onKeyDown={(e) => { if (e.key === "Enter") setEditingName(null); }}
										/>
									) : (
										<legend className="person-legend">
											{personDisplayName(person, i)}
											<button
												type="button"
												className="person-edit-name"
												onClick={() => setEditingName(i)}
												title="Change name"
											>
												<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
													<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
													<path d="m15 5 4 4" />
												</svg>
											</button>
										</legend>
									)}
									{people.length > 1 && (
										<button type="button" className="person-remove" onClick={() => handleRemovePerson(i)} aria-label={`Remove person ${i + 1}`}>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
												<line x1="18" y1="6" x2="6" y2="18" />
												<line x1="6" y1="6" x2="18" y2="18" />
											</svg>
										</button>
									)}
								</div>
								<div className="person-fields">
									<div className="form-group">
										<label htmlFor={`sex-${i}`}>Sex</label>
										<select
											id={`sex-${i}`}
											name={`person_${i + 1}_sex`}
											required
											value={person.sex}
											onChange={(e) => updatePerson(i, "sex", e.target.value)}
										>
											{SEX_OPTIONS.map((o) => (
												<option key={o.value} value={o.value}>{o.label}</option>
											))}
										</select>
									</div>
									<div className="form-group">
										<label htmlFor={`experience-${i}`}>Experience <span className="form-optional">(optional)</span></label>
										<select
											id={`experience-${i}`}
											name={`person_${i + 1}_experience`}
											value={person.experience}
											onChange={(e) => updatePerson(i, "experience", e.target.value)}
										>
											{EXPERIENCE_OPTIONS.map((o) => (
												<option key={o.value} value={o.value}>{o.label}</option>
											))}
										</select>
									</div>
								<div className="form-group">
									<label htmlFor={`package-${i}`}>Package</label>
									<select
										id={`package-${i}`}
										name={`person_${i + 1}_package`}
										required
										value={person.package}
										onChange={(e) => updatePerson(i, "package", e.target.value)}
									>
										<option value="">Select a package</option>
										{pkgOptions.map((o) => (
											<option key={o.value} value={o.value}>{o.label}</option>
										))}
									</select>
									{(() => {
										const sel = pkgOptions.find((o) => o.value === person.package);
										if (!sel?.pricePerPerson) return null;
										return (
											<span className="package-price-tag">
												&euro;{sel.pricePerPerson} {formatDurationLabel(days)} per person
											</span>
										);
									})()}
								</div>
									<div className="form-group">
										<label htmlFor={`board-${i}`}>Board size <span className="form-optional">(optional)</span></label>
										<select
											id={`board-${i}`}
											name={`person_${i + 1}_board`}
											value={person.board}
											onChange={(e) => updatePerson(i, "board", e.target.value)}
										>
											{BOARD_OPTIONS.map((o) => (
												<option key={o.value} value={o.value}>{o.label}</option>
											))}
										</select>
										<button
											type="button"
											className="calc-modal-link"
											onClick={() => {
												trackBoardCalcOpened();
												setBoardCalcOpen(i);
											}}
										>
											calculate →
										</button>
									</div>
									{showWetsuit && (
										<div className="form-group">
											<label htmlFor={`wetsuit-${i}`}>Wetsuit size</label>
											<select
												id={`wetsuit-${i}`}
												name={`person_${i + 1}_wetsuit`}
												required
												value={person.wetsuitSize}
												onChange={(e) => updatePerson(i, "wetsuitSize", e.target.value)}
												disabled={!person.sex}
											>
												{wetsuitOpts.map((o) => (
													<option key={o.value} value={o.value}>{o.label}</option>
												))}
											</select>
											{person.sex && (
												<button
													type="button"
													className="calc-modal-link"
													onClick={() => {
														trackWetsuitCalcOpened(person.sex);
														setWetsuitCalcOpen(i);
													}}
												>
													calculate →
												</button>
											)}
										</div>
									)}
								</div>
							</fieldset>
						);
					})}

					{people.length < 8 && (
						<button type="button" className="btn btn-outline person-add-btn" onClick={handleAddPerson}>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<line x1="12" y1="5" x2="12" y2="19" />
								<line x1="5" y1="12" x2="19" y2="12" />
							</svg>
							Add person
						</button>
					)}
				</div>

				<div className="form-group">
					<label htmlFor="message">Anything else we should know?</label>
					<textarea id="message" name="message" rows={4} placeholder="Board preferences, special requests, questions..." />
				</div>
			{estimate.selectedCount > 0 && (
				<div className="estimate-summary">
					<div className="estimate-header">
						<span className="estimate-label">Estimated total</span>
						{estimate.allSelected ? (
							<span className="estimate-amount">&euro;{estimate.total}</span>
						) : (
							<span className="estimate-amount estimate-amount--partial">&euro;{estimate.total}+</span>
						)}
					</div>
					{estimate.allSelected && people.length > 1 && (
						<div className="estimate-breakdown">
							{people.map((person, i) => {
								const opt = pkgOptions.find((o) => o.value === person.package);
								if (!opt?.pricePerPerson) return null;
								return (
									<div key={i} className="estimate-line">
										<span>Person {i + 1} &middot; {opt.label.split(" — ")[0]}</span>
										<span>&euro;{opt.pricePerPerson}</span>
									</div>
								);
							})}
						</div>
					)}
					<p className="estimate-note">
						Final pricing confirmed in our personalized reply
					</p>
					<div className="estimate-rating">
						<span className="estimate-rating-stars" aria-hidden="true">★★★★★</span>
						<span className="estimate-rating-text">4.9 on Google · 8 reviews</span>
					</div>
					<ul className="estimate-trust">
						<li>Free delivery in Aljezur, Arrifana &amp; Vale da Telha</li>
						<li>Pay on arrival — no upfront payment</li>
						<li>Free cancellation up to 72h after booking</li>
					</ul>
				</div>
			)}

			{status === "error" && (
				<div className="form-error">
					<p>{errorMsg || "Something went wrong. Please try again or contact us via WhatsApp."}</p>
				</div>
			)}

			<div className="submit-reassure">
				<div className="submit-reassure-line">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<rect x="3" y="6" width="18" height="13" rx="1" />
						<path d="M3 10h18" />
						<line x1="7" y1="15" x2="10" y2="15" />
					</svg>
					<span>
						<strong>No card charged now.</strong> Leon confirms availability
						first, then you pay by link or on arrival.
					</span>
				</div>
				<div className="submit-reassure-line">
					<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
						<circle cx="12" cy="12" r="9" />
						<path d="M12 7v5l3 2" />
					</svg>
					<span>
						<strong>Personal reply usually within 3 hours</strong> · Mon–Sun
						08:00–20:00 Portugal (GMT+1).
					</span>
				</div>
			</div>

			<button
				type="submit"
				className="btn btn-primary btn-full"
				disabled={status === "submitting"}
			>
				{status === "submitting" ? "Sending..." : "Send request — no payment now"}
			</button>
			</form>

			<BoardCalcModal
				open={boardCalcOpen !== null}
				onClose={() => setBoardCalcOpen(null)}
				onSelect={(value) => {
					if (boardCalcOpen !== null) updatePerson(boardCalcOpen, "board", value);
					trackBoardCalcResult(value);
					setBoardCalcOpen(null);
				}}
			/>

			<WetsuitCalcModal
				open={wetsuitCalcOpen !== null}
				sex={wetsuitCalcSex}
				onClose={() => setWetsuitCalcOpen(null)}
				onSelect={(size) => {
					if (wetsuitCalcOpen !== null) updatePerson(wetsuitCalcOpen, "wetsuitSize", size);
					trackWetsuitCalcResult({ sex: wetsuitCalcSex, size });
					setWetsuitCalcOpen(null);
				}}
			/>
		</>
	);
}
