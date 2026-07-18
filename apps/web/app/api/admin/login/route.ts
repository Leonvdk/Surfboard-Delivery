import { compare } from "bcryptjs";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../lib/auth/session";

export async function POST(request: Request) {
	try {
		const { password } = (await request.json()) as { password?: string };
		if (!password) {
			return NextResponse.json({ error: "Password required" }, { status: 400 });
		}

		const hash = process.env.ADMIN_PASSWORD_HASH;
		if (!hash) {
			return NextResponse.json(
				{ error: "Admin not configured" },
				{ status: 503 },
			);
		}

		const ok = await compare(password, hash);
		if (!ok) {
			return NextResponse.json({ error: "Wrong password" }, { status: 401 });
		}

		const session = await getAdminSession();
		session.authenticated = true;
		session.loggedInAt = Date.now();
		await session.save();

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Admin login error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
