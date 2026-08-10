// Partner UTM link helpers. Kept out of the "use server" actions module
// because those may only export async functions.

const SITE_URL = "https://surfrental-aljezur.com";

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
