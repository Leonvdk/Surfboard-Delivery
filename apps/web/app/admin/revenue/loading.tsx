export default function AdminRevenueLoading() {
	return (
		<section className="admin-revenue-page" aria-busy="true">
			<header className="admin-page-header">
				<h1>Revenue</h1>
			</header>
			<div className="admin-today">
				<div className="admin-skeleton admin-skeleton--card" />
				<div className="admin-skeleton admin-skeleton--card" />
			</div>
			<div className="admin-skeleton admin-skeleton--grid" />
		</section>
	);
}
