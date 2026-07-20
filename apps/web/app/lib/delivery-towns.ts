/**
 * Delivery-town data for the /deliver-to/[town] pages. Every field
 * feeds both prose and JSON-LD, so keep it factual — Google and AI
 * answer engines look for consistency between visible copy and
 * structured data.
 *
 * PERSONAL_NOTE fields are placeholders — Leon fills these with the
 * things only the owner-operator would know (favourite café, the
 * road he takes, the mercado detail). Untouched notes render as a
 * short generic paragraph so the page isn't obviously incomplete
 * while we wait.
 */

export type DeliveryTown = {
	slug: string;
	name: string;
	title: string;
	metaDescription: string;
	kicker: string;
	oneLiner: string;
	introParagraphs: string[];
	typicalStays: string[];
	nearbyBeaches: Array<{
		name: string;
		distance: string;
		anchor: string;
	}>;
	deliveryNotes: string;
	boardMatch: string;
	personalNote?: string;
	faqs: Array<{ question: string; answer: string }>;
};

export const DELIVERY_TOWNS: DeliveryTown[] = [
	{
		slug: "aljezur",
		name: "Aljezur",
		title: "Surfboard Delivery in Aljezur — Free to Your Door",
		metaDescription:
			"Free surfboard and wetsuit delivery in Aljezur town. From €18/day board-only, €28/day with wetsuit, three-day minimum. Delivered to your guesthouse, Airbnb, or casa rural — no shop queue, no car rack.",
		kicker: "Delivery zone · Aljezur town",
		oneLiner:
			"Free surfboard and wetsuit delivery to any accommodation in Aljezur town — from €18/day, three-day minimum.",
		introParagraphs: [
			"Aljezur is the western Algarve's small hillside town, wedged between the Moorish castle ruins and the river valley below. Most surf trips based here stay in one of the whitewashed guesthouses on the slope, a casa rural along the Rua da Igreja, or a self-catering Airbnb in the Rossio quarter. We deliver surfboards and wetsuits directly to your accommodation — no shop pickup, no strapping a board onto your rental car, no wasted first morning.",
			"From Aljezur, Praia da Arrifana is 10 minutes by car; Praia do Amado is 20; Praia da Bordeira is 25. Which beach we recommend depends on the swell and your level — we send that with your gear on delivery day.",
		],
		typicalStays: [
			"Guesthouses on the hillside (Amazigh Design Hostel, Vicentina Hotel, Casa Vicentina)",
			"Casas rurais along the river valley",
			"Airbnbs in the old town and Rossio",
			"Campervans parked at Camping Serrão (5 min north)",
		],
		nearbyBeaches: [
			{ name: "Praia da Arrifana", distance: "10 min", anchor: "praia-da-arrifana" },
			{ name: "Praia do Amado", distance: "20 min", anchor: "amoreira" },
			{ name: "Praia da Bordeira", distance: "25 min", anchor: "" },
			{ name: "Praia da Amoreira", distance: "8 min", anchor: "amoreira" },
		],
		deliveryNotes:
			"Deliveries in Aljezur are typically door-to-door. If your accommodation has limited parking, we can meet you at the municipal parking above the castle or in Largo do Mercado — just tell us on booking.",
		boardMatch:
			"Aljezur guests overwhelmingly split their trips between Arrifana and Amoreira. If you're a beginner, our 7'8 or 8'6 works both spots on most days. Intermediate surfers usually take the 7'0 to Amoreira for the punchier sandbank waves.",
		personalNote:
			"TODO(Leon): the personal detail here — a mercado you stop at, the road you take down to Amoreira, the café where you meet guests on delivery day. Anything specific to the town in your voice.",
		faqs: [
			{
				question: "Do you deliver to Airbnbs in Aljezur old town?",
				answer:
					"Yes — anywhere in Aljezur town, including the narrow streets of the old town near the castle. Some streets are pedestrian only; if that's your case, we meet you at the nearest parking (usually Largo do Mercado or Rua 25 de Abril). Free delivery, always.",
			},
			{
				question: "How far in advance should I book if I'm staying in Aljezur?",
				answer:
					"48 hours is enough. In peak season (Jul–Sep) we recommend 5–7 days ahead. Weekly rentals booking further ahead get first choice of board size.",
			},
			{
				question: "Can I collect the gear in Aljezur town instead of delivery?",
				answer:
					"You can, but there's no financial reason to — delivery is free. If you'd rather meet us in person (some guests like to), we'll pick a public spot in Aljezur (usually the parking above the mercado).",
			},
		],
	},
	{
		slug: "arrifana",
		name: "Arrifana",
		title: "Surfboard Delivery in Arrifana — 5 min from Praia da Arrifana",
		metaDescription:
			"Free surfboard and wetsuit delivery to Arrifana village and Vale da Telha. From €18/day board-only, €28/day with wetsuit, three-day minimum. Direct to your accommodation above Praia da Arrifana.",
		kicker: "Delivery zone · Arrifana",
		oneLiner:
			"Free surfboard delivery to Arrifana village and the clifftop guesthouses above Praia da Arrifana — from €18/day.",
		introParagraphs: [
			"Arrifana is the cliff-top village directly above Praia da Arrifana — the most popular surf beach on the Costa Vicentina. If you're staying in Arrifana, you're within a five-minute walk of the cliff-top view over the bay and about ten minutes down to the sand. It's the shortest board-to-beach commute we deliver to.",
			"Because Arrifana faces west into a wide sheltered bay, it works on most swell directions and offers something for every level — mellow reforms in the middle, longer rides on the outside peaks, and, when the north-west lights up, a right-hand point break (Canal / Kangaroos) at the far end.",
		],
		typicalStays: [
			"Arrifana Sea Villas",
			"Casa da Falésia and other clifftop guesthouses",
			"Vale da Telha villas (5 min drive from Arrifana beach)",
			"Airbnbs above the fishing harbour",
		],
		nearbyBeaches: [
			{ name: "Praia da Arrifana", distance: "5 min walk / 3 min drive", anchor: "praia-da-arrifana" },
			{
				name: "Canal / Kangaroos (Arrifana point break)",
				distance: "10 min walk from beach",
				anchor: "canal-kangaroos-arrifana-point",
			},
			{ name: "Praia da Amoreira", distance: "12 min", anchor: "amoreira" },
			{ name: "Monte Clérigo", distance: "10 min", anchor: "monte-clerigo" },
		],
		deliveryNotes:
			"Direct-to-door delivery for every accommodation in Arrifana village. Some clifftop houses have narrow access — if you tell us which one on booking we can suggest a meeting point 30 seconds from your door.",
		boardMatch:
			"Arrifana works for every level, which is why we get every board size ordered by guests staying here. Beginners: 7'8 or 8'6. Intermediates chasing the outside peaks: 7'0. Advanced surfers chasing Canal when it's on: bring your own or ask about the 6'6 shortboard.",
		personalNote:
			"TODO(Leon): the personal detail here — where you park when you drop off, the café / esplanada you point people to for post-surf coffee, the little quirks of the road down to the beach.",
		faqs: [
			{
				question: "Can you deliver boards to accommodations right above Praia da Arrifana?",
				answer:
					"Yes. Every guesthouse and villa on the clifftop above Arrifana beach is within our delivery zone. We deliver during check-in windows or a time you pick — free, no delivery fee ever.",
			},
			{
				question: "What board should I rent if I'm staying in Arrifana?",
				answer:
					"Depends on your level and the swell. In summer / small conditions: an 8'6 longboard or 7'8 funboard. In shoulder-season / medium conditions: a 7'0 for intermediates, 7'8 for confident beginners. When Canal is firing (advanced only): a 6'6 shortboard. Tell us your dates and level and we'll match.",
			},
			{
				question: "How early can you deliver on check-in day in Arrifana?",
				answer:
					"We aim for the exact time your accommodation lets you in — typically 15:00 in Portugal. If your check-in is earlier or later, tell us the window on booking and we'll be there.",
			},
		],
	},
	{
		slug: "vale-da-telha",
		name: "Vale da Telha",
		title: "Surfboard Delivery to Vale da Telha — Free, To Your Villa",
		metaDescription:
			"Free surfboard and wetsuit delivery to villas and apartments in Vale da Telha. From €18/day board-only, €28/day with wetsuit, three-day minimum. Delivered to your door — save the trip into Aljezur town.",
		kicker: "Delivery zone · Vale da Telha",
		oneLiner:
			"Free surfboard delivery to any villa or apartment in Vale da Telha — from €18/day, three-day minimum.",
		introParagraphs: [
			"Vale da Telha is a wide coastal urbanização between Aljezur and Arrifana — mostly villas, apartments, and self-catering houses spread across a network of quiet residential streets. If you're staying here, you're a ten-minute drive from Praia da Arrifana, five minutes from Praia da Amoreira, and about twenty from Aljezur town. That layout is convenient for the beach but a real chore if you were planning to pick up a board from a rental shop.",
			"We handle that trip for you. Send your address and dates and we deliver directly to the villa — no dropping into town, no folding a board into a rental car, no rented roof racks. On pickup day we swing back and take everything.",
		],
		typicalStays: [
			"Family-sized villas and holiday houses",
			"Groups of 4–8 in self-catering apartments",
			"Longer stays — Vale da Telha is where a lot of our two-week and three-week rentals are based",
			"Digital-nomad houses on the outer streets",
		],
		nearbyBeaches: [
			{ name: "Praia da Arrifana", distance: "8 min", anchor: "praia-da-arrifana" },
			{ name: "Praia da Amoreira", distance: "5 min", anchor: "amoreira" },
			{ name: "Monte Clérigo", distance: "8 min", anchor: "monte-clerigo" },
			{ name: "Praia do Amado", distance: "25 min", anchor: "" },
		],
		deliveryNotes:
			"Vale da Telha is a spread-out urbanização with dozens of villa streets — Google Maps sometimes struggles with the exact house. Please send the full address including any letter suffix (e.g. \"Rua 25, Lote 47 B\") and, if you can, a WhatsApp pin. We plan our delivery route the night before, so tell us on booking.",
		boardMatch:
			"Vale da Telha groups typically split levels — one beginner, one intermediate, sometimes a longboarder. We can deliver 2–4 different boards to the same address on the same delivery, no extra cost. For most guests: an 8'6 for the beginner, a 7'0 for the intermediate, plus wetsuits.",
		personalNote:
			"TODO(Leon): the personal detail here — which streets you like driving through, the shop or café you point self-catering guests to for groceries, the surf-check habit for the Vale da Telha view over Arrifana.",
		faqs: [
			{
				question: "Do you deliver to villas in Vale da Telha for a group of 5+?",
				answer:
					"Yes — Vale da Telha is where most of our group rentals go. We can drop 4–6 boards, matching wetsuits, and extras (roof rack pads for a rental car, changing mats) at a single address in one delivery. Free delivery regardless of order size.",
			},
			{
				question: "Is there a group discount for a Vale da Telha rental?",
				answer:
					"Groups of 3–5 save about 12% per person on our published rates. For 6+ we build a custom quote — usually 15–20% off. See /group-bookings.",
			},
			{
				question: "What's the closest beach to Vale da Telha for a beginner surf lesson-free session?",
				answer:
					"Praia da Amoreira is five minutes down the road and has forgiving reforms on mid-tide. Monte Clérigo is a similar drive and works well on smaller days. Both are more beginner-friendly than the outside peaks at Arrifana.",
			},
		],
	},
	{
		slug: "monte-clerigo",
		name: "Monte Clérigo",
		title: "Surfboard Delivery to Monte Clérigo — Free to Your Guesthouse",
		metaDescription:
			"Free surfboard and wetsuit delivery to Monte Clérigo village. From €18/day board-only, €28/day with wetsuit, three-day minimum. Delivered to your door, 30 seconds from Praia de Monte Clérigo.",
		kicker: "Delivery zone · Monte Clérigo",
		oneLiner:
			"Free surfboard delivery to Monte Clérigo — the beach-front village, ten minutes from Aljezur.",
		introParagraphs: [
			"Monte Clérigo is a small, quiet village at the foot of a dramatic cliff, right next to Praia de Monte Clérigo. A handful of guesthouses, one or two restaurants, and one of the more forgiving beach breaks on the coast. If you're staying here, you can walk to the sand in less than a minute — but you still need a board.",
			"We deliver directly to your guesthouse. Because the village is compact and the road in is narrow, we usually meet you at your door or at the small parking above the beach — whichever works. On pickup day we come back the same way.",
		],
		typicalStays: [
			"Small guesthouses just above the beach",
			"Family-run casas rurais on the road in from Aljezur",
			"Airbnbs in the handful of houses fronting the sea",
			"Campervans parked at the top of the cliff",
		],
		nearbyBeaches: [
			{ name: "Praia de Monte Clérigo", distance: "30 seconds walk", anchor: "monte-clerigo" },
			{ name: "Praia da Amoreira", distance: "8 min", anchor: "amoreira" },
			{ name: "Praia da Arrifana", distance: "10 min", anchor: "praia-da-arrifana" },
		],
		deliveryNotes:
			"The road down to Monte Clérigo is narrow and steep. Tell us when your check-in is and we'll match it — otherwise we meet at the small parking above the beach.",
		boardMatch:
			"Monte Clérigo is forgiving — the waves crumble more than close out on typical summer days. Perfect for beginners on an 8'6 longboard or 7'8 funboard, and a good day-off spot for intermediates when Arrifana is too big.",
		personalNote:
			"TODO(Leon): the personal detail — the café / restaurant where you get coffee after a delivery, the surf-check habit from the top of the road, a note on the tides here.",
		faqs: [
			{
				question: "Is Monte Clérigo a good beach for beginners?",
				answer:
					"Yes — one of the best on this stretch of coast. The waves are forgiving on typical summer and shoulder-season days, the beach is sheltered from north winds by the cliff, and the walk from car to water is short. On big winter swells it can get heavy — we'll flag that in the delivery brief.",
			},
			{
				question: "Do you deliver to Monte Clérigo in low season?",
				answer:
					"Yes — we deliver year-round. Winter conditions can be spectacular for experienced surfers (bigger, cleaner swells) and the delivery route is quieter, so it often works out easier than peak season.",
			},
			{
				question: "How's parking in Monte Clérigo?",
				answer:
					"Small but usually fine outside peak weekends. The main lot is at the top of the road down to the beach; there's roadside space along the way. If you're delivering in high summer, expect to park higher and walk 3–5 minutes down.",
			},
		],
	},
	{
		slug: "carrapateira",
		name: "Carrapateira",
		title: "Surfboard Delivery to Carrapateira — Amado & Bordeira",
		metaDescription:
			"Free surfboard and wetsuit delivery to Carrapateira — the village between Praia do Amado and Praia da Bordeira. From €18/day board-only, €28/day with wetsuit, three-day minimum.",
		kicker: "Delivery zone · Carrapateira",
		oneLiner:
			"Free surfboard delivery to Carrapateira — the surf village between Praia do Amado and Praia da Bordeira.",
		introParagraphs: [
			"Carrapateira is the small surf village between two of the coast's best-known beaches — Praia do Amado to the south and Praia da Bordeira to the north. Both are on your doorstep, both are exposed and consistent, and if you stay here you're within ten minutes of the water in either direction.",
			"Carrapateira has a bohemian surf culture — bakeries, small restaurants, a few hostels and campsites, and quiet casas rurais along the road out toward the cliffs. If you're staying here you probably came for the surf. We handle the gear.",
		],
		typicalStays: [
			"Casas rurais along the Estrada Nacional",
			"Surf hostels (Carrapateira Surf Camp, Casa Fajara)",
			"Campervan sites near Praia do Amado",
			"Airbnbs in the village core",
		],
		nearbyBeaches: [
			{ name: "Praia do Amado", distance: "5 min", anchor: "" },
			{ name: "Praia da Bordeira", distance: "5 min", anchor: "" },
			{ name: "Vale Figueiras", distance: "15 min", anchor: "vale-figueiras" },
		],
		deliveryNotes:
			"Carrapateira is 25 minutes south of Aljezur. We schedule Carrapateira deliveries as a batch — usually mid-morning or late afternoon — so tell us your check-in window on booking and we'll match it.",
		boardMatch:
			"Amado and Bordeira are open-ocean beach breaks — more punch than Arrifana on the same swell. For beginners: 8'6 in summer, 7'8 when it firms up. Intermediates: 7'0 works well at Amado's inside peaks. Advanced surfers rent the 6'6.",
		personalNote:
			"TODO(Leon): the personal detail — the bakery you stop at, the road detour you like, the surf-check habit at the Carrapateira viewpoint over Bordeira.",
		faqs: [
			{
				question: "Do you deliver as far south as Carrapateira?",
				answer:
					"Yes. Carrapateira is our southern-most regular delivery zone — free, same three-day minimum, same prices as Aljezur town. We batch Carrapateira deliveries around a check-in window so tell us yours on booking.",
			},
			{
				question: "Which beach should I aim for from Carrapateira?",
				answer:
					"Amado if you want the more sheltered peaks; Bordeira if you want the bigger, more open-ocean feel — and space. Both work in most swell conditions. We'll pick the one that suits your level on delivery day.",
			},
			{
				question: "Can I get boards delivered directly to Praia do Amado or Bordeira?",
				answer:
					"To the parking areas above each beach — yes, if that's easier for you than your accommodation. Just tell us and we'll meet you at a specific time.",
			},
		],
	},
];

export function getTownBySlug(slug: string) {
	return DELIVERY_TOWNS.find((t) => t.slug === slug);
}

export function allTownSlugs() {
	return DELIVERY_TOWNS.map((t) => t.slug);
}
