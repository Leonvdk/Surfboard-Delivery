import type { Metadata, Viewport } from "next";
import { AdminNavBar } from "./_components/admin-nav-bar";
import { AdminTabBar } from "./_components/admin-tab-bar";
import { ServiceWorkerRegister } from "./_components/service-worker-register";

export const metadata: Metadata = {
	title: "Admin — Surf Rental Aljezur",
	robots: { index: false, follow: false },
	manifest: "/admin/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		title: "SR Admin",
		statusBarStyle: "default",
	},
};

export const viewport: Viewport = {
	themeColor: "#C04419",
	width: "device-width",
	initialScale: 1,
	viewportFit: "cover",
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
			<AdminTabBar />
			<ServiceWorkerRegister />
		</div>
	);
}
