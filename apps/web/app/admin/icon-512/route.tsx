import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#C04419",
					color: "#FFFFFF",
					fontSize: 280,
					fontWeight: 900,
					fontFamily: "system-ui",
					letterSpacing: -10,
				}}
			>
				SR
			</div>
		),
		{ width: 512, height: 512 },
	);
}
