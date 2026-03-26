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
