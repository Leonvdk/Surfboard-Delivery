"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
	children: ReactNode;
	className?: string;
	stagger?: boolean;
	delay?: number;
	threshold?: number;
}

export function Reveal({
	children,
	className = "",
	stagger = false,
	delay = 0,
	threshold = 0.15,
}: RevealProps) {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const prefersReducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;
		if (prefersReducedMotion) {
			el.setAttribute("data-revealed", "true");
			return;
		}

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					if (delay > 0) {
						setTimeout(
							() => el.setAttribute("data-revealed", "true"),
							delay,
						);
					} else {
						el.setAttribute("data-revealed", "true");
					}
					observer.unobserve(el);
				}
			},
			{ threshold, rootMargin: "0px 0px -60px 0px" },
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [delay, threshold]);

	return (
		<div
			ref={ref}
			className={className}
			{...(stagger
				? { "data-animate-stagger": "" }
				: { "data-animate": "" })}
		>
			{children}
		</div>
	);
}

export function HorizonLine() {
	return <hr className="horizon-line" aria-hidden="true" />;
}
