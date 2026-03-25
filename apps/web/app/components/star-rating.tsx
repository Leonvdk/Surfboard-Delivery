export function StarRating({ rating = 5 }: { rating?: number }) {
	return (
		<div className="review-stars" aria-label={`${rating} out of 5 stars`}>
			{Array.from({ length: 5 }, (_, i) => (
				<svg key={i} viewBox="0 0 20 20" aria-hidden="true">
					{i < rating ? (
						<path d="M10 1l2.5 5 5.5.8-4 3.9.9 5.5L10 13.4l-4.9 2.8.9-5.5-4-3.9 5.5-.8L10 1z" />
					) : (
						<path
							d="M10 1l2.5 5 5.5.8-4 3.9.9 5.5L10 13.4l-4.9 2.8.9-5.5-4-3.9 5.5-.8L10 1z"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.2"
						/>
					)}
				</svg>
			))}
		</div>
	);
}
