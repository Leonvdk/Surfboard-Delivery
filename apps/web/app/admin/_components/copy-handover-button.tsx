"use client";

import { useState } from "react";
import { CheckIcon } from "./icons";

/**
 * Copies a plain-text handover summary of a booking to the clipboard, so
 * Leon can paste it to whoever covers deliveries (e.g. the friend taking
 * over in August). The text is assembled server-side and passed in.
 */
export function CopyHandoverButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 2000);
		} catch {
			// Clipboard needs a secure context; fall back to a prompt so the
			// text is still selectable rather than silently failing.
			window.prompt("Copy this handover:", text);
		}
	}

	return (
		<button type="button" className="admin-btn" onClick={copy}>
			{copied ? (
				<>
					<CheckIcon /> Copied
				</>
			) : (
				"Copy handover"
			)}
		</button>
	);
}
