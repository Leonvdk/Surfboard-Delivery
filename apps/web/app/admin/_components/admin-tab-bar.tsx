"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
	href: string;
	label: string;
	// Match by prefix so /admin/bookings/42 highlights the Bookings tab.
	match: (pathname: string) => boolean;
	icon: React.ReactNode;
}

const iconProps = {
	width: 22,
	height: 22,
	viewBox: "0 0 24 24",
	fill: "none",
	stroke: "currentColor",
	strokeWidth: 1.8,
	strokeLinecap: "round" as const,
	strokeLinejoin: "round" as const,
	"aria-hidden": true,
};

const TABS: Tab[] = [
	{
		href: "/admin",
		label: "Bookings",
		match: (p) => p === "/admin" || p.startsWith("/admin/bookings"),
		icon: (
			<svg {...iconProps}>
				<path d="M4 5h16" />
				<path d="M4 12h16" />
				<path d="M4 19h16" />
			</svg>
		),
	},
	{
		href: "/admin/calendar",
		label: "Calendar",
		match: (p) => p.startsWith("/admin/calendar"),
		icon: (
			<svg {...iconProps}>
				<rect x="3.5" y="5" width="17" height="15" />
				<path d="M3.5 10h17" />
				<path d="M8 3v4" />
				<path d="M16 3v4" />
			</svg>
		),
	},
	{
		href: "/admin/revenue",
		label: "Revenue",
		match: (p) => p.startsWith("/admin/revenue"),
		icon: (
			<svg {...iconProps}>
				<path d="M5 20V10" />
				<path d="M12 20V4" />
				<path d="M19 20v-7" />
			</svg>
		),
	},
];

export function AdminTabBar() {
	const pathname = usePathname();
	if (pathname === "/admin/login") return null;

	return (
		<nav className="admin-tabbar" aria-label="Admin sections">
			<ul className="admin-tabbar-list">
				{TABS.map((tab) => {
					const active = tab.match(pathname);
					return (
						<li key={tab.href} className="admin-tabbar-item">
							<Link
								href={tab.href}
								className={`admin-tabbar-link${active ? " admin-tabbar-link--active" : ""}`}
								aria-current={active ? "page" : undefined}
							>
								<span className="admin-tabbar-icon">{tab.icon}</span>
								<span className="admin-tabbar-label">{tab.label}</span>
							</Link>
						</li>
					);
				})}
			</ul>
		</nav>
	);
}
