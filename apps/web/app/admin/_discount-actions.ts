"use server";

import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { type PackageTier, packages } from "../lib/pricing";
import { getStripe } from "../lib/stripe";
import { getPackageProductId } from "../lib/stripe-packages";
import { partnerUtmLink, slugifySource } from "./_lib/partner-links";

export interface DiscountFormState {
	ok: boolean;
	message: string;
}

const TIERS: PackageTier[] = ["boardOnly", "fullPackage", "premium"];
function isTier(v: string): v is PackageTier {
	return (TIERS as string[]).includes(v);
}


/**
 * Create a discount code = a Stripe Coupon (the % or € rule) + a Promotion
 * Code (the customer-facing string). Package-restricted codes point the
 * coupon's applies_to at the stable package product; those are percentage-only
 * because Stripe rejects amount_off + applies_to. An optional redemption cap
 * lives on the promotion code.
 *
 * Shaped for useActionState — returns a message rather than throwing.
 */
export async function createDiscount(
	_prev: DiscountFormState,
	formData: FormData,
): Promise<DiscountFormState> {
	const stripe = getStripe();
	if (!stripe) {
		return { ok: false, message: "Stripe isn't configured (STRIPE_SECRET_KEY)." };
	}

	const code = String(formData.get("code") ?? "")
		.trim()
		.toUpperCase();
	const valueType = String(formData.get("valueType") ?? "percent");
	const value = Number(formData.get("value"));
	const scope = String(formData.get("scope") ?? "all");
	const maxRaw = String(formData.get("maxRedemptions") ?? "").trim();
	const partner = String(formData.get("partner") ?? "").trim();
	const source = partner ? slugifySource(partner) : "";

	if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
		return {
			ok: false,
			message: "Code must be 3–40 characters: letters, numbers, - or _.",
		};
	}
	if (valueType !== "percent" && valueType !== "amount") {
		return { ok: false, message: "Pick a discount type." };
	}
	if (!Number.isFinite(value) || value <= 0) {
		return { ok: false, message: "Enter a positive discount value." };
	}
	if (valueType === "percent" && value > 100) {
		return { ok: false, message: "A percentage can't be over 100." };
	}
	const packageScoped = scope !== "all";
	if (packageScoped && !isTier(scope)) {
		return { ok: false, message: "Unknown package." };
	}
	if (packageScoped && valueType === "amount") {
		return {
			ok: false,
			message:
				"Package-specific codes must be a percentage — Stripe doesn't allow a fixed € amount limited to one product.",
		};
	}

	let maxRedemptions: number | null = null;
	if (maxRaw !== "") {
		const n = Number(maxRaw);
		if (!Number.isInteger(n) || n <= 0) {
			return { ok: false, message: "Usage limit must be a whole number, or blank for unlimited." };
		}
		maxRedemptions = n;
	}

	try {
		const couponParams: Stripe.CouponCreateParams = {
			duration: "once",
			name:
				scope === "all"
					? `${code} — whole order`
					: `${code} — ${packages[scope as PackageTier].name}`,
		};
		if (valueType === "percent") couponParams.percent_off = value;
		else {
			couponParams.amount_off = Math.round(value * 100);
			couponParams.currency = "eur";
		}
		if (packageScoped) {
			const productId = await getPackageProductId(scope as PackageTier);
			if (!productId) {
				return {
					ok: false,
					message:
						"Couldn't set up the package product in Stripe — check the key has Products: Write, then retry.",
				};
			}
			couponParams.applies_to = { products: [productId] };
		}

		const coupon = await stripe.coupons.create(couponParams);

		// The 2026-06-24 API nests the coupon under `promotion`.
		await stripe.promotionCodes.create({
			promotion: { type: "coupon", coupon: coupon.id },
			code,
			...(maxRedemptions ? { max_redemptions: maxRedemptions } : {}),
			// Partner attribution lives on the promo code's metadata, so the
			// codes list can rebuild the UTM link without a local table.
			...(partner && source ? { metadata: { partner, utm_source: source } } : {}),
			active: true,
		});

		revalidatePath("/admin/discounts");
		const valueLabel = valueType === "percent" ? `${value}% off` : `€${value} off`;
		const scopeLabel = scope === "all" ? "the whole order" : packages[scope as PackageTier].name;
		return {
			ok: true,
			message: `Created ${code}: ${valueLabel} ${scopeLabel}${maxRedemptions ? `, limited to ${maxRedemptions} use${maxRedemptions === 1 ? "" : "s"}` : ""}.${partner && source ? ` Partner link: ${partnerUtmLink(source)}` : ""}`,
		};
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		// The common one: the code string is already in use.
		if (/already/i.test(message)) {
			return { ok: false, message: `Code “${code}” already exists in Stripe.` };
		}
		return { ok: false, message: `Stripe rejected it: ${message}` };
	}
}

/** Turn a promotion code off so it stops working at checkout. Stripe keeps it
 * for records — codes can't be hard-deleted, only deactivated. */
export async function deactivateDiscount(promotionCodeId: string) {
	const stripe = getStripe();
	if (!stripe) return;
	try {
		await stripe.promotionCodes.update(promotionCodeId, { active: false });
		revalidatePath("/admin/discounts");
	} catch (err) {
		console.error("Deactivate promotion code failed:", err);
	}
}
