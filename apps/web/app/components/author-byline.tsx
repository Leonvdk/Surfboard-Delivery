import Link from "next/link";

export function AuthorByline() {
	return (
		<p className="author-byline">
			By{" "}
			<Link href="/about" className="author-byline-link">
				Leon van de Klundert
			</Link>
			<span className="author-byline-role"> · Surf Rental Aljezur</span>
		</p>
	);
}
