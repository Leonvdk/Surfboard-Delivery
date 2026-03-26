import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCtaPopup from "../../../components/blog-cta-popup";
import { Breadcrumbs } from "../../../components/breadcrumbs";
import { JsonLd } from "../../../components/json-ld";
import { HorizonLine, Reveal } from "../../../components/reveal";
import {
	TAG_CATEGORIES,
	getPostsByCategory,
} from "../../../lib/blog";
import { breadcrumbJsonLd } from "../../../lib/jsonld";
import { SITE_URL } from "../../../lib/metadata";

interface Props {
	params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
	return Object.keys(TAG_CATEGORIES).map((key) => ({ category: key }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { category } = await params;
	const cat = TAG_CATEGORIES[category];
	if (!cat) return {};

	return {
		title: `${cat.label} — SurfRental Aljezur Blog`,
		description: `Browse all ${cat.label.toLowerCase()} articles — surf guides, tips, and local knowledge from the Costa Vicentina.`,
		alternates: { canonical: `/blog/category/${category}` },
		robots: { index: true, follow: true },
	};
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export default async function CategoryPage({ params }: Props) {
	const { category } = await params;
	const cat = TAG_CATEGORIES[category];
	if (!cat) notFound();

	const posts = getPostsByCategory(category);
	if (posts.length === 0) notFound();

	const tagsInCategory = new Set<string>();
	for (const post of posts) {
		for (const tag of post.tags) {
			if (cat.tags.includes(tag)) tagsInCategory.add(tag);
		}
	}
	const activeTags = Array.from(tagsInCategory).sort();

	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Blog", url: `${SITE_URL}/blog` },
					{
						name: cat.label,
						url: `${SITE_URL}/blog/category/${category}`,
					},
				])}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<Breadcrumbs
							items={[
								{ label: "Home", href: "/" },
								{ label: "Blog", href: "/blog" },
								{ label: cat.label },
							]}
						/>
						<div>
							<h1>{cat.label}</h1>
							<p className="page-hero-sub">
								{posts.length} {posts.length === 1 ? "post" : "posts"} in{" "}
								{cat.label.toLowerCase()}.
							</p>
						</div>
					</Reveal>

					{activeTags.length > 1 && (
						<Reveal>
							<div className="blog-tag-filters">
								{activeTags.map((tag) => (
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
											<time
												className="blog-card-date"
												dateTime={post.date}
											>
												{formatDate(post.date)}
											</time>
											<span
												className="blog-card-dot"
												aria-hidden="true"
											>
												·
											</span>
											<span className="blog-card-read">
												{post.readingTime} min read
											</span>
										</div>
										<h3 className="blog-card-title">
											{post.title}
										</h3>
										<p className="blog-card-desc">
											{post.description}
										</p>
									</div>
									<div className="blog-card-footer">
										{post.tags.length > 0 && (
											<div className="blog-card-tags">
												{post.tags
													.slice(0, 2)
													.map((tag) => (
														<span
															key={tag}
															className="blog-tag"
														>
															{tag}
														</span>
													))}
											</div>
										)}
										<span
											className="blog-card-cta"
											aria-hidden="true"
										>
											Read
											<svg
												width="14"
												height="14"
												viewBox="0 0 24 24"
												fill="none"
												stroke="currentColor"
												strokeWidth="2"
												strokeLinecap="round"
												strokeLinejoin="round"
											>
												<line
													x1="5"
													y1="12"
													x2="19"
													y2="12"
												/>
												<polyline points="12 5 19 12 12 19" />
											</svg>
										</span>
									</div>
								</Link>
							</Reveal>
						))}
					</div>
				</div>
			</section>

			<BlogCtaPopup />
		</>
	);
}
