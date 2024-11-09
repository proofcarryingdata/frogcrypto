import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import { config } from "dotenv";

config({ path: ".env" });

export const db = drizzle(sql, { logger: true });

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
