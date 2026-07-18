import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/auth/session";
import { sendPushToAll } from "../../../../lib/push";

export const runtime = "nodejs";

export async function POST() {
	const session = await getAdminSession();
	if (!session.authenticated) {
		return NextResponse.json({ error: "unauthorized" }, { status: 401 });
	}
	const result = await sendPushToAll({
		title: "Test push",
		body: "If you see this on your home screen, notifications work end-to-end.",
		url: "/admin",
		tag: `test-${Date.now()}`,
	});
	return NextResponse.json(result);
}
