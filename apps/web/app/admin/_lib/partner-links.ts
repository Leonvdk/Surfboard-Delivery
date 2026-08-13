// Partner / marketing UTM link helpers. Kept out of the "use server" actions
// module because those may only export async functions. Pure functions here,
// so they're safe to import into client components (the live link preview).

const SITE_URL = "https://surfrental-aljezur.com";

/** The link categories Leon files his UTM links under, for filtering. */
export const LINK_CATEGORIES = ["social", "marketing", "partner", "referral"] as const;
export type LinkCategoryValue = (typeof LINK_CATEGORIES)[number];

/** Sensible default utm_medium per category. GA groups traffic by medium, so
 * these keep channels tidy: social posts, email/ads, partner referrals, and
 * general referral links (word-of-mouth, referral programmes). */
export const CATEGORY_MEDIUM: Record<LinkCategoryValue, string> = {
	social: "social",
	marketing: "email",
	partner: "referral",
	referral: "referral",
};

/** Turn a free-text value into a stable, lowercase UTM token (GA is
 * case-sensitive, so consistency stops channels fragmenting). */
export function utmToken(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 60);
}

/** Build a full campaign URL from its parts. Destination is a path on the
 * site ("/", "/contact", …); the utm_* params are appended in a stable order. */
export function buildUtmUrl(opts: {
	destination: string;
	source: string;
	medium: string;
	campaign: string;
}): string {
	const raw = opts.destination.trim() || "/";
	const path = raw.startsWith("/") ? raw : `/${raw}`;
	const params = new URLSearchParams({
		utm_source: opts.source,
		utm_medium: opts.medium,
		utm_campaign: opts.campaign,
	});
	return `${SITE_URL}${path}?${params.toString()}`;
}

/** The UTM link to hand a partner. Clicks land in GA's Referral channel under
 * the partner's source; the code's redemptions show up in Stripe — so a
 * partner code carries both traffic and revenue attribution. */
export function partnerUtmLink(source: string): string {
	return `${SITE_URL}/?utm_source=${source}&utm_medium=referral&utm_campaign=partners`;
}

/** Turn a partner name into a stable, URL-safe utm_source slug. */
export function slugifySource(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "")
		.slice(0, 40);
}
