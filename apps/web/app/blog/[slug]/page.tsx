import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import BlogCtaPopup from "../../components/blog-cta-popup";
import { Breadcrumbs } from "../../components/breadcrumbs";
import { CtaSection } from "../../components/cta-section";
import { JsonLd } from "../../components/json-ld";
import { mdxComponents } from "../../components/mdx-components";
import { HorizonLine, Reveal } from "../../components/reveal";
import { getAllPosts, getPostBySlug } from "../../lib/blog";
import { articleJsonLd, breadcrumbJsonLd } from "../../lib/jsonld";
import { SITE_URL } from "../../lib/metadata";

interface Props {
	params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
	return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const post = getPostBySlug(slug);
	if (!post) return {};

	return {
		title: post.title,
		description: post.description,
		alternates: { canonical: `/blog/${slug}` },
		openGraph: {
			title: post.title,
			description: post.description,
			url: `${SITE_URL}/blog/${slug}`,
			type: "article",
			publishedTime: post.date,
			modifiedTime: post.updated !== post.date ? post.updated : undefined,
		},
	};
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export default async function BlogPostPage({ params }: Props) {
	const { slug } = await params;
	const post = getPostBySlug(slug);
	if (!post) notFound();

	return (
		<>
			<JsonLd
				data={breadcrumbJsonLd([
					{ name: "Home", url: SITE_URL },
					{ name: "Blog", url: `${SITE_URL}/blog` },
					{ name: post.title, url: `${SITE_URL}/blog/${slug}` },
				])}
			/>
			<JsonLd
				data={articleJsonLd({
					title: post.title,
					description: post.description,
					url: `${SITE_URL}/blog/${slug}`,
					datePublished: post.date,
					dateModified: post.updated,
				})}
			/>

			<section className="section" style={{ paddingTop: 100 }}>
				<div className="container">
					<Reveal>
						<Breadcrumbs
							items={[
								{ label: "Home", href: "/" },
								{ label: "Blog", href: "/blog" },
								{ label: post.title },
							]}
						/>
					</Reveal>
					<Reveal>
						<header className="blog-post-header">
							{post.emoji && (
								<span className="blog-post-emoji">{post.emoji}</span>
							)}
							<div className="blog-post-meta">
								<time className="blog-post-date" dateTime={post.date}>
									{formatDate(post.date)}
								</time>
								{post.updated && post.updated !== post.date && (
									<span className="blog-post-updated">
										· Updated {formatDate(post.updated)}
									</span>
								)}
								<span className="blog-post-read">· {post.readingTime} min read</span>
							</div>
							<h1 className="blog-post-title">{post.title}</h1>
							<p className="blog-post-description">{post.description}</p>
							{post.tags.length > 0 && (
								<div className="blog-post-tags">
									{post.tags.map((tag) => (
										<span key={tag} className="blog-tag">
											{tag}
										</span>
									))}
								</div>
							)}
						</header>
					</Reveal>

					<HorizonLine />

					<Reveal>
						<article className="blog-post-body">
							<MDXRemote source={post.content} components={mdxComponents} />
						</article>
					</Reveal>
				</div>
			</section>

			<CtaSection />

			<BlogCtaPopup />
		</>
	);
}
