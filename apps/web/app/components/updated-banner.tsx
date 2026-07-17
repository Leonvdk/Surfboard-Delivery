interface Props {
	updated: string;
	published?: string;
}

function formatDate(dateStr: string): string {
	return new Date(dateStr).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

export function UpdatedBanner({ updated, published }: Props) {
	if (!updated) return null;
	if (published && published === updated) return null;

	return (
		<p className="updated-banner">
			<span className="updated-banner-dot" aria-hidden="true">•</span>
			<span>
				Last updated <time dateTime={updated}>{formatDate(updated)}</time>
			</span>
		</p>
	);
}
