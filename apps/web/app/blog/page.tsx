import type { Metadata } from "next";
import BlogCtaPopup from "../components/blog-cta-popup";
import BlogFilteredGrid from "../components/blog-filtered-grid";
import { Breadcrumbs } from "../components/breadcrumbs";
import { JsonLd } from "../components/json-ld";
import { Reveal } from "../components/reveal";
import { TAG_CATEGORIES, getAllSearchablePosts } from "../lib/blog";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Blog — Surf Tips, Travel Guides & Local Knowledge from Aljezur",
	description:
		"Surf guides, trip planning tips, and local knowledge from the Costa Vicentina. Everything you need to plan your surf holiday in Aljezur, Portugal.",
	alternates: { canonical: "/blog" },
	openGraph: {
		title: "Blog | Surf Rental Aljezur",
		description:
			"Surf tips, travel guides, and local knowledge for your Aljezur surf trip.",
		url: `${SITE_URL}/blog`,
	},
};

export default function BlogPage() {
	const posts = getAllSearchablePosts();
	const categories = Object.entries(TAG_CATEGORIES);

	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Blog", url: `${SITE_URL}/blog` },
				])}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
						<div>
							<h1>Blog</h1>
							<p className="page-hero-sub">
								Surf guides, travel tips, and local knowledge from the Costa Vicentina. Written by
								surfers who live here.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<BlogFilteredGrid posts={posts} categories={categories} />

			<BlogCtaPopup />
		</>
	);
}
