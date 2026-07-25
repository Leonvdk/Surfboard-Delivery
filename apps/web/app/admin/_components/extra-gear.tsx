import Link from "next/link";
import type { Booking } from "../../lib/db/schema";
import { attachGear, removeAssignment } from "../_board-actions";
import { findConflict, type FleetData } from "../_lib/boards-cache";
import { formatShortDate } from "../_lib/dates";
import { GEAR_KIND_LABEL } from "../_lib/gear-sizes";

/**
 * Booking-level extra gear (personIndex = -1 assignments): roof racks
 * thrown in for free, a paid extra wetsuit, whatever went in the van.
 * Same conflict rules as boards — one physical item, one booking at a
 * time. Busy flags in the picker are warnings for the default window;
 * the server hard-blocks real conflicts on the submitted dates.
 */
export function ExtraGearPanel({
	booking,
	data,
}: {
	booking: Booking;
	data: FleetData;
}) {
	const attached = data.assignments
		.filter((a) => a.bookingId === booking.id && a.personIndex === -1)
		.sort((a, b) => a.startDate.localeCompare(b.startDate));

	// Any active item can be attached — non-board gear first (the common
	// case), then boards, so a spare foamie is still one select away.
	const candidates = [...data.fleet]
		.filter((b) => b.status === "active")
		.sort((a, b) =>
			a.kind === b.kind
				? a.name.localeCompare(b.name)
				: a.kind === "board"
					? 1
					: b.kind === "board"
						? -1
						: a.kind.localeCompare(b.kind),
		);

	return (
		<article className="admin-card">
			<h2>Extra gear</h2>
			<p className="admin-card-hint">
				Anything that went in the van beyond the per-person packages — free
				or paid, note it either way.
			</p>

			{attached.length > 0 && (
				<ul className="admin-board-history">
					{attached.map((a) => {
						const item = data.fleet.find((b) => b.id === a.boardId);
						const removeWithId = removeAssignment.bind(null, a.id);
						return (
							<li key={a.id} className="admin-board-history-row">
								<span className="admin-cell-strong">
									{item?.name ?? `Item #${a.boardId}`}
								</span>
								{item && (
									<span className="admin-cell-muted">
										{GEAR_KIND_LABEL[item.kind]}
									</span>
								)}
								<span className="admin-board-history-dates">
									{formatShortDate(a.startDate)} → {formatShortDate(a.endDate)}
								</span>
								{a.notes && <span className="admin-cell-muted">{a.notes}</span>}
								<form action={removeWithId}>
									<button type="submit" className="admin-board-remove">
										remove
									</button>
								</form>
							</li>
						);
					})}
				</ul>
			)}

			{candidates.length === 0 ? (
				<p className="admin-board-assign-empty">
					No active gear in the fleet —{" "}
					<Link href="/admin/boards" className="admin-row-link">
						add some →
					</Link>
				</p>
			) : (
				<form
					action={attachGear.bind(null, booking.id)}
					className="admin-board-assign"
				>
					<div className="admin-board-assign-row">
						<select name="gearId" required className="admin-input" defaultValue="">
							<option value="" disabled>
								Add gear to this booking
							</option>
							{candidates.map((b) => {
								const conflict = findConflict(
									data.assignments,
									b.id,
									booking.checkin,
									booking.checkout,
								);
								return (
									<option key={b.id} value={b.id}>
										{b.name} · {GEAR_KIND_LABEL[b.kind]}
										{conflict
											? ` — busy ${conflict.startDate} → ${conflict.endDate} (${conflict.bookingName})`
											: ""}
									</option>
								);
							})}
						</select>
						<input
							type="date"
							name="startDate"
							required
							defaultValue={booking.checkin}
							className="admin-input"
							aria-label="Gear start"
						/>
						<input
							type="date"
							name="endDate"
							required
							defaultValue={booking.checkout}
							className="admin-input"
							aria-label="Gear end"
						/>
						<input
							type="text"
							name="notes"
							placeholder="free / paid €10 …"
							className="admin-input"
						/>
						<button type="submit" className="admin-btn">
							Add
						</button>
					</div>
				</form>
			)}
		</article>
	);
}
