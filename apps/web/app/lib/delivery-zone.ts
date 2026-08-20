import { DELIVERY_TOWNS } from "./delivery-towns";

/**
 * The free-delivery footprint, in one place.
 *
 * This used to be retyped as prose in a dozen page files, and it drifted: the
 * site simultaneously claimed three towns, four, five and seven. Contradicting
 * yourself is expensive twice over — customers in Amoreira or Rogil read that
 * we don't serve them, and answer engines that find conflicting facts on the
 * same domain lower their confidence in citing any of them.
 *
 * Derived from DELIVERY_TOWNS so adding a town to the delivery pages updates
 * every sentence that names the zone.
 */
export const DELIVERY_ZONE = DELIVERY_TOWNS.map((t) => t.name);

/** "Aljezur, Arrifana, Vale da Telha, Monte Clérigo, Amoreira, Rogil, and Carrapateira" */
export function deliveryZoneSentence(conjunction = "and"): string {
	const towns = [...DELIVERY_ZONE];
	const last = towns.pop();
	return `${towns.join(", ")}, ${conjunction} ${last}`;
}

/** "Aljezur, Arrifana, Vale da Telha, Monte Clérigo, Amoreira, Rogil, Carrapateira" */
export function deliveryZoneList(): string {
	return DELIVERY_ZONE.join(", ");
}

/** "Aljezur · Arrifana · Vale da Telha · …" — for compact strips and footers. */
export function deliveryZoneDots(): string {
	return DELIVERY_ZONE.join(" · ");
}
