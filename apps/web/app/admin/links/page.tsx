import { getDb } from "../../lib/db/client";
import { LinkForm } from "../_components/link-form";
import { LinksTable } from "../_components/links-table";
import { listMarketingLinks } from "../_link-actions";

export const dynamic = "force-dynamic";

export default async function AdminLinksPage() {
	if (!getDb()) {
		return (
			<section className="admin-empty">
				<h1>Database not configured</h1>
				<p>
					Set <code>DATABASE_URL</code> in Vercel to build and save marketing links.
				</p>
			</section>
		);
	}

	const links = await listMarketingLinks();

	return (
		<section className="admin-list-page">
			<header className="admin-page-header">
				<h1>Marketing links</h1>
			</header>

			<article className="admin-card">
				<h2>New link</h2>
				<p className="admin-card-hint">
					Build a tagged link for a post or campaign, then copy it. Traffic shows in GA under
					Acquisition → Traffic acquisition (Session source / medium). Filed by category so you can
					filter your social, marketing and partner links below. Partner <em>codes</em> with revenue
					attribution still live in Discount codes.
				</p>
				<LinkForm />
			</article>

			<article className="admin-card">
				<h2>Saved links</h2>
				<LinksTable links={links} />
			</article>
		</section>
	);
}
