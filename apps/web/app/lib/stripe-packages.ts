import { type PackageTier, packages } from "./pricing";
import { getStripe } from "./stripe";

/**
 * Stable Stripe Products for our three packages.
 *
 * Payment links otherwise mint a throwaway product per line (see
 * stripe-payment-link.ts). A package-restricted discount needs a *stable*
 * product to point its `applies_to` at, so this find-or-creates one product
 * per tier, tagged with metadata we can search by. The product carries no
 * price — prices stay inline and per-booking, exactly as before; only the
 * product identity is shared, which is what makes "20% off Premium" possible.
 *
 * Results are memoised per server process so we don't search Stripe on every
 * payment link.
 */

const METADATA_KEY = "sra_package";
const cache = new Map<PackageTier, string>();

export async function getPackageProductId(tier: PackageTier): Promise<string | null> {
	const cached = cache.get(tier);
	if (cached) return cached;

	const stripe = getStripe();
	if (!stripe) return null;

	try {
		// Search first so we never create duplicates across deploys/processes.
		const found = await stripe.products.search({
			query: `active:'true' AND metadata['${METADATA_KEY}']:'${tier}'`,
			limit: 1,
		});
		const existing = found.data[0];
		if (existing) {
			cache.set(tier, existing.id);
			return existing.id;
		}

		const created = await stripe.products.create({
			// Kept to the plain package name — this is what shows on the
			// customer's checkout line once the price is attached to it.
			name: packages[tier].name,
			metadata: { [METADATA_KEY]: tier },
		});
		cache.set(tier, created.id);
		return created.id;
	} catch (err) {
		console.error(`Stripe package product lookup failed for ${tier}:`, err);
		return null;
	}
}

/** All three package products, tier → productId (skips any that failed). */
export async function getAllPackageProductIds(): Promise<Record<PackageTier, string | null>> {
	const tiers: PackageTier[] = ["boardOnly", "fullPackage", "premium"];
	const ids = await Promise.all(tiers.map((t) => getPackageProductId(t)));
	return {
		boardOnly: ids[0] ?? null,
		fullPackage: ids[1] ?? null,
		premium: ids[2] ?? null,
	};
}
