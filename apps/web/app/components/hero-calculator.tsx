"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { trackCtaClick } from "../lib/analytics";

type Level = "" | "never" | "few-times" | "intermediate" | "advanced";
type Sex = "" | "male" | "female" | "kid";

type Board = {
	name: string;
	size: string;
	image: string;
};

const BOARDS: Record<string, Board> = {
	longboard: { name: "Longboard", size: "8\u20196", image: "/images/rentals/8'6/picture(1).jpg" },
	"funboard-78": { name: "Funboard", size: "7\u20198", image: "/images/rentals/7'8/picture(1).jpg" },
	"funboard-70": { name: "Funboard", size: "7\u20190", image: "/images/rentals/7'0/picture(1).jpg" },
	shortboard: { name: "Shortboard", size: "6\u20196", image: "/images/rentals/6'6/picture(1).jpg" },
};

function recommend(level: Level, weight: number): Board | "advanced" | null {
	if (!level) return null;
	if (level === "advanced") return "advanced";
	if (!weight) return null;
	if (level === "never") return weight >= 80 ? BOARDS.longboard! : BOARDS["funboard-78"]!;
	if (level === "few-times") {
		if (weight >= 80) return BOARDS.longboard!;
		if (weight < 38) return BOARDS["funboard-70"]!;
		return BOARDS["funboard-78"]!;
	}
	if (level === "intermediate") return weight >= 80 ? BOARDS["funboard-78"]! : BOARDS["funboard-70"]!;
	return null;
}

function recommendWetsuitSize(sex: Sex, height: number, weight: number): string | null {
	if (!sex || !height) return null;
	if (sex === "kid") {
		if (height < 110) return "100–110 cm";
		if (height < 120) return "110–120 cm";
		if (height < 130) return "120–130 cm";
		if (height < 140) return "130–140 cm";
		if (height < 150) return "140–150 cm";
		return "150–160 cm";
	}
	if (!weight) return null;
	if (sex === "male") {
		if (height <= 172 && weight <= 65) return "XS";
		if (height <= 178 && weight <= 72) return "S";
		if (height <= 183 && weight <= 82) return "M";
		if (height <= 190 && weight <= 92) return "L";
		return "XL";
	}
	if (sex === "female") {
		if (height <= 163 && weight <= 55) return "XS";
		if (height <= 170 && weight <= 63) return "S";
		if (height <= 176 && weight <= 72) return "M";
		if (height <= 183 && weight <= 82) return "L";
		return "XL";
	}
	return null;
}

export function HeroCalculator() {
	const [level, setLevel] = useState<Level>("");
	const [sex, setSex] = useState<Sex>("");
	const [weight, setWeight] = useState("");
	const [height, setHeight] = useState("");

	const w = Number.parseInt(weight, 10) || 0;
	const h = Number.parseInt(height, 10) || 0;
	const result = recommend(level, w);
	const wetsuitSize = recommendWetsuitSize(sex, h, w);

	const hasResult = result !== null;

	return (
		<div className="hero-calc">
			<div className="hero-calc-header">
				<svg className="hero-calc-icon" width="22" height="22" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4">
					<ellipse cx="40" cy="40" rx="12" ry="36" />
					<line x1="40" y1="4" x2="40" y2="76" />
				</svg>
				<span className="hero-calc-title">Find your perfect setup</span>
			</div>

			<div className="hero-calc-body">
				<div className="hero-calc-fields">
					<div className="hero-calc-field">
						<label className="hero-calc-label" htmlFor="hero-level">Experience</label>
						<select
							id="hero-level"
							className="hero-calc-select"
							value={level}
							onChange={(e) => setLevel(e.target.value as Level)}
						>
							<option value="">Select your level</option>
							<option value="never">Never surfed</option>
							<option value="few-times">Surfed a few times</option>
							<option value="intermediate">Intermediate</option>
							<option value="advanced">Advanced</option>
						</select>
					</div>

					<div className="hero-calc-field">
						<label className="hero-calc-label" htmlFor="hero-sex">Sex</label>
						<select
							id="hero-sex"
							className="hero-calc-select"
							value={sex}
							onChange={(e) => setSex(e.target.value as Sex)}
						>
							<option value="">Select</option>
							<option value="male">Male</option>
							<option value="female">Female</option>
							<option value="kid">Kid</option>
						</select>
					</div>

					<div className="hero-calc-row">
						<div className="hero-calc-field">
							<label className="hero-calc-label" htmlFor="hero-weight">Weight (kg)</label>
							<input
								id="hero-weight"
								className="hero-calc-input"
								type="number"
								min="20"
								max="200"
								placeholder="e.g. 75"
								value={weight}
								onChange={(e) => setWeight(e.target.value)}
							/>
						</div>
						<div className="hero-calc-field">
							<label className="hero-calc-label" htmlFor="hero-height">Height (cm)</label>
							<input
								id="hero-height"
								className="hero-calc-input"
								type="number"
								min="100"
								max="220"
								placeholder="e.g. 178"
								value={height}
								onChange={(e) => setHeight(e.target.value)}
							/>
						</div>
					</div>
				</div>

				{hasResult && result !== "advanced" && (
					<div className="hero-calc-result">
						<div className="hero-calc-rec">
							<div className="hero-calc-rec-img">
								<Image
									src={result.image}
									alt={`${result.size} ${result.name}`}
									width={300}
									height={225}
								/>
							</div>
							<div className="hero-calc-rec-info">
								<div className="hero-calc-rec-label">Your board</div>
								<div className="hero-calc-rec-name">{result.size} {result.name}</div>
								{wetsuitSize && (
									<div className="hero-calc-rec-wetsuit">
										Wetsuit: <strong>{wetsuitSize}</strong>
									</div>
								)}
							</div>
						</div>
						<Link
							href="/contact"
							className="btn btn-primary btn-full"
							onClick={() =>
								trackCtaClick({
									cta_text: "Book this setup",
									cta_location: "hero_calculator",
									destination: "/contact",
								})
							}
						>
							Book this setup
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<line x1="5" y1="12" x2="19" y2="12" />
								<polyline points="12 5 19 12 12 19" />
							</svg>
						</Link>
					</div>
				)}

				{hasResult && result === "advanced" && (
					<div className="hero-calc-result">
						<div className="hero-calc-advanced">
							<p className="hero-calc-advanced-text">
								You can ride any of our boards!
								{wetsuitSize && <> Wetsuit size: <strong>{wetsuitSize}</strong></>}
							</p>
						</div>
						<Link
							href="/surf-gear"
							className="btn btn-primary btn-full"
							onClick={() =>
								trackCtaClick({
									cta_text: "Browse all boards",
									cta_location: "hero_calculator",
									destination: "/surf-gear",
								})
							}
						>
							Browse all boards
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
								<line x1="5" y1="12" x2="19" y2="12" />
								<polyline points="12 5 19 12 12 19" />
							</svg>
						</Link>
					</div>
				)}

				{!hasResult && (
					<div className="hero-calc-empty">
						<p>Tell us about yourself — we&apos;ll match you with the right board and wetsuit in seconds.</p>
					</div>
				)}
			</div>
		</div>
	);
}
