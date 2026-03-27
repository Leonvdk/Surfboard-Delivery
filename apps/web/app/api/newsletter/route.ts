import { Resend } from "resend";
import { NextResponse } from "next/server";

let _resend: Resend | null = null;

function getResend() {
	if (!_resend) {
		_resend = new Resend(process.env.RESEND_API_KEY);
	}
	return _resend;
}

interface NewsletterRequest {
	email: string;
	firstName: string;
}

export async function POST(request: Request) {
	try {
		const body: NewsletterRequest = await request.json();

		if (!body.email || !body.firstName) {
			return NextResponse.json(
				{ error: "Email and first name are required" },
				{ status: 400 },
			);
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(body.email)) {
			return NextResponse.json(
				{ error: "Invalid email address" },
				{ status: 400 },
			);
		}

		const client = getResend();

		const { data, error } = await client.contacts.create({
			email: body.email,
			firstName: body.firstName,
			unsubscribed: false,
			segments: [{ id: "ce223431-cd0b-452a-ba3e-a04f22e06da6" }],
		});

		if (error) {
			console.error("Resend contact error:", JSON.stringify(error));
			return NextResponse.json(
				{ error: "Failed to subscribe" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true, id: data?.id });
	} catch (err) {
		console.error("Newsletter API error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
