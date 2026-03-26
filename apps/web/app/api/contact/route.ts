import { Resend } from "resend";
import { NextResponse } from "next/server";

let _resend: Resend | null = null;

function getResend() {
	if (!_resend) {
		_resend = new Resend(process.env.RESEND_API_KEY);
	}
	return _resend;
}

const BUSINESS_EMAIL = "hello@surfrental-aljezur.com";
const FROM_EMAIL = "SurfRental Aljezur <hello@surfrental-aljezur.com>";

interface PersonData {
	sex: string;
	experience: string;
	package: string;
	board: string;
	wetsuitSize: string;
}

interface BookingRequest {
	name: string;
	email: string;
	checkin: string;
	checkout: string;
	accommodation: string;
	peopleCount: number;
	people: PersonData[];
	message: string;
	estimatedTotal: number | null;
}

function formatPerson(p: PersonData, i: number): string {
	const lines = [
		`  Person ${i + 1}:`,
		`    Sex: ${p.sex}`,
		`    Experience: ${p.experience}`,
		`    Package: ${p.package}`,
		`    Board: ${p.board}`,
	];
	if (p.wetsuitSize) lines.push(`    Wetsuit size: ${p.wetsuitSize}`);
	return lines.join("\n");
}

function formatPersonHtml(p: PersonData, i: number): string {
	const row = (label: string, value: string) =>
		`<tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;">${label}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${value}</td></tr>`;

	let html = `<tr><td colspan="2" style="padding:16px 0 8px;font-weight:800;font-size:15px;letter-spacing:-0.02em;border-bottom:1.5px solid #1A1A1A;">Person ${i + 1}</td></tr>`;
	html += row("Sex", p.sex);
	html += row("Experience", p.experience);
	html += row("Package", p.package);
	html += row("Board", p.board);
	if (p.wetsuitSize) html += row("Wetsuit size", p.wetsuitSize);
	return html;
}

function buildBusinessEmail(data: BookingRequest): { subject: string; text: string; html: string } {
	const subject = `New booking request from ${data.name} (${data.checkin} → ${data.checkout})`;

	const totalLine = data.estimatedTotal != null ? `Estimated total: €${data.estimatedTotal}` : "Estimated total: Not available (custom package selected)";

	const text = `New booking request

Name: ${data.name}
Email: ${data.email}
Delivery: ${data.checkin}
Pickup: ${data.checkout}
Accommodation: ${data.accommodation}
People: ${data.peopleCount}
${totalLine}

${data.people.map((p, i) => formatPerson(p, i)).join("\n\n")}

${data.message ? `Message:\n${data.message}` : "(No additional message)"}

Reply directly to this email to reach the customer.`;

	const row = (label: string, value: string) =>
		`<tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;width:140px;">${label}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${value}</td></tr>`;

	const html = `
<div style="background:#FAFAF8;padding:32px 0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:0 16px;">
    <!-- Header -->
    <div style="margin-bottom:24px;">
      <span style="font-weight:800;font-size:18px;letter-spacing:-0.03em;color:#1A1A1A;">SurfRental Aljezur</span>
    </div>

    <!-- Card -->
    <div style="background:#FFFFFF;border:1.5px solid #1A1A1A;box-shadow:4px 4px 0 #1A1A1A;padding:32px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#D4501E;margin-bottom:8px;">New booking request</div>
      <h2 style="margin:0 0 24px;font-size:20px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">${data.name} — ${data.checkin} → ${data.checkout}</h2>

      <table style="width:100%;border-collapse:collapse;">
        ${row("Name", data.name)}
        ${row("Email", `<a href="mailto:${data.email}" style="color:#D4501E;text-decoration:none;">${data.email}</a>`)}
        ${row("Delivery", data.checkin)}
        ${row("Pickup", data.checkout)}
        ${row("Accommodation", data.accommodation)}
        ${row("People", String(data.peopleCount))}
        ${data.people.map((p, i) => formatPersonHtml(p, i)).join("")}
      </table>

      <div style="margin-top:20px;padding:16px 20px;background:${data.estimatedTotal != null ? "#F0F0EE" : "#FFF8F5"};border-left:3px solid ${data.estimatedTotal != null ? "#1A1A1A" : "#D4501E"};">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#555555;margin-bottom:6px;">Estimated total</div>
        <div style="font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">${data.estimatedTotal != null ? `€${data.estimatedTotal}` : "Custom — needs quote"}</div>
      </div>

      ${data.message ? `
      <div style="margin-top:24px;padding:16px 20px;background:#F0F0EE;border-left:3px solid #D4501E;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#555555;margin-bottom:6px;">Message</div>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#1A1A1A;">${data.message.replace(/\n/g, "<br/>")}</p>
      </div>` : ""}
    </div>

    <p style="margin-top:16px;font-size:12px;color:#888888;">Reply directly to this email to reach ${data.name}.</p>
  </div>
</div>`;

	return { subject, text, html };
}

function buildCustomerEmail(data: BookingRequest): { subject: string; text: string; html: string } {
	const subject = "We received your booking request — SurfRental Aljezur";

	const customerTotalLine = data.estimatedTotal != null
		? `Estimated total: €${data.estimatedTotal} (final pricing confirmed in our reply)`
		: "We'll include pricing in our personalized reply.";

	const text = `Hi ${data.name},

Thanks for your booking request! We've received your details and will get back to you within 24 hours with availability and a gear recommendation.

Your request summary:
  Delivery: ${data.checkin}
  Pickup: ${data.checkout}
  Accommodation: ${data.accommodation}
  People: ${data.peopleCount}
  ${customerTotalLine}

${data.people.map((p, i) => formatPerson(p, i)).join("\n\n")}

If you have any questions in the meantime, reply to this email or reach us on WhatsApp at +31 6 13262259.

See you in the water!
— The SurfRental team`;

	const summaryRow = (label: string, value: string) =>
		`<tr><td style="padding:8px 16px 8px 0;color:#555555;font-size:14px;border-bottom:1px solid #E0E0E0;width:140px;">${label}</td><td style="padding:8px 0;font-size:14px;border-bottom:1px solid #E0E0E0;">${value}</td></tr>`;

	const html = `
<div style="background:#FAFAF8;padding:32px 0;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:0 16px;">
    <!-- Header -->
    <div style="margin-bottom:32px;">
      <span style="font-weight:800;font-size:18px;letter-spacing:-0.03em;color:#1A1A1A;">SurfRental Aljezur</span>
    </div>

    <!-- Personal message -->
    <div style="margin-bottom:32px;">
      <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">Hey ${data.name}!</h2>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#1A1A1A;">Thanks so much for reaching out — we're stoked you're planning a surf trip to Aljezur! We've received your request and are already looking into the best gear setup for you.</p>
      <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#1A1A1A;">We'll personally review your booking and get back to you within 24 hours with availability, a tailored gear recommendation, and everything you need to know before your trip.</p>
      <p style="margin:0;font-size:15px;line-height:1.7;color:#1A1A1A;">In the meantime, the waves are looking good — you're going to have a great time.</p>
    </div>

    <!-- Summary card -->
    <div style="background:#FFFFFF;border:1.5px solid #1A1A1A;box-shadow:4px 4px 0 #1A1A1A;padding:32px;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#D4501E;margin-bottom:8px;">Your request</div>
      <h3 style="margin:0 0 20px;font-size:17px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">Booking summary</h3>

      <table style="width:100%;border-collapse:collapse;">
        ${summaryRow("Delivery", data.checkin)}
        ${summaryRow("Pickup", data.checkout)}
        ${summaryRow("Accommodation", data.accommodation)}
        ${summaryRow("People", String(data.peopleCount))}
        ${data.people.map((p, i) => formatPersonHtml(p, i)).join("")}
      </table>

      ${data.estimatedTotal != null ? `
      <div style="margin-top:24px;padding:20px;background:#F0F0EE;border-left:3px solid #1A1A1A;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#555555;margin-bottom:6px;">Estimated total</div>
        <div style="font-size:28px;font-weight:800;letter-spacing:-0.03em;color:#1A1A1A;margin-bottom:4px;">€${data.estimatedTotal}</div>
        <div style="font-size:12px;color:#888888;">Final pricing confirmed in our personalized reply</div>
      </div>` : ""}

      ${data.message ? `
      <div style="margin-top:20px;padding:16px 20px;background:#F0F0EE;border-left:3px solid #D4501E;">
        <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#555555;margin-bottom:6px;">Your message</div>
        <p style="margin:0;font-size:14px;line-height:1.6;color:#1A1A1A;">${data.message.replace(/\n/g, "<br/>")}</p>
      </div>` : ""}
    </div>

    <!-- What happens next -->
    <div style="background:#FFFFFF;border:1.5px solid #1A1A1A;padding:24px 32px;margin-bottom:32px;">
      <h3 style="margin:0 0 12px;font-size:15px;font-weight:800;letter-spacing:-0.02em;color:#1A1A1A;">What happens next?</h3>
      <table style="border-collapse:collapse;font-size:14px;line-height:1.7;color:#555555;">
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;color:#D4501E;vertical-align:top;">01</td><td style="padding:4px 0;">We review your request and check gear availability</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;color:#D4501E;vertical-align:top;">02</td><td style="padding:4px 0;">You receive a personalized confirmation with final pricing</td></tr>
        <tr><td style="padding:4px 12px 4px 0;font-weight:700;color:#D4501E;vertical-align:top;">03</td><td style="padding:4px 0;">We deliver everything to your door — you just paddle out</td></tr>
      </table>
    </div>

    <!-- Contact -->
    <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#1A1A1A;">Questions before we get back to you? Just reply to this email or send us a message on <a href="https://wa.me/31613262259" style="color:#D4501E;font-weight:600;text-decoration:none;">WhatsApp</a>.</p>

    <p style="margin:24px 0 0;font-size:15px;line-height:1.7;color:#1A1A1A;">See you in the water!<br/><strong style="font-weight:800;">Leon</strong><br/><span style="color:#555555;">SurfRental Aljezur</span></p>

    <!-- Footer -->
    <hr style="margin:32px 0 16px;border:none;border-top:1.5px solid #1A1A1A;" />
    <p style="font-size:12px;color:#888888;line-height:1.5;">SurfRental Aljezur · Aljezur, Arrifana & Vale da Telha<br/><a href="https://surfrental-aljezur.com" style="color:#D4501E;text-decoration:none;">surfrental-aljezur.com</a></p>
  </div>
</div>`;

	return { subject, text, html };
}

export async function POST(request: Request) {
	try {
		const data: BookingRequest = await request.json();

		if (!data.name || !data.email || !data.checkin || !data.checkout) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const businessEmail = buildBusinessEmail(data);
		const customerEmail = buildCustomerEmail(data);

		const client = getResend();

		const [businessResult, customerResult] = await Promise.all([
			client.emails.send({
				from: FROM_EMAIL,
				to: BUSINESS_EMAIL,
				replyTo: data.email,
				subject: businessEmail.subject,
				text: businessEmail.text,
				html: businessEmail.html,
			}),
			client.emails.send({
				from: FROM_EMAIL,
				to: data.email,
				replyTo: BUSINESS_EMAIL,
				subject: customerEmail.subject,
				text: customerEmail.text,
				html: customerEmail.html,
			}),
		]);

		if (businessResult.error || customerResult.error) {
			const resendErr = businessResult.error || customerResult.error;
			console.error("Resend error:", JSON.stringify(resendErr));
			return NextResponse.json(
				{ error: "Failed to send email", details: resendErr },
				{ status: 500 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Contact API error:", err);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
