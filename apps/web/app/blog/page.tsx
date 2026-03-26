import type { Metadata } from "next";
import Link from "next/link";
import BlogCtaPopup from "../components/blog-cta-popup";
import { Breadcrumbs } from "../components/breadcrumbs";
import { JsonLd } from "../components/json-ld";
import { HorizonLine, Reveal } from "../components/reveal";
import { getAllPosts, getAllTags } from "../lib/blog";
import { breadcrumbJsonLd } from "../lib/jsonld";
import { SITE_URL } from "../lib/metadata";

export const metadata: Metadata = {
	title: "Blog — Surf Tips, Travel Guides & Local Knowledge from Aljezur",
	description:
		"Surf guides, trip planning tips, and local knowledge from the Costa Vicentina. Everything you need to plan your surf holiday in Aljezur, Portugal.",
	alternates: { canonical: "/blog" },
	openGraph: {
		title: "Blog | SurfRental Aljezur",
		description:
			"Surf tips, travel guides, and local knowledge for your Aljezur surf trip.",
		url: `${SITE_URL}/blog`,
	},
};

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export default function BlogPage() {
	const posts = getAllPosts();
	const tags = getAllTags();

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
					{tags.length > 0 && (
						<Reveal>
							<div className="blog-tag-filters">
								{tags.map((tag) => (
									<Link
										key={tag}
										href={`/blog/tag/${encodeURIComponent(tag)}`}
										className="blog-tag"
									>
										{tag}
									</Link>
								))}
							</div>
						</Reveal>
					)}
				</div>
			</section>

			<HorizonLine />

			<section className="section">
				<div className="container">
					{posts.length === 0 ? (
						<Reveal>
							<div className="content-prose" style={{ textAlign: "center" as const }}>
								<p>Posts coming soon. Check back shortly.</p>
							</div>
						</Reveal>
					) : (
						<Reveal stagger>
							<div className="blog-grid">
								{posts.map((post) => (
									<Link
										key={post.slug}
										href={`/blog/${post.slug}`}
										className="blog-card"
									>
										{post.emoji && (
											<span className="blog-card-emoji">{post.emoji}</span>
										)}
										<div className="blog-card-meta">
											<time className="blog-card-date" dateTime={post.date}>
												{formatDate(post.date)}
											</time>
											<span className="blog-card-dot">·</span>
											<span className="blog-card-read">{post.readingTime} min read</span>
										</div>
										<h3>{post.title}</h3>
										<p>{post.description}</p>
										<div className="blog-card-bottom">
											{post.tags.length > 0 && (
												<div className="blog-card-tags">
													{post.tags.map((tag) => (
														<span key={tag} className="blog-tag">
															{tag}
														</span>
													))}
												</div>
											)}
											<span className="blog-card-arrow" aria-hidden="true">→</span>
										</div>
									</Link>
								))}
							</div>
						</Reveal>
					)}
				</div>
			</section>

			<BlogCtaPopup />
		</>
	);
}
