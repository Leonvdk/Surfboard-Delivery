import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
			},
			{
				userAgent: "GPTBot",
				allow: "/",
			},
			{
				userAgent: "ChatGPT-User",
				allow: "/",
			},
			{
				userAgent: "PerplexityBot",
				allow: "/",
			},
			{
				userAgent: "ClaudeBot",
				allow: "/",
			},
			{
				userAgent: "Google-Extended",
				allow: "/",
			},
		],
		sitemap: "https://surfrental-aljezur.com/sitemap.xml",
	};
}
