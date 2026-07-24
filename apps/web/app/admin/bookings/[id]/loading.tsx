export default function BookingDetailLoading() {
	return (
		<section className="admin-detail" aria-busy="true">
			<div className="admin-skeleton admin-skeleton--line" />
			<div className="admin-detail-grid">
				<div className="admin-skeleton admin-skeleton--card" />
				<div className="admin-skeleton admin-skeleton--card" />
			</div>
			<div className="admin-skeleton admin-skeleton--card admin-skeleton--wide" />
		</section>
	);
}
