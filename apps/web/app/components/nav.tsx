"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const LINKS = [
	{ href: "/surf-gear", label: "Boards" },
	{ href: "/pricing", label: "Pricing" },
	{ href: "/how-it-works", label: "Process" },
	{ href: "/reviews", label: "Reviews" },
	{ href: "/blog", label: "Blog" },
] as const;

export function Nav() {
	const [open, setOpen] = useState(false);

	const close = useCallback(() => setOpen(false), []);

	useEffect(() => {
		if (!open) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, close]);

	return (
		<nav className="nav" aria-label="Main navigation">
			<div className="container">
				<Link href="/" className="nav-logo" aria-label="Surf Rental Aljezur home">
					<Image src="/images/logo.png" alt="" width={36} height={36} className="nav-logo-img" />
					<span className="nav-logo-text">
						<span className="nav-word nav-word-1">Surf</span>{" "}
						<span className="nav-word nav-word-2">Rental</span>{" "}
						<em className="nav-word nav-word-3">Aljezur</em>
					</span>
				</Link>

				<ul className="nav-links">
					{LINKS.map(({ href, label }) => (
						<li key={href}>
							<Link href={href}>{label}</Link>
						</li>
					))}
					<li>
						<Link href="/contact" className="nav-cta">
							Book Now
						</Link>
					</li>
				</ul>

				<button
					type="button"
					className="mobile-menu-btn"
					onClick={() => setOpen((prev) => !prev)}
					aria-label="Toggle menu"
					aria-expanded={open}
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
					>
						{open ? (
							<>
								<line x1="6" y1="6" x2="18" y2="18" />
								<line x1="6" y1="18" x2="18" y2="6" />
							</>
						) : (
							<>
								<line x1="4" y1="7" x2="20" y2="7" />
								<line x1="4" y1="12" x2="20" y2="12" />
								<line x1="4" y1="17" x2="20" y2="17" />
							</>
						)}
					</svg>
				</button>
			</div>

			{open && (
				<div className="nav-mobile-menu">
					{LINKS.map(({ href, label }) => (
						<Link key={href} href={href} onClick={close}>
							{label}
						</Link>
					))}
					<Link href="/contact" className="nav-cta" onClick={close}>
						Book Now
					</Link>
				</div>
			)}
		</nav>
	);
}
