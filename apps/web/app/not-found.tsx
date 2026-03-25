import Link from "next/link";
import { Reveal } from "./components/reveal";

export default function NotFound() {
	return (
		<section className="page-hero" style={{ minHeight: "60vh" }}>
			<div className="container" style={{ textAlign: "center" }}>
				<Reveal>
					<div>
						<h1>Page not found</h1>
						<p className="page-hero-sub">
							Looks like this wave closed out. Let&apos;s get you back in the lineup.
						</p>
						<div className="hero-cta" style={{ marginTop: "32px" }}>
							<Link href="/" className="btn btn-primary">
								Back to home
							</Link>
							<Link href="/surf-spots" className="btn btn-secondary">
								Explore surf spots
							</Link>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
