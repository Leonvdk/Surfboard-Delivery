// Idempotent migration runner, executed at the start of every Vercel build
// (see package.json "build"). Local DATABASE_URL is a Vercel-sensitive var
// that can't be pulled to dev machines, so the build container — which does
// have it — is the one place migrations can reliably run.
//
// Strategy: execute every statement of every drizzle/*.sql file in order,
// skipping only errors that prove the statement already ran ("already
// exists" / duplicates). Anything else fails the build loudly, which is
// what we want — deploying code against a half-migrated schema is worse
// than a failed deploy. No transaction: the Neon HTTP driver doesn't
// support them, which is exactly why per-statement idempotency matters.

import { readdirSync, readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
	console.log("[migrate] DATABASE_URL not set — skipping migrations");
	process.exit(0);
}

const sql = neon(url);
const dir = new URL("../drizzle/", import.meta.url);
const files = readdirSync(dir)
	.filter((f) => f.endsWith(".sql"))
	.sort();

for (const file of files) {
	const text = readFileSync(new URL(file, dir), "utf8");
	const statements = text.split("--> statement-breakpoint");
	let applied = 0;
	let skipped = 0;
	for (const statement of statements) {
		const trimmed = statement.trim();
		if (!trimmed) continue;
		try {
			await sql.query(trimmed);
			applied++;
		} catch (err) {
			const msg = String(err?.message ?? err);
			if (/already exists|duplicate/i.test(msg)) {
				skipped++;
				continue;
			}
			console.error(`[migrate] ${file} FAILED on statement:\n${trimmed}\n→ ${msg}`);
			process.exit(1);
		}
	}
	console.log(`[migrate] ${file}: ${applied} applied, ${skipped} already in place`);
}

console.log("[migrate] schema is up to date");
