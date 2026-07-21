import type { Metadata, Viewport } from "next";
import { AdminNavBar } from "./_components/admin-nav-bar";
import { AdminTabBar } from "./_components/admin-tab-bar";
import { PullToRefresh } from "./_components/pull-to-refresh";
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

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	// The OS badge is now driven client-side by NotificationsBell so it
	// reflects "unseen since last panel open", not "unfinished on the
	// server". Do not add another badge updater here — two writers race.
	return (
		<div className="admin-shell">
			<AdminNavBar logout={logout} />
			<PullToRefresh />
			<main className="admin-main">{children}</main>
			<AdminTabBar />
			<ServiceWorkerRegister />
		</div>
	);
}
