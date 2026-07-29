"use client";

import { useState } from "react";
import { enableTwoWaySync } from "../_actions";
import { CheckIcon, WarningIcon } from "./icons";

type Result = Awaited<ReturnType<typeof enableTwoWaySync>>;

/**
 * Enable / re-enable live two-way sync on demand. Registering the watch
 * channel needs a deployed HTTPS webhook and a Google-verified domain, so
 * the result (including the domain-verification instruction) is shown
 * inline rather than hidden in logs.
 */
export function TwoWaySyncToggle({
	active,
	expiration,
}: {
	active: boolean;
	expiration: string | null;
}) {
	const [busy, setBusy] = useState(false);
	const [result, setResult] = useState<Result | null>(null);

	async function run() {
		setBusy(true);
		setResult(null);
		try {
			setResult(await enableTwoWaySync());
		} catch (err) {
			setResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
		} finally {
			setBusy(false);
		}
	}

	const liveNow = result?.ok ?? active;

	return (
		<div className="admin-sync-now">
			<p className="admin-card-hint">
				<strong>Two-way sync.</strong> With this on, changing an event&apos;s
				time or location in Google Calendar writes back to the booking. Gear,
				price and which runs exist stay controlled here.
			</p>

			{liveNow ? (
				<p className="admin-sync-status admin-sync-status--ok">
					<CheckIcon /> Live sync is on
					{expiration ? ` · renews automatically` : ""}. Edit a delivery
					time or location in Google and it flows back here.
				</p>
			) : (
				<p className="admin-sync-status admin-sync-status--warn">
					<WarningIcon /> Live sync is off — edits in Google won&apos;t flow
					back until you enable it.
				</p>
			)}

			<button type="button" className="admin-btn" onClick={run} disabled={busy}>
				{busy ? "Enabling…" : liveNow ? "Re-enable live sync" : "Enable live 2-way sync"}
			</button>

			{result && !result.ok && (
				<p className="admin-sync-result admin-sync-result--warn">
					<WarningIcon /> {result.error}
				</p>
			)}
			{result?.ok && (
				<p className="admin-sync-result admin-sync-result--ok">
					<CheckIcon /> Live sync enabled.
				</p>
			)}
		</div>
	);
}
