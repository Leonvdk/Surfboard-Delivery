import Link from "next/link";
import type { Booking, BookingPerson } from "../../lib/db/schema";
import {
	assignBoard,
	autoAssignBoard,
	removeAssignment,
	swapBoard,
} from "../_board-actions";
import {
	type AssignmentWithBooking,
	findConflict,
	type FleetData,
} from "../_lib/boards-cache";
import { formatShortDate, todayIso } from "../_lib/dates";

/**
 * Per-person board assignment block on the booking detail page.
 * Shows either the assignment chain (with swap + remove) or an assign
 * form whose board list marks conflicts for the person's window.
 */
export function BoardAssignmentPanel({
	booking,
	person,
	personIndex,
	data,
}: {
	booking: Booking;
	person: BookingPerson;
	personIndex: number;
	data: FleetData;
}) {
	// The person's effective window: their own custom dates, else the
	// booking envelope. Dates stay editable in the form — for staggered
	// parties the envelope can be wider than one person's actual range.
	const windowStart = person.checkin || booking.checkin;
	const windowEnd = person.checkout || booking.checkout;

	const chain = data.assignments
		.filter((a) => a.bookingId === booking.id && a.personIndex === personIndex)
		.sort((a, b) => a.startDate.localeCompare(b.startDate));

	if (chain.length > 0) {
		return <AssignmentChain chain={chain} data={data} />;
	}

	const assignWithIds = assignBoard.bind(null, booking.id, personIndex);
	const sameSize = data.fleet.filter(
		(b) => b.kind === "board" && b.status === "active" && b.size === person.board,
	);
	const otherActive = data.fleet.filter(
		(b) => b.kind === "board" && b.status === "active" && b.size !== person.board,
	);
	// Matching-size boards first; everything else after, flagged.
	const ordered = [...sameSize, ...otherActive];

	if (ordered.length === 0) {
		return (
			<p className="admin-board-assign-empty">
				No active boards in the fleet —{" "}
				<Link href="/admin/boards" className="admin-row-link">
					add one →
				</Link>
			</p>
		);
	}

	// A same-size board that's free for this person's window → offer a
	// one-tap assign so Leon skips the dropdown on the common case.
	const freeSameSize = sameSize.find(
		(b) => !findConflict(data.assignments, b.id, windowStart, windowEnd),
	);

	return (
		<>
			{person.board && freeSameSize && (
				<form
					action={autoAssignBoard.bind(
						null,
						booking.id,
						personIndex,
						person.board,
						windowStart,
						windowEnd,
					)}
					className="admin-board-autoassign"
				>
					<button type="submit" className="admin-btn admin-btn--small">
						Auto-assign free {person.board} ({freeSameSize.name})
					</button>
				</form>
			)}
			<form action={assignWithIds} className="admin-board-assign">
			<div className="admin-board-assign-row">
				<select name="boardId" required className="admin-input" defaultValue="">
					<option value="" disabled>
						Assign a board
					</option>
					{/* Busy boards stay selectable — the flag is computed for the
						DEFAULT window, but the date inputs are editable and a
						narrower range may be perfectly fine. The server action
						validates the submitted dates and hard-blocks real
						conflicts with a named-booking error. */}
					{ordered.map((b) => {
						const conflict = findConflict(
							data.assignments,
							b.id,
							windowStart,
							windowEnd,
						);
						const sizeFlag = b.size !== person.board && person.board ? " · other size" : "";
						return (
							<option key={b.id} value={b.id}>
								{b.name}
								{sizeFlag}
								{conflict ? ` — busy ${conflict.startDate} → ${conflict.endDate} (${conflict.bookingName})` : ""}
							</option>
						);
					})}
				</select>
				<input
					type="date"
					name="startDate"
					required
					defaultValue={windowStart}
					className="admin-input"
					aria-label="Assignment start"
				/>
				<input
					type="date"
					name="endDate"
					required
					defaultValue={windowEnd}
					className="admin-input"
					aria-label="Assignment end"
				/>
				<button type="submit" className="admin-btn">
					Assign
				</button>
			</div>
			</form>
		</>
	);
}

function AssignmentChain({
	chain,
	data,
}: {
	chain: AssignmentWithBooking[];
	data: FleetData;
}) {
	// The chain renders oldest → newest; only the last (current) link gets
	// the swap + remove controls.
	const current = chain[chain.length - 1]!;
	const currentBoard = data.fleet.find((b) => b.id === current.boardId);
	const swapWithId = swapBoard.bind(null, current.id);
	const removeWithId = removeAssignment.bind(null, current.id);
	const today = todayIso();
	const defaultSwapDate =
		today >= current.startDate && today <= current.endDate
			? today
			: current.startDate;

	const swapCandidates = data.fleet.filter(
		(b) => b.kind === "board" && b.status === "active" && b.id !== current.boardId,
	);

	return (
		<div className="admin-board-assigned">
			{chain.map((a, i) => {
				const board = data.fleet.find((b) => b.id === a.boardId);
				return (
					<div key={a.id} className="admin-board-chain-row">
						{i > 0 && <span className="admin-board-chain-arrow">↳ swap</span>}
						<Link
							href={`/admin/boards/${a.boardId}`}
							className="admin-board-chain-name"
						>
							{board?.name ?? `Board #${a.boardId}`}
						</Link>
						<span className="admin-board-chain-dates">
							{formatShortDate(a.startDate)} → {formatShortDate(a.endDate)}
						</span>
						{a.notes && <span className="admin-cell-muted">{a.notes}</span>}
					</div>
				);
			})}

			<details className="admin-board-swap">
				<summary>Swap {currentBoard ? currentBoard.name : "board"}</summary>
				<form action={swapWithId} className="admin-board-assign">
					<div className="admin-board-assign-row">
						<select name="newBoardId" required className="admin-input" defaultValue="">
							<option value="" disabled>
								New board
							</option>
							{/* Same rule as the assign picker: busy is a warning for
								the default swap date, not a hard block — the owner can
								move the swap date and the server validates for real. */}
							{swapCandidates.map((b) => {
								const conflict = findConflict(
									data.assignments,
									b.id,
									defaultSwapDate,
									current.endDate,
									current.id,
								);
								return (
									<option key={b.id} value={b.id}>
										{b.name}
										{conflict ? ` — busy ${conflict.startDate} → ${conflict.endDate} (${conflict.bookingName})` : ""}
									</option>
								);
							})}
						</select>
						<input
							type="date"
							name="swapDate"
							required
							defaultValue={defaultSwapDate}
							min={current.startDate}
							max={current.endDate}
							className="admin-input"
							aria-label="Swap date"
						/>
						<input
							type="text"
							name="notes"
							placeholder="Why? (optional)"
							className="admin-input"
						/>
						<button type="submit" className="admin-btn">
							Swap
						</button>
					</div>
				</form>
			</details>

			<form action={removeWithId}>
				<button type="submit" className="admin-board-remove">
					Remove assignment
				</button>
			</form>
		</div>
	);
}
