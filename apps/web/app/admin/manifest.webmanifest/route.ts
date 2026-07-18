import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Next.js's manifest.ts convention only works at app/ root — for an admin-only
// PWA we hand-roll the manifest response so the URL stays under /admin/.
export function GET() {
	return NextResponse.json(
		{
			name: "Surf Rental Admin",
			short_name: "SR Admin",
			description:
				"Bookings, calendar and revenue for Surf Rental Aljezur — pin to home screen to run standalone.",
			start_url: "/admin",
			scope: "/admin",
			display: "standalone",
			orientation: "portrait",
			background_color: "#FAFAF8",
			theme_color: "#C04419",
			icons: [
				{
					src: "/admin/icon",
					sizes: "192x192",
					type: "image/png",
					purpose: "any",
				},
				{
					src: "/admin/icon-512",
					sizes: "512x512",
					type: "image/png",
					purpose: "any",
				},
				{
					src: "/admin/icon-512",
					sizes: "512x512",
					type: "image/png",
					purpose: "maskable",
				},
			],
		},
		{
			headers: {
				"Content-Type": "application/manifest+json; charset=utf-8",
				"Cache-Control": "public, max-age=3600",
			},
		},
	);
}
