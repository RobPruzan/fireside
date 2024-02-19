import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import path from "path";
config({ path: path.join(__dirname, ".env") });
export const sql = postgres(process.env.CONNECTION_STRING!, { max: 1 });
export const db = drizzle(sql);
