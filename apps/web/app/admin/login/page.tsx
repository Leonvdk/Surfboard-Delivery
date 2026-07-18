"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function AdminLoginPage() {
	const router = useRouter();
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	async function handleSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setError(null);
		setSubmitting(true);
		try {
			const res = await fetch("/api/admin/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ password }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				setError(data?.error || "Login failed");
				setSubmitting(false);
				return;
			}
			router.push("/admin");
			router.refresh();
		} catch (_err) {
			setError("Network error");
			setSubmitting(false);
		}
	}

	return (
		<div className="admin-login">
			<form onSubmit={handleSubmit} className="admin-login-form">
				<h1 className="admin-login-title">Admin</h1>
				<label htmlFor="password" className="admin-login-label">
					Password
				</label>
				<input
					id="password"
					type="password"
					required
					autoFocus
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="admin-login-input"
				/>
				{error && <p className="admin-login-error">{error}</p>}
				<button
					type="submit"
					disabled={submitting}
					className="admin-login-submit"
				>
					{submitting ? "Signing in..." : "Sign in"}
				</button>
			</form>
		</div>
	);
}
