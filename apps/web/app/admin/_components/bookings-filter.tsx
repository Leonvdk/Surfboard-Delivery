"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import type { BookingStatus } from "../../lib/db/schema";

interface Props {
	counts: Record<BookingStatus, number>;
	total: number;
}

const STATUS_FILTERS: Array<{ value: BookingStatus | "all"; label: string }> = [
	{ value: "all", label: "All" },
	{ value: "requested", label: "Requested" },
	{ value: "confirmed", label: "Confirmed" },
	{ value: "in_progress", label: "In progress" },
	{ value: "completed", label: "Completed" },
	{ value: "cancelled", label: "Cancelled" },
];

export function BookingsFilter({ counts, total }: Props) {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();
	const [pending, startTransition] = useTransition();

	const currentStatus = (params.get("status") ?? "all") as BookingStatus | "all";
	const currentQ = params.get("q") ?? "";

	const [q, setQ] = useState(currentQ);

	useEffect(() => {
		setQ(currentQ);
	}, [currentQ]);

	function update(nextStatus: BookingStatus | "all", nextQ: string) {
		const p = new URLSearchParams(params.toString());
		if (nextStatus === "all") p.delete("status");
		else p.set("status", nextStatus);
		if (nextQ) p.set("q", nextQ);
		else p.delete("q");
		const qs = p.toString();
		startTransition(() => {
			router.push(qs ? `${pathname}?${qs}` : pathname);
		});
	}

	function onSubmit(e: FormEvent) {
		e.preventDefault();
		update(currentStatus, q);
	}

	function countFor(v: BookingStatus | "all"): number {
		if (v === "all") return total;
		return counts[v] ?? 0;
	}

	return (
		<div className="bookings-filter">
			<div className="bookings-filter-chips">
				{STATUS_FILTERS.map((s) => (
					<button
						key={s.value}
						type="button"
						className={`bookings-filter-chip${s.value === currentStatus ? " bookings-filter-chip--active" : ""}`}
						onClick={() => update(s.value, q)}
					>
						{s.label} <span className="bookings-filter-count">{countFor(s.value)}</span>
					</button>
				))}
			</div>
			<form onSubmit={onSubmit} className="bookings-filter-search">
				<input
					type="search"
					className="bookings-filter-input"
					placeholder="Search name, email, or accommodation"
					value={q}
					onChange={(e) => setQ(e.target.value)}
				/>
				<button
					type="submit"
					className="bookings-filter-submit"
					disabled={pending}
				>
					{pending ? "…" : "Search"}
				</button>
			</form>
		</div>
	);
}
