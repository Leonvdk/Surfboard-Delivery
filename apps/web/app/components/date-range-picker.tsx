"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const MONTH_NAMES = [
	"January", "February", "March", "April", "May", "June",
	"July", "August", "September", "October", "November", "December",
];
const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const MIN_DAYS = 5;
const MIN_ADVANCE_DAYS = 2;

function toDateStr(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDate(s: string): Date | null {
	if (!s) return null;
	const d = new Date(`${s}T00:00:00`);
	return Number.isNaN(d.getTime()) ? null : d;
}

function isSameDay(a: Date, b: Date): boolean {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function daysBetween(a: Date, b: Date): number {
	return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function getMonthDays(year: number, month: number): Date[] {
	const days: Date[] = [];
	const d = new Date(year, month, 1);
	while (d.getMonth() === month) {
		days.push(new Date(d));
		d.setDate(d.getDate() + 1);
	}
	return days;
}

interface DateRangePickerProps {
	checkin: string;
	checkout: string;
	onCheckinChange: (v: string) => void;
	onCheckoutChange: (v: string) => void;
}

export function DateRangePicker({
	checkin,
	checkout,
	onCheckinChange,
	onCheckoutChange,
}: DateRangePickerProps) {
	const [open, setOpen] = useState(false);
	const [hovered, setHovered] = useState<Date | null>(null);
	const [mounted, setMounted] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => setMounted(true), []);

	const today = useMemo(() => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d;
	}, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

	const minDate = useMemo(() => {
		const d = new Date(today);
		d.setDate(d.getDate() + MIN_ADVANCE_DAYS);
		return d;
	}, [today]);

	const startDate = parseDate(checkin);
	const endDate = parseDate(checkout);

	const [viewMonth, setViewMonth] = useState({ year: 0, month: 0 });

	useEffect(() => {
		const d = startDate || minDate;
		setViewMonth({ year: d.getFullYear(), month: d.getMonth() });
	}, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

	const days = useMemo(() => daysBetween(startDate || today, endDate || today), [startDate, endDate, today]);
	const tooShort = startDate && endDate && days < MIN_DAYS;

	const handleDayClick = useCallback(
		(day: Date) => {
			if (!startDate || endDate || day < startDate) {
				onCheckinChange(toDateStr(day));
				onCheckoutChange("");
			} else {
				onCheckoutChange(toDateStr(day));
				setOpen(false);
			}
		},
		[startDate, endDate, onCheckinChange, onCheckoutChange],
	);

	useEffect(() => {
		if (!open) return;
		const onClickOutside = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
		};
		const onEsc = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("mousedown", onClickOutside);
		document.addEventListener("keydown", onEsc);
		return () => {
			document.removeEventListener("mousedown", onClickOutside);
			document.removeEventListener("keydown", onEsc);
		};
	}, [open]);

	const nextMonth = {
		year: viewMonth.month === 11 ? viewMonth.year + 1 : viewMonth.year,
		month: viewMonth.month === 11 ? 0 : viewMonth.month + 1,
	};

	const goBack = () => {
		setViewMonth((v) => ({
			year: v.month === 0 ? v.year - 1 : v.year,
			month: v.month === 0 ? 11 : v.month - 1,
		}));
	};
	const goForward = () => {
		setViewMonth((v) => ({
			year: v.month === 11 ? v.year + 1 : v.year,
			month: v.month === 11 ? 0 : v.month + 1,
		}));
	};

	const canGoBack =
		viewMonth.year > minDate.getFullYear() ||
		(viewMonth.year === minDate.getFullYear() && viewMonth.month > minDate.getMonth());

	const formatDisplay = (d: Date | null) =>
		d ? d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

	return (
		<div className="drp" ref={ref}>
			<label className="drp-label">Rental dates</label>
			<button
				type="button"
				className="drp-trigger"
				onClick={() => setOpen((v) => !v)}
				aria-expanded={open}
			>
				<span className="drp-trigger-date">
					<span className="drp-trigger-sub">Delivery</span>
					{formatDisplay(startDate)}
				</span>
				<span className="drp-trigger-mid">
				{startDate && endDate && (
					<span className="drp-trigger-nights">
						{days} night{days !== 1 ? "s" : ""}
					</span>
				)}
				<span className="drp-trigger-arrow">→</span>
			</span>
				<span className="drp-trigger-date">
					<span className="drp-trigger-sub">Pickup</span>
					{formatDisplay(endDate)}
				</span>
			</button>

			{tooShort && (
				<p className="drp-warning">
					Minimum rental period is {MIN_DAYS} days. Please select a longer stay.
				</p>
			)}

			{startDate && endDate && !tooShort && days >= 10 && (
				<p className="form-duration-hint">Extended stay pricing applied</p>
			)}

			{open && (
				<div className="drp-dropdown">
					<div className="drp-nav">
						<button type="button" onClick={goBack} disabled={!canGoBack} aria-label="Previous month">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="15 18 9 12 15 6" />
							</svg>
						</button>
						<button type="button" onClick={goForward} aria-label="Next month">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="9 18 15 12 9 6" />
							</svg>
						</button>
					</div>
					<div className="drp-months">
						<MonthGrid
							year={viewMonth.year}
							month={viewMonth.month}
							minDate={minDate}
							startDate={startDate}
							endDate={endDate}
							hovered={hovered}
							onHover={setHovered}
							onClick={handleDayClick}
						/>
						<MonthGrid
							year={nextMonth.year}
							month={nextMonth.month}
							minDate={minDate}
							startDate={startDate}
							endDate={endDate}
							hovered={hovered}
							onHover={setHovered}
							onClick={handleDayClick}
						/>
					</div>
					{!endDate && startDate && (
						<p className="drp-hint">Now select your pickup date</p>
					)}
					{!startDate && (
						<p className="drp-hint">Select your delivery date</p>
					)}
				</div>
			)}

			<input type="hidden" name="checkin" value={checkin} />
			<input type="hidden" name="checkout" value={checkout} />
		</div>
	);
}

function MonthGrid({
	year,
	month,
	minDate,
	startDate,
	endDate,
	hovered,
	onHover,
	onClick,
}: {
	year: number;
	month: number;
	minDate: Date;
	startDate: Date | null;
	endDate: Date | null;
	hovered: Date | null;
	onHover: (d: Date | null) => void;
	onClick: (d: Date) => void;
}) {
	const days = useMemo(() => getMonthDays(year, month), [year, month]);
	const first = days[0];
	const firstDow = first ? (first.getDay() + 6) % 7 : 0;

	return (
		<div className="drp-month">
			<h3 className="drp-month-title">{MONTH_NAMES[month]} {year}</h3>
			<div className="drp-day-labels">
				{DAY_LABELS.map((d) => (
					<span key={d}>{d}</span>
				))}
			</div>
			<div className="drp-grid">
				{Array.from({ length: firstDow }).map((_, i) => (
					<span key={`pad-${i}`} />
				))}
				{days.map((day) => {
					const disabled = day < minDate;
					const isStart = startDate && isSameDay(day, startDate);
					const isEnd = endDate && isSameDay(day, endDate);
					const previewEnd = !endDate && startDate && hovered && hovered > startDate ? hovered : null;
					const inRange =
						startDate &&
						((endDate && day > startDate && day < endDate) ||
							(previewEnd && day > startDate && day <= previewEnd));

					let cls = "drp-day";
					if (disabled) cls += " drp-day--disabled";
					if (isStart) cls += " drp-day--start";
					if (isEnd) cls += " drp-day--end";
					if (inRange) cls += " drp-day--in-range";
					if (previewEnd && isSameDay(day, previewEnd)) cls += " drp-day--preview-end";

					return (
						<button
							key={day.getDate()}
							type="button"
							className={cls}
							disabled={disabled}
							onClick={() => onClick(day)}
							onMouseEnter={() => onHover(day)}
							onMouseLeave={() => onHover(null)}
						>
							{day.getDate()}
						</button>
					);
				})}
			</div>
		</div>
	);
}
