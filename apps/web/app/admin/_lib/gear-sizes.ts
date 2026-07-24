import type { GearKind } from "../../lib/db/schema";

/** Size vocabularies per gear kind — shared by the fleet page's add
 * forms, the edit modal, and server-side validation in _board-actions. */

export const BOARD_SIZES = ["6'6", "7'0", "7'8", "8'6"] as const;

export const WETSUIT_SIZES = [
	"XS",
	"S",
	"M",
	"L",
	"XL",
	"100-110",
	"110-120",
	"120-130",
	"130-140",
	"140-150",
	"150-160",
] as const;

export const GEAR_KIND_LABEL: Record<GearKind, string> = {
	board: "Board",
	wetsuit: "Wetsuit",
	other: "Other gear",
};

/** Server-side size validation, matching what each kind's form offers.
 * Other gear has no meaningful size — free text, empty allowed. */
export function isValidSize(kind: GearKind, size: string): boolean {
	if (kind === "board") return (BOARD_SIZES as readonly string[]).includes(size);
	if (kind === "wetsuit")
		return (WETSUIT_SIZES as readonly string[]).includes(size);
	return size.length <= 40;
}
