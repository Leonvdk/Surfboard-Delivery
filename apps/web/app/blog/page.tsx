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
						<div className="blog-grid">
								{posts.map((post) => (
									<Reveal key={post.slug}>
										<Link
											href={`/blog/${post.slug}`}
											className="blog-card"
										>
											<div className="blog-card-accent" />
											<div className="blog-card-content">
												<div className="blog-card-meta">
													<time className="blog-card-date" dateTime={post.date}>
														{formatDate(post.date)}
													</time>
													<span className="blog-card-dot" aria-hidden="true">·</span>
													<span className="blog-card-read">{post.readingTime} min read</span>
												</div>
												<h3 className="blog-card-title">{post.title}</h3>
												<p className="blog-card-desc">{post.description}</p>
											</div>
											<div className="blog-card-footer">
												{post.tags.length > 0 && (
													<div className="blog-card-tags">
														{post.tags.slice(0, 2).map((tag) => (
															<span key={tag} className="blog-tag">
																{tag}
															</span>
														))}
													</div>
												)}
												<span className="blog-card-cta" aria-hidden="true">
													Read
													<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
														<line x1="5" y1="12" x2="19" y2="12" />
														<polyline points="12 5 19 12 12 19" />
													</svg>
												</span>
											</div>
										</Link>
									</Reveal>
								))}
							</div>
					)}
				</div>
			</section>

			<BlogCtaPopup />
		</>
	);
}
