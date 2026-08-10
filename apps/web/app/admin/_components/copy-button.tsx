"use client";

import { useState } from "react";

/** Copy a value to the clipboard with brief "copied" feedback. */
export function CopyButton({ value, label = "copy" }: { value: string; label?: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			className="admin-copy-btn"
			title={value}
			onClick={async () => {
				try {
					await navigator.clipboard.writeText(value);
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				} catch {
					/* clipboard blocked — the title attribute still shows the value */
				}
			}}
		>
			{copied ? "copied ✓" : label}
		</button>
	);
}
