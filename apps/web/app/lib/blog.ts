import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { cache } from "react";

export interface PostMeta {
	slug: string;
	title: string;
	description: string;
	date: string;
	updated: string;
	tags: string[];
	emoji: string;
	readingTime: number;
	noindex: boolean;
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

export const getAllPosts = cache((): PostMeta[] => {
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
				noindex: data.noindex === true,
			};
		})
		.sort((a, b) => (a.date > b.date ? -1 : 1));
});

export const TAG_CATEGORIES: Record<string, { label: string; tags: string[] }> = {
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
		tags: ["seasons", "conditions", "surf conditions", "winter", "summer", "off-season"],
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
				noindex: data.noindex === true,
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
	return getAllPosts().filter((post) => post.tags.some((t) => cat.tags.includes(t)));
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

export const getPostBySlug = cache((slug: string): Post | null => {
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
		noindex: data.noindex === true,
		content,
	};
});

/**
 * Pull the Q&A pairs out of a post's FAQ section so they can be emitted as
 * FAQPage structured data.
 *
 * Answer engines lift question/answer pairs far more readily when they're
 * marked up than when they're only prose, and most of our posts already end
 * with a hand-written FAQ. This reads that section straight from the MDX —
 * no duplicate content to maintain, and it stays correct when the prose is
 * edited.
 *
 * Recognises "## FAQ", "## Frequently asked questions" and "## Common
 * questions" (any casing), treats each "### ..." as a question, and stops at
 * the next "##" heading or the closing "---" rule.
 */
export function extractFaqs(content: string): Array<{ question: string; answer: string }> {
	const lines = content.split("\n");
	const faqs: Array<{ question: string; answer: string }> = [];

	let inSection = false;
	let question: string | null = null;
	let answer: string[] = [];

	const flush = () => {
		if (question) {
			const text = stripInlineMarkdown(answer.join(" ").trim());
			if (text) faqs.push({ question: stripInlineMarkdown(question), answer: text });
		}
		question = null;
		answer = [];
	};

	for (const line of lines) {
		const h2 = line.match(/^##\s+(.*)$/);
		if (h2 && !line.startsWith("###")) {
			// Entering or leaving the FAQ section.
			const heading = (h2[1] ?? "").toLowerCase();
			const isFaqHeading =
				heading.includes("frequently asked") ||
				heading.includes("common questions") ||
				heading.trim() === "faq" ||
				heading.startsWith("faq");
			if (inSection) flush();
			inSection = isFaqHeading;
			continue;
		}
		if (!inSection) continue;
		// A horizontal rule ends the FAQ block (our posts close with one).
		if (/^---\s*$/.test(line)) {
			flush();
			inSection = false;
			continue;
		}
		const h3 = line.match(/^###\s+(.*)$/);
		if (h3) {
			flush();
			question = (h3[1] ?? "").trim();
			continue;
		}
		if (question && line.trim()) answer.push(line.trim());
	}
	flush();

	return faqs;
}

/** Flatten inline markdown so schema carries clean prose, not syntax. */
function stripInlineMarkdown(text: string): string {
	return text
		.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label
		.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, "$1") // bold / italic
		.replace(/`([^`]+)`/g, "$1") // inline code
		.replace(/\s+/g, " ")
		.trim();
}
