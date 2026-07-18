import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
	title: "Admin — Surf Rental Aljezur",
	robots: { index: false, follow: false },
};

async function logout() {
	"use server";
	const { getAdminSession } = await import("../lib/auth/session");
	const session = await getAdminSession();
	session.destroy();
	const { redirect } = await import("next/navigation");
	redirect("/admin/login");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="admin-shell">
			<nav className="admin-nav">
				<div className="admin-nav-inner">
					<Link href="/admin" className="admin-nav-brand">
						Surf Rental · Admin
					</Link>
					<ul className="admin-nav-links">
						<li>
							<Link href="/admin">Bookings</Link>
						</li>
						<li>
							<Link href="/admin/calendar">Calendar</Link>
						</li>
						<li>
							<Link href="/admin/revenue">Revenue</Link>
						</li>
					</ul>
					<form action={logout}>
						<button type="submit" className="admin-nav-logout">
							Log out
						</button>
					</form>
				</div>
			</nav>
			<main className="admin-main">{children}</main>
		</div>
	);
}
