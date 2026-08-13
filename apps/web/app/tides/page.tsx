import type { Metadata } from "next";
import { TideGuide } from "./tide-guide";
import "./tide-guide.css";

export const metadata: Metadata = {
	title: "How Tides Work — Surf Rental Aljezur",
	description:
		"An interactive, physics-based guide to ocean tides: drag the Sun and Moon and watch the sea bulge. See why spring tides are big and neap tides small — and what it means for surfers on the Costa Vicentina.",
};

export default function TidesPage() {
	return <TideGuide />;
}
