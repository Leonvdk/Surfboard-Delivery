interface JsonLdProps {
	data: Record<string, unknown> | null;
}

export function JsonLd({ data }: JsonLdProps) {
	if (!data) return null;

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires innerHTML
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}
