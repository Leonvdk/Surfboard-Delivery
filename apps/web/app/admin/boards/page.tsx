import Link from "next/link";
import type { Board, BoardStatus } from "../../lib/db/schema";
import { createBoard } from "../_board-actions";
import { BoardEditButton } from "../_components/board-edit-modal";
import {
	type AssignmentWithBooking,
	getCachedFleet,
	isOutToday,
	nextFreeDate,
} from "../_lib/boards-cache";
import { formatShortDate, todayIso } from "../_lib/dates";
import { BOARD_SIZES, WETSUIT_SIZES } from "../_lib/gear-sizes";

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

	const boards = fleet.filter((b) => b.kind === "board");
	const wetsuits = fleet.filter((b) => b.kind === "wetsuit");
	const otherGear = fleet.filter((b) => b.kind === "other");

	const activeBoards = boards.filter((b) => b.status === "active");
	const totalInvested = fleet.reduce((sum, b) => sum + (b.purchaseCost ?? 0), 0);
	const freeToday = activeBoards.filter(
		(b) => !isOutToday(assignments, b.id, today),
	).length;

	return (
		<section className="admin-list-page">
			<header className="admin-page-header">
				<h1>Fleet</h1>
			</header>

			<div className="admin-today">
				<article className="admin-today-card">
					<div className="admin-today-heading">
						<span className="admin-today-kicker">Boards</span>
						<span className="admin-today-count">{boards.length}</span>
					</div>
					<p className="admin-empty-inline">
						{activeBoards.length} active
						{boards.length !== activeBoards.length
							? ` · ${boards.length - activeBoards.length} in repair / retired`
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
					<p className="admin-empty-inline">
						across boards, wetsuits &amp; other gear
					</p>
				</article>
			</div>

			{/* ── Boards ── */}
			<div className="admin-list-heading">
				<h2>Boards</h2>
			</div>

			{boards.length === 0 && (
				<p className="admin-empty-inline">No boards yet — add one below.</p>
			)}

			{boards.length > 0 && (
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
							{boards.map((b) => (
								<BoardRow
									key={b.id}
									board={b}
									assignments={assignments}
									today={today}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}

			<AddGearForm
				kind="board"
				title="Add a board"
				namePlaceholder="e.g. 7'8 Funboard — blue NSP"
				sizes={BOARD_SIZES}
			/>

			{/* ── Wetsuits ── */}
			<div className="admin-list-heading">
				<h2>Wetsuits</h2>
			</div>

			{wetsuits.length === 0 && (
				<p className="admin-empty-inline">No wetsuits tracked yet — add one below.</p>
			)}

			{wetsuits.length > 0 && (
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Wetsuit</th>
								<th>Size</th>
								<th>Status</th>
								<th>Cost</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{wetsuits.map((b) => (
								<SimpleGearRow key={b.id} item={b} showSize />
							))}
						</tbody>
					</table>
				</div>
			)}

			<AddGearForm
				kind="wetsuit"
				title="Add a wetsuit"
				namePlaceholder="e.g. Xcel 4/3 — black/blue"
				sizes={WETSUIT_SIZES}
			/>

			{/* ── Other gear ── */}
			<div className="admin-list-heading">
				<h2>Other gear</h2>
			</div>

			{otherGear.length === 0 && (
				<p className="admin-empty-inline">
					Ponchos, changing mats, tubs, roof racks… add them below.
				</p>
			)}

			{otherGear.length > 0 && (
				<div className="admin-table-wrap">
					<table className="admin-table">
						<thead>
							<tr>
								<th>Item</th>
								<th>Status</th>
								<th>Cost</th>
								<th />
							</tr>
						</thead>
						<tbody>
							{otherGear.map((b) => (
								<SimpleGearRow key={b.id} item={b} showSize={false} />
							))}
						</tbody>
					</table>
				</div>
			)}

			<AddGearForm
				kind="other"
				title="Add other gear"
				namePlaceholder="e.g. Roof rack pads — pair"
				sizes={null}
			/>
		</section>
	);
}

function BoardRow({
	board: b,
	assignments,
	today,
}: {
	board: Board;
	assignments: AssignmentWithBooking[];
	today: string;
}) {
	const out = isOutToday(assignments, b.id, today);
	const free = nextFreeDate(assignments, b.id, today);
	return (
		<tr>
			<td>
				<div className="admin-cell-strong">
					<Link
						href={`/admin/boards/${b.id}`}
						className="admin-board-name-link"
						title="Assignment history"
					>
						{b.name}
					</Link>
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
					<Link href={`/admin/bookings/${out.bookingId}`} className="admin-row-link">
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
				<BoardEditButton
					board={{
						id: b.id,
						kind: b.kind,
						name: b.name,
						size: b.size,
						purchaseCost: b.purchaseCost,
						purchaseDate: b.purchaseDate,
						status: b.status,
						notes: b.notes,
					}}
				/>
			</td>
		</tr>
	);
}

function SimpleGearRow({ item: b, showSize }: { item: Board; showSize: boolean }) {
	return (
		<tr>
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
			{showSize && <td>{b.size || "—"}</td>}
			<td>
				<span className={`admin-board-status admin-board-status--${b.status}`}>
					{STATUS_LABEL[b.status]}
				</span>
			</td>
			<td>{b.purchaseCost != null ? `€${b.purchaseCost}` : "—"}</td>
			<td>
				<BoardEditButton
					board={{
						id: b.id,
						kind: b.kind,
						name: b.name,
						size: b.size,
						purchaseCost: b.purchaseCost,
						purchaseDate: b.purchaseDate,
						status: b.status,
						notes: b.notes,
					}}
				/>
			</td>
		</tr>
	);
}

function AddGearForm({
	kind,
	title,
	namePlaceholder,
	sizes,
}: {
	kind: "board" | "wetsuit" | "other";
	title: string;
	namePlaceholder: string;
	sizes: readonly string[] | null;
}) {
	return (
		<article className="admin-card">
			<h2>{title}</h2>
			<form action={createBoard} className="admin-board-form">
				<input type="hidden" name="kind" value={kind} />
				<div className="admin-board-form-grid">
					<label>
						Name
						<input
							type="text"
							name="name"
							required
							placeholder={namePlaceholder}
							className="admin-input"
						/>
					</label>
					{sizes ? (
						<label>
							Size
							<select name="size" required className="admin-input" defaultValue="">
								<option value="" disabled>
									Select
								</option>
								{sizes.map((s) => (
									<option key={s} value={s}>
										{s}
									</option>
								))}
							</select>
						</label>
					) : (
						<input type="hidden" name="size" value="" />
					)}
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
					Add
				</button>
			</form>
		</article>
	);
}
