import Link from "next/link";
import { Reveal } from "./components/reveal";

export default function NotFound() {
	return (
		<section className="error-page">
			<div className="container">
				<Reveal>
					<div className="error-page-inner">
						<span className="error-page-code">404</span>
						<h1 className="error-page-title">Page not found</h1>
						<p className="error-page-desc">
							Looks like this wave closed out. Let&apos;s get you back in the
							lineup.
						</p>
						<div className="error-page-actions">
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
