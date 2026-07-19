"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

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

// useLayoutEffect on the server logs a warning; fall through to useEffect
// when window isn't available. The measurement obviously only matters on
// the client, so no visible skew.
const useIsomorphicLayoutEffect =
	typeof window === "undefined" ? useEffect : useLayoutEffect;

export function AdminTabBar() {
	const pathname = usePathname();
	const listRef = useRef<HTMLUListElement>(null);
	const [indicator, setIndicator] = useState<{
		left: number;
		width: number;
	} | null>(null);

	const activeIndex = TABS.findIndex((t) => t.match(pathname));

	useIsomorphicLayoutEffect(() => {
		const list = listRef.current;
		if (!list) return;
		const items = list.querySelectorAll<HTMLLIElement>(".admin-tabbar-item");
		const activeItem = items[activeIndex];
		if (!activeItem) return;

		// Capture narrowed references so the closures below don't need
		// their own null checks (and TS stops complaining about them).
		const listEl: HTMLUListElement = list;
		const itemEl: HTMLLIElement = activeItem;

		function measure() {
			const listRect = listEl.getBoundingClientRect();
			const itemRect = itemEl.getBoundingClientRect();
			// Narrow the marker so it hovers over the tab's icon+label instead
			// of spanning the full column — matches the previous ::before rule
			// (left: 30%; right: 30%).
			const insetRatio = 0.3;
			const inset = itemRect.width * insetRatio;
			setIndicator({
				left: itemRect.left - listRect.left + inset,
				width: itemRect.width - inset * 2,
			});
		}

		measure();
		// Recompute on resize / orientation change so the marker doesn't
		// end up at a stale x-offset.
		const ro = new ResizeObserver(measure);
		ro.observe(listEl);
		window.addEventListener("resize", measure);
		return () => {
			ro.disconnect();
			window.removeEventListener("resize", measure);
		};
	}, [activeIndex]);

	if (pathname === "/admin/login") return null;

	return (
		<nav className="admin-tabbar" aria-label="Admin sections">
			<ul className="admin-tabbar-list" ref={listRef}>
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
				{indicator && (
					<span
						className="admin-tabbar-indicator"
						aria-hidden="true"
						style={{
							transform: `translate3d(${indicator.left}px, 0, 0)`,
							width: `${indicator.width}px`,
						}}
					/>
				)}
			</ul>
		</nav>
	);
}
