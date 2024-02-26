import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const sql = postgres(process.env.CONNECTION_STRING!, { max: 1 });
export const db = drizzle(sql);
