import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import { join } from "path";
// yolo
config({ path: join(__dirname, "..", ".env") });
config({ path: join(__dirname, ".env") });

export const createDB = ({ connString }: { connString: string }) => {
  console.log(connString);
  const sql = postgres(connString, { max: 1 });
  return { db: drizzle(sql), sql };
};
