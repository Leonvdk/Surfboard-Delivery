import Link from "next/link";
import { notFound } from "next/navigation";
import type { BoardStatus } from "../../../lib/db/schema";
import { setBoardStatus, updateBoard } from "../../_board-actions";
import { getCachedFleet } from "../../_lib/boards-cache";
import { formatShortDate } from "../../_lib/dates";

export const dynamic = "force-dynamic";

const STATUSES: Array<{ value: BoardStatus; label: string }> = [
	{ value: "active", label: "Active" },
	{ value: "repair", label: "In repair" },
	{ value: "retired", label: "Retired" },
];

export default async function BoardDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id: idStr } = await params;
	const id = Number.parseInt(idStr, 10);
	if (Number.isNaN(id)) notFound();

	const data = await getCachedFleet();
	if (!data) {
		return (
			<section className="admin-empty">
				<h1>Database not configured</h1>
				<p>Set <code>DATABASE_URL</code> to manage the fleet.</p>
			</section>
		);
	}

	const board = data.fleet.find((b) => b.id === id);
	if (!board) notFound();

	const history = data.assignments
		.filter((a) => a.boardId === id)
		.sort((a, b) => b.startDate.localeCompare(a.startDate));

	const updateWithId = updateBoard.bind(null, id);

	return (
		<section className="admin-detail">
			<Link href="/admin/boards" className="admin-back">
				← All boards
			</Link>

			<header className="admin-detail-header">
				<h1>
					{board.name} <span className="admin-detail-id">#{board.id}</span>
				</h1>
			</header>

			<div className="admin-detail-grid">
				<article className="admin-card">
					<h2>Details</h2>
					<form action={updateWithId} className="admin-board-form">
						<label>
							Name
							<input
								type="text"
								name="name"
								required
								defaultValue={board.name}
								className="admin-input"
							/>
						</label>
						<div className="admin-board-form-grid">
							<label>
								Size
								<select
									name="size"
									required
									defaultValue={board.size}
									className="admin-input"
								>
									<option value="6'6">6&apos;6</option>
									<option value="7'0">7&apos;0</option>
									<option value="7'8">7&apos;8</option>
									<option value="8'6">8&apos;6</option>
								</select>
							</label>
							<label>
								Cost (€)
								<input
									type="number"
									name="purchaseCost"
									min="0"
									defaultValue={board.purchaseCost ?? ""}
									className="admin-input"
								/>
							</label>
							<label>
								Purchased on
								<input
									type="date"
									name="purchaseDate"
									defaultValue={board.purchaseDate ?? ""}
									className="admin-input"
								/>
							</label>
						</div>
						<label>
							Notes
							<textarea
								name="notes"
								rows={3}
								defaultValue={board.notes ?? ""}
								className="admin-textarea"
								placeholder="Dings, quirks, repairs..."
							/>
						</label>
						<button type="submit" className="admin-btn">
							Save
						</button>
					</form>
				</article>

				<article className="admin-card">
					<h2>Status</h2>
					<p className="admin-card-hint">
						Repair and retired boards drop out of availability but keep their
						history.
					</p>
					<div className="admin-board-status-row">
						{STATUSES.map((s) => {
							const setStatus = setBoardStatus.bind(null, id, s.value);
							const isCurrent = board.status === s.value;
							return (
								<form key={s.value} action={setStatus}>
									<button
										type="submit"
										className={`admin-btn admin-board-status-btn${isCurrent ? " admin-board-status-btn--current" : ""}`}
										disabled={isCurrent}
									>
										{s.label}
									</button>
								</form>
							);
						})}
					</div>
				</article>
			</div>

			<article className="admin-card">
				<h2>Assignment history</h2>
				{history.length === 0 ? (
					<p className="admin-empty-inline">
						This board hasn&apos;t been on any bookings yet.
					</p>
				) : (
					<ul className="admin-board-history">
						{history.map((a) => (
							<li key={a.id} className="admin-board-history-row">
								<span className="admin-board-history-dates">
									{formatShortDate(a.startDate)} → {formatShortDate(a.endDate)}
								</span>
								<Link
									href={`/admin/bookings/${a.bookingId}`}
									className="admin-row-link"
								>
									#{a.bookingId} · {a.bookingName}
								</Link>
								<span className={`admin-status admin-status--${a.bookingStatus}`}>
									{a.bookingStatus.replace("_", " ")}
								</span>
								{a.swappedFromId != null && (
									<span className="admin-board-swap-flag">swapped in</span>
								)}
								{a.notes && (
									<span className="admin-cell-muted">{a.notes}</span>
								)}
							</li>
						))}
					</ul>
				)}
			</article>
		</section>
	);
}
