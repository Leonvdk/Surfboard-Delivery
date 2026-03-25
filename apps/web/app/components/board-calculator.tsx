"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type Board = {
	name: string;
	size: string;
	anchor: string;
	image: string;
	level: string;
	description: string;
	traits: string[];
};

const BOARDS = {
	longboard: {
		name: "Longboard",
		size: "8\u20196",
		anchor: "board-8-6",
		image: "/images/rentals/8'6/picture(1).jpg",
		level: "Beginner & Longboarders",
		description:
			"Maximum stability and glide. The extra volume makes it easy to catch every wave, and the outline is perfect for cross stepping and nose riding.",
		traits: ["Maximum stability", "Early wave entry", "Nose-riding capable"],
	},
	"funboard-78": {
		name: "Funboard",
		size: "7\u20198",
		anchor: "board-7-8",
		image: "/images/rentals/7'8/picture(1).jpg",
		level: "Beginner – Intermediate",
		description:
			"The sweet spot between stability and maneuverability. Easy to paddle into waves with enough shape to start carving real turns.",
		traits: ["Versatile all-rounder", "Easy paddling", "Forgiving & stable"],
	},
	"funboard-70": {
		name: "Funboard",
		size: "7\u20190",
		anchor: "board-7-8",
		image: "/images/rentals/7'0/picture(1).jpg",
		level: "Intermediate",
		description:
			"A step down from the 7\u20198 for surfers ready to progress. Still forgiving, but more responsive and easier to maneuver in the pocket.",
		traits: ["More responsive", "Easy paddling", "Progression-friendly"],
	},
	shortboard: {
		name: "Shortboard",
		size: "6\u20196",
		anchor: "board-6-6",
		image: "/images/rentals/6'6/picture(1).jpg",
		level: "Intermediate – Advanced",
		description:
			"Built for speed, sharp turns, and aerial maneuvers. Responsive and fast for surfers who know what they want.",
		traits: ["Fast & responsive", "Duck-dives easily", "Thruster fin setup"],
	},
} satisfies Record<string, Board>;

const ALL_BOARDS: Board[] = [
	BOARDS.shortboard,
	BOARDS["funboard-70"],
	BOARDS["funboard-78"],
	BOARDS.longboard,
];

type Level = "" | "never" | "few-times" | "intermediate" | "advanced";
type Sex = "" | "male" | "female" | "kid";
type Result =
	| { type: "single"; board: Board }
	| { type: "advanced" }
	| null;

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

function recommend(level: Level, weight: number, height: number): Result {
	if (!level || !weight || !height) return null;

	if (level === "advanced") return { type: "advanced" };

	if (level === "never") {
		if (weight >= 80) return { type: "single", board: BOARDS.longboard };
		return { type: "single", board: BOARDS["funboard-78"] };
	}

	if (level === "few-times") {
		if (weight >= 80) return { type: "single", board: BOARDS.longboard };
		if (weight < 38) return { type: "single", board: BOARDS["funboard-70"] };
		return { type: "single", board: BOARDS["funboard-78"] };
	}

	if (level === "intermediate") {
		if (weight >= 80) return { type: "single", board: BOARDS["funboard-78"] };
		return { type: "single", board: BOARDS["funboard-70"] };
	}

	return null;
}

function BoardCard({ board }: { board: Board }) {
	return (
		<div className="calc-card">
			<div className="calc-card-img">
				<Image
					src={board.image}
					alt={`${board.size} ${board.name}`}
					width={600}
					height={450}
				/>
			</div>
			<div className="calc-card-body">
				<span className="calc-card-level">{board.level}</span>
				<h3 className="calc-card-name">
					{board.size} {board.name}
				</h3>
				<p className="calc-card-desc">{board.description}</p>
				<ul className="calc-card-traits">
					{board.traits.map((t) => (
						<li key={t}>{t}</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export function BoardCalculator() {
	const [level, setLevel] = useState<Level>("");
	const [sex, setSex] = useState<Sex>("");
	const [weight, setWeight] = useState("");
	const [height, setHeight] = useState("");

	const w = Number.parseInt(weight, 10) || 0;
	const h = Number.parseInt(height, 10) || 0;
	const result = recommend(level, w, h);
	const wetsuitSize = recommendWetsuitSize(sex, h, w);

	const filled = level !== "" && w > 0 && h > 0;

	return (
		<div className="calc-layout">
			<div className="calc-form">
				<div className="calc-field">
					<label className="calc-label" htmlFor="calc-level">
						Surf experience
					</label>
					<select
						id="calc-level"
						className="calc-select"
						value={level}
						onChange={(e) => setLevel(e.target.value as Level)}
					>
						<option value="">Select your level</option>
						<option value="never">Never surfed before</option>
						<option value="few-times">Surfed a few times</option>
						<option value="intermediate">
							Intermediate — I can pop up and ride
						</option>
						<option value="advanced">
							Advanced — comfortable in all conditions
						</option>
					</select>
				</div>

				<div className="calc-field">
					<label className="calc-label" htmlFor="calc-sex">
						Sex
					</label>
					<select
						id="calc-sex"
						className="calc-select"
						value={sex}
						onChange={(e) => setSex(e.target.value as Sex)}
					>
						<option value="">Select</option>
						<option value="male">Male</option>
						<option value="female">Female</option>
						<option value="kid">Kid</option>
					</select>
				</div>

				<div className="calc-row">
					<div className="calc-field">
						<label className="calc-label" htmlFor="calc-weight">
							Weight (kg)
						</label>
						<input
							id="calc-weight"
							className="calc-input"
							type="number"
							min="20"
							max="200"
							placeholder="e.g. 75"
							value={weight}
							onChange={(e) => setWeight(e.target.value)}
						/>
					</div>
					<div className="calc-field">
						<label className="calc-label" htmlFor="calc-height">
							Height (cm)
						</label>
						<input
							id="calc-height"
							className="calc-input"
							type="number"
							min="100"
							max="220"
							placeholder="e.g. 178"
							value={height}
							onChange={(e) => setHeight(e.target.value)}
						/>
					</div>
				</div>

				{wetsuitSize && (
					<div className="calc-wetsuit">
						<div className="calc-wetsuit-icon">
							<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
								<path d="M12 2C10 2 8.5 3.5 8.5 5.5V8L6 10v6l2 2v4h8v-4l2-2v-6l-2-2V5.5C16 3.5 14 2 12 2z" />
								<path d="M10 8h4" />
							</svg>
						</div>
						<div className="calc-wetsuit-body">
							<div className="calc-wetsuit-label">Recommended wetsuit size</div>
							<div className="calc-wetsuit-size">{wetsuitSize}</div>
							<p className="calc-wetsuit-note">
								{sex === "kid"
									? "Based on height. If between sizes, go one up for room to grow."
									: "Based on your height and weight. Wetsuits should fit snug — if between sizes, go tighter."}
							</p>
						</div>
					</div>
				)}

				{!wetsuitSize && sex === "" && filled && (
					<p className="calc-wetsuit-hint">
						Select your sex above to get a wetsuit size recommendation too.
					</p>
				)}
			</div>

			<div className="calc-result">
				{filled && result ? (
					<>
						{result.type === "single" ? (
							<BoardCard board={result.board} />
						) : (
							<div className="calc-advanced">
								<p className="calc-advanced-intro">
									You can surf any of our boards. Check the surf forecast for your
									trip and pick your poison!
								</p>
							<div className="calc-advanced-grid">
								{ALL_BOARDS.map((board) => (
									<Link key={board.size} href={`/surf-gear#${board.anchor}`} className="calc-mini-card">
										<div className="calc-mini-img">
											<Image
												src={board.image}
												alt={`${board.size} ${board.name}`}
												width={300}
												height={225}
											/>
										</div>
										<div className="calc-mini-body">
											<div className="calc-mini-name">
												{board.size} {board.name}
											</div>
										</div>
									</Link>
								))}
							</div>
							</div>
						)}
					</>
				) : (
					<div className="calc-empty">
						<div className="calc-empty-icon">
							<svg
								viewBox="0 0 80 80"
								fill="none"
								stroke="currentColor"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<ellipse cx="40" cy="40" rx="12" ry="36" />
								<line x1="40" y1="4" x2="40" y2="76" />
							</svg>
						</div>
						<p>Fill in your details and we&apos;ll recommend the right board and wetsuit size.</p>
					</div>
				)}
			</div>
		</div>
	);
}
