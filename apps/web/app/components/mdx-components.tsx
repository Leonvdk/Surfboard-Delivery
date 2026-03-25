import type { MDXComponents } from "mdx/types";
import Link from "next/link";
import type { AnchorHTMLAttributes, HTMLAttributes } from "react";

function isInternalLink(href: string | undefined): boolean {
	if (!href) return false;
	return href.startsWith("/") || href.startsWith("#");
}

export const mdxComponents: MDXComponents = {
	h1: (props: HTMLAttributes<HTMLHeadingElement>) => (
		<h1 className="blog-post-h1" {...props} />
	),
	h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
		<h2 className="blog-post-h2" {...props} />
	),
	h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
		<h3 className="blog-post-h3" {...props} />
	),
	p: (props: HTMLAttributes<HTMLParagraphElement>) => (
		<p className="blog-post-p" {...props} />
	),
	ul: (props: HTMLAttributes<HTMLUListElement>) => (
		<ul className="blog-post-ul" {...props} />
	),
	ol: (props: HTMLAttributes<HTMLOListElement>) => (
		<ol className="blog-post-ol" {...props} />
	),
	li: (props: HTMLAttributes<HTMLLIElement>) => (
		<li className="blog-post-li" {...props} />
	),
	a: ({ href, children, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
		isInternalLink(href) ? (
			<Link href={href!} className="blog-post-a" {...rest}>
				{children}
			</Link>
		) : (
			<a href={href} className="blog-post-a" target="_blank" rel="noopener noreferrer" {...rest}>
				{children}
			</a>
		),
	blockquote: (props: HTMLAttributes<HTMLQuoteElement>) => (
		<blockquote className="blog-post-blockquote" {...props} />
	),
	strong: (props: HTMLAttributes<HTMLElement>) => (
		<strong className="blog-post-strong" {...props} />
	),
	hr: () => <hr className="blog-post-hr" />,
};
