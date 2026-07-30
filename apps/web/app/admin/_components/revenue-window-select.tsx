"use client";

import { useRouter } from "next/navigation";
import {
	REVENUE_WINDOW_COOKIE,
	REVENUE_WINDOWS,
} from "../_lib/revenue-window";

/**
 * Time-window selector for the Revenue page. Writes the choice to a cookie
 * (so the server restores it on the next landing, no flash) and navigates
 * with the window in the query so the page re-renders scoped to it.
 */
export function RevenueWindowSelect({ value }: { value: string }) {
	const router = useRouter();

	function choose(key: string) {
		document.cookie = `${REVENUE_WINDOW_COOKIE}=${key}; path=/; max-age=31536000; samesite=lax`;
		router.push(`/admin/revenue?window=${key}`);
	}

	return (
		<div className="admin-window-select" role="group" aria-label="Time window">
			{REVENUE_WINDOWS.map((w) => (
				<button
					key={w.key}
					type="button"
					className={`admin-window-opt${w.key === value ? " admin-window-opt--active" : ""}`}
					aria-pressed={w.key === value}
					onClick={() => choose(w.key)}
				>
					{w.label}
				</button>
			))}
		</div>
	);
}
