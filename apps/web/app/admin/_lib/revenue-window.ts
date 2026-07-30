/**
 * The Revenue page time windows. Shared by the server page (to scope every
 * metric) and the client selector. `days: null` means all-time. Default is
 * all-time; the last-used window is remembered in a cookie so landing on
 * the page restores it.
 */
export interface RevenueWindow {
	key: string;
	label: string;
	days: number | null;
}

export const REVENUE_WINDOWS: RevenueWindow[] = [
	{ key: "week", label: "Last week", days: 7 },
	{ key: "30d", label: "30 days", days: 30 },
	{ key: "3mo", label: "3 months", days: 90 },
	{ key: "6mo", label: "6 months", days: 180 },
	{ key: "year", label: "Year", days: 365 },
	{ key: "all", label: "All time", days: null },
];

export const DEFAULT_WINDOW_KEY = "all";
export const REVENUE_WINDOW_COOKIE = "rev_window";

export function resolveWindow(key: string | undefined | null): RevenueWindow {
	return (
		REVENUE_WINDOWS.find((w) => w.key === key) ??
		REVENUE_WINDOWS.find((w) => w.key === DEFAULT_WINDOW_KEY)!
	);
}
