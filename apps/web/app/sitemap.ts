import type { MetadataRoute } from "next";
import { getAllPosts, getAllTags } from "./lib/blog";
import { SITE_URL } from "./lib/metadata";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();
	const posts = getAllPosts();

	const staticPages: MetadataRoute.Sitemap = [
		{
			url: SITE_URL,
			lastModified,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${SITE_URL}/surf-gear`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${SITE_URL}/pricing`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${SITE_URL}/surf-spots`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${SITE_URL}/how-it-works`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/contact`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/faq`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${SITE_URL}/blog`,
			lastModified,
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: `${SITE_URL}/about`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.6,
		},
		{
			url: `${SITE_URL}/reviews`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${SITE_URL}/group-bookings`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: `${SITE_URL}/gift-vouchers`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.6,
		},
		{
			url: `${SITE_URL}/partners`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.5,
		},
		{
			url: `${SITE_URL}/sustainability`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.4,
		},
		{
			url: `${SITE_URL}/terms`,
			lastModified,
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${SITE_URL}/privacy`,
			lastModified,
			changeFrequency: "yearly",
			priority: 0.3,
		},
	];

	const blogPages: MetadataRoute.Sitemap = posts
		.filter((post) => post.date && !Number.isNaN(Date.parse(post.date)))
		.map((post) => ({
			url: `${SITE_URL}/blog/${post.slug}`,
			lastModified: new Date(post.date),
			changeFrequency: "monthly" as const,
			priority: 0.6,
		}));

	const tagPages: MetadataRoute.Sitemap = getAllTags().map((tag) => ({
		url: `${SITE_URL}/blog/tag/${encodeURIComponent(tag)}`,
		lastModified,
		changeFrequency: "weekly" as const,
		priority: 0.4,
	}));

	return [...staticPages, ...blogPages, ...tagPages];
}
