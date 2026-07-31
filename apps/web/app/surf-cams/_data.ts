/**
 * Surf-cam spots. Each has a MEO Beachcam live-cam id (the segment used in
 * beachcam.meo.pt's own stream path, auth-beachcam/<camId>/playlist.m3u8) used
 * by the BeachcamCam iframe, plus a link to the full Beachcam page and a
 * Google Maps location.
 *
 * Keep this list in sync with app/sitemap.ts and the nav/footer links.
 */

export interface CamSpot {
	slug: string;
	/** Short display name, e.g. "Arrifana". */
	name: string;
	/** Full beach name, e.g. "Praia da Arrifana". */
	fullName: string;
	/** MEO Beachcam live-cam id (auth-beachcam/<camId>), for the iframe embed. */
	camId: string;
	/** Full-resolution live HD feed (link out, not embedded). */
	beachcamUrl: string;
	/** Google Maps location link. */
	mapsUrl: string;
	level: string;
	/** One-line hook for cards and the hero sub. */
	tagline: string;
	/** What you're looking at / why check this cam. 2–3 sentences. */
	blurb: string;
	bestConditions: string;
	whoFor: string;
	access: string;
}

function mapsUrl(query: string): string {
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export const CAM_SPOTS: CamSpot[] = [
	{
		slug: "arrifana",
		name: "Arrifana",
		fullName: "Praia da Arrifana",
		camId: "arrifana",
		beachcamUrl: "https://beachcam.meo.pt/livecams/arrifana/",
		mapsUrl: mapsUrl("Praia da Arrifana, Aljezur, Portugal"),
		level: "All levels",
		tagline: "The area's most reliable, sheltered bay — check it before you drive down.",
		blurb:
			"The live cam looks out over Arrifana's wide, cliff-backed bay. It's the quickest way to read the size and how busy the peaks are before you commit to the drive down. The bay faces southwest and its high cliffs block north and northwest wind, so it's often the cleanest, most surfable spot around when everywhere else is blown out.",
		bestConditions:
			"Works on all tides — many prefer mid to low for more defined walls. Picks up NW and W swell, and even wraps in energy when the neighbouring beaches are small. Cleanest with a light NE/E offshore, usually early morning.",
		whoFor:
			"Everyone. Gentle reforms on the inside for beginners, punchier peaks further out for intermediates, and the Kangaroos point at the north end — a rock reef, advanced surfers only — when a bigger NW swell wraps in.",
		access:
			"10 minutes from Aljezur, 5 from Vale da Telha. Clifftop parking, short walk down to the sand.",
	},
	{
		slug: "monte-clerigo",
		name: "Monte Clérigo",
		fullName: "Praia do Monte Clérigo",
		camId: "bcmonteclerigo",
		beachcamUrl: "https://beachcam.meo.pt/livecams/monte-clerigo/",
		mapsUrl: mapsUrl("Praia do Monte Clérigo, Aljezur, Portugal"),
		level: "Beginner – Intermediate",
		tagline: "Open beach break below the cliffs — forgiving inside, bigger outside.",
		blurb:
			"The cam shows the beach break in front of the little village. On a small, clean day the inside whitewater is crumbly and forgiving — a good place to find your feet. It's more open than sheltered Arrifana, though, so it catches more swell and wind and breaks bigger, with more rocks and current to read than nearby Amoreira. The cam is the honest way to see which it is today.",
		bestConditions:
			"Best low to mid tide — mind the rocks at the north end and at low water. Faces W–NW and takes plenty of NW swell, usually bigger than Arrifana.",
		whoFor:
			"Beginners and improvers on the smaller, cleaner days — soft sand-bottom peaks for first green waves. It's exposed, so it can jump in size and the currents pick up: check it before you paddle out.",
		access: "15 minutes from Aljezur. Village cafés and a restaurant look right over the beach.",
	},
	{
		slug: "amoreira",
		name: "Amoreira",
		fullName: "Praia da Amoreira",
		camId: "bcamoreira",
		beachcamUrl: "https://beachcam.meo.pt/livecams/praia-da-amoreira/",
		mapsUrl: mapsUrl("Praia da Amoreira, Aljezur, Portugal"),
		level: "Beginner – Advanced",
		tagline: "River-mouth break where the Aljezur river meets the Atlantic — friendly when small, punchy when big.",
		blurb:
			"The cam takes in the river mouth and the shifting sandbanks that make Amoreira's waves. Because the banks move with the river, the cam is the honest way to see how it's breaking. On a small summer swell it's mellow and one of the friendliest spots around for beginners; on a bigger swell the outer banks turn punchy for stronger surfers. It's usually bigger than Arrifana and cleaner than Monte Clérigo, with fewer rocks and gentler currents — but the river-mouth current always wants respect.",
		bestConditions:
			"A shallow lagoon forms at low tide (good for families); the peaks near the river mouth work best mid to high. Faces W–NW and comes alive with autumn and winter NW swells; often small in summer. Always mind the river current.",
		whoFor:
			"Beginners on a small, clean summer swell — soft inside sections and a low-tide lagoon. Intermediate to advanced when the outer banks and swell line up. Keep clear of the river-mouth current.",
		access: "10–15 minutes from Aljezur. Boardwalk through the dunes; limited parking.",
	},
	{
		slug: "odeceixe",
		name: "Odeceixe",
		fullName: "Praia de Odeceixe",
		camId: "bcodeceixe",
		beachcamUrl: "https://beachcam.meo.pt/livecams/odeceixe/",
		mapsUrl: mapsUrl("Praia de Odeceixe, Portugal"),
		level: "All levels",
		tagline: "River-and-sea beach at the Alentejo border — LiveHD cam.",
		blurb:
			"A LiveHD cam over the beach where the Rio Seixe meets the sea. The river enters on the north side and throws up rights off the river mouth, while the open beach shows the Atlantic peaks. Beginners can read the calmer water by the river — and the cam makes the 20-minute drive north an easy call.",
		bestConditions:
			"A river-mouth beach break best around low tide. Faces W/WNW and catches consistent NW swell; watch the river current at the mouth. Cleanest with a light E offshore.",
		whoFor:
			"All levels. Calmer river side for beginners and families (surf schools run here in summer), open-beach and river-mouth peaks for intermediates. Mind the river current.",
		access:
			"About 20 minutes north of Aljezur, on the Algarve–Alentejo border. Parking above the beach and by the river.",
	},
];

export function getCamSpot(slug: string): CamSpot | undefined {
	return CAM_SPOTS.find((s) => s.slug === slug);
}
