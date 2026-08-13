"use client";

import { useActionState, useMemo, useState } from "react";
import { buildUtmUrl, CATEGORY_MEDIUM, utmToken } from "../_lib/partner-links";
import { createMarketingLink, type LinkFormState } from "../_link-actions";
import { CopyButton } from "./copy-button";

const INITIAL: LinkFormState = { ok: false, message: "" };

// Common landing pages, so Leon usually just picks one instead of typing a path.
const PAGES = [
	{ label: "Homepage", path: "/" },
	{ label: "Contact / booking", path: "/contact" },
	{ label: "How it works", path: "/how-it-works" },
	{ label: "Reviews", path: "/reviews" },
	{ label: "Blog", path: "/blog" },
];

/**
 * Build-a-UTM-link form. The category sets a sensible default medium (social →
 * social, marketing → email, partner → referral) that stays editable, and the
 * live preview shows the exact link — normalised the same way it's saved — so
 * there are no surprises.
 */
export function LinkForm() {
	const [state, action, pending] = useActionState(createMarketingLink, INITIAL);
	const [category, setCategory] = useState<"social" | "marketing" | "partner" | "referral">(
		"social",
	);
	// The destination is picked from a dropdown; "__custom" reveals a path field.
	const [pageChoice, setPageChoice] = useState("/");
	const [customPath, setCustomPath] = useState("");
	const isCustomPage = pageChoice === "__custom";
	const destination = isCustomPage ? customPath.trim() || "/" : pageChoice;
	const [source, setSource] = useState("");
	const [campaign, setCampaign] = useState("");
	const [tags, setTags] = useState("");
	// Medium follows the category (social → social, marketing → email, …).
	const medium = CATEGORY_MEDIUM[category];

	// Preview mirrors the server's normalisation, so what you see is what saves.
	const preview = useMemo(
		() =>
			buildUtmUrl({
				destination: destination || "/",
				source: utmToken(source) || "source",
				medium,
				campaign: utmToken(campaign) || "campaign",
			}),
		[destination, source, medium, campaign],
	);

	return (
		<form action={action} className="admin-board-form admin-link-form">
			<div className="admin-board-form-grid">
				<label>
					Category
					<select
						name="category"
						className="admin-input"
						value={category}
						onChange={(e) => setCategory(e.target.value as typeof category)}
					>
						<option value="social">Social</option>
						<option value="marketing">Marketing</option>
						<option value="partner">Partner</option>
						<option value="referral">Referral</option>
					</select>
				</label>
				<label>
					Destination page
					<select
						className="admin-input"
						value={pageChoice}
						onChange={(e) => setPageChoice(e.target.value)}
					>
						{PAGES.map((p) => (
							<option key={p.path} value={p.path}>
								{p.label}
							</option>
						))}
						<option value="__custom">Custom path…</option>
					</select>
				</label>
				{isCustomPage && (
					<label>
						Custom path
						<input
							type="text"
							className="admin-input"
							value={customPath}
							onChange={(e) => setCustomPath(e.target.value)}
							placeholder="/some/page"
						/>
					</label>
				)}
				{/* The resolved destination goes to the server as a hidden field. */}
				<input type="hidden" name="destination" value={destination} />
				<label>
					Source
					<input
						type="text"
						name="source"
						required
						className="admin-input"
						value={source}
						onChange={(e) => setSource(e.target.value)}
						placeholder="e.g. linkedin, instagram, newsletter"
					/>
				</label>
				<label>
					Campaign
					<input
						type="text"
						name="campaign"
						required
						className="admin-input"
						value={campaign}
						onChange={(e) => setCampaign(e.target.value)}
						placeholder="e.g. spring_launch"
					/>
				</label>
				<label>
					Tags <span className="admin-label-opt">(optional, comma separated)</span>
					<input
						type="text"
						name="tags"
						className="admin-input"
						value={tags}
						onChange={(e) => setTags(e.target.value)}
						placeholder="e.g. launch, discount, winter"
					/>
				</label>
			</div>

			<div className="admin-link-preview">
				<span className="admin-link-preview-label">Preview</span>
				<code className="admin-link-preview-url">{preview}</code>
				<CopyButton value={preview} label="copy" />
			</div>

			{state.message && (
				<p
					className={
						state.ok
							? "admin-card-hint admin-discount-ok"
							: "admin-card-hint admin-sync-status--warn"
					}
				>
					{state.message}
				</p>
			)}

			<button type="submit" className="admin-btn" disabled={pending}>
				{pending ? "Saving…" : "Save link"}
			</button>
		</form>
	);
}
