"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NotificationsBell } from "./notifications-bell";

interface Props {
	logout: () => Promise<void>;
}

export function AdminNavBar({ logout }: Props) {
	const pathname = usePathname();
	// Login page renders bare — the admin tabs make no sense before you're
	// authenticated, and the redirect target is the current URL anyway.
	if (pathname === "/admin/login") return null;

	return (
		<nav className="admin-nav">
			<div className="admin-nav-inner">
				<Link href="/admin" className="admin-nav-brand">
					Surf Rental · Admin
				</Link>
				<ul className="admin-nav-links">
					<li>
						<Link
							href="/admin"
							className={
								pathname === "/admin" || pathname.startsWith("/admin/bookings")
									? "admin-nav-link admin-nav-link--active"
									: "admin-nav-link"
							}
						>
							Bookings
						</Link>
					</li>
					<li>
						<Link
							href="/admin/calendar"
							className={
								pathname.startsWith("/admin/calendar")
									? "admin-nav-link admin-nav-link--active"
									: "admin-nav-link"
							}
						>
							Calendar
						</Link>
					</li>
					<li>
						<Link
							href="/admin/revenue"
							className={
								pathname.startsWith("/admin/revenue")
									? "admin-nav-link admin-nav-link--active"
									: "admin-nav-link"
							}
						>
							Revenue
						</Link>
					</li>
				</ul>
				<div className="admin-nav-tail">
					<NotificationsBell />
					<form action={logout}>
						<button type="submit" className="admin-nav-logout">
							Log out
						</button>
					</form>
				</div>
			</div>
		</nav>
	);
}
