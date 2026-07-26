"use client";

import type { BookingAddon } from "../../lib/db/schema";
import {
	ADDON_CATALOG,
	calcAddonPrice,
	formatWeeksLabel,
} from "../../lib/pricing";

/**
 * Booking-level extras (roof racks etc.). Priced per started week over
 * the whole trip window, with a per-line override so a comped rack
 * reads as €0 on the bill rather than as a discount line.
 *
 * Shared by the new-booking form and the edit modal so both price the
 * same way — and so a new add-on in ADDON_CATALOG appears in both.
 */
export function AddonsEditor({
	addons,
	onChange,
	tripDays,
}: {
	addons: BookingAddon[];
	onChange: (next: BookingAddon[]) => void;
	tripDays: number | null;
}) {
	const find = (key: string) => addons.find((a) => a.key === key);

	const setQuantity = (key: string, quantity: number) => {
		const rest = addons.filter((a) => a.key !== key);
		if (quantity <= 0) {
			onChange(rest);
			return;
		}
		const existing = find(key);
		onChange([...rest, { ...(existing ?? { key }), key, quantity }]);
	};

	const setOverride = (key: string, raw: string) => {
		const existing = find(key);
		if (!existing) return;
		const parsed = Number.parseInt(raw, 10);
		const rest = addons.filter((a) => a.key !== key);
		onChange([
			...rest,
			{
				...existing,
				priceOverride:
					raw.trim() === "" || !Number.isFinite(parsed) ? null : parsed,
			},
		]);
	};

	return (
		<div className="admin-addons">
			{ADDON_CATALOG.map((tariff) => {
				const chosen = find(tariff.key);
				const qty = chosen?.quantity ?? 0;
				const tariffPrice = tripDays
					? calcAddonPrice(tariff.key, tripDays, Math.max(1, qty))
					: 0;
				return (
					<div key={tariff.key} className="admin-addon-row">
						<label className="admin-addon-toggle">
							<input
								type="checkbox"
								checked={qty > 0}
								onChange={(e) => setQuantity(tariff.key, e.target.checked ? 1 : 0)}
							/>
							<span>{tariff.label}</span>
						</label>

						<span className="admin-addon-tariff">
							€{tariff.firstWeek} first week · €{tariff.extraWeek}/week after
							{tripDays ? ` → ${formatWeeksLabel(tripDays)}` : ""}
						</span>

						{qty > 0 && (
							<span className="admin-addon-fields">
								<label>
									Qty
									<input
										type="number"
										min="1"
										className="admin-input"
										value={qty}
										onChange={(e) =>
											setQuantity(
												tariff.key,
												Math.max(1, Number.parseInt(e.target.value, 10) || 1),
											)
										}
									/>
								</label>
								<label>
									Price (€)
									<input
										type="number"
										min="0"
										className="admin-input"
										value={chosen?.priceOverride ?? ""}
										placeholder={String(tariffPrice)}
										onChange={(e) => setOverride(tariff.key, e.target.value)}
									/>
								</label>
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}

/** Sum of the add-on lines — used by both forms' running totals. */
export function addonsTotal(
	addons: BookingAddon[],
	tripDays: number | null,
): number {
	if (!tripDays) return 0;
	return addons.reduce((sum, a) => {
		if (a.priceOverride != null && a.priceOverride >= 0) return sum + a.priceOverride;
		return sum + calcAddonPrice(a.key, tripDays, a.quantity);
	}, 0);
}
