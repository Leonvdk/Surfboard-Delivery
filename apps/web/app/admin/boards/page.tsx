import Link from "next/link";
import type { BoardStatus } from "../../lib/db/schema";
import { createBoard } from "../_board-actions";
import {
	getCachedFleet,
	isOutToday,
	nextFreeDate,
} from "../_lib/boards-cache";
import { formatShortDate, todayIso } from "../_lib/dates";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<BoardStatus, string> = {
	active: "Active",
	repair: "In repair",
	retired: "Retired",
};

export default async function AdminBoardsPage() {
	const data = await getCachedFleet();
	if (!data) {
		return (
			<section className="admin-empty">
				<h1>Database not configured</h1>
				<p>Set <code>DATABASE_URL</code> to manage the fleet.</p>
			</section>
		);
	}

	const { fleet, assignments } = data;
	const today = todayIso();

	const activeBoards = fleet.filter((b) => b.status === "active");
	const totalInvested = fleet.reduce((sum, b) => sum + (b.purchaseCost ?? 0), 0);
	const freeToday = activeBoards.filter(
		(b) => !isOutToday(assignments, b.id, today),
	).length;

	return (
		<section className="admin-list-page">
			<header className="admin-page-header">
				<h1>Boards</h1>
			</header>

			<div className="admin-today">
				<article className="admin-today-card">
					<div className="admin-today-heading">
						<span className="admin-today-kicker">Fleet</span>
						<span className="admin-today-count">{fleet.length}</span>
					</div>
					<p className="admin-empty-inline">
						{activeBoards.length} active
						{fleet.length !== activeBoards.length
							? ` · ${fleet.length - activeBoards.length} in repair / retired`
							: ""}
					</p>
				</article>
				<article className="admin-today-card">
					<div className="admin-today-heading">
						<span className="admin-today-kicker">Free today</span>
						<span className="admin-today-count">{freeToday}</span>
					</div>
					<p className="admin-empty-inline">of {activeBoards.length} active boards</p>
				</article>
				<article className="admin-today-card">
					<div className="admin-today-heading">
						<span className="admin-today-kicker">Invested</span>
						<span className="admin-today-count">€{totalInvested}</span>
					</div>
					<p className="admin-empty-inline">total purchase cost on record</p>
				</article>
			</div>

			<div className="admin-list-heading">
				<h2>Fleet</h2>
			</div>

			{fleet.length === 0 && (
				<p className="admin-empty-inline">
					No boards yet — add your first one below.
				</p>
			)}

			{fleet.length > 0 && (
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Board</th>
								<th>Size</th>
								<th>Status</th>
								<th>Right now</th>
								<th>Next free</th>
								<th>Cost</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{fleet.map((b) => {
								const out = isOutToday(assignments, b.id, today);
								const free = nextFreeDate(assignments, b.id, today);
								return (
									<tr key={b.id}>
										<td>
											<div className="admin-cell-strong">
												{b.name}
												{b.notes ? (
													<span
														className="admin-note-dot"
														title={b.notes.slice(0, 200)}
														aria-label="has notes"
													>
														●
													</span>
												) : null}
											</div>
										</td>
										<td>{b.size}</td>
										<td>
											<span className={`admin-board-status admin-board-status--${b.status}`}>
												{STATUS_LABEL[b.status]}
											</span>
										</td>
										<td>
											{b.status !== "active" ? (
												"—"
											) : out ? (
												<Link
													href={`/admin/bookings/${out.bookingId}`}
													className="admin-row-link"
												>
													Out · {out.bookingName.split(" ")[0]} → {formatShortDate(out.endDate)}
												</Link>
											) : (
												<span className="admin-board-free">Free</span>
											)}
										</td>
										<td>
											{b.status !== "active"
												? "—"
												: free === today
													? "today"
													: formatShortDate(free)}
										</td>
										<td>{b.purchaseCost != null ? `€${b.purchaseCost}` : "—"}</td>
										<td>
											<Link href={`/admin/boards/${b.id}`} className="admin-row-link">
												Edit&nbsp;→
											</Link>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			)}

			<div className="admin-list-heading">
				<h2>Add a board</h2>
			</div>
			<article className="admin-card">
				<form action={createBoard} className="admin-board-form">
					<div className="admin-board-form-grid">
						<label>
							Name
							<input
								type="text"
								name="name"
								required
								placeholder={"e.g. 7'8 Funboard — blue NSP"}
								className="admin-input"
							/>
						</label>
						<label>
							Size
							<select name="size" required className="admin-input" defaultValue="">
								<option value="" disabled>
									Select
								</option>
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
								placeholder="e.g. 350"
								className="admin-input"
							/>
						</label>
						<label>
							Purchased on
							<input type="date" name="purchaseDate" className="admin-input" />
						</label>
					</div>
					<label>
						Notes
						<input
							type="text"
							name="notes"
							placeholder="Dings, quirks, repairs..."
							className="admin-input"
						/>
					</label>
					<button type="submit" className="admin-btn">
						Add board
					</button>
				</form>
			</article>
		</section>
	);
}
