import Link from "next/link";
import { getPostBySlug } from "../lib/blog";

interface Props {
	slugs: string[];
	heading?: string;
}

export function RelatedPosts({
	slugs,
	heading = "Related reading",
}: Props) {
	const posts = slugs
		.map((slug) => getPostBySlug(slug))
		.filter((p): p is NonNullable<typeof p> => p !== null && !p.noindex);

	if (posts.length === 0) return null;

	return (
		<aside className="related-posts" aria-labelledby="related-posts-heading">
			<h2 className="related-posts-heading" id="related-posts-heading">
				{heading}
			</h2>
			<ul className="related-posts-list">
				{posts.map((post) => (
					<li key={post.slug} className="related-posts-item">
						<Link href={`/blog/${post.slug}`} className="related-posts-link">
							<span className="related-posts-emoji" aria-hidden="true">
								{post.emoji || "•"}
							</span>
							<span className="related-posts-body">
								<span className="related-posts-title">{post.title}</span>
								<span className="related-posts-desc">{post.description}</span>
							</span>
						</Link>
					</li>
				))}
			</ul>
		</aside>
	);
}
