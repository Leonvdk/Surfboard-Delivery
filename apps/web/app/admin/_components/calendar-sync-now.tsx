"use client";

import { useState } from "react";
import { syncCalendarNow } from "../_actions";
import { CheckIcon, WarningIcon } from "./icons";

type Result = Awaited<ReturnType<typeof syncCalendarNow>>;

/**
 * On-demand "Sync now" — runs the whole forward window against Google and
 * shows the real outcome inline, including Google's error text on failure.
 * This is the tool for answering "is it actually working?" without digging
 * through Vercel logs, and it backfills existing bookings in one tap.
 */
export function CalendarSyncNow() {
	const [busy, setBusy] = useState(false);
	const [result, setResult] = useState<Result | null>(null);

	async function run() {
		setBusy(true);
		setResult(null);
		try {
			setResult(await syncCalendarNow());
		} catch (err) {
			setResult({
				configured: true,
				ok: false,
				bookings: 0,
				created: 0,
				updated: 0,
				deleted: 0,
				failures: [{ id: 0, error: err instanceof Error ? err.message : String(err) }],
			});
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className="admin-sync-now">
			<button type="button" className="admin-btn" onClick={run} disabled={busy}>
				{busy ? "Syncing…" : "Sync now"}
			</button>

			{result && !result.configured && (
				<p className="admin-sync-result admin-sync-result--warn">
					<WarningIcon /> Not configured — set GOOGLE_CALENDAR_ID,
					GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_KEY in Vercel.
				</p>
			)}

			{result?.configured && result.ok && (
				<p className="admin-sync-result admin-sync-result--ok">
					<CheckIcon /> Synced {result.bookings} booking
					{result.bookings === 1 ? "" : "s"} — {result.created} created,{" "}
					{result.updated} updated
					{result.deleted > 0 ? `, ${result.deleted} removed` : ""}.
				</p>
			)}

			{result?.configured && !result.ok && (
				<div className="admin-sync-result admin-sync-result--warn">
					<p>
						<WarningIcon /> {result.failures.length} failed. Most common cause:
						the calendar isn&apos;t shared with the service account (Google
						returns 404), or the key is wrong (401/403).
					</p>
					<ul className="admin-sync-errors">
						{result.failures.slice(0, 5).map((f, i) => (
							<li key={`${f.id}-${i}`}>
								{f.id > 0 ? `Booking #${f.id}: ` : ""}
								{f.error}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
}
