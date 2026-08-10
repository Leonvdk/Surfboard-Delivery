"use client";

import { useActionState, useState } from "react";
import { createDiscount, type DiscountFormState } from "../_discount-actions";

const INITIAL: DiscountFormState = { ok: false, message: "" };

/**
 * Create-a-discount form. Package-restricted codes are percentage-only (a
 * Stripe limitation), so choosing a package forces the type to percent and
 * disables the fixed-€ option, with a note explaining why.
 */
export function DiscountForm() {
	const [state, action, pending] = useActionState(createDiscount, INITIAL);
	const [scope, setScope] = useState("all");
	const [valueType, setValueType] = useState("percent");
	const packageScoped = scope !== "all";

	return (
		<form action={action} className="admin-board-form admin-discount-form">
			<div className="admin-board-form-grid">
				<label>
					Code
					<input
						type="text"
						name="code"
						required
						placeholder="e.g. SUMMER20"
						className="admin-input"
						style={{ textTransform: "uppercase" }}
						autoCapitalize="characters"
					/>
				</label>
				<label>
					Type
					<select
						name="valueType"
						className="admin-input"
						value={packageScoped ? "percent" : valueType}
						disabled={packageScoped}
						onChange={(e) => setValueType(e.target.value)}
					>
						<option value="percent">Percentage %</option>
						<option value="amount">Fixed €</option>
					</select>
					{packageScoped && <input type="hidden" name="valueType" value="percent" />}
				</label>
				<label>
					{packageScoped || valueType === "percent" ? "Percent off" : "Euros off"}
					<input
						type="number"
						name="value"
						required
						min="1"
						step={packageScoped || valueType === "percent" ? "1" : "0.01"}
						max={packageScoped || valueType === "percent" ? "100" : undefined}
						placeholder={packageScoped || valueType === "percent" ? "20" : "15"}
						className="admin-input"
					/>
				</label>
				<label>
					Applies to
					<select
						name="scope"
						className="admin-input"
						value={scope}
						onChange={(e) => setScope(e.target.value)}
					>
						<option value="all">Whole order</option>
						<option value="boardOnly">Board Only package</option>
						<option value="fullPackage">Full Package</option>
					</select>
				</label>
				<label>
					Usage limit
					<input
						type="number"
						name="maxRedemptions"
						min="1"
						step="1"
						placeholder="blank = unlimited"
						className="admin-input"
					/>
				</label>
			</div>

			{packageScoped && (
				<p className="admin-card-hint">
					Package-specific codes are a percentage off that package only — Stripe doesn&apos;t allow
					a fixed € amount tied to one product.
				</p>
			)}

			{state.message && (
				<p
					className={
						state.ok
							? "admin-card-hint admin-discount-ok"
							: "admin-card-hint admin-sync-status--warn"
					}
				>
					{state.message}
				</p>
			)}

			<button type="submit" className="admin-btn" disabled={pending}>
				{pending ? "Creating…" : "Create code"}
			</button>
		</form>
	);
}
