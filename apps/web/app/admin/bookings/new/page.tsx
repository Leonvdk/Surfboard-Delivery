import Link from "next/link";
import { NewBookingForm } from "../../_components/new-booking-form";

export const dynamic = "force-dynamic";

export default function NewBookingPage() {
	return (
		<section className="admin-detail">
			<Link href="/admin" className="admin-back">
				← All bookings
			</Link>
			<header className="admin-page-header">
				<h1>New booking</h1>
			</header>
			<NewBookingForm />
		</section>
	);
}
