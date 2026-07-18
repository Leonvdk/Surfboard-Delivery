import "server-only";

import { eq } from "drizzle-orm";
import webpush from "web-push";
import { getDb, schema } from "./db/client";

let configured = false;

/**
 * VAPID identification for outgoing web pushes. The public key is also
 * exposed to the client via NEXT_PUBLIC_VAPID_PUBLIC_KEY so the browser
 * can subscribe with a matching key. The subject must be a mailto: URL
 * or an https URL; browsers reject anything else.
 */
function configure(): boolean {
	if (configured) return true;
	const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	const privateKey = process.env.VAPID_PRIVATE_KEY;
	const subject =
		process.env.VAPID_SUBJECT ?? "mailto:hello@surfrental-aljezur.com";
	if (!publicKey || !privateKey) return false;
	webpush.setVapidDetails(subject, publicKey, privateKey);
	configured = true;
	return true;
}

export interface PushPayload {
	title: string;
	body: string;
	url: string;
	tag?: string;
	badge?: number;
}

/**
 * Fan out a single payload to every stored subscription. Endpoints that
 * come back 404/410 (subscription revoked or expired) are pruned from
 * the DB so we don't keep re-sending to dead endpoints.
 */
export async function sendPushToAll(payload: PushPayload): Promise<{
	sent: number;
	pruned: number;
}> {
	if (!configure()) {
		console.warn("[push] VAPID keys not configured — skipping send");
		return { sent: 0, pruned: 0 };
	}
	const db = getDb();
	if (!db) return { sent: 0, pruned: 0 };

	const subs = await db.select().from(schema.pushSubscriptions);
	let sent = 0;
	let pruned = 0;

	const body = JSON.stringify(payload);

	await Promise.all(
		subs.map(async (s) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: s.endpoint,
						keys: { p256dh: s.p256dh, auth: s.auth },
					},
					body,
				);
				sent += 1;
			} catch (err) {
				const status = (err as { statusCode?: number }).statusCode;
				if (status === 404 || status === 410) {
					await db
						.delete(schema.pushSubscriptions)
						.where(eq(schema.pushSubscriptions.endpoint, s.endpoint));
					pruned += 1;
				} else {
					console.error("[push] send failed:", err);
				}
			}
		}),
	);

	return { sent, pruned };
}
