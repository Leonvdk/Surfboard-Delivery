"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Renders the marketing-site chrome (top nav, footer, floating CTA) — but
 * hides everything when we're inside the /admin surface, which has its own
 * layout and shouldn't inherit the public site's UI.
 */
export function SiteChrome({ children }: { children: ReactNode }) {
	const pathname = usePathname();
	if (pathname.startsWith("/admin")) return null;
	return <>{children}</>;
}
