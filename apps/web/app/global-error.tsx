"use client";

import { DM_Sans, Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
	subsets: ["latin"],
	variable: "--font-sora",
	display: "swap",
});

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
	display: "swap",
});

export default function GlobalError({
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en" className={`${sora.variable} ${dmSans.variable}`}>
			<body>
				<section className="error-page">
					<div className="container">
						<div className="error-page-inner">
							<span className="error-page-code">500</span>
							<h1 className="error-page-title">
								Something went wrong
							</h1>
							<p className="error-page-desc">
								A wave knocked us off the board. Let&apos;s try that again.
							</p>
							<div className="error-page-actions">
								<button
									type="button"
									onClick={() => reset()}
									className="btn btn-primary"
								>
									Try again
								</button>
								<a href="/" className="btn btn-secondary">
									Back to home
								</a>
							</div>
						</div>
					</div>
				</section>
			</body>
		</html>
	);
}
