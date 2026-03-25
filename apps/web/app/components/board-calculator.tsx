"use client";

import Image from "next/image";
import { useState } from "react";

type Board = {
	name: string;
	size: string;
	image: string;
	level: string;
	description: string;
	traits: string[];
};

const BOARDS = {
	longboard: {
		name: "Longboard",
		size: "8\u20196",
		image: "/images/rentals/8'6/picture(1).jpg",
		level: "Beginner & Longboarders",
		description:
			"Maximum stability and glide. The extra volume makes it easy to catch every wave, and the outline is perfect for cross stepping and nose riding.",
		traits: ["Maximum stability", "Early wave entry", "Nose-riding capable"],
	},
	"funboard-78": {
		name: "Funboard",
		size: "7\u20198",
		image: "/images/rentals/7'8/picture(1).jpg",
		level: "Beginner – Intermediate",
		description:
			"The sweet spot between stability and maneuverability. Easy to paddle into waves with enough shape to start carving real turns.",
		traits: ["Versatile all-rounder", "Easy paddling", "Forgiving & stable"],
	},
	"funboard-70": {
		name: "Funboard",
		size: "7\u20190",
		image: "/images/rentals/7'0/picture(1).jpg",
		level: "Intermediate",
		description:
			"A step down from the 7\u20198 for surfers ready to progress. Still forgiving, but more responsive and easier to maneuver in the pocket.",
		traits: ["More responsive", "Easy paddling", "Progression-friendly"],
	},
	shortboard: {
		name: "Shortboard",
		size: "6\u20196",
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
type Result =
	| { type: "single"; board: Board }
	| { type: "advanced" }
	| null;

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
	const [weight, setWeight] = useState("");
	const [height, setHeight] = useState("");

	const w = Number.parseInt(weight, 10) || 0;
	const h = Number.parseInt(height, 10) || 0;
	const result = recommend(level, w, h);

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
			</div>

			<div className="calc-result">
				{filled && result ? (
					result.type === "single" ? (
						<BoardCard board={result.board} />
					) : (
						<div className="calc-advanced">
							<p className="calc-advanced-intro">
								You can surf any of our boards. Check the surf forecast for your
								trip and pick your poison!
							</p>
							<div className="calc-advanced-grid">
								{ALL_BOARDS.map((board) => (
									<div key={board.size} className="calc-mini-card">
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
									</div>
								))}
							</div>
						</div>
					)
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
						<p>Fill in your details and we&apos;ll recommend the right board.</p>
					</div>
				)}
			</div>
		</div>
	);
}
