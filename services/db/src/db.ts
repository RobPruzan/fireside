import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import { join } from "path";
// yolo
config({ path: join(__dirname, "..", ".env") });
config({ path: join(__dirname, ".env") });

export const createDB = () => {
  console.log("conn string we got", process.env.CONNECTION_STRING);
  const sql = postgres(process.env.CONNECTION_STRING!, { max: 1 });
  return { db: drizzle(sql), sql };
};
