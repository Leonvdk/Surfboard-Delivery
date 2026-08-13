"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the marketing-site chrome (top nav, footer, floating CTA) — but
 * hides everything when we're inside the /admin surface or the fullscreen
 * /tides guide, which have their own layout and shouldn't inherit the public
 * site's UI.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	if (pathname.startsWith("/admin") || pathname.startsWith("/tides")) return null;
	return <>{children}</>;
}
