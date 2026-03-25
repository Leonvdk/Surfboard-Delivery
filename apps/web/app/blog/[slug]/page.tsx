import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
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
				})}
			/>

			<section className="section" style={{ paddingTop: "var(--space-10)" }}>
				<div className="container">
					<Reveal>
						<nav className="blog-breadcrumbs" aria-label="Breadcrumb">
							<Link href="/">Home</Link>
							<span>/</span>
							<Link href="/blog">Blog</Link>
							<span>/</span>
							<span>{post.title}</span>
						</nav>
					</Reveal>
					<Reveal>
						<header className="blog-post-header">
							<time className="blog-post-date" dateTime={post.date}>
								{formatDate(post.date)}
							</time>
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
		</>
	);
}
