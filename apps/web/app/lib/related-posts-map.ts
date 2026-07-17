// Hand-picked internal links from winning canonicals to related content.
// Only these slugs get a visible "Related reading" section — keeps PageRank
// flowing to intentional posts rather than every random tag match.

export const RELATED_POSTS_MAP: Record<string, string[]> = {
	"best-time-to-surf-aljezur": [
		"summer-surfing-aljezur",
		"winter-surfing-aljezur",
		"aljezur-off-season-surfing",
		"aljezur-vs-peniche-vs-ericeira",
	],
	"getting-to-aljezur": [
		"best-time-to-surf-aljezur",
		"where-to-stay-aljezur",
		"aljezur-vs-peniche-vs-ericeira",
		"one-week-aljezur-itinerary",
	],
	"aljezur-vs-peniche-vs-ericeira": [
		"aljezur-vs-sagres-surf",
		"aljezur-vs-ericeira-surf",
		"aljezur-vs-lagos-surf",
		"aljezur-vs-nazare-for-beginners",
		"best-time-to-surf-aljezur",
		"getting-to-aljezur",
	],
	"aljezur-vs-lagos-surf": [
		"aljezur-vs-sagres-surf",
		"aljezur-vs-peniche-vs-ericeira",
		"best-time-to-surf-aljezur",
		"getting-to-aljezur",
	],
	"aljezur-vs-nazare-for-beginners": [
		"aljezur-vs-peniche-vs-ericeira",
		"best-time-to-surf-aljezur",
		"getting-to-aljezur",
	],
	"aljezur-vs-sagres-surf": [
		"aljezur-vs-peniche-vs-ericeira",
		"aljezur-vs-lagos-surf",
		"best-time-to-surf-aljezur",
		"getting-to-aljezur",
	],
	"aljezur-vs-ericeira-surf": [
		"aljezur-vs-peniche-vs-ericeira",
		"aljezur-vs-sagres-surf",
		"best-time-to-surf-aljezur",
	],
	"summer-surfing-aljezur": [
		"best-time-to-surf-aljezur",
		"aljezur-off-season-surfing",
		"aljezur-vs-peniche-vs-ericeira",
	],
	"winter-surfing-aljezur": [
		"best-time-to-surf-aljezur",
		"aljezur-off-season-surfing",
		"aljezur-vs-peniche-vs-ericeira",
	],
	"aljezur-off-season-surfing": [
		"best-time-to-surf-aljezur",
		"summer-surfing-aljezur",
		"winter-surfing-aljezur",
	],
	"portugal-vs-france-surf": [
		"aljezur-vs-peniche-vs-ericeira",
		"best-time-to-surf-aljezur",
		"getting-to-aljezur",
	],
};
