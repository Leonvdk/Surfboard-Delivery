import type { Metadata } from "next";
import { AdminNavBar } from "./_components/admin-nav-bar";

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
			<AdminNavBar logout={logout} />
			<main className="admin-main">{children}</main>
		</div>
	);
}
