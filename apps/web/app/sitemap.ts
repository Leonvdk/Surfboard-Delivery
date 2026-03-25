import type { MetadataRoute } from "next";

const BASE_URL = "https://surfrental.pt";

export default function sitemap(): MetadataRoute.Sitemap {
	const lastModified = new Date();

	return [
		{
			url: BASE_URL,
			lastModified,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: `${BASE_URL}/surf-gear`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${BASE_URL}/pricing`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${BASE_URL}/surf-spots`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: `${BASE_URL}/how-it-works`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${BASE_URL}/contact`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: `${BASE_URL}/faq`,
			lastModified,
			changeFrequency: "monthly",
			priority: 0.7,
		},
	];
}
