// Date helpers used across the admin pages. Everything is done against the
// booking's stored date strings (YYYY-MM-DD) so the "today" comparisons are
// deterministic regardless of TZ.

export function todayIso(): string {
	const d = new Date();
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function addDaysIso(iso: string, days: number): string {
	const d = new Date(`${iso}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

export function daysBetween(startIso: string, endIso: string): number {
	const a = new Date(`${startIso}T00:00:00Z`).getTime();
	const b = new Date(`${endIso}T00:00:00Z`).getTime();
	return Math.round((b - a) / 86400000);
}

export function formatShortDate(iso: string): string {
	if (!iso) return "";
	const d = new Date(`${iso}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return iso;
	const day = d.getUTCDate();
	const month = d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" });
	const year2 = String(d.getUTCFullYear() % 100).padStart(2, "0");
	return `${day} ${month} '${year2}`;
}

export function formatLongDate(iso: string): string {
	if (!iso) return "";
	const d = new Date(`${iso}T00:00:00Z`);
	if (Number.isNaN(d.getTime())) return iso;
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
		timeZone: "UTC",
	});
}
