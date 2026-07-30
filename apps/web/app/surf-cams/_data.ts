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
		tagline: "The area's most reliable bay — check it before you drive down.",
		blurb:
			"The live cam looks out over Arrifana's wide, cliff-sheltered bay from the clifftop. It's the quickest way to read the size and how busy the peaks are before you commit to the drive down. The bay holds a swell and blocks north wind, so it's often surfable when everywhere else is blown out.",
		bestConditions:
			"Works on all tides and picks up W–NW swell. Cleanest with light E/NE (offshore) wind, usually early morning.",
		whoFor:
			"Everyone. Mellow reforms in the middle for beginners, punchier outside peaks for intermediates, the point at the north end for advanced surfers on a bigger swell.",
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
		tagline: "Forgiving beach break tucked between the cliffs.",
		blurb:
			"The cam shows the beach break in front of the little village. Look for the crumbly, forgiving peaks that make Monte Clérigo one of the best spots in the area to progress. On a mid to high tide the whitewater reforms gently — ideal for building confidence.",
		bestConditions:
			"Best around mid to high tide; low tide can go shallow and close out. Faces W–NW and takes plenty of swell.",
		whoFor:
			"Beginners and improvers. Softer than Arrifana on the bigger days, with sand-bottom peaks that are good for first green waves and early turns.",
		access: "15 minutes from Aljezur. Village cafés and a restaurant look right over the beach.",
	},
	{
		slug: "amoreira",
		name: "Amoreira",
		fullName: "Praia da Amoreira",
		camId: "bcamoreira",
		beachcamUrl: "https://beachcam.meo.pt/livecams/praia-da-amoreira/",
		mapsUrl: mapsUrl("Praia da Amoreira, Aljezur, Portugal"),
		level: "Intermediate – Advanced",
		tagline: "Wild river-mouth break where the Aljezur river meets the Atlantic.",
		blurb:
			"The cam takes in the river mouth and the sandbanks that make Amoreira's waves. Because the banks shift with the river, the cam is the honest way to see how it's breaking on the day. When the sand lines up it's one of the punchiest waves near Aljezur.",
		bestConditions:
			"Best from mid to high tide. Watch the current near the river mouth. Comes alive with autumn and winter NW swells; can be flat in summer.",
		whoFor:
			"Intermediate to advanced surfers. More power than Arrifana or Monte Clérigo, and the river-mouth current wants some experience.",
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
			"A LiveHD cam over the beach where the Rio Seixe meets the sea. Beginners can read the sheltered river side while the open beach shows the Atlantic peaks. It's a 20-minute drive north but the cam makes it easy to decide if the trip is worth it.",
		bestConditions:
			"A beach break that works across low, mid and high tide. Faces W and catches consistent swell; sheltered river side for the calmest water.",
		whoFor:
			"All levels. Calm river side for beginners and families, open beach peaks for intermediates.",
		access:
			"About 20 minutes north of Aljezur, on the Algarve–Alentejo border. Parking above the beach and by the river.",
	},
];

export function getCamSpot(slug: string): CamSpot | undefined {
	return CAM_SPOTS.find((s) => s.slug === slug);
}
