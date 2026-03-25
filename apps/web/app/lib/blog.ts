import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export interface PostMeta {
	slug: string;
	title: string;
	description: string;
	date: string;
	tags: string[];
}

export interface Post extends PostMeta {
	content: string;
}

const POSTS_DIR = path.join(process.cwd(), "content", "blog");

export function getAllPosts(): PostMeta[] {
	if (!fs.existsSync(POSTS_DIR)) return [];

	return fs
		.readdirSync(POSTS_DIR)
		.filter((f) => f.endsWith(".mdx"))
		.map((filename) => {
			const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf-8");
			const { data } = matter(raw);
			return {
				slug: filename.replace(/\.mdx$/, ""),
				title: data.title ?? "",
				description: data.description ?? "",
				date: data.date ?? "",
				tags: data.tags ?? [],
			};
		})
		.sort((a, b) => (a.date > b.date ? -1 : 1));
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
		tags: data.tags ?? [],
		content,
	};
}
