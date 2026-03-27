"use client";

import { useEffect } from "react";
import {
	trackEmailClick,
	trackPhoneClick,
	trackWhatsAppClick,
} from "../lib/analytics";

export function OutboundTracker() {
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			const anchor = (e.target as HTMLElement).closest("a");
			if (!anchor) return;

			const href = anchor.getAttribute("href") ?? "";
			const section =
				anchor.closest("footer") ? "footer"
				: anchor.closest("nav") ? "nav"
				: anchor.closest(".page-hero") ? "hero"
				: anchor.closest(".blog-cta-popup") ? "blog_popup"
				: "page_body";

			if (href.includes("wa.me")) {
				trackWhatsAppClick(section);
			} else if (href.startsWith("mailto:")) {
				trackEmailClick(section);
			} else if (href.startsWith("tel:")) {
				trackPhoneClick(section);
			}
		};

		document.addEventListener("click", handleClick);
		return () => document.removeEventListener("click", handleClick);
	}, []);

	return null;
}
