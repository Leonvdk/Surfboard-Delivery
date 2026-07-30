/**
 * Deep links used across the admin so Leon never retypes an address or a
 * message while out delivering.
 */

/** True when the accommodation field is itself a pasted map/URL link. */
export function isUrl(s: string | null | undefined): boolean {
	return /^https?:\/\//i.test((s ?? "").trim());
}

/** Google/Apple Maps link for an accommodation. If the field is already a
 * pasted URL (a Google Maps place link, an Airbnb link) use it directly;
 * otherwise search Maps, biased to Portugal so a local name like "Casa Sol,
 * Vale da Telha" resolves to the right place. */
export function mapsUrl(address: string | null | undefined): string | null {
	const a = address?.trim();
	if (!a) return null;
	if (isUrl(a)) return a;
	return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${a}, Portugal`)}`;
}

/** Short, layout-safe label for an accommodation: a pasted URL would blow
 * out the row width, so it shows as "Map location" (the raw link lives on
 * the Navigate button). Plain addresses show as-is. */
export function accommodationLabel(address: string | null | undefined): string {
	const a = address?.trim();
	if (!a) return "—";
	return isUrl(a) ? "Map location" : a;
}

/** wa.me link, optionally pre-filled with a message. Phone is stored with
 * spaces and a +, so strip to digits. */
export function waUrl(
	phone: string | null | undefined,
	text?: string,
): string | null {
	const digits = phone?.replace(/[^\d]/g, "");
	if (!digits) return null;
	return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** First name for a friendly, personal message. */
export function firstName(fullName: string): string {
	return fullName.trim().split(/\s+/)[0] ?? fullName;
}

/** On-the-road WhatsApp templates, keyed for buttons. Personal messages
 * from Leon, so a shaka is on-brand here (unlike website copy). */
export function deliveryMessages(name: string): { label: string; text: string }[] {
	const n = firstName(name);
	return [
		{ label: "On my way", text: `Hi ${n}, on my way with your surf gear — about 15 min out 🤙` },
		{ label: "Here now", text: `Hi ${n}, I'm outside with your gear whenever you're ready.` },
		{ label: "Running late", text: `Hi ${n}, running a little behind — I'll be there as soon as I can, thanks for your patience.` },
	];
}
