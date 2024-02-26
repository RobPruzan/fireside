import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";

config({ path: ".env" });
export const sql = postgres(process.env.CONNECTION_STRING, { max: 1 });
export const db = drizzle(sql);
export * from "drizzle-orm";
export * from "./schema";
