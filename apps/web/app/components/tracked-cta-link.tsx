"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackCtaClick } from "../lib/analytics";

interface Props {
	href: string;
	className?: string;
	ctaText: string;
	ctaLocation: string;
	children: ReactNode;
}

export function TrackedCtaLink({
	href,
	className,
	ctaText,
	ctaLocation,
	children,
}: Props) {
	return href.startsWith("#") ? (
		<a
			href={href}
			className={className}
			onClick={() =>
				trackCtaClick({
					cta_text: ctaText,
					cta_location: ctaLocation,
					destination: href,
				})
			}
		>
			{children}
		</a>
	) : (
		<Link
			href={href}
			className={className}
			onClick={() =>
				trackCtaClick({
					cta_text: ctaText,
					cta_location: ctaLocation,
					destination: href,
				})
			}
		>
			{children}
		</Link>
	);
}
