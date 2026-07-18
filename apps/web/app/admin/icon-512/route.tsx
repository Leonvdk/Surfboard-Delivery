import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";

function logoDataUrl(): string {
	const buf = readFileSync(
		join(process.cwd(), "public", "images", "logo.png"),
	);
	return `data:image/png;base64,${buf.toString("base64")}`;
}

export function GET() {
	// 512 icon with generous padding so it survives the maskable safe-zone
	// crop that Android home-screen launchers apply.
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#FAFAF8",
					padding: 92,
				}}
			>
				{/* biome-ignore lint/performance/noImgElement: Satori only supports <img> */}
				<img
					src={logoDataUrl()}
					width={328}
					height={166}
					alt=""
				/>
			</div>
		),
		{ width: 512, height: 512 },
	);
}
