import Link from "next/link";
import type { Board, BoardStatus } from "../../lib/db/schema";
import { createBoard } from "../_board-actions";
import { ClickableGearRow } from "../_components/clickable-gear-row";
import { FleetAttention } from "../_components/fleet-attention";
import { FleetPayback } from "../_components/fleet-payback";
import { GearSection } from "../_components/gear-section";
import { getCachedBookings } from "../_lib/bookings-cache";
import {
	type AssignmentWithBooking,
	getCachedFleet,
	isOutToday,
	nextFreeDate,
} from "../_lib/boards-cache";
import { formatShortDate, todayIso } from "../_lib/dates";
import { buildGearEarnings } from "../_lib/gear-earnings";
import { BOARD_SIZES, WETSUIT_SIZES } from "../_lib/gear-sizes";
import { eur } from "../_lib/revenue-metrics";

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
	const bookings = (await getCachedBookings()) ?? [];
	const earnings = buildGearEarnings(bookings, fleet, assignments);

	const boards = fleet.filter((b) => b.kind === "board");
	const wetsuits = fleet.filter((b) => b.kind === "wetsuit");
	const otherGear = fleet.filter((b) => b.kind === "other");

	const activeBoards = boards.filter((b) => b.status === "active");
	const freeToday = activeBoards.filter(
		(b) => !isOutToday(assignments, b.id, today),
	).length;

	// ── Fleet payback: collected vs invested, per item ──
	const paybackItems = fleet.map((b) => ({
		id: b.id,
		name: b.name,
		costCents: b.purchaseCost != null ? b.purchaseCost * 100 : null,
		collectedCents: earnings.byGearId.get(b.id)?.collectedCents ?? 0,
	}));
	const totalCollectedCents = paybackItems.reduce((s, i) => s + i.collectedCents, 0);
	const totalInvestedCents = paybackItems.reduce((s, i) => s + (i.costCents ?? 0), 0);

	// ── Available now, grouped by board size (dots: filled = free today) ──
	const freeBySize = new Map<string, boolean[]>();
	for (const b of activeBoards) {
		const arr = freeBySize.get(b.size) ?? [];
		arr.push(!isOutToday(assignments, b.id, today));
		freeBySize.set(b.size, arr);
	}
	const availBySize = BOARD_SIZES.filter((s) => freeBySize.has(s)).map((s) => ({
		size: s,
		free: freeBySize.get(s)!,
	}));

	// ── Needs attention: boards flagged for repair ──
	const repairBoards = fleet.filter((b) => b.status === "repair");
	const attentionSig = repairBoards
		.map((b) => b.id)
		.sort((a, b) => a - b)
		.join(",");
	const attentionLead =
		repairBoards.length > 0
			? `${repairBoards.map((b) => b.name).join(", ")} ${repairBoards.length === 1 ? "is" : "are"} marked in repair — fix it, or retire it so it stops nagging.`
			: "";

	return (
		<section className="admin-list-page">
			<header className="admin-page-header">
				<h1>Fleet</h1>
			</header>

			{repairBoards.length > 0 && (
				<FleetAttention
					signature={attentionSig}
					count={repairBoards.length}
					lead={attentionLead}
				/>
			)}

			<div className="fleet-strip">
				<FleetPayback
					collectedCents={totalCollectedCents}
					investedCents={totalInvestedCents}
					items={paybackItems}
				/>

				<div className="fleet-stat fleet-avail">
					<span className="fleet-stat-kicker">Available now</span>
					{availBySize.length === 0 ? (
						<span className="fleet-stat-sub">No active boards</span>
					) : (
						<div className="fleet-avail-grid">
							{availBySize.map(({ size, free }) => {
								const freeCount = free.filter(Boolean).length;
								return (
									<div key={size} className="fleet-avail-size">
										<span className="fleet-avail-label">{size}</span>
										<span className="fleet-avail-dots" aria-hidden="true">
											{free.map((isFree, i) => (
												<span
													// biome-ignore lint/suspicious/noArrayIndexKey: dots are positional
													key={i}
													className={`fleet-dot${isFree ? " fleet-dot--free" : ""}`}
												/>
											))}
										</span>
										<span className="fleet-avail-count">
											{freeCount}<span className="fleet-avail-of">/{free.length}</span>
										</span>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</div>

			{/* ── Boards ── */}
			<GearSection
				title="Boards"
				count={boards.length}
				summary={`${freeToday} free today`}
				defaultOpen
				addForm={
					<AddGearForm
						kind="board"
						title="Add a board"
						namePlaceholder="e.g. 7'8 Funboard — blue NSP"
						sizes={BOARD_SIZES}
					/>
				}
			>
				{boards.length === 0 ? (
					<p className="admin-empty-inline">No boards yet — tap + to add one.</p>
				) : (
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
									<th>Collected</th>
									<th>Net</th>
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
										collectedCents={earnings.byGearId.get(b.id)?.collectedCents ?? 0}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}
			</GearSection>

			{/* ── Wetsuits ── */}
			<GearSection
				title="Wetsuits"
				count={wetsuits.length}
				addForm={
					<AddGearForm
						kind="wetsuit"
						title="Add a wetsuit"
						namePlaceholder="e.g. Xcel 4/3 — black/blue"
						sizes={WETSUIT_SIZES}
					/>
				}
			>
				{wetsuits.length === 0 ? (
					<p className="admin-empty-inline">
						No wetsuits tracked yet — tap + to add one.
					</p>
				) : (
					<div className="admin-table-wrap">
						<table className="admin-table">
							<thead>
								<tr>
									<th>Wetsuit</th>
									<th>Size</th>
									<th>Status</th>
									<th>Cost</th>
									<th>Collected</th>
									<th>Net</th>
									<th />
								</tr>
							</thead>
							<tbody>
								{wetsuits.map((b) => (
									<SimpleGearRow
										key={b.id}
										item={b}
										showSize
										collectedCents={earnings.byGearId.get(b.id)?.collectedCents ?? 0}
									/>
								))}
							</tbody>
						</table>
					</div>
				)}
			</GearSection>

			{/* ── Other gear ── */}
			<GearSection
				title="Other gear"
				count={otherGear.length}
				addForm={
					<AddGearForm
						kind="other"
						title="Add other gear"
						namePlaceholder="e.g. Roof rack pads — pair"
						sizes={null}
					/>
				}
			>
				{otherGear.length === 0 ? (
					<p className="admin-empty-inline">
						Ponchos, changing mats, tubs, roof racks… tap + to add them.
					</p>
				) : (
					<div className="admin-table-wrap">
						<table className="admin-table">
							<thead>
								<tr>
									<th>Item</th>
									<th>Status</th>
									<th>Cost</th>
									<th>Collected</th>
									<th>Net</th>
									<th />
							</tr>
						</thead>
						<tbody>
							{otherGear.map((b) => (
								<SimpleGearRow
									key={b.id}
									item={b}
									showSize={false}
									collectedCents={earnings.byGearId.get(b.id)?.collectedCents ?? 0}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}
			</GearSection>
		</section>
	);
}

/** Collected + Net cells shared by every gear row. Net = collected − cost;
 * "—" when we have neither a cost nor any earnings to show. */
function EarningsCells({
	collectedCents,
	costEuros,
}: {
	collectedCents: number;
	costEuros: number | null;
}) {
	const netCents = collectedCents - (costEuros ?? 0) * 100;
	const hasData = collectedCents > 0 || costEuros != null;
	return (
		<>
			<td>{collectedCents > 0 ? eur(collectedCents) : "—"}</td>
			<td className={hasData && netCents < 0 ? "admin-cell-negative" : undefined}>
				{hasData ? eur(netCents) : "—"}
			</td>
		</>
	);
}

function BoardRow({
	board: b,
	assignments,
	today,
	collectedCents,
}: {
	board: Board;
	assignments: AssignmentWithBooking[];
	today: string;
	collectedCents: number;
}) {
	const out = isOutToday(assignments, b.id, today);
	const free = nextFreeDate(assignments, b.id, today);
	return (
		<ClickableGearRow
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
		>
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
			<EarningsCells collectedCents={collectedCents} costEuros={b.purchaseCost} />
			<td className="admin-row-chevron-cell">
				<span className="admin-row-chevron" aria-hidden="true">
					›
				</span>
			</td>
		</ClickableGearRow>
	);
}

function SimpleGearRow({
	item: b,
	showSize,
	collectedCents,
}: {
	item: Board;
	showSize: boolean;
	collectedCents: number;
}) {
	return (
		<ClickableGearRow
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
		>
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
			<EarningsCells collectedCents={collectedCents} costEuros={b.purchaseCost} />
			<td className="admin-row-chevron-cell">
				<span className="admin-row-chevron" aria-hidden="true">
					›
				</span>
			</td>
		</ClickableGearRow>
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
		<form action={createBoard} className="admin-board-form" aria-label={title}>
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
	);
}
