"use client";

import { useEffect, useState } from "react";

const KEY = "sra_fleet_attention";
const SNOOZE_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

/**
 * Fleet "needs attention" warning — same look as the home-page alerts, but
 * snoozable and dismissable. Both actions are keyed to a `signature` of the
 * current issue set, so a *new* problem still surfaces even if an earlier one
 * was snoozed or dismissed.
 */
export function FleetAttention({
	signature,
	count,
	lead,
}: {
	signature: string;
	count: number;
	lead: string;
}) {
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		try {
			const s = JSON.parse(localStorage.getItem(KEY) || "{}");
			if (s.dismissedSig === signature) return;
			if (s.snoozedSig === signature && s.snoozedUntil && Date.now() < s.snoozedUntil)
				return;
			setVisible(true);
		} catch {
			setVisible(true);
		}
	}, [signature]);

	if (!visible) return null;

	const persist = (patch: Record<string, unknown>) => {
		try {
			const s = JSON.parse(localStorage.getItem(KEY) || "{}");
			localStorage.setItem(KEY, JSON.stringify({ ...s, ...patch }));
		} catch {
			/* storage blocked — hiding for this session still works */
		}
	};
	const dismiss = () => {
		persist({ dismissedSig: signature, snoozedSig: "", snoozedUntil: 0 });
		setVisible(false);
	};
	const snooze = () => {
		persist({ snoozedSig: signature, snoozedUntil: Date.now() + SNOOZE_MS, dismissedSig: "" });
		setVisible(false);
	};

	return (
		<article className="admin-attention admin-attention--alert fleet-attention">
			<div className="admin-attention-header">
				<span className="admin-attention-kicker">Needs attention</span>
				<span className="admin-attention-count">{count}</span>
			</div>
			<p className="admin-attention-lead">{lead}</p>
			<div className="fleet-attention-actions">
				<button type="button" className="fleet-attention-btn" onClick={snooze}>
					Snooze 3 days
				</button>
				<button type="button" className="fleet-attention-btn" onClick={dismiss}>
					Dismiss
				</button>
			</div>
		</article>
	);
}
