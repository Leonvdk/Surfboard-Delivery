import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Lazily initialised Neon client. Returns `null` when `DATABASE_URL` isn't set
 * so the site keeps working during local dev before the DB is provisioned.
 */
export function getDb() {
	if (_db) return _db;
	const url = process.env.DATABASE_URL;
	if (!url) return null;
	const sql = neon(url);
	_db = drizzle(sql, { schema });
	return _db;
}

export { schema };
