"use client";

import { usePathname } from "next/navigation";

const HIDDEN_PATHS = ["/contact"];

export function WhatsAppFloat() {
	const pathname = usePathname();
	if (HIDDEN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
		return null;
	}

	return (
		<div className="whatsapp-float">
			<a
				href="https://wa.me/31613262259?text=Hi%20Surf%20Rental%20Aljezur%2C%20I%27d%20like%20to%20ask%20about..."
				className="whatsapp-float-link"
				aria-label="Message us on WhatsApp"
				target="_blank"
				rel="noopener noreferrer"
			>
				<svg width="28" height="28" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
					<path d="M16.003 3C9.373 3 3.998 8.375 3.998 15.006c0 2.117.556 4.184 1.61 6.005L4 29l8.198-2.148a12.03 12.03 0 0 0 3.805.62h.005c6.63 0 12.005-5.376 12.005-12.006C28.013 8.375 22.632 3 16.003 3zm0 21.808h-.004a9.98 9.98 0 0 1-3.617-.68l-.259-.104-4.867 1.274 1.302-4.746-.169-.271a9.951 9.951 0 0 1-1.52-5.276c.001-5.504 4.48-9.98 9.987-9.98 2.667 0 5.174 1.04 7.06 2.926a9.9 9.9 0 0 1 2.923 7.058c-.001 5.504-4.481 9.98-9.836 9.98zm5.474-7.472c-.3-.15-1.774-.876-2.048-.977-.275-.101-.475-.15-.674.15-.2.301-.774.977-.948 1.176-.174.2-.35.226-.649.075-.3-.15-1.266-.466-2.412-1.487-.891-.795-1.492-1.777-1.667-2.077-.174-.301-.019-.463.131-.612.135-.135.3-.351.45-.526.15-.176.2-.301.3-.502.1-.2.05-.376-.025-.526-.075-.15-.674-1.626-.923-2.226-.244-.585-.492-.505-.674-.514l-.575-.011a1.104 1.104 0 0 0-.798.376c-.275.301-1.048 1.024-1.048 2.5s1.073 2.899 1.222 3.099c.15.2 2.11 3.222 5.114 4.518.716.309 1.274.492 1.71.63.72.229 1.373.196 1.89.119.577-.087 1.774-.725 2.024-1.426.25-.7.25-1.301.174-1.426-.075-.125-.275-.2-.575-.35z" />
				</svg>
				<span className="whatsapp-float-label">Chat with us</span>
			</a>
		</div>
	);
}
