import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface PostMeta {
	slug: string;
	title: string;
	description: string;
	date: string;
	updated: string;
	tags: string[];
	emoji: string;
	readingTime: number;
}

export interface Post extends PostMeta {
	content: string;
}

export interface SearchablePost extends PostMeta {
	searchText: string;
}

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

function estimateReadingTime(content: string): number {
	const words = content.trim().split(/\s+/).length;
	return Math.max(1, Math.ceil(words / 230));
}

export function getAllPosts(): PostMeta[] {
	if (!fs.existsSync(POSTS_DIR)) return [];

	return fs
		.readdirSync(POSTS_DIR)
		.filter((f) => f.endsWith(".mdx"))
		.map((filename) => {
			const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf-8");
			const { data, content } = matter(raw);
			return {
				slug: filename.replace(/\.mdx$/, ""),
				title: data.title ?? "",
				description: data.description ?? "",
				date: data.date ?? "",
				updated: data.updated ?? data.date ?? "",
				tags: data.tags ?? [],
				emoji: data.emoji ?? "",
				readingTime: estimateReadingTime(content),
			};
		})
		.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export const TAG_CATEGORIES: Record<string, { label: string; tags: string[] }> =
	{
		spots: {
			label: "Surf Spots",
			tags: [
				"surf spots",
				"surf guide",
				"Arrifana",
				"Monte Clérigo",
				"Amoreira",
				"Vale Figueiras",
				"Bordeira",
				"Carrapateira",
				"Sagres",
				"Algarve",
				"Costa Vicentina",
			],
		},
		planning: {
			label: "Trip Planning",
			tags: [
				"planning",
				"travel",
				"itinerary",
				"budget",
				"logistics",
				"accommodation",
				"comparison",
				"road trip",
				"Portugal",
			],
		},
		learn: {
			label: "Learn to Surf",
			tags: [
				"beginner",
				"first time",
				"technique",
				"tips",
				"surf knowledge",
				"etiquette",
				"safety",
				"progression",
				"intermediate",
			],
		},
		gear: {
			label: "Gear & Equipment",
			tags: ["gear", "surfboards", "wetsuit"],
		},
		seasons: {
			label: "Seasons & Conditions",
			tags: [
				"seasons",
				"conditions",
				"surf conditions",
				"winter",
				"summer",
				"off-season",
			],
		},
		lifestyle: {
			label: "Local Life",
			tags: [
				"food",
				"restaurants",
				"culture",
				"local life",
				"activities",
				"hiking",
				"yoga",
				"wellness",
				"nature",
				"camping",
				"vanlife",
				"digital nomad",
				"remote work",
				"family",
				"kids",
				"Rota Vicentina",
				"Aljezur",
			],
		},
	};

function stripMarkdown(md: string): string {
	return md
		.replace(/^---[\s\S]*?---/m, "")
		.replace(/#{1,6}\s+/g, "")
		.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
		.replace(/[*_~`>|]/g, "")
		.replace(/\n{2,}/g, " ")
		.replace(/\n/g, " ")
		.replace(/\s{2,}/g, " ")
		.trim()
		.toLowerCase();
}

export function getAllSearchablePosts(): SearchablePost[] {
	if (!fs.existsSync(POSTS_DIR)) return [];

	return fs
		.readdirSync(POSTS_DIR)
		.filter((f) => f.endsWith(".mdx"))
		.map((filename) => {
			const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf-8");
			const { data, content } = matter(raw);
			return {
				slug: filename.replace(/\.mdx$/, ""),
				title: data.title ?? "",
				description: data.description ?? "",
				date: data.date ?? "",
				updated: data.updated ?? data.date ?? "",
				tags: data.tags ?? [],
				emoji: data.emoji ?? "",
				readingTime: estimateReadingTime(content),
				searchText: [
					data.title ?? "",
					data.description ?? "",
					...(data.tags ?? []),
					stripMarkdown(content),
				]
					.join(" ")
					.toLowerCase(),
			};
		})
		.sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getCategoryForTag(tag: string): string | null {
	for (const [key, cat] of Object.entries(TAG_CATEGORIES)) {
		if (cat.tags.includes(tag)) return key;
	}
	return null;
}

export function getPostsByCategory(categoryKey: string): PostMeta[] {
	const cat = TAG_CATEGORIES[categoryKey];
	if (!cat) return [];
	return getAllPosts().filter((post) =>
		post.tags.some((t) => cat.tags.includes(t)),
	);
}

export function getAllTags(): string[] {
	const posts = getAllPosts();
	const tagSet = new Set<string>();
	for (const post of posts) {
		for (const tag of post.tags) {
			tagSet.add(tag);
		}
	}
	return Array.from(tagSet).sort();
}

export function getPostsByTag(tag: string): PostMeta[] {
	return getAllPosts().filter((post) => post.tags.includes(tag));
}

export function getPostBySlug(slug: string): Post | null {
	const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
	if (!fs.existsSync(filePath)) return null;

	const raw = fs.readFileSync(filePath, "utf-8");
	const { data, content } = matter(raw);

	return {
		slug,
		title: data.title ?? "",
		description: data.description ?? "",
		date: data.date ?? "",
		updated: data.updated ?? data.date ?? "",
		tags: data.tags ?? [],
		emoji: data.emoji ?? "",
		readingTime: estimateReadingTime(content),
		content,
	};
}
