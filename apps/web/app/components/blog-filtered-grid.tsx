"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchablePost } from "../lib/blog";

interface Props {
	posts: SearchablePost[];
	categories: [string, { label: string; tags: string[] }][];
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export default function BlogFilteredGrid({ posts, categories }: Props) {
	const [query, setQuery] = useState("");
	const [activeCategory, setActiveCategory] = useState<string | null>(null);

	const filtered = useMemo(() => {
		let results = posts;

		if (activeCategory) {
			const cat = categories.find(([key]) => key === activeCategory);
			if (cat) {
				const catTags = cat[1].tags;
				results = results.filter((p) =>
					p.tags.some((t) => catTags.includes(t)),
				);
			}
		}

		if (query.trim()) {
			const terms = query.toLowerCase().trim().split(/\s+/);
			results = results.filter((p) =>
				terms.every((term) => p.searchText.includes(term)),
			);
		}

		return results;
	}, [posts, categories, query, activeCategory]);

	return (
		<>
			<div className="blog-toolbar">
				<div className="container">
					<div className="blog-toolbar-inner">
						<div className="blog-search-wrap">
							<svg
								className="blog-search-icon"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2.5"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<circle cx="11" cy="11" r="8" />
								<line x1="21" y1="21" x2="16.65" y2="16.65" />
							</svg>
							<input
								type="text"
								className="blog-search"
								placeholder={`Search ${posts.length} articles...`}
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
							{query && (
								<button
									type="button"
									className="blog-search-clear"
									onClick={() => setQuery("")}
									aria-label="Clear search"
								>
									Clear
								</button>
							)}
						</div>
						<div className="blog-category-filters">
							<button
								type="button"
								className={`blog-category-pill ${activeCategory === null ? "active" : ""}`}
								onClick={() => setActiveCategory(null)}
							>
								All
							</button>
							{categories.map(([key, cat]) => (
								<button
									type="button"
									key={key}
									className={`blog-category-pill ${activeCategory === key ? "active" : ""}`}
									onClick={() =>
										setActiveCategory(
											activeCategory === key ? null : key,
										)
									}
								>
									{cat.label}
								</button>
							))}
						</div>
					</div>
					{(query || activeCategory) && (
						<p className="blog-results-count">
							{filtered.length}{" "}
							{filtered.length === 1 ? "article" : "articles"}
							{query ? ` matching "${query}"` : ""}
							{activeCategory
								? ` in ${categories.find(([k]) => k === activeCategory)?.[1].label}`
								: ""}
						</p>
					)}
				</div>
			</div>

			<section className="blog-results-section">
				<div className="container">
					{filtered.length === 0 ? (
						<div
							className="content-prose"
							style={{ textAlign: "center" }}
						>
							<p>
								No articles found.{" "}
								<button
									type="button"
									className="blog-clear-link"
									onClick={() => {
										setQuery("");
										setActiveCategory(null);
									}}
								>
									Clear filters
								</button>
							</p>
						</div>
					) : (
						<div className="blog-grid">
							{filtered.map((post) => (
								<div key={post.slug} className="blog-grid-item">
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
								</div>
							))}
						</div>
					)}
				</div>
			</section>
		</>
	);
}
