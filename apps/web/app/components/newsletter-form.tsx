"use client";

import { useCallback, useState } from "react";

type Status = "idle" | "submitting" | "success" | "error";

export function NewsletterForm() {
	const [firstName, setFirstName] = useState("");
	const [email, setEmail] = useState("");
	const [status, setStatus] = useState<Status>("idle");
	const [errorMsg, setErrorMsg] = useState("");

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (!firstName.trim() || !email.trim()) return;

			setStatus("submitting");
			setErrorMsg("");

			try {
				const res = await fetch("/api/newsletter", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						firstName: firstName.trim(),
						email: email.trim(),
					}),
				});

				if (!res.ok) {
					const data = await res.json().catch(() => null);
					throw new Error(data?.error || "Something went wrong");
				}

				setStatus("success");
				setFirstName("");
				setEmail("");
			} catch (err) {
				setStatus("error");
				setErrorMsg(
					err instanceof Error ? err.message : "Something went wrong",
				);
			}
		},
		[firstName, email],
	);

	if (status === "success") {
		return (
			<div className="newsletter-success">
				<p className="newsletter-success-text">
					You&apos;re in! We&apos;ll keep you posted on surf conditions, local
					tips &amp; exclusive deals.
				</p>
			</div>
		);
	}

	return (
		<form className="newsletter-form" onSubmit={handleSubmit} noValidate>
			<div className="newsletter-fields">
				<input
					type="text"
					placeholder="First name"
					value={firstName}
					onChange={(e) => setFirstName(e.target.value)}
					required
					className="newsletter-input"
					autoComplete="given-name"
				/>
				<input
					type="email"
					placeholder="Email address"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					className="newsletter-input"
					autoComplete="email"
				/>
				<button
					type="submit"
					className="newsletter-btn"
					disabled={status === "submitting"}
				>
					{status === "submitting" ? "Joining…" : "Subscribe"}
				</button>
			</div>
			{status === "error" && (
				<p className="newsletter-error">{errorMsg}</p>
			)}
		</form>
	);
}
