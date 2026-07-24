export default function AdminLoading() {
	return (
		<section className="admin-list-page" aria-busy="true">
			<header className="admin-page-header">
				<h1>Bookings</h1>
			</header>
			<div className="admin-today">
				<div className="admin-skeleton admin-skeleton--card" />
				<div className="admin-skeleton admin-skeleton--card" />
				<div className="admin-skeleton admin-skeleton--card admin-skeleton--wide" />
			</div>
			<div className="admin-skeleton admin-skeleton--table" />
		</section>
	);
}
