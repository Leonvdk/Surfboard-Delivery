import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

function logoDataUrl(): string {
	const buf = readFileSync(
		join(process.cwd(), "public", "images", "logo.png"),
	);
	return `data:image/png;base64,${buf.toString("base64")}`;
}

export default function AppleIcon() {
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
				width={136}
				height={69}
				alt=""
			/>
		</div>,
		size,
	);
}
