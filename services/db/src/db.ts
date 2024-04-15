import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "dotenv";
import { join } from "path";
// yolo
config({ path: join(__dirname, "..", ".env") });
config({ path: join(__dirname, ".env") });

export const createDB = ({ connString }: { connString: string }) => {
  console.log(connString);
  const sql = postgres(connString, {
    onnotice: (notice) => {
      console.log("PG NOTICE", notice);
    },
    onclose: (connId) => {
      console.log("PG CLOSE", config);
    },
    onparameter: (key, value) => {
      console.log("PARAM CHANGE", key, value);
    },
  });
  return { db: drizzle(sql), sql };
};
