import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

// Embed the marketing logo as a data URL so Satori can render it inside
// the ImageResponse (it can't fetch local assets on its own).
function logoDataUrl(): string {
	const buf = readFileSync(
		join(process.cwd(), "public", "images", "logo.png"),
	);
	return `data:image/png;base64,${buf.toString("base64")}`;
}

export default function Icon() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: "#FAFAF8",
				padding: 22,
			}}
		>
			{/* biome-ignore lint/performance/noImgElement: Satori only supports <img> */}
			<img
				src={logoDataUrl()}
				width={148}
				height={75}
				alt=""
			/>
		</div>,
		size,
	);
}
