import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import BlogCtaPopup from "../../../components/blog-cta-popup";
import { Breadcrumbs } from "../../../components/breadcrumbs";
import { JsonLd } from "../../../components/json-ld";
import { HorizonLine, Reveal } from "../../../components/reveal";
import { getAllTags, getPostsByTag } from "../../../lib/blog";
import { breadcrumbJsonLd } from "../../../lib/jsonld";
import { SITE_URL } from "../../../lib/metadata";

interface Props {
	params: Promise<{ tag: string }>;
}

export async function generateStaticParams() {
	return getAllTags().map((tag) => ({ tag: encodeURIComponent(tag) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { tag } = await params;
	const decoded = decodeURIComponent(tag);
	const posts = getPostsByTag(decoded);
	if (posts.length === 0) return {};

	return {
		title: `Posts tagged "${decoded}"`,
		description: `All blog posts about ${decoded} — surf guides, tips, and local knowledge from the Costa Vicentina.`,
		alternates: { canonical: `/blog/tag/${tag}` },
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

export default async function TagPage({ params }: Props) {
	const { tag } = await params;
	const decoded = decodeURIComponent(tag);
	const posts = getPostsByTag(decoded);
	if (posts.length === 0) notFound();

	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Blog", url: `${SITE_URL}/blog` },
					{ name: decoded, url: `${SITE_URL}/blog/tag/${tag}` },
				])}
			/>

			<section className="page-hero">
				<div className="container">
					<Reveal>
						<Breadcrumbs
							items={[
								{ label: "Home", href: "/" },
								{ label: "Blog", href: "/blog" },
								{ label: decoded },
							]}
						/>
						<div>
							<h1>
								Tagged: <em>{decoded}</em>
							</h1>
							<p className="page-hero-sub">
								{posts.length} {posts.length === 1 ? "post" : "posts"} about {decoded}.
							</p>
						</div>
					</Reveal>
				</div>
			</section>

			<HorizonLine />

			<section className="section">
				<div className="container">
					<Reveal stagger>
						<div className="blog-grid">
							{posts.map((post) => (
								<Link key={post.slug} href={`/blog/${post.slug}`} className="blog-card">
									<time className="blog-card-date" dateTime={post.date}>
										{formatDate(post.date)}
									</time>
									<h3>{post.title}</h3>
									<p>{post.description}</p>
									{post.tags.length > 0 && (
										<div className="blog-card-tags">
											{post.tags.map((t) => (
												<span key={t} className="blog-tag">
													{t}
												</span>
											))}
										</div>
									)}
								</Link>
							))}
						</div>
					</Reveal>
				</div>
			</section>

			<BlogCtaPopup />
		</>
	);
}
