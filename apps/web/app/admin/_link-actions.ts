"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb } from "../lib/db/client";
import { type LinkCategory, type MarketingLink, marketingLinks } from "../lib/db/schema";
import { buildUtmUrl, CATEGORY_MEDIUM, LINK_CATEGORIES, utmToken } from "./_lib/partner-links";

export interface LinkFormState {
	ok: boolean;
	message: string;
}

function isCategory(v: string): v is LinkCategory {
	return (LINK_CATEGORIES as readonly string[]).includes(v);
}

/** Load every saved link, newest first (for the list). Returns [] with no DB. */
export async function listMarketingLinks(): Promise<MarketingLink[]> {
	const db = getDb();
	if (!db) return [];
	return db.select().from(marketingLinks).orderBy(desc(marketingLinks.createdAt));
}

/**
 * Save a categorised UTM link. Shaped for useActionState — returns a message
 * rather than throwing. utm_medium is derived from the category; source and
 * campaign are normalised to lowercase UTM tokens so GA channels stay tidy;
 * the full URL is stored for one-click copy. Optional free-text tags (comma
 * separated) group links for filtering.
 */
export async function createMarketingLink(
	_prev: LinkFormState,
	formData: FormData,
): Promise<LinkFormState> {
	const db = getDb();
	if (!db) return { ok: false, message: "Database isn't configured (DATABASE_URL)." };

	const category = String(formData.get("category") ?? "");
	const destinationRaw = String(formData.get("destination") ?? "").trim() || "/";
	const source = utmToken(String(formData.get("source") ?? ""));
	const campaign = utmToken(String(formData.get("campaign") ?? ""));

	if (!isCategory(category)) return { ok: false, message: "Pick a category." };
	if (!source) return { ok: false, message: "Enter a source (e.g. linkedin, instagram)." };
	if (!campaign) return { ok: false, message: "Enter a campaign name." };

	// Medium follows the category — one less thing to get wrong.
	const medium = CATEGORY_MEDIUM[category];

	// Tags: split on commas, normalise, drop blanks/dupes. Null when none.
	const tags = Array.from(
		new Set(
			String(formData.get("tags") ?? "")
				.split(",")
				.map((t) => t.trim().toLowerCase())
				.filter(Boolean),
		),
	);

	const destination = destinationRaw.startsWith("/") ? destinationRaw : `/${destinationRaw}`;
	const url = buildUtmUrl({ destination, source, medium, campaign });

	try {
		await db.insert(marketingLinks).values({
			category,
			destination,
			source,
			medium,
			campaign,
			tags: tags.length ? tags : null,
			url,
		});
		revalidatePath("/admin/links");
		return { ok: true, message: `Saved ${source} · ${campaign}. Copy it from the list below.` };
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return { ok: false, message: `Couldn't save it: ${message}` };
	}
}

/** Remove a saved link from the inventory. Doesn't affect GA — past clicks are
 * already recorded there; this only tidies Leon's list. */
export async function deleteMarketingLink(id: number) {
	const db = getDb();
	if (!db) return;
	try {
		await db.delete(marketingLinks).where(eq(marketingLinks.id, id));
		revalidatePath("/admin/links");
	} catch (err) {
		console.error("Delete marketing link failed:", err);
	}
}
