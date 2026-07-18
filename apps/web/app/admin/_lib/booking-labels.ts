import type { BookingPerson } from "../../lib/db/schema";

const PACKAGE_LABEL: Record<string, string> = {
	premium: "Premium (board + wetsuit + changing mat + roof rack)",
	full: "Full Package (board + wetsuit)",
	board: "Board Only",
	custom: "Not sure — recommend",
};

const PACKAGE_SHORT: Record<string, string> = {
	premium: "Premium",
	full: "Full",
	board: "Board only",
	custom: "TBD",
};

const BOARD_LABEL: Record<string, string> = {
	"6'6": "6'6 Shortboard",
	"7'0": "7'0 Funboard",
	"7'8": "7'8 Funboard",
	"8'6": "8'6 Longboard",
};

const EXPERIENCE_LABEL: Record<string, string> = {
	never: "Never surfed",
	"few-times": "Surfed a few times",
	intermediate: "Intermediate",
	advanced: "Advanced",
};

const SEX_LABEL: Record<string, string> = {
	male: "Male",
	female: "Female",
	kid: "Kid",
};

// Older bookings (before the Round 3 CRO cleanup) used values like "board-1w"
// and "premium-2w"; strip the duration suffix so they look up cleanly.
function normalisePackage(value: string): string {
	return value.replace(/-\d+w$/, "");
}

export function packageLabel(value: string): string {
	if (!value) return "—";
	const key = normalisePackage(value);
	return PACKAGE_LABEL[key] ?? value;
}

export function packageShort(value: string): string {
	if (!value) return "TBD";
	const key = normalisePackage(value);
	return PACKAGE_SHORT[key] ?? value;
}

export function boardLabel(value: string): string {
	if (!value) return "Recommend one";
	return BOARD_LABEL[value] ?? value;
}

export function experienceLabel(value: string): string {
	if (!value) return "—";
	return EXPERIENCE_LABEL[value] ?? value;
}

export function sexLabel(value: string): string {
	if (!value) return "—";
	return SEX_LABEL[value] ?? value;
}

/**
 * Aggregate what needs to physically go out the door for this booking. Counts
 * packages, boards, and wetsuit sizes across all people so Leon can see the
 * total gear list at a glance.
 */
export function summariseGear(people: BookingPerson[] | null) {
	if (!people || people.length === 0) return null;

	const packages = new Map<string, number>();
	const boards = new Map<string, number>();
	const wetsuits = new Map<string, number>();

	for (const p of people) {
		const pkg = normalisePackage(p.package || "custom");
		packages.set(pkg, (packages.get(pkg) ?? 0) + 1);
		if (p.board) boards.set(p.board, (boards.get(p.board) ?? 0) + 1);
		if (p.wetsuitSize) wetsuits.set(p.wetsuitSize, (wetsuits.get(p.wetsuitSize) ?? 0) + 1);
	}

	const asRows = (map: Map<string, number>, format: (k: string) => string) =>
		Array.from(map.entries())
			.sort((a, b) => b[1] - a[1])
			.map(([key, count]) => ({ label: format(key), count }));

	return {
		packages: asRows(packages, packageShort),
		boards: asRows(boards, boardLabel),
		wetsuits: asRows(wetsuits, (k) => k),
	};
}
