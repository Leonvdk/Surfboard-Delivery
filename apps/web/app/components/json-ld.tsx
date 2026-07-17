type JsonLdData =
	| Record<string, unknown>
	| Array<Record<string, unknown>>
	| null;

interface JsonLdProps {
	data: JsonLdData;
}

export function JsonLd({ data }: JsonLdProps) {
	if (!data) return null;
	if (Array.isArray(data) && data.length === 0) return null;

	return (
		<script
			type="application/ld+json"
			// biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires innerHTML
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}
