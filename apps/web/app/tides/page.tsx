import type { Metadata } from "next";
import { JsonLd } from "../components/json-ld";
import { faqJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";
import { TideGuide } from "./tide-guide";
import "./tide-guide.css";

export const metadata: Metadata = {
	title: "How Tides Work — Surf Rental Aljezur",
	description:
		"An interactive, physics-based guide to ocean tides: drag the Sun and Moon and watch the sea bulge. See why spring tides are big and neap tides small — and what it means for surfers on the Costa Vicentina.",
	alternates: { canonical: "/tides" },
};

/**
 * The guide itself is a WebGL canvas, so almost none of its teaching is
 * readable by a crawler. These are the same explanations the lesson gives,
 * expressed as structured Q&A — the form answer engines actually lift.
 */
const TIDE_FAQS = [
	{
		question: "What causes tides?",
		answer:
			"The Moon's gravity pulls hardest on the ocean nearest to it and weakest on the ocean on the far side of the Earth. That difference stretches the sea into two bulges — one under the Moon and one directly opposite. Those bulges are high tide. The Sun does the same thing with a little under half the Moon's effect.",
	},
	{
		question: "Why are there two high tides a day?",
		answer:
			"Because the tidal stretch raises a bulge on both sides of the Earth at once — the near side and the far side. As the planet spins, a coast passes through both bulges and both dips in roughly a day, giving most beaches two highs and two lows.",
	},
	{
		question: "How many hours are there between high tides?",
		answer:
			"Roughly 12 hours and 25 minutes on a semidiurnal coast like Portugal's. The extra 25 minutes is the Moon moving along its orbit while the Earth turns, so the tide arrives a little later each day.",
	},
	{
		question: "What is the difference between a spring tide and a neap tide?",
		answer:
			"At new and full moon the Sun and Moon line up, their bulges stack, and you get a spring tide — the highest highs and lowest lows. At the half moons the Sun sits at right angles to the Moon, the bulges partly cancel, and the range shrinks to a neap tide. It has nothing to do with the season.",
	},
	{
		question: "Why do tides differ from place to place?",
		answer:
			"The open-ocean bulge is only tens of centimetres. What you see at the beach is shaped by the coast — the depth and slope of the sea floor, bays that funnel water, and basins that resonate. That is why the Bay of Fundy swings over 15 metres, the Mediterranean barely moves, and some coasts get only one high tide a day.",
	},
	{
		question: "What tide is best for surfing in Aljezur?",
		answer:
			"Aljezur's beaches are semidiurnal — two lows and two highs a day, with a couple of metres between them. Low tide opens up sandbanks and peaks at beaches like Amoreira, and the hour either side of low is often the cleanest surf. Check the tide before you paddle out.",
	},
];

export default function TidesPage() {
	return (
		<>
			<JsonLd data={faqJsonLd(TIDE_FAQS)} />
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "LearningResource",
					name: "How Tides Work — an interactive guide",
					description:
						"An interactive, physics-based explanation of ocean tides: tidal bulges, spring and neap tides, why the tide comes and goes on a cycle, and why the interval and range differ by coast.",
					url: `${SITE_URL}/tides`,
					learningResourceType: "Interactive simulation",
					educationalLevel: "Beginner",
					isAccessibleForFree: true,
					inLanguage: "en",
					about: [
						{ "@type": "Thing", name: "Tide" },
						{ "@type": "Thing", name: "Surfing" },
						{ "@type": "Thing", name: "Oceanography" },
					],
					publisher: { "@id": `${SITE_URL}/#business` },
					author: { "@id": `${SITE_URL}/#leon` },
				}}
			/>
			<TideGuide />
		</>
	);
}
